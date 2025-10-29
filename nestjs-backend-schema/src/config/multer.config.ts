import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';

// Configuração para Avatars
export const avatarMulterConfig: MulterOptions = {
  storage: diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `avatar-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      callback(
        new BadRequestException('Apenas imagens são permitidas!'),
        false,
      );
    } else {
      callback(null, true);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};

// Configuração para Vídeos
export const videoMulterConfig: MulterOptions = {
  storage: diskStorage({
    destination: './uploads/videos',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `video-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(mp4|avi|mov|wmv|flv|mkv)$/)) {
      callback(new BadRequestException('Apenas vídeos são permitidos!'), false);
    } else {
      callback(null, true);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
  },
};

// Configuração para Documentos
export const documentMulterConfig: MulterOptions = {
  storage: diskStorage({
    destination: './uploads/documents',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `doc-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(pdf|doc|docx|txt)$/)) {
      callback(new Error('Apenas documentos!'), false);
    } else {
      callback(null, true);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

// Configuração com Memory Storage (para Sharp)
export const imageMemoryConfig: MulterOptions = {
  storage: memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Apenas imagens!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
