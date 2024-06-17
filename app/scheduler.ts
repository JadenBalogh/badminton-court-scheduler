import { Player, Court } from '../types/types'

const EXPECTED_GAME_DURATION = 480000; // 8 minutes in milliseconds
const MAX_TIME_SCORE_WAIT_TIME = 1800000; // 30 minutes in milliseconds
const MAX_DIVERSITY_SCORE_PLAY_DELAY = 3600000; // 1 hour in milliseconds

// TODO: Move these heuristic weights into admin settings
const TIME_SCORE_WEIGHT = 1;
const DIVERSITY_SCORE_WEIGHT = 1;
const SKILL_SCORE_WEIGHT = 1;

// Returns the normalized TIME score for the given player. 0 minute wait = 0.0 time score. 30 minute wait = 1.0 time score.
function calculateTimeScore(player: Player, gameStartTime: number) {
  let waitTime = gameStartTime - player.lastScheduledEndTimestamp;
  return Math.min(waitTime, MAX_TIME_SCORE_WAIT_TIME) / MAX_TIME_SCORE_WAIT_TIME;
}

// Returns the normalized DIVERSITY score for the given player. Just played with all others = 0.0 diversity score. Played with all others 1+ hours ago = 1.0 time score.
function calculateDiversityScore(player: Player, gameStartTime: number, otherPlayers: Player[]) {
  let diversityScore = 0;
  for (let otherPlayer of otherPlayers) {
    let lastPartneredTime = player.lastPartneredTimestamp[otherPlayer.id] ? player.lastPartneredTimestamp[otherPlayer.id] : 0;
    let lastPlayedDelay = gameStartTime - lastPartneredTime;
    diversityScore += Math.min(lastPlayedDelay, MAX_DIVERSITY_SCORE_PLAY_DELAY) / MAX_DIVERSITY_SCORE_PLAY_DELAY;
  }
  return diversityScore / otherPlayers.length;
}

// Returns the normalized SKILL score for the given player. Skill difference more than skillVariance beyond the target value = 0.0 skill score. Exact skill match = 1.0 skill score.
function calculateSkillScore(player: Player, otherPlayers: Player[], skillVariance: number) {
  if (otherPlayers.length < 2) {
    return 0; // Skill score can only be calculated when at least one player has been picked on each team.
  }

  let targetSkillLevel;
  if (otherPlayers.length === 2) {
    targetSkillLevel = otherPlayers[1].skillLevel; // When finding the 2nd team 1 player, aim to find one with the same skill level as the 1st team 2 player
  } else {
    let team1SkillLevel = otherPlayers[0].skillLevel + otherPlayers[2].skillLevel;
    let team2SkillLevel = otherPlayers[1].skillLevel;
    targetSkillLevel = team1SkillLevel - team2SkillLevel; // When finding the last player on the court, aim to perfectly balance the team skill levels
  }

  let skillOffset = Math.abs(player.skillLevel - targetSkillLevel);
  return 1 - Math.min(skillOffset / (skillVariance + 1), 1);
}

// Returns the weighted sum of the TIME, DIVERSITY and SKILL scores
function calculateTotalScore(player: Player, gameStartTime: number, otherPlayers: Player[], skillVariance: number) {
  let timeScore = calculateTimeScore(player, gameStartTime) * TIME_SCORE_WEIGHT;
  let diversityScore = calculateDiversityScore(player, gameStartTime, otherPlayers) * DIVERSITY_SCORE_WEIGHT;
  let skillScore = calculateSkillScore(player, otherPlayers, skillVariance) * SKILL_SCORE_WEIGHT;
  return timeScore + diversityScore + skillScore;
}

