import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../guard/jwt.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar/:userId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const avatarPath = await this.uploadService.uploadAvatar(file, userId);

    return {
      message: 'Avatar enviado com sucesso',
      avatarUrl: avatarPath,
    };
  }

  @Delete('avatar')
  async deleteAvatar(@Param('avatarPath') avatarPath: string) {
    await this.uploadService.deleteAvatar(avatarPath);

    return {
      message: 'Avatar deletado com sucesso',
    };
  }
}
