import { Player } from '../types/types';
import Image from "next/image";

type CourtPlayerProps = {
  player: Player;
  handleSkipPlayer: (player: Player) => void;
}

export default function CourtPlayer({ player, handleSkipPlayer }: CourtPlayerProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-center max-w-64 w-full">
        <p className="text-lg truncate">
          {player ? player.name : "(empty)"}
        </p>
      </div>
    </div>
  );
}
