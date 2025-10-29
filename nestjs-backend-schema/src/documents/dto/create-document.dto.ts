import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class DeleteMultipleDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[] | undefined;
}
