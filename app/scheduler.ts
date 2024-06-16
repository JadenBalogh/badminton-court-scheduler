import { Player, Court } from '../types/types'

function calculateDiversityScore(player: Player, candidate: Player): number {
  if (!player.lastPlayedTimes[candidate.id]) {
    return 480000; // 8 minutes in milliseconds
  } else {
    // return the elapsed time since they last played together
    console.log("diversityScore for player", player.id, "and candidate", candidate.id, Date.now() - player.lastPlayedTimes[candidate.id])
    return Date.now() - player.lastPlayedTimes[candidate.id];
  }
}

function calculateTimeWaited(player: Player): number {
  return Date.now() - player.waitStartTime;
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

function generateQueue(players: Player[]) {
  console.log("TODO: Implement generateQueue()");
}

export const Scheduler = {
  makeTeams,
  generateQueue
}
