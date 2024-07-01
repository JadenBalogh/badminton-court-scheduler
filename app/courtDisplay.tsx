import { Court, Player } from '../types/types';
import Image from "next/image";
import CourtPlayer from "./courtPlayer";

type CourtProps = {
  court: Court;
  handleSkipPlayer: (player: Player) => void;
}

export default function CourtDisplay({ court, handleSkipPlayer }: CourtProps) {
  return (
    <div className="relative text-center">
      <Image
        src="/badminton-court.png"
        alt="Badminton Court"
        width={218}
        height={400}
        priority
      />
      <div className="w-full absolute top-0 left-0 text-center py-6">
        <div className="flex flex-col h-80 items-center justify-between">
          <div className="flex w-full items-center justify-evenly">
            <CourtPlayer player={court.players[0]} handleSkipPlayer={handleSkipPlayer} />
            <CourtPlayer player={court.players[1]} handleSkipPlayer={handleSkipPlayer} />
          </div>
          <div className="flex w-full items-center justify-evenly">
            <CourtPlayer player={court.players[2]} handleSkipPlayer={handleSkipPlayer} />
            <CourtPlayer player={court.players[3]} handleSkipPlayer={handleSkipPlayer} />
          </div>
        </div>
      </div>
    </div>
  );
}
