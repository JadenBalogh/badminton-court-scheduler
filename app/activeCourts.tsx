import { Court, Player } from '../types/types';
import CourtDisplay from "./courtDisplay";

type ActiveCourtsProps = {
  courts: Court[];
  handleCourtFinishesGame: (i: number) => void;
  handleSkipPlayer: (player: Player) => void;
}

export default function ActiveCourts({ courts, handleCourtFinishesGame, handleSkipPlayer }: ActiveCourtsProps) {
  return (
    <div className="relative flex w-full justify-center gap-x-32">
      {
        courts.map((court) =>
          <div key={court.id}>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 rounded"
              onClick={() => handleCourtFinishesGame(court.id)}>
                Finish Game
            </button>
            <CourtDisplay court={court} handleSkipPlayer={handleSkipPlayer} />
          </div>
        )
      }
    </div>
  );
}