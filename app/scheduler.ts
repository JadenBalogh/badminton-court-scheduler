import { Player, Court } from '../types/types'

const EXPECTED_GAME_DURATION = 480000; // 8 minutes in milliseconds

function calculateDiversityScore(player: Player, candidate: Player): number {
  if (!player.lastPartneredTimestamp[candidate.id]) {
    return EXPECTED_GAME_DURATION; // 8 minutes in milliseconds
  } else {
    // return the elapsed time since they last played together
    console.log("diversityScore for player", player.id, "and candidate", candidate.id, Date.now() - player.lastPartneredTimestamp[candidate.id])
    return Date.now() - player.lastPartneredTimestamp[candidate.id];
  }
}

function calculateTimeWaited(player: Player): number {
  return Date.now() - player.lastPlayedTimestamp;
}

function calculateTimeAndDiversityScore(player: Player, candidate: Player, timeCoefficient: number = 0.5, diversityCoefficient: number = 0.5): number {
  return timeCoefficient * calculateTimeWaited(candidate) + diversityCoefficient * calculateDiversityScore(player, candidate);
}

function isSkillOkay(candidate: Player, player1: Player, player2: Player, player3: Player, skillVariance: number): boolean {
  return Math.abs((player1.skillLevel + player3.skillLevel) - (candidate.skillLevel + player2.skillLevel)) <= skillVariance;
}

function selectFirstPlayer(queue: Player[], team1: Player[]): void {
  const player = queue.shift();
  if (player) {
    team1.push(player);
  } else {
    throw new Error("Queue is empty");
  }
}

function selectSecondPlayer(queue: Player[], team1: Player[], team2: Player[], x: number): void {
  const player1 = team1[0];
  const player2 = queue
    .slice(0, x)
    .reduce((pre, cur) => {
      const preScore = calculateTimeAndDiversityScore(player1, pre);
      const curScore = calculateTimeAndDiversityScore(player1, cur);
      if (preScore === curScore) {
        return pre;
      } else {
        return preScore > curScore ? pre : cur;
      }
    });
  team2.push(player2);
  queue.splice(queue.indexOf(player2), 1);
}

function selectThirdPlayer(queue: Player[], team1: Player[], team2: Player[], x: number): void {
  const player1 = team1[0];
  const player2 = team2[0];
  const player3 = queue
    .slice(0, x)
    .reduce((pre, cur) => {
      const preScore = calculateTimeAndDiversityScore(player1, pre)
        + calculateTimeAndDiversityScore(player2, pre);
      const curScore = calculateTimeAndDiversityScore(player1, cur)
        + calculateTimeAndDiversityScore(player2, cur);
      if (preScore === curScore) {
        return pre;
      } else {
        return preScore > curScore ? pre : cur;
      }
    });
  team1.push(player3);
  queue.splice(queue.indexOf(player3), 1);
}

function selectFourthPlayer(queue: Player[], team1: Player[], team2: Player[], x: number, skillVariance: number): void {
  const player1 = team1[0];
  const player2 = team2[0];
  const player3 = team1[1];
  const candidates = queue.slice(0, x)
    .filter(candidate => isSkillOkay(candidate, player1, player2, player3, skillVariance));
  const player4 = candidates.reduce((pre, cur) => {
    const preScore = calculateTimeAndDiversityScore(player1, pre)
      + calculateTimeAndDiversityScore(player2, pre)
      + calculateTimeAndDiversityScore(player3, pre);
    const curScore = calculateTimeAndDiversityScore(player1, cur)
      + calculateTimeAndDiversityScore(player2, cur)
      + calculateTimeAndDiversityScore(player3, cur);
    if (preScore === curScore) {
      return pre;
    } else {
      return preScore > curScore ? pre : cur;
    }
  });
  team2.push(player4);
  queue.splice(queue.indexOf(player4), 1);
}

function makeTeams(queue: Player[], x: number = 6, skillVariance: number = 1) {
  let team1: Player[] = [];
  let team2: Player[] = [];
  selectFirstPlayer(queue, team1);
  selectSecondPlayer(queue, team1, team2, x);
  selectThirdPlayer(queue, team1, team2, x);
  selectFourthPlayer(queue, team1, team2, x, skillVariance);
  // console.log([team1, team2]);
  return [team1, team2];
}

// Returns the best matching player in the queue based on TIME, DIVERSITY and SKILL heuristics
function findBestPlayer(playerQueue: Player[], selectedPlayers: Player[], skillVariance: number = -1) {
  return 0;
}

// Wraps the target player to the end of the queue and updates their scheduled next game end time
function schedulePlayer(playerQueue: Player[], playerIndex: number, scheduledEndTime: number) {
  let player = playerQueue[playerIndex];
  playerQueue.splice(playerIndex, 1);
  playerQueue.push(player);
  player.lastScheduledEndTimestamp = scheduledEndTime;
  return player;
}

function generateQueue(players: Player[], numCourts: number) {
  console.log("Generating court queue...");

  let result: Court[] = []; // Generated queue of courts

  // Step 1: Sort players by time played (longest wait first)
  let playerQueue: Player[] = [...players];
  playerQueue.sort((a, b) => a.lastPlayedTimestamp - b.lastPlayedTimestamp);
  console.log("Computed time-based player queue:");
  console.log(playerQueue);

  // Step 2: Perform greedy algorithm to select players to add to the next court
  let scheduledEndTime = Date.now() + EXPECTED_GAME_DURATION;

  for (let i = 0; i < numCourts; i++) {
    let court: Court = {
      id: i,
      players: []
    };

    // Step 2a: Assign first player in queue to team 1
    let team1Player1 = schedulePlayer(playerQueue, 0, scheduledEndTime);

    // Step 2b: Assign next best player in queue to team 2 using TIME and DIVERSITY heuristics
    let team2Player1Index = findBestPlayer(playerQueue, [team1Player1]);
    let team2Player1 = schedulePlayer(playerQueue, team2Player1Index, scheduledEndTime);

    // Step 2c: Assign next best player in queue to team 1 using TIME and DIVERSITY heuristics
    let team1Player2Index = findBestPlayer(playerQueue, [team1Player1, team2Player1]);
    let team1Player2 = schedulePlayer(playerQueue, team1Player2Index, scheduledEndTime);

    // Step 2d: Assign next best player in queue to team 2 using TIME, DIVERSITY and SKILL heuristics
    let team2Player2Index = findBestPlayer(playerQueue, [team1Player1, team2Player1, team1Player2], 1);
    let team2Player2 = schedulePlayer(playerQueue, team2Player2Index, scheduledEndTime);

    court.players = [team1Player1, team1Player2, team2Player1, team2Player2];
    result.push(court);

    scheduledEndTime += EXPECTED_GAME_DURATION;
  }

  console.log("Generated court queue:");
  console.log(result);

  return result;
}

export const Scheduler = {
  makeTeams,
  generateQueue
}
