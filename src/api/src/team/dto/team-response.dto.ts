export class TeamResponseDto {
  id: string;
  name: string;
  userCount?: number;
  boardCount?: number;
  users?: Array<{
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
      if (team.users) {
        this.userCount = team.users.length;
        this.users = team.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }));
      }
      if (team.boards) {
        this.boardCount = team.boards?.length;
        this.boards = team.boards.map((board: any) => ({
          id: board.id,
          name: board.name,
        }));
      }
    } else {
      this.userCount = team._count?.users;
      this.boardCount = team._count?.boards;
    }
  }
}
