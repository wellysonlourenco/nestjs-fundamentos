import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(data: { email: string; password: string; name?: string }) {
    // Verifica se email já existe
    const existingUser = await this.prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Valida senha
    if (data.password.length < 6) {
      throw new BadRequestException('Senha deve ter no mínimo 6 caracteres');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Cria usuário
    const user = await this.prisma.users.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.name || '',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        createdAt: true,
      },
    });

    // Gera token
    const token = this.generateToken(user);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.getTokenExpiration(),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
    };
  }

  async login(email: string, password: string) {
    // Busca usuário
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica se está ativo
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Usuário desativado. Entre em contato com o suporte.',
      );
    }

    // Valida senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gera token
    const token = this.generateToken(user);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.getTokenExpiration(),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário desativado');
    }

    return user;
  }

  async refreshToken(user: any) {
    // Valida se usuário ainda existe e está ativo
    const validUser = await this.validateUser(user.userId);

    // Gera novo token
    const token = this.generateToken({
      id: validUser.id,
      email: validUser.email,
      roles: validUser.roles,
    });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.getTokenExpiration(),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      // Por segurança, não revela se email existe ou não
      return {
        message:
          'Se o email existir, você receberá instruções para resetar a senha',
      };
    }

    // Gera token de reset (válido por 1 hora)
    const resetToken = this.jwtService.sign(
      { userId: user.id, type: 'reset' },
      { expiresIn: '1h' },
    );

    // TODO: Enviar email com o token
    // await this.emailService.sendPasswordReset(user.email, resetToken);

    console.log(`🔑 Token de reset para ${user.email}: ${resetToken}`);

    return {
      message:
        'Se o email existir, você receberá instruções para resetar a senha',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Valida token
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'reset') {
        throw new BadRequestException('Token inválido');
      }

      // Valida nova senha
      if (newPassword.length < 6) {
        throw new BadRequestException('Senha deve ter no mínimo 6 caracteres');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualiza senha
      await this.prisma.users.update({
        where: { id: payload.userId },
        data: { password: hashedPassword },
      });

      return { message: 'Senha resetada com sucesso' };
    } catch (error) {
      throw new BadRequestException('Token inválido ou expirado');
    }
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Valida senha antiga
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Valida nova senha
    if (newPassword.length < 6) {
      throw new BadRequestException(
        'Nova senha deve ter no mínimo 6 caracteres',
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.sign(payload);
  }

  private getTokenExpiration(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1d';

    // Converte '1d', '7d', '1h' etc para segundos
    const timeMap: Record<string, number> = {
      d: 86400,
      h: 3600,
      m: 60,
      s: 1,
    };

    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value) * timeMap[unit];
    }

    return 86400; // Default 1 dia
  }
}
