export type Player = {
  // Static variables
  id: number;
  name: string;
  skillLevel: number;

  // Dynamic session variables
  lastPlayedTimestamp: number; // Timestamp since the last game ended
  lastPartneredTimestamp: { [id: number]: number }; // Timestamp this player last finished playing with each other player

  // Transient algorithm variables
  lastScheduledEndTimestamp: number; // The hypothetical last played time in the queue, based on last scheduled time
}

export type Court = {
  id: number;
  players: Player[];
}
