import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

import { UserRole } from '../../../generated/client';
export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  clerkId!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
