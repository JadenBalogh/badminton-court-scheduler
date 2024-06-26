export type Player = {
  // Static variables
  name: string;
  skillLevel: number;

  // Dynamic session variables
  isPlaying: boolean;
  lastPlayedTimestamp: number; // Timestamp since the last game ended
  lastPartneredTimestamp: { [name: string]: number }; // Timestamp this player last finished playing with each other player

  // Transient algorithm variables
  lastScheduledEndTimestamp: number; // The hypothetical last played time in the queue, based on last scheduled time
}

export type PlayerData = {
  name: string;
  skillLevel: number;
}

export type Court = {
  id: number;
  players: Player[];
}

export type SessionSettings = {
  courtCount: number;
  maxTeamSkillVariance: number;
  maxIndividualSkillVariance: number;
  expectedGameDuration: number;
  maxTimeScoreWaitTime: number;
  maxDiversityScoreWaitTime: number;
  timeScoreWeight: number;
  diversityScoreWeight: number;
  balanceScoreWeight: number;
  skillScoreWeight: number;
}
