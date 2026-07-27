import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SubtaskSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  text!: string;
}
