import { Court, Player } from '../types/types';

const SHOW_SKILL_LEVEL = false;

type CourtPlayerProps = {
  court: Court;
  player: Player;
  index: number;
  handlePlayerSelected: (court: Court, player: Player, index: number) => void;
}

export default function CourtPlayer({ court, player, index, handlePlayerSelected }: CourtPlayerProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-center max-w-64 w-full"
        onClick={() => handlePlayerSelected(court, player, index)}>
        <p className="text-lg truncate">
          {player ? player.name + (SHOW_SKILL_LEVEL ? " (" + player.skillLevel + ")" : "") : "[empty]"}
        </p>
      </div>
    </div>
  );
}
