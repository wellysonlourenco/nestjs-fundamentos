import { z } from 'zod';

// ========================================
// UUID Validation
// ========================================
export const uuidSchema = z.string().uuid('ID inválido');

// ========================================
// Pagination
// ========================================
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Página deve ser um número')
    .default('1')
    .transform(Number)
    .refine((val) => val > 0, 'Página deve ser maior que 0'),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limite deve ser um número')
    .default('10')
    .transform(Number)
    .refine((val) => val > 0 && val <= 100, 'Limite deve estar entre 1 e 100'),
});

// ========================================
// Date Range
// ========================================
export const dateRangeSchema = z
  .object({
    startDate: z
      .string()
      .datetime('Data inicial inválida')
      .or(z.string().date('Data inicial inválida'))
      .optional(),
    endDate: z
      .string()
      .datetime('Data final inválida')
      .or(z.string().date('Data final inválida'))
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Data inicial deve ser anterior à data final',
      path: ['endDate'],
    },
  );

// ========================================
// Email
// ========================================
export const emailSchema = z
  .email('Email inválido')
  .min(1, 'Email é obrigatório')
  .toLowerCase()
  .trim();

// ========================================
// Password
// ========================================
export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres')
  .max(100, 'Senha muito longa')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Senha deve conter ao menos uma letra maiúscula, uma minúscula e um número',
  )
  .optional()
  .or(z.string().min(6).max(100)); // Versão simples sem regex

export const simplePasswordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres')
  .max(100, 'Senha muito longa');

// ========================================
// Phone
// ========================================
export const phoneSchema = z
  .string()
  .regex(
    /^(\+\d{1,3}[- ]?)?\(?([0-9]{2,3})\)?[- ]?([0-9]{4,5})[- ]?([0-9]{4})$/,
    'Telefone inválido',
  )
  .optional()
  .or(z.string().min(10).max(15));

// ========================================
// CPF (Brazilian document)
// ========================================
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
  .optional();

// ========================================
// URL
// ========================================
export const urlSchema = z.string().url('URL inválida').optional();

// ========================================
// Sort Direction
// ========================================
export const sortDirectionSchema = z.enum(['asc', 'desc']).default('desc');

// ========================================
// Boolean from String
// ========================================
export const booleanFromStringSchema = z
  .enum(['true', 'false'])
  .transform((val) => val === 'true');

// ========================================
// File Size (in bytes)
// ========================================
export const fileSizeSchema = (maxSizeMB: number = 10) =>
  z
    .number()
    .max(
      maxSizeMB * 1024 * 1024,
      `Arquivo muito grande (máximo ${maxSizeMB}MB)`,
    );

// ========================================
// Common Mimetypes
// ========================================
export const imageMimetypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

export const documentMimetypeSchema = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const videoMimetypeSchema = z.enum([
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
]);

// ========================================
// Tipos inferidos
// ========================================
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;
