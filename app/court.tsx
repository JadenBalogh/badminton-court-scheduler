import Image from "next/image";
import CourtPlayer from "./court-player";

export default function Court() {
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
            <CourtPlayer />
            <CourtPlayer />
          </div>
          <div className="flex w-full items-center justify-evenly">
            <CourtPlayer />
            <CourtPlayer />
          </div>
        </div>
      </div>
    </div>
  );
}
