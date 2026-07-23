import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsArray,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';

// Mirrors src/app/types/task.ts's LabelKey union
export const LABEL_KEYS = [
  'design',
  'frontend',
  'backend',
  'infra',
  'research',
  'bug',
] as const;

export class TaskSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsIn(['high', 'med', 'low'])
  priority!: 'high' | 'med' | 'low';

  @IsArray()
  @ArrayMaxSize(4)
  @IsIn(LABEL_KEYS, { each: true })
  labels!: string[];
}
