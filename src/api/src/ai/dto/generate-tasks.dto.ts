import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class GenerateTasksDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  input!: string;
}
