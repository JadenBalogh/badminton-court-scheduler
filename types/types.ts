export type Player = {
  id: number;
  name: string;
  skillLevel: number;
  waitStartTime: number; // Timestamp since the last game ended
  lastPlayedTimes: { [id: number]: number }; // Timestamp this player last finished playing with each other player
}

export type Court = {
  id: number;
  players: Player[];
}
