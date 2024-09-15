import { Court, Player } from '../types/types';
import CourtDisplay from "./courtDisplay";
import { Scheduler } from './scheduler';

type ActiveCourtsProps = {
  courts: Court[];
  players: Player[];
  handleGameFinished: (i: number) => void;
  handlePlayerSelected: (court: Court, player: Player) => void;
}

export default function ActiveCourts({ courts, players, handleGameFinished, handlePlayerSelected }: ActiveCourtsProps) {
  function getPlayTime(court: Court) {
    let playTimeMS = Scheduler.getCurrentTime() - court.startTime;
    let playTimeMins = playTimeMS / 1000 / 60; // Convert ms to mins
    return Math.round(playTimeMins);
  }

  function getPlayTimeText(court: Court) {
    if (court.playerIDs.length === 0) {
      return "";
    }

    let playTime = getPlayTime(court);
    let minsText = playTime === 1 ? "min" : "mins";
    return playTime === 0 ? "Just started!" : "Started " + playTime + " " + minsText + " ago.";
  }

  return (
    <div className="flex flex-wrap w-full justify-center gap-y-8">
      {
        courts.map((court) =>
          <div className="flex flex-col w-80 items-center gap-y-2" key={court.id}>
            <CourtDisplay isActive={true} court={court} players={players} handlePlayerSelected={handlePlayerSelected} />
            <p className="text-sm">{getPlayTimeText(court)}</p>
            {court.playerIDs.length > 0 ?
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-32 h-12 mt-4 rounded"
                onClick={() => handleGameFinished(court.id)}>
                Finish Game
              </button> : <></>
            }
          </div>
        )
      }
    </div>
  );
}
