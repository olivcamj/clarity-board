import { IsUUID, IsArray } from 'class-validator';

export class AddUserToTeamDto {
  @IsUUID()
  @IsArray()
  userId!: string;
}
