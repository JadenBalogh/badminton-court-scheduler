import { Court, Player } from '../types/types';

type CourtPlayerProps = {
  court: Court;
  player: Player;
  handleSkipPlayer: (court: Court, player: Player) => void;
}

export default function CourtPlayer({ court, player, handleSkipPlayer }: CourtPlayerProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-center max-w-64 w-full"
        onClick={() => handleSkipPlayer(court, player)}>
        <p className="text-lg truncate">
          {player ? player.name : "(empty)"}
        </p>
      </div>
    </div>
  );
}
