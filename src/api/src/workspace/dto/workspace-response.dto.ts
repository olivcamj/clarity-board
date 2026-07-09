import { MemberRole } from '../../../generated/client';

export class WorkspaceResponseDto {
  id: string;
  name: string;
  role: MemberRole;

  constructor(workspace: { id: string; name: string }, role: MemberRole) {
    this.id = workspace.id;
    this.name = workspace.name;
    this.role = role;
  }
}
