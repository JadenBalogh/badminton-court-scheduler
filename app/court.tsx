import Image from "next/image";
import CourtPlayer from "./court-player";

type CourtProps = {
  players: string[];
}

export default function Court({ players }: CourtProps) {
  function getPlayer(index: number) {
    return players[index] ?? "(empty)";
  }

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
            <CourtPlayer name={getPlayer(0)} />
            <CourtPlayer name={getPlayer(1)} />
          </div>
          <div className="flex w-full items-center justify-evenly">
            <CourtPlayer name={getPlayer(2)} />
            <CourtPlayer name={getPlayer(3)} />
          </div>
        </div>
      </div>
    </div>
  );
}
