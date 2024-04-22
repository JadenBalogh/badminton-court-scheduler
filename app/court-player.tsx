import Image from "next/image";

export default function CourtPlayer() {
  return (
    <div className="flex flex-col max-w-20 w-full items-center justify-between">
      <Image
        src="/badminton-racket.svg"
        alt="Badminton Racket"
        width={60}
        height={60}
        priority
      />
      <div className="text-left w-full">
        <p className="truncate">
          {"Player Name Test"}
        </p>
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 rounded">
        Skip
      </button>
    </div>
  );
}
