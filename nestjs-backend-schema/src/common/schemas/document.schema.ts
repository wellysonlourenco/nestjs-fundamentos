import { z } from 'zod';

// Schema para criação de documento
export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título muito longo')
    .trim(),
  description: z.string().max(1000, 'Descrição muito longa').trim().optional(),
});

// Schema para atualização de documento
export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título muito longo')
    .trim()
    .optional(),
  description: z.string().max(1000, 'Descrição muito longa').trim().optional(),
});

// Schema para query params de listagem
export const listDocumentsQuerySchema = z.object({
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
  userId: z.string().uuid('ID de usuário inválido').optional(),
});

// Schema para validação de arquivo
export const fileUploadSchema = z.object({
  mimetype: z
    .string()
    .refine(
      (mime) =>
        [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ].includes(mime),
      'Tipo de arquivo não suportado',
    ),
  size: z.number().max(10 * 1024 * 1024, 'Arquivo muito grande (máximo 10MB)'),
});

// Tipos inferidos
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type FileUploadValidation = z.infer<typeof fileUploadSchema>;
