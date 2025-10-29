import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(data: {
    email: string;
    password: string;
    fullName?: string;
    roles?: Role[];
  }) {
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
        fullName: data.fullName || data.email.split('@')[0],
        roles: data.roles || [Role.USER],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Faz upload do novo avatar
    const avatarPath = await this.uploadService.uploadAvatar(file, userId);

    // Se já tinha avatar, deleta o antigo
    if (user.profile?.avatar) {
      await this.uploadService.deleteAvatar(user.profile.avatar);
    }

    // Atualiza ou cria profile
    const profile = await this.prisma.profiles.upsert({
      where: { userId },
      create: {
        userId,
        avatar: avatarPath,
      },
      update: {
        avatar: avatarPath,
      },
    });

    return {
      message: 'Avatar atualizado com sucesso',
      avatar: avatarPath,
    };
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: { isActive?: boolean; role?: Role },
  ) {
    const skip = (page - 1) * limit;

    // Construir filtros dinâmicos
    const where: any = {};
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.role) {
      where.roles = { has: filters.role };
    }

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            bio: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByEmail(email: string, includePassword = false) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: includePassword,
        fullName: true,
        roles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async update(id: string, data: { name?: string; email?: string }) {
    // Verifica se usuário existe
    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se está alterando email, verifica se já existe
    if (data.email && data.email !== user.email) {
      const emailExists = await this.prisma.users.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async updateProfile(userId: string, data: { bio?: string }) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const profile = await this.prisma.profiles.upsert({
      where: { userId },
      create: {
        userId,
        bio: data.bio,
      },
      update: {
        bio: data.bio,
      },
    });

    return profile;
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    // Busca usuário com senha
    const user = await this.prisma.users.findUnique({
      where: { id },
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
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Senha atualizada com sucesso' };
  }

  async updateRoles(id: string, roles: Role[]) {
    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data: { roles },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async delete(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Deleta usuário (cascade deleta profile e posts)
    await this.prisma.users.delete({ where: { id } });

    return { message: 'Usuário deletado com sucesso' };
  }

  async deactivate(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async deleteAvatar(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.profile?.avatar) {
      throw new BadRequestException('Usuário não possui avatar');
    }

    // Deleta arquivo físico
    await this.uploadService.deleteAvatar(user.profile.avatar);

    // Remove do banco
    await this.prisma.profiles.update({
      where: { userId },
      data: { avatar: null },
    });

    return { message: 'Avatar removido com sucesso' };
  }

  async activate(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async count(filters?: { isActive?: boolean; role?: Role }) {
    const where: any = {};
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.role) {
      where.roles = { has: filters.role };
    }

    return this.prisma.users.count({ where });
  }

  async search(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.users.count({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
