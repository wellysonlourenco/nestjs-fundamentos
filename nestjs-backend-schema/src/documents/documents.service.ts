import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private uploadPath: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH_DOCUMENTS') ||
      './uploads/documents';
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    data?: { title?: string; description?: string },
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Valida se usuário existe
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Cria registro no banco
    const document = await this.prisma.documents.create({
      data: {
        title: data?.title || file.originalname,
        description: data?.description,
        filename: file.filename,
        filepath: `/uploads/documents/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Documento enviado com sucesso',
      document,
    };
  }

  async uploadMultipleDocuments(
    userId: string,
    files: Express.Multer.File[],
    data?: { title?: string; description?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Cria múltiplos documentos
    const documents = await Promise.all(
      files.map((file) =>
        this.prisma.documents.create({
          data: {
            title: data?.title || file.originalname,
            description: data?.description,
            filename: file.filename,
            filepath: `/uploads/documents/${file.filename}`,
            mimetype: file.mimetype,
            size: file.size,
            userId,
          },
        }),
      ),
    );

    return {
      message: `${documents.length} documento(s) enviado(s) com sucesso`,
      documents,
    };
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 10,
    filters?: { mimetype?: string; startDate?: Date; endDate?: Date },
  ) {
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = { userId };

    if (filters?.mimetype) {
      where.mimetype = { contains: filters.mimetype };
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [documents, total] = await Promise.all([
      this.prisma.documents.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.documents.count({ where }),
    ]);

    return {
      data: documents,
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

  async findAllByUser(userId: string, page = 1, limit = 10) {
    return this.findAll(userId, page, limit);
  }

  async findOne(id: string, userId: string) {
    const document = await this.prisma.documents.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Verifica se o usuário tem permissão para ver o documento
    if (document.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este documento',
      );
    }

    return document;
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; description?: string },
  ) {
    const document = await this.prisma.documents.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (document.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este documento',
      );
    }

    const updated = await this.prisma.documents.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Documento atualizado com sucesso',
      document: updated,
    };
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const document = await this.prisma.documents.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Verifica permissão (dono ou admin)
    if (!isAdmin && document.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este documento',
      );
    }

    // Deleta arquivo físico
    await this.deleteFile(document.filepath);

    // Deleta registro do banco
    await this.prisma.documents.delete({ where: { id } });

    return { message: 'Documento deletado com sucesso' };
  }

  async deleteMultiple(ids: string[], userId: string, isAdmin = false) {
    const documents = await this.prisma.documents.findMany({
      where: { id: { in: ids } },
    });

    if (documents.length === 0) {
      throw new NotFoundException('Nenhum documento encontrado');
    }

    // Verifica permissões
    if (!isAdmin) {
      const unauthorized = documents.some((doc) => doc.userId !== userId);
      if (unauthorized) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar alguns documentos',
        );
      }
    }

    // Deleta arquivos físicos
    await Promise.all(documents.map((doc) => this.deleteFile(doc.filepath)));

    // Deleta registros do banco
    const deleted = await this.prisma.documents.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      message: `${deleted.count} documento(s) deletado(s) com sucesso`,
      count: deleted.count,
    };
  }

  async download(id: string, userId: string) {
    const document = await this.prisma.documents.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (document.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para baixar este documento',
      );
    }

    // Constrói caminho completo do arquivo
    const filename = document.filepath.replace('/uploads/documents/', '');
    const filepath = path.join(this.uploadPath, filename);

    // Verifica se arquivo existe
    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Arquivo físico não encontrado');
    }

    return {
      filepath,
      filename: document.filename,
      mimetype: document.mimetype,
    };
  }

  async getStats(userId: string) {
    const [totalDocuments, totalSize, documentsByType] = await Promise.all([
      this.prisma.documents.count({ where: { userId } }),
      this.prisma.documents.aggregate({
        where: { userId },
        _sum: { size: true },
      }),
      this.prisma.documents.groupBy({
        by: ['mimetype'],
        where: { userId },
        _count: true,
        _sum: { size: true },
      }),
    ]);

    return {
      totalDocuments,
      totalSize: totalSize._sum.size || 0,
      totalSizeMB: ((totalSize._sum.size || 0) / 1024 / 1024).toFixed(2),
      documentsByType: documentsByType.map((type) => ({
        mimetype: type.mimetype,
        count: type._count,
        size: type._sum.size || 0,
        sizeMB: ((type._sum.size || 0) / 1024 / 1024).toFixed(2),
      })),
    };
  }

  async search(userId: string, query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.prisma.documents.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { filename: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.documents.count({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { filename: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async deleteFile(filepath: string): Promise<void> {
    try {
      const filename = filepath.replace('/uploads/documents/', '');
      const fullPath = path.join(this.uploadPath, filename);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️  Documento deletado: ${filename}`);
      }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
    }
  }
}
