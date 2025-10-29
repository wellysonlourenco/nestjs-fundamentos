import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new BadRequestException({
          message: 'Validação falhou',
          errors,
        });
      }
      throw new BadRequestException('Validação falhou');
    }
  }
}

/**
 * Função helper para usar o pipe inline
 * @example
 * create(@Body(usePipe(createUserSchema)) data: CreateUserInput) {}
 */
export function usePipe(schema: ZodSchema) {
  return new ZodValidationPipe(schema);
}
