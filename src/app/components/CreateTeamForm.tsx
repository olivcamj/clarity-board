'use client';

import { useState } from 'react';
import { useTeams } from '../hooks/useTeams';

export function CreateTeamForm() {
  const [name, setName] = useState('');
  const { createTeam, loading, error } = useTeams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      const team = await createTeam(name);
      console.log('✅ Team created:', team);
      setName('');
    } catch {
      // error already handled in hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Team name"
        className="border p-2 rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? 'Creating…' : 'Create Team'}
      </button>

      {error && <p className="text-red-600">{error}</p>}
      
    </form>
  );
}
