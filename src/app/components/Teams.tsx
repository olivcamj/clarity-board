import React from 'react';

interface Team {
  id: string;
  name: string;
}

interface TeamsProps {
  teams: Team[];
}

const Teams = ({ teams }: TeamsProps) => {
  return (
    <div className="w-full">
      <h2>My Teams</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.id} className="w-7 h-1/2 border-2 p-1 text-blue-400">
            {team.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Teams;
