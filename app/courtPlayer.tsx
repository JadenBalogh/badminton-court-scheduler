import { Player } from '../types/types';
import Image from "next/image";

type CourtPlayerProps = {
  player: Player;
}

export default function CourtPlayerDisplay({ player }: CourtPlayerProps) {
  return (
    <div className="flex flex-col max-w-20 w-full items-center justify-between">
      <Image
        src="/badminton-racket.svg"
        alt="Badminton Racket"
        width={60}
        height={60}
        priority
      />
      <div className="text-center w-full">
        <p className="truncate">
          {player ? player.name : "(empty)"}
        </p>
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 rounded">
        Skip
      </button>
    </div>
  );
}
