import { getGames } from '@/lib/games';
import GameViewer from '@/components/GameViewer';

export default async function Home() {
  const games = await getGames();

  return (
    <main className="min-h-screen bg-gray-50">
      <GameViewer games={games} />
    </main>
  );
}