// Returns the index of best matching player in the queue based on TIME, DIVERSITY and SKILL heuristics
function assignBestPlayer(playerQueue: Player[], gameStartTime: number, selectedPlayers: Player[], skillVariance: number = -1) {
  // Consider only players that haven't already been selected as part of this team
  let candidates = playerQueue.slice(0, playerQueue.length - selectedPlayers.length);

  console.log("Evaluating candidates:")
  console.log([...candidates]);

  // Optionally filter out any player that has a 0 skill score for this team (outside the allowed skill variance)
  if (skillVariance >= 0) {
    candidates = candidates.filter(player => calculateSkillScore(player, selectedPlayers, skillVariance) > 0);
  }

  // Reduce the candidates down to the highest scoring player
  let bestPlayer = candidates.reduce((prevPlayer, currPlayer) => {
    let prevPlayerScore = calculateTotalScore(prevPlayer, gameStartTime, selectedPlayers, skillVariance);
    let currPlayerScore = calculateTotalScore(currPlayer, gameStartTime, selectedPlayers, skillVariance);
    return prevPlayerScore >= currPlayerScore ? prevPlayer : currPlayer;
  });

  console.log("Found best player with total score: " + calculateTotalScore(bestPlayer, gameStartTime, selectedPlayers, skillVariance));
  console.log("Best player score breakdown:");
  console.log(" -> TIME: " + calculateTimeScore(bestPlayer, gameStartTime) * TIME_SCORE_WEIGHT) + " (last scheduled end: " + bestPlayer.lastScheduledEndTimestamp + ")";
  console.log(" -> DIVERSITY: " + calculateDiversityScore(bestPlayer, gameStartTime, selectedPlayers) * DIVERSITY_SCORE_WEIGHT);
  console.log(" -> SKILL: " + calculateSkillScore(bestPlayer, selectedPlayers, skillVariance) * SKILL_SCORE_WEIGHT);
  console.log(" -> Last Scheduled End: " + bestPlayer.lastScheduledEndTimestamp);

  return bestPlayer;
}

// Wraps the target player to the end of the queue and updates their scheduled next game end time
function schedulePlayer(playerQueue: Player[], player: Player, gameStartTime: number) {
  let playerIndex = playerQueue.indexOf(player);
  playerQueue.splice(playerIndex, 1);
  playerQueue.push(player);
  player.lastScheduledEndTimestamp = gameStartTime + EXPECTED_GAME_DURATION;
}

function generateQueue(players: Player[], numCourts: number, queueLength: number, skillVariance: number) {
  console.log("Generating court queue...");

  let result: Court[] = []; // Generated queue of courts

  // Step 1: Sort players by time played (longest wait first)
  let playerQueue: Player[] = [...players];
  playerQueue.sort((a, b) => a.lastPlayedTimestamp - b.lastPlayedTimestamp);
  console.log("Computed time-based player queue:");
  console.log([...playerQueue]);

  // Step 2: Perform greedy algorithm to select players to add to the next court
  let scheduledGameTime = Date.now();
  playerQueue.forEach(player => player.lastScheduledEndTimestamp = player.lastPlayedTimestamp);

  for (let i = 0; i < queueLength; i++) {
    let court: Court = {
      id: i,
      players: []
    };

    if (i > 0 && i % numCourts === 0) {
      scheduledGameTime += EXPECTED_GAME_DURATION;
    }

    console.log("*****");
    console.log("*****");
    console.log("*****");
    console.log("Scheduling Court " + i + " at time " + scheduledGameTime + "...");

    // Step 2a: Assign first player in queue to team 1
    console.log("***");
    console.log("Picking Team 1, Player 1...");
    let team1Player1 = playerQueue[0];
    schedulePlayer(playerQueue, team1Player1, scheduledGameTime);
    console.log(team1Player1);

    // Step 2b: Assign next best player in queue to team 2 using TIME and DIVERSITY heuristics
    console.log("***");
    console.log("Picking Team 2, Player 1...");
    let team2Player1 = assignBestPlayer(playerQueue, scheduledGameTime, [team1Player1]);
    schedulePlayer(playerQueue, team2Player1, scheduledGameTime);
    console.log(team2Player1);

    // Step 2c: Assign next best player in queue to team 1 using TIME and DIVERSITY heuristics
    console.log("***");
    console.log("Picking Team 1, Player 2...");
    let team1Player2 = assignBestPlayer(playerQueue, scheduledGameTime, [team1Player1, team2Player1], skillVariance);
    schedulePlayer(playerQueue, team1Player2, scheduledGameTime);
    console.log(team1Player2);

    // Step 2d: Assign next best player in queue to team 2 using TIME, DIVERSITY and SKILL heuristics
    console.log("***");
    console.log("Picking Team 2, Player 2...");
    let team2Player2 = assignBestPlayer(playerQueue, scheduledGameTime, [team1Player1, team2Player1, team1Player2], skillVariance);
    schedulePlayer(playerQueue, team2Player2, scheduledGameTime);
    console.log(team2Player2);

    court.players = [team1Player1, team1Player2, team2Player1, team2Player2];
    result.push(court);
  }

  console.log("Generated court queue:");
  console.log(result);

  return result;
}

export const Scheduler = {
  generateQueue
}
