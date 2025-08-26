import { IsArray, IsIn, IsOptional, IsString, MinLength, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChatDto {
  @IsString()
  @MinLength(1)
  input!: string;

  @IsOptional()
  @IsString()
  actor?: string;
}

export class TeachDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @ArrayNotEmpty({ message: 'tags must not be an empty array', each: false })
  tags?: string[];

  @IsOptional()
  @IsIn(['global', 'session'])
  @Transform(({ value }) => (value ?? 'session'))
  scope?: 'global' | 'session';
}
