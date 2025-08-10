import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsPositive,
} from 'class-validator';

export class DeleteUserDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsPositive({ each: true })
  ids: number[];
}
