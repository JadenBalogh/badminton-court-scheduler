import { Player, Court, SessionSettings } from '../types/types'

const ADVANCED_DEBUG_LOGGING = false; // Enable advanced logging
const DEFAULT_PLAYER: Player = {
  name: "",
  username: "",
  skillLevel: 0,
  isEnabled: false,
  isPlaying: false,
  lastPlayedTimestamp: 0,
  lastPartneredTimestamp: {},
  lastScheduledEndTimestamp: 0
}

// Returns the normalized TIME score for the given player. 0 minute wait = 0.0 time score. 30 minute wait = 1.0 time score.
function calculateTimeScore(player: Player, gameStartTime: number, settings: SessionSettings) {
  if (player.isPlaying) {
    return 0;
  }

  let waitTime = gameStartTime - player.lastScheduledEndTimestamp;
  return Math.min(waitTime, settings.maxTimeScoreWaitTime) / settings.maxTimeScoreWaitTime;
}

// Returns the normalized DIVERSITY score for the given player. Just played with all others = 0.0 diversity score. Played with all others 1+ hours ago = 1.0 time score.
function calculateDiversityScore(player: Player, gameStartTime: number, otherPlayers: Player[], settings: SessionSettings) {
  let diversityScore = 0;
  for (let otherPlayer of otherPlayers) {
    let lastPartneredTime = player.lastPartneredTimestamp[otherPlayer.username] ? player.lastPartneredTimestamp[otherPlayer.username] : 0;
    let lastPlayedDelay = gameStartTime - lastPartneredTime;
    diversityScore += Math.min(lastPlayedDelay, settings.maxDiversityScoreWaitTime) / settings.maxDiversityScoreWaitTime;
  }
  return diversityScore / otherPlayers.length;
}

// Returns the normalized BALANCE score for the given player. Skill variance more than maxTeamSkillVariance beyond the target level = 0.0 skill score. Exact skill match = 1.0 skill score.
function calculateBalanceScore(player: Player, otherPlayers: Player[], settings: SessionSettings) {
  if (otherPlayers.length < 2) {
    return 0; // Skill score can only be calculated when at least one player has been picked on each team.
  }

  let targetSkillLevel;
  if (otherPlayers.length === 2) {
    // When finding the 2nd team 1 player, aim to find one with the same skill level as the 1st team 2 player
    targetSkillLevel = otherPlayers[1].skillLevel;
  } else {
    // When finding the 2nd team 2 player, aim to perfectly balance the team skill levels
    let team1SkillLevel = otherPlayers[0].skillLevel + otherPlayers[2].skillLevel;
    let team2SkillLevel = otherPlayers[1].skillLevel;
    targetSkillLevel = team1SkillLevel - team2SkillLevel;
  }

  let skillVariance = Math.abs(player.skillLevel - targetSkillLevel);
  return 1 - Math.min(skillVariance / (settings.maxTeamSkillVariance + 1), 1);
}

// Returns the normalized SKILL score for the given player. Skill variance more than maxIndividualSkillVariance beyond the target level = 0.0 skill score. Exact skill match = 1.0 skill score.
function calculateSkillScore(player: Player, otherPlayers: Player[], settings: SessionSettings) {
  if (otherPlayers.length > 1) {
    return 0; // Skill score can only be calculated when at least one player has been picked on each team.
  }

  let targetSkillLevel = otherPlayers[0].skillLevel;
  let skillVariance = Math.abs(player.skillLevel - targetSkillLevel);
  return 1 - Math.min(skillVariance / (settings.maxIndividualSkillVariance + 1), 1);
}

// Returns the weighted sum of the TIME, DIVERSITY, BALANCE, and SKILL scores
function calculateTotalScore(player: Player, gameStartTime: number, otherPlayers: Player[], settings: SessionSettings) {
  let timeScore = calculateTimeScore(player, gameStartTime, settings) * settings.timeScoreWeight;
  let diversityScore = calculateDiversityScore(player, gameStartTime, otherPlayers, settings) * settings.diversityScoreWeight;
  let balance = calculateBalanceScore(player, otherPlayers, settings) * settings.balanceScoreWeight;
  let skill = calculateSkillScore(player, otherPlayers, settings) * settings.skillScoreWeight;
  return timeScore + diversityScore + balance + skill;
}

