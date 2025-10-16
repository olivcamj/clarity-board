export class UserResponseDto {
  id!: string;
  clerkId!: string;
  name!: string | null;
  email!: string | null;
  role!: string;
  createdAt!: Date;
  updatedAt!: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
