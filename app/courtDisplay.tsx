import { Court, Player } from '../types/types';
import CourtPlayer from "./courtPlayer";
import { Scheduler } from './scheduler';

const NEW_COURT_DURATION: number = 10000; // How long a court is considered "new" after starting
const DEFAULT_PLAYER: Player = {
  name: "[empty]",
  username: "",
  skillLevel: 0,
  gender: "?",
  isEnabled: false,
  isPlaying: false,
  lastPlayedTimestamp: 0,
  lastPartneredTimestamp: {},
  gamesPlayed: 0,
  timesPartnered: {},
  lastScheduledEndTimestamp: 0
}

type CourtProps = {
  isActive: boolean,
  court: Court,
  players: Player[],
  handlePlayerSelected: (court: Court, player: Player, index: number) => void
}

export default function CourtDisplay({ isActive, court, players, handlePlayerSelected = () => { } }: CourtProps) {
  function shouldHighlight(): boolean {
    return isActive && Scheduler.getCurrentTime() - court.startTime < NEW_COURT_DURATION;
  }

  function getPlayer(index: number): Player {
    if (index < 0 || index >= court.playerIDs.length) {
      return DEFAULT_PLAYER;
    }

    let playerID = court.playerIDs[index];
    return players.find((p) => p.username === playerID) ?? DEFAULT_PLAYER;
  }

  return (
    <div className={`flex flex-col items-center w-64 p-4 rounded
      ${shouldHighlight()
        ? "bg-orange-200 font-semibold outline outline-3 outline-amber-200"
        : "bg-gradient-to-b from-neutral-300 to-zinc-300"}`
    }>
      <CourtPlayer court={court} player={getPlayer(0)} index={0} handlePlayerSelected={handlePlayerSelected} />
      <CourtPlayer court={court} player={getPlayer(1)} index={1} handlePlayerSelected={handlePlayerSelected} />
      <p className="py-2 text-sm">vs.</p>
      <CourtPlayer court={court} player={getPlayer(2)} index={2} handlePlayerSelected={handlePlayerSelected} />
      <CourtPlayer court={court} player={getPlayer(3)} index={3} handlePlayerSelected={handlePlayerSelected} />
    </div>
  );
}
