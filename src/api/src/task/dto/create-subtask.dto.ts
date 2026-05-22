import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubtaskDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
