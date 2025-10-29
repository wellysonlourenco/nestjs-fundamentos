import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  private uploadPath: string;
  private maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  constructor(private configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH') || './uploads/avatars';
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      console.log(`📁 Diretório de upload criado: ${this.uploadPath}`);
    }
  }

  validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Valida tipo de arquivo
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Apenas: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Valida tamanho
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    return true;
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    this.validateFile(file);

    // Gera nome único
    const filename = `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`;
    const filepath = path.join(this.uploadPath, filename);

    try {
      // Redimensiona e otimiza imagem com Sharp
      await sharp(file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 90 })
        .toFile(filepath);

      // Retorna caminho relativo
      return `/uploads/avatars/${filename}`;
    } catch (error) {
      throw new BadRequestException('Erro ao processar imagem');
    }
  }

  async deleteAvatar(avatarPath: string): Promise<void> {
    if (!avatarPath) return;

    try {
      // Remove /uploads/ do início para obter caminho real
      const filename = avatarPath.replace('/uploads/avatars/', '');
      const filepath = path.join(this.uploadPath, filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Avatar deletado: ${filename}`);
      }
    } catch (error) {
      console.error('Erro ao deletar avatar:', error);
    }
  }

  getFilePath(avatarPath: string): string {
    const filename = avatarPath.replace('/uploads/avatars/', '');
    return path.join(this.uploadPath, filename);
  }
}
