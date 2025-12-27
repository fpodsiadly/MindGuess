import { getInitialAkiState } from "@/app/actions/akinator";
import { AkinatorShell } from "@/components/akinator-shell";

export default async function HomePage() {
  const initialState = await getInitialAkiState();

  return (
    <main>
      <AkinatorShell initialState={initialState} />
    </main>
  );
}