// Returns the best matching player in the queue based on the scheduling heuristics
function assignBestPlayer(playerQueue: Player[], gameStartTime: number, selectedPlayers: Player[], settings: SessionSettings): Player {
  // Consider only players that haven't already been selected as part of this team
  let candidates = playerQueue.slice(0, playerQueue.length - selectedPlayers.length);

  // Try to filter out any player that has a 0 balance AND skill score for this team (i.e. outside the allowed skill variances)
  let skillFilterResults = candidates.filter(player => calculateBalanceScore(player, selectedPlayers, settings) + calculateSkillScore(player, selectedPlayers, settings) > 0);
  if (skillFilterResults.length > 0) {
    candidates = skillFilterResults; // Only apply the skill filter if any valid players are left
  }

  // Reduce the candidates down to the highest scoring player
  let bestPlayer = candidates.reduce((prevPlayer, currPlayer) => {
    let prevPlayerScore = calculateTotalScore(prevPlayer, gameStartTime, selectedPlayers, settings);
    let currPlayerScore = calculateTotalScore(currPlayer, gameStartTime, selectedPlayers, settings);
    return prevPlayerScore >= currPlayerScore ? prevPlayer : currPlayer;
  });

  if (ADVANCED_DEBUG_LOGGING) {
    console.log("Evaluating candidates:")
    console.log(candidates.map((player) => [player.name, calculateTotalScore(player, gameStartTime, selectedPlayers, settings), player]).sort((a, b) => Number(b[1]) - Number(a[1])));
    console.log("Found best player with total score: " + calculateTotalScore(bestPlayer, gameStartTime, selectedPlayers, settings));
    console.log("Best player score breakdown:");
    console.log(" -> TIME: " + calculateTimeScore(bestPlayer, gameStartTime, settings) * settings.timeScoreWeight) + " (last scheduled end: " + bestPlayer.lastScheduledEndTimestamp + ")";
    console.log(" -> DIVERSITY: " + calculateDiversityScore(bestPlayer, gameStartTime, selectedPlayers, settings) * settings.diversityScoreWeight);
    console.log(" -> BALANCE: " + calculateBalanceScore(bestPlayer, selectedPlayers, settings) * settings.balanceScoreWeight);
    console.log(" -> SKILL: " + calculateSkillScore(bestPlayer, selectedPlayers, settings) * settings.skillScoreWeight);
    console.log(" -> Last Scheduled End: " + bestPlayer.lastScheduledEndTimestamp);
  }

  return bestPlayer;
}

// Wraps the target player to the end of the queue and updates their scheduled next game end time
function schedulePlayer(playerQueue: Player[], player: Player, gameStartTime: number, settings: SessionSettings) {
  let playerIndex = playerQueue.indexOf(player);
  playerQueue.splice(playerIndex, 1);
  playerQueue.push(player);
  player.lastScheduledEndTimestamp = gameStartTime + settings.expectedGameDuration;
}

// Returns a list of playerIDs created using the team balancing algorithm. Format: [T1P1, T2P1, T1P2, T2P2] (T = Team, P = Player)
function assignCourtPlayers(playerQueue: Player[], gameStartTime: number, settings: SessionSettings): string[] {
  if (ADVANCED_DEBUG_LOGGING) {
    console.log("Picking Team 1, Player 1...");
  }

  // Assign first player in queue to team 1
  let team1Player1 = playerQueue[0];
  schedulePlayer(playerQueue, team1Player1, gameStartTime, settings);

  if (ADVANCED_DEBUG_LOGGING) {
    console.log(structuredClone(team1Player1));

    console.log("***");
    console.log("Picking Team 2, Player 1...");
  }

  // Assign next best player in queue to team 2 using TIME and DIVERSITY heuristics
  let team2Player1 = assignBestPlayer(playerQueue, gameStartTime, [team1Player1], settings);
  schedulePlayer(playerQueue, team2Player1, gameStartTime, settings);

  if (ADVANCED_DEBUG_LOGGING) {
    console.log(structuredClone(team2Player1));

    console.log("***");
    console.log("Picking Team 1, Player 2...");
  }

  // Assign next best player in queue to team 1 using TIME and DIVERSITY heuristics
  let team1Player2 = assignBestPlayer(playerQueue, gameStartTime, [team1Player1, team2Player1], settings);
  schedulePlayer(playerQueue, team1Player2, gameStartTime, settings);

  if (ADVANCED_DEBUG_LOGGING) {
    console.log(structuredClone(team1Player2));

    console.log("***");
    console.log("Picking Team 2, Player 2...");
  }

  // Assign next best player in queue to team 2 using TIME, DIVERSITY and BALANCE heuristics
  let team2Player2 = assignBestPlayer(playerQueue, gameStartTime, [team1Player1, team2Player1, team1Player2], settings);
  schedulePlayer(playerQueue, team2Player2, gameStartTime, settings);

  if (ADVANCED_DEBUG_LOGGING) {
    console.log(structuredClone(team2Player2));
  }

  return [team1Player1.username, team1Player2.username, team2Player1.username, team2Player2.username];
}

