export type Player = {
  // Static variables
  name: string;
  username: string; // Used as an ID for this player. Careful: not checked for uniqueness.
  skillLevel: number;

  // Dynamic session variables
  isEnabled: boolean; // Whether this player will be considered in the algorithm
  isPlaying: boolean; // Whether this player is currently playing on a court
  lastPlayedTimestamp: number; // Timestamp the last game ended
  lastPartneredTimestamp: { [username: string]: number }; // Timestamp this player last finished playing with each other player
  gamesPlayed: number;
  timesPartnered: { [username: string]: number };

  // Transient algorithm variables
  lastScheduledEndTimestamp: number; // The hypothetical last played time in the queue, based on last scheduled time
}

export type PlayerData = {
  username: string;
  skillLevel: number;
}

export type Court = {
  id: number;
  playerIDs: string[];
  startTime: number;
}

export type SessionSettings = {
  courtCount: number;
  maxTeamSkillVariance: number;
  maxIndividualSkillVariance: number;
  expectedGameDuration: number;
  maxTimeScoreWaitTime: number;
  maxDiversityScoreWaitTime: number;
  maxDiversityScorePlayCount: number;
  timeScoreWeight: number;
  diversityScoreWeight: number;
  balanceScoreWeight: number;
  skillScoreWeight: number;
}

export type ConfirmDialogOptions = {
  title: string;
  desc: string;
  confirmText: string;
  cancelText: string;
  defaultOption: string;
  players: Player[];
}

export type ConfirmDialogResult = {
  confirmed: boolean,
  player: Player | undefined,
}

export type ConfirmDialogCallback = (confirmed: boolean, player: Player | undefined) => void;
export type ConfirmCallback = (player: Player | undefined) => void;
