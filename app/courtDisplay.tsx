import { Court } from '../types/types';
import Image from "next/image";
import CourtPlayer from "./courtPlayer";

type CourtProps = {
  court: Court;
}

export default function CourtDisplay({ court }: CourtProps) {
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
            <CourtPlayer player={court.players[0]} />
            <CourtPlayer player={court.players[1]} />
          </div>
          <div className="flex w-full items-center justify-evenly">
            <CourtPlayer player={court.players[2]} />
            <CourtPlayer player={court.players[3]} />
          </div>
        </div>
      </div>
    </div>
  );
}
