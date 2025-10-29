import { z } from 'zod';

// Schema para registro
export const registerSchema = z.object({
  email: z
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa'),
  fullName: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim()
    .optional(),
});

// Schema para login
export const loginSchema = z.object({
  email: z
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Schema para forgot password
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .toLowerCase()
    .trim(),
});

// Schema para reset password
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z
    .string()
    .min(6, 'Nova senha deve ter no mínimo 6 caracteres')
    .max(100, 'Nova senha muito longa'),
});

// Schema para change password
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(6, 'Nova senha deve ter no mínimo 6 caracteres')
      .max(100, 'Nova senha muito longa'),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Nova senha deve ser diferente da senha atual',
    path: ['newPassword'],
  });

// Tipos inferidos
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
