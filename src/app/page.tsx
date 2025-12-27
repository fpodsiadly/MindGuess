import { getInitialState } from "@/app/actions/game";
import { GameShell } from "@/components/game-shell";

export default async function HomePage() {
  const initialState = await getInitialState();

  return (
    <main>
      <GameShell initialState={initialState} />
    </main>
  );
}
