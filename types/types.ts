export type Player = {
  id: number;
  name: string;
  skillLevel: number;
}

export type Court = {
  id: number;
  players: Player[];
}
