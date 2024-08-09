import { Court, Player } from '../types/types';
import CourtPlayer from "./courtPlayer";
import { NEW_COURT_DURATION } from './page';

type CourtProps = {
  isActive: boolean,
  court: Court,
  handleSkipPlayer: (court: Court, player: Player) => void
}

export default function CourtDisplay({ isActive, court, handleSkipPlayer = () => { } }: CourtProps) {
  function shouldHighlight(): boolean {
    return isActive && Date.now() - court.startTime < NEW_COURT_DURATION;
  }

  return (
    <div className={`flex flex-col items-center w-64 p-4 rounded
      ${shouldHighlight()
        ? "bg-orange-200 font-semibold outline outline-3 outline-amber-200"
        : "bg-gradient-to-b from-neutral-300 to-zinc-300"}`
    }>
      <CourtPlayer court={court} player={court.players[0]} handleSkipPlayer={handleSkipPlayer} />
      <CourtPlayer court={court} player={court.players[1]} handleSkipPlayer={handleSkipPlayer} />
      <p className="py-2 text-sm">vs.</p>
      <CourtPlayer court={court} player={court.players[2]} handleSkipPlayer={handleSkipPlayer} />
      <CourtPlayer court={court} player={court.players[3]} handleSkipPlayer={handleSkipPlayer} />
    </div>
  );
}
