import { z } from 'zod';
import { Role } from '@prisma/client';

// Schema para criação de usuário
export const createUserSchema = z.object({
  email: z.email('Email inválido').min(1, 'Email é obrigatório'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa'),
  fullName: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .optional(),
  roles: z.array(z.nativeEnum(Role)).default([Role.USER]).optional(),
});

// Schema para atualização de usuário
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .optional(),
  email: z.email('Email inválido').optional(),
});

// Schema para atualização de perfil
export const updateProfileSchema = z.object({
  bio: z.string().max(500, 'Bio muito longa').optional(),
});

// Schema para atualização de senha
export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(6, 'Nova senha deve ter no mínimo 6 caracteres')
    .max(100, 'Nova senha muito longa'),
});

// Schema para atualização de roles
export const updateRolesSchema = z.object({
  roles: z.array(z.nativeEnum(Role)).min(1, 'Deve ter ao menos uma role'),
});

// Schema para query params de listagem
export const listUsersQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Página deve ser um número')
    .default('1')
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limite deve ser um número')
    .default('10')
    .transform(Number),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  role: z.nativeEnum(Role).optional(),
});

// Schema para busca
export const searchUsersQuerySchema = z.object({
  q: z
    .string()
    .min(1, 'Termo de busca é obrigatório')
    .max(100, 'Termo de busca muito longo'),
  page: z.string().regex(/^\d+$/).default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).default('10').transform(Number),
});

// Tipos inferidos
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateRolesInput = z.infer<typeof updateRolesSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
