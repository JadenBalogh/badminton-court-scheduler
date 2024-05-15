type Player = {
  id: number;
  name: string;
  skill: number;
  timeStartedWaiting: number;
  playersPlayedAt: { [id: number]: number };
}

type Players = Player[];

const players: Players = [
  { id: 1, name: "Player 1", skill: 1, timeStartedWaiting: Date.now(), playersPlayedAt: { 3: Date.now() - 360000 } },
  { id: 2, name: "Player 2", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 3, name: "Player 3", skill: 1, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 4, name: "Player 4", skill: 3, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 5, name: "Player 5", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 6, name: "Player 6", skill: 1, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 7, name: "Player 7", skill: 3, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 8, name: "Player 8", skill: 3, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 9, name: "Player 9", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 10, name: "Player 10", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
];

// let queue: Players = [];
// let team1: Players = [];
// let team2: Players = [];

function calculateDiversityScore(player: Player, candidate: Player): number {
  if (!player.playersPlayedAt[candidate.id]) {
    return 480000; // 8 minutes in milliseconds
  } else {
    // return the elapsed time since they last played together
    console.log("diversityScore for player", player.id, "and candidate", candidate.id, Date.now() - player.playersPlayedAt[candidate.id])
    return Date.now() - player.playersPlayedAt[candidate.id];
  }
}

function calculateTimeWaited(player: Player): number {
  return Date.now() - player.timeStartedWaiting;
}

function calculateTimeAndDiversityScore(player: Player, candidate: Player, timeCoefficient: number = 0.5, diversityCoefficient: number = 0.5): number {
  return timeCoefficient * calculateTimeWaited(candidate) + diversityCoefficient * calculateDiversityScore(player, candidate);
}

function isSkillOkay(candidate: Player, player1: Player, player2: Player, player3: Player, skillVariance: number): boolean {
  return Math.abs((player1.skill + player3.skill) - (candidate.skill + player2.skill)) <= skillVariance;
}

function selectFirstPlayer(queue: Players, team1: Players): void  {
  const player = queue.shift();
  if (player) {
    team1.push(player);
  } else {
    throw new Error("Queue is empty");
  }
}

function selectSecondPlayer(queue: Players, team1: Players, team2: Players, x: number): void {
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

function selectThirdPlayer(queue: Players, team1: Players, team2: Players, x: number): void {
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

function selectFourthPlayer(queue: Players, team1: Players, team2: Players, x: number, skillVariance: number): void {
  const player1 = team1[0];
  const player2 = team2[0];
  const player3 = team1[1];
  const candidates = queue.slice(0, x)
    .filter(candidate => isSkillOkay(candidate, player1, player2, player3, skillVariance));
  const  player4 = candidates.reduce((pre, cur) => {
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

function makeTeams(queue: Players, x: number = 6, skillVariance: number = 1) {
  let team1: Players = [];
  let team2: Players = [];
  selectFirstPlayer(queue, team1);
  selectSecondPlayer(queue, team1, team2, x);
  selectThirdPlayer(queue, team1, team2, x);
  selectFourthPlayer(queue, team1, team2, x, skillVariance);
  // console.log([team1, team2]);
  return [team1, team2];
}

module.exports = makeTeams;