import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateSubtaskDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
