import { z } from 'zod';

/**
 * Cria um schema com paginação
 * @example
 * const mySchema = withPagination(z.object({ name: z.string() }));
 */
export function withPagination<T extends z.ZodObject<any>>(schema: T) {
  return schema.extend({
    page: z.string().regex(/^\d+$/).default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).default('10').transform(Number),
  });
}

/**
 * Torna todos os campos de um schema opcionais
 * @example
 * const updateSchema = makeOptional(createSchema);
 */
export function makeOptional<T extends z.ZodObject<any>>(schema: T) {
  return schema.partial();
}

/**
 * Remove campos de um schema
 * @example
 * const publicUserSchema = omitFields(userSchema, ['password', 'resetToken']);
 */
export function omitFields<
  T extends z.ZodObject<any>,
  K extends keyof z.infer<T>,
>(schema: T, fields: K[]) {
  return schema.omit(
    fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
  );
}

/**
 * Seleciona apenas alguns campos de um schema
 * @example
 * const loginSchema = pickFields(userSchema, ['email', 'password']);
 */
export function pickFields<
  T extends z.ZodObject<any>,
  K extends keyof z.infer<T>,
>(schema: T, fields: K[]) {
  return schema.pick(
    fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
  );
}

/**
 * Valida um valor contra um schema sem lançar exceção
 * @returns { success: true, data } ou { success: false, error }
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Formata erros do Zod para um formato mais amigável
 */
export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Cria um schema de ID (UUID ou CUID)
 */
export function createIdSchema(type: 'uuid' | 'cuid' = 'cuid') {
  if (type === 'uuid') {
    return z.string().uuid('ID inválido');
  }
  return z.string().min(1, 'ID é obrigatório');
}

/**
 * Cria um schema enum a partir de um array de strings
 * @example
 * const statusSchema = createEnumSchema(['active', 'inactive', 'pending']);
 */
export function createEnumSchema<T extends string>(
  values: readonly [T, ...T[]],
  errorMessage?: string,
) {
  return z.enum(values, {
    message: errorMessage || `Valor deve ser um de: ${values.join(', ')}`,
  });
}

/**
 * Adiciona validação customizada a um schema
 */
export function withCustomValidation<T extends z.ZodTypeAny>(
  schema: T,
  validator: (value: z.infer<T>) => boolean | Promise<boolean>,
  message: string,
) {
  return schema.refine(validator, { message });
}
