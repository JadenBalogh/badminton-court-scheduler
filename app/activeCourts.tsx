import { Court, Player } from '../types/types';
import CourtDisplay from "./courtDisplay";

type ActiveCourtsProps = {
  courts: Court[];
  handleGameFinished: (i: number) => void;
  handleSkipPlayer: (player: Player) => void;
}

export default function ActiveCourts({ courts, handleGameFinished, handleSkipPlayer }: ActiveCourtsProps) {
  return (
    <div className="flex flex-wrap w-full justify-center gap-y-8">
      {
        courts.map((court) =>
          <div className="flex flex-col w-80 items-center gap-y-6" key={court.id}>
            <CourtDisplay court={court} handleSkipPlayer={handleSkipPlayer} />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-32 h-12 rounded"
              onClick={() => handleGameFinished(court.id)}>
              Finish Game
            </button>
          </div>
        )
      }
    </div>
  );
}
