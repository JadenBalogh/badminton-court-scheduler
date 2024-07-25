import { Court, Player } from '../types/types';
import Image from "next/image";
import CourtPlayer from "./courtPlayer";

type CourtProps = {
  court: Court;
  handleSkipPlayer: (player: Player) => void;
}

export default function CourtDisplay({ court, handleSkipPlayer }: CourtProps) {
  return (
    <div className="flex flex-col items-center w-64 p-4 bg-neutral-300 rounded">
      <CourtPlayer player={court.players[0]} handleSkipPlayer={handleSkipPlayer} />
      <CourtPlayer player={court.players[1]} handleSkipPlayer={handleSkipPlayer} />
      <p className="py-2">vs.</p>
      <CourtPlayer player={court.players[2]} handleSkipPlayer={handleSkipPlayer} />
      <CourtPlayer player={court.players[3]} handleSkipPlayer={handleSkipPlayer} />
    </div>
  );
}