function getPlayer(username: string, players: Player[]): Player {
  let player = players.find((p) => p.username === username);
  if (!player) {
    console.log("ERROR: Failed to find player by username: (" + username + "). Scheduling will likely break.");
  }
  return player ?? DEFAULT_PLAYER;
}

// Returns a priority-sorted player queue from the given list of players
function generatePlayerQueue(players: Player[]) {
  let playerQueue: Player[] = [...players];
  playerQueue.sort((a, b) => {
    if (a.isPlaying !== b.isPlaying) {
      return +a.isPlaying - +b.isPlaying;
    } else {
      return a.lastPlayedTimestamp - b.lastPlayedTimestamp
    }
  });
  return playerQueue;
}

function generateQueue(players: Player[], courts: Court[], queueLength: number, settings: SessionSettings) {
  console.log("Generating court queue...");

  let result: Court[] = []; // Generated queue of courts

  // Step 1: Sort players by time played (longest wait first)
  let playerQueue: Player[] = generatePlayerQueue(players);

  console.log("Computed time-based player queue:");
  console.log(structuredClone(playerQueue));

  if (playerQueue.length < 4) {
    console.log("Failed to generate queue. Not enough players.");
    return result;
  }

  // Step 2: Calculate estimated start times based on the current active court estimated times remaining
  let courtQueue: Court[] = [...courts];
  courtQueue.sort((a, b) => {
    return a.startTime - b.startTime;
  });
  let startOffsets = courtQueue.map(court => {
    let playedDuration = Date.now() - court.startTime;
    return settings.expectedGameDuration - playedDuration;
  });

  if (courtQueue.length === 0) {
    console.log("Failed to generate queue. No active courts.");
    return result;
  }

  console.log("Computed estimated times remaining per active court:");
  console.log(structuredClone(startOffsets));

  let scheduledGameTime = Date.now();
  playerQueue.forEach(player => player.lastScheduledEndTimestamp = player.lastPlayedTimestamp);

  // Step 3: Perform greedy algorithm to select players to add to the next court
  for (let i = 0; i < queueLength; i++) {
    let courtIndex = i % settings.courtCount;

    if (i > 0 && courtIndex === 0) {
      scheduledGameTime += settings.expectedGameDuration;
    }

    let court: Court = {
      id: i,
      playerIDs: [],
      startTime: scheduledGameTime + startOffsets[courtIndex]
    };

    if (ADVANCED_DEBUG_LOGGING) {
      console.log("*****");
      console.log("*****");
      console.log("*****");
      console.log("Scheduling Court " + i + " at time " + scheduledGameTime + "...");
    }

    court.playerIDs = assignCourtPlayers(playerQueue, scheduledGameTime, settings);
    result.push(court);
  }

  console.log("Generated court queue:");
  console.log(structuredClone(result));

  return result;
}

function getNextCourt(queue: Court[], players: Player[], settings: SessionSettings) {
  let nextCourt: Court = { ...queue[0] };
  if (nextCourt && nextCourt.playerIDs.every(playerID => !getPlayer(playerID, players).isPlaying)) {
    return nextCourt; // No scheduled players are currently on a court, so the scheduled court is valid. Return immediately.
  }

  // Generate the next court using the balancing algorithm, force-excluding players who are already playing
  let playerQueue = generatePlayerQueue(players).filter(p => !p.isPlaying);

  if (playerQueue.length < 4) {
    nextCourt.playerIDs = [];
    return nextCourt;
  }

  nextCourt.playerIDs = assignCourtPlayers(playerQueue, Date.now(), settings);
  return nextCourt;
}

function getBestPlayer(court: Court, index: number, players: Player[], settings: SessionSettings) {
  let playerQueue = generatePlayerQueue(players).filter(p => !p.isPlaying);
  let courtPlayerIDs: string[];

  // Re-order the court so that teams are maintained but the open slot is always last
  if (index === 0) {
    courtPlayerIDs = [court.playerIDs[3], court.playerIDs[2], court.playerIDs[1]];
  } else if (index === 1) {
    courtPlayerIDs = [court.playerIDs[2], court.playerIDs[3], court.playerIDs[0]];
  } else if (index === 2) {
    courtPlayerIDs = [court.playerIDs[1], court.playerIDs[0], court.playerIDs[3]];
  } else {
    courtPlayerIDs = [court.playerIDs[0], court.playerIDs[1], court.playerIDs[2]];
  }

  let courtPlayers = courtPlayerIDs.map((playerID) => getPlayer(playerID, players));
  return assignBestPlayer(playerQueue, Date.now(), courtPlayers, settings);
}

export const Scheduler = {
  generateQueue,
  getNextCourt,
  getBestPlayer
}
