export class TeamResponseDto {
  id: string;
  name: string;
  memberCount?: number;
  boardCount?: number;
  members?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  boards?: Array<{
    id: string;
    name: string;
  }>;

  constructor(team: any, includeRelations = false) {
    this.id = team.id;
    this.name = team.name;

    if (includeRelations) {
      if (team.memberships) {
        this.memberCount = team.memberships.length;
        this.members = team.memberships.map((member: any) => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
        }));
      }
      if (team.boards) {
        this.boardCount = team.boards.length;
        this.boards = team.boards.map((board: any) => ({
          id: board.id,
          name: board.name,
        }));
      }
    } else {
      this.memberCount = team._count?.memberships;
      this.boardCount = team._count?.boards;
    }
  }
}
