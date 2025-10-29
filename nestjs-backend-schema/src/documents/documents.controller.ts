import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { documentMulterConfig } from 'src/config/multer.config';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import * as fs from 'fs';
import { Response } from 'express';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('document', documentMulterConfig))
  async uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.documentsService.uploadDocument(req.user.userId, file, body);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('documents', 10, documentMulterConfig))
  async uploadMultipleDocuments(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { title?: string; description?: string },
  ) {
    return this.documentsService.uploadMultipleDocuments(
      req.user.userId,
      files,
      body,
    );
  }

  @Get() // Listar meus documentos
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('mimetype') mimetype?: string,
  ) {
    const filters = mimetype ? { mimetype } : undefined;
    return this.documentsService.findAll(
      req.user.userId,
      +page,
      +limit,
      filters,
    );
  }

  @Get('stats') //Estatísticas dos documentos
  async getStats(@Request() req) {
    return this.documentsService.getStats(req.user.userId);
  }

  @Get('search') // Buscar documentos
  async search(
    @Request() req,
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.documentsService.search(req.user.userId, query, +page, +limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user.userId);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const { filepath, filename, mimetype } =
      await this.documentsService.download(id, req.user.userId);

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.documentsService.update(id, req.user.userId, body);
  }

  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async delete(@Param('id') id: string, @Request() req) {
  //   const isAdmin = req.user.roles?.includes(Role.ADMIN);
  //   return this.documentsService.delete(id, req.user.userId, isAdmin);
  // }

  @Delete('batch/delete') // Deletar múltiplos documentos (Admin)
  // @Roles(Role.ADMIN)
  async deleteMultiple(@Request() req, @Body() body: { ids: string[] }) {
    return this.documentsService.deleteMultiple(
      body.ids,
      req.user.userId,
      true,
    );
  }
}

// POST   /api/documents/upload              // Upload 1 documento
// POST   /api/documents/upload-multiple     // Upload múltiplos
// GET    /api/documents                     // Listar meus documentos
// GET    /api/documents/stats               // Estatísticas
// GET    /api/documents/search?q=termo      // Buscar
// GET    /api/documents/:id                 // Ver detalhes
// GET    /api/documents/:id/download        // Baixar
// PUT    /api/documents/:id                 // Atualizar info
// DELETE /api/documents/:id                 // Deletar
// DELETE /api/documents/batch/delete        // Deletar vários (Admin)
