import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsBoolean()
  isAI?: boolean;
}
