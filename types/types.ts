export type Player = {
  // Static variables
  name: string;
  username: string;
  skillLevel: number;

  // Dynamic session variables
  isEnabled: boolean; // Whether this player will be considered in the algorithm
  isPlaying: boolean; // Whether this player is currently playing on a court
  lastPlayedTimestamp: number; // Timestamp since the last game ended
  lastPartneredTimestamp: { [username: string]: number }; // Timestamp this player last finished playing with each other player

  // Transient algorithm variables
  lastScheduledEndTimestamp: number; // The hypothetical last played time in the queue, based on last scheduled time
}

export type PlayerData = {
  username: string;
  skillLevel: number;
}

export type Court = {
  id: number;
  players: Player[];
  startTime: number;
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
