export type Player = {
  // Static variables
  name: string;
  username: string; // Used as an ID for this player. Careful: not checked for uniqueness.
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
  timeScoreWeight: number;
  diversityScoreWeight: number;
  balanceScoreWeight: number;
  skillScoreWeight: number;
}

export type ConfirmDialogOptions = {
  title: string,
  desc: string,
  confirmText: string,
  cancelText: string,
}

export type ConfirmDialogCallback = (confirmed: boolean) => void;
export type Callback = () => void;
