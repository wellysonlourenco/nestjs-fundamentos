import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Request,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { avatarMulterConfig } from 'src/config/multer.config';
import { usePipe } from 'src/common/pipes';
import {
  CreateUserInput,
  createUserSchema,
  UpdateUserInput,
  updateUserSchema,
  UpdateProfileInput,
  updateProfileSchema,
  UpdatePasswordInput,
  updatePasswordSchema,
  UpdateRolesInput,
  updateRolesSchema,
  ListUsersQuery,
  listUsersQuerySchema,
  SearchUsersQuery,
  searchUsersQuerySchema,
} from 'src/common';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========== ROTAS PÚBLICAS (PROFILE DO USUÁRIO LOGADO) ==========

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body(usePipe(updateProfileSchema)) data: UpdateProfileInput,
  ) {
    return this.usersService.updateProfile(req.user.userId, data);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', avatarMulterConfig))
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(req.user.userId, file);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@Request() req) {
    return this.usersService.deleteAvatar(req.user.userId);
  }

  @Put('password')
  async updatePassword(
    @Request() req,
    @Body(usePipe(updatePasswordSchema)) data: UpdatePasswordInput,
  ) {
    return this.usersService.updatePassword(
      req.user.userId,
      data.oldPassword,
      data.newPassword,
    );
  }

  // ========== ROTAS DE ADMIN ==========

  @Post()
  @Roles(Role.ADMIN)
  create(@Body(usePipe(createUserSchema)) data: CreateUserInput) {
    return this.usersService.create(data);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  findAll(@Query(usePipe(listUsersQuerySchema)) query: ListUsersQuery) {
    const filters: { isActive?: boolean; role?: Role } = {};

    if (query.isActive !== undefined) {
      filters.isActive = query.isActive;
    }

    if (query.role) {
      filters.role = query.role;
    }

    const page = query.page || 1;
    const limit = query.limit || 10;

    return this.usersService.findAll(page, limit, filters);
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.MODERATOR)
  search(@Query(usePipe(searchUsersQuerySchema)) query: SearchUsersQuery) {
    return this.usersService.search(query.q, query.page, query.limit);
  }

  @Get('count')
  @Roles(Role.ADMIN, Role.MODERATOR)
  async count(
    @Query('isActive') isActive?: string,
    @Query('role') role?: Role,
  ) {
    const filters: { isActive?: boolean; role?: Role } = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (role) {
      filters.role = role;
    }

    const total = await this.usersService.count(filters);
    return { total };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body(usePipe(updateUserSchema)) data: UpdateUserInput,
  ) {
    return this.usersService.update(id, data);
  }

  @Put(':id/roles')
  @Roles(Role.ADMIN)
  updateRoles(
    @Param('id') id: string,
    @Body(usePipe(updateRolesSchema)) data: UpdateRolesInput,
  ) {
    return this.usersService.updateRoles(id, data.roles);
  }

  @Put(':id/deactivate')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Put(':id/activate')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
