import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}
