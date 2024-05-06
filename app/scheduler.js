const players = [
  { id: 1, name: "Player 1", skill: 1, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 2, name: "Player 2", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 3, name: "Player 3", skill: 3, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 4, name: "Player 4", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 5, name: "Player 5", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 6, name: "Player 6", skill: 1, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 7, name: "Player 7", skill: 3, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 8, name: "Player 8", skill: 3, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 9, name: "Player 9", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
  { id: 10, name: "Player 10", skill: 2, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
];

let queue = [];
let team1 = [];
let team2 = [];

function calculateDiversityScore(player, candidate) {
  if (!player.playersPlayedAt[candidate.id]) {
    return Infinity;
  } else {
    // return the elapsed time since they last played together
    return Date.now() - player.playersPlayedAt[candidate.id];
  }
}

function calculateTimeWaited(player) {
  return Date.now() - player.timeStartedWaiting;
}

function calculateTimeAndDiversityScore(player, candidate, timeCoefficient = 0.5, diversityCoefficient = 0.5) {
  return timeCoefficient * calculateTimeWaited(candidate) + diversityCoefficient * calculateDiversityScore(player, candidate);
}

function isSkillOkay(candidate, player1, player2, player3, skillVariance = 1) {
  return Math.abs((player1.skill + player3.skill) - (candidate.skill + player2.skill)) <= skillVariance;
}

function selectFirstPlayer() {
  const player = queue.shift();
  team1.push(player);
}

function selectSecondPlayer(player1, x = 6) {
  const player2 = queue
    .slice(0, x)
    .reduce((pre, cur) => {
      const preScore = calculateTimeAndDiversityScore(player1, pre);
      const curScore = calculateTimeAndDiversityScore(player1, cur);
      return preScore < curScore ? pre : cur;
    });
  team2.push(player2);
  queue.splice(queue.indexOf(player2), 1);
}

function selectThirdPlayer(player1, player2, x = 6) {
  const player3 = queue
    .slice(0, x)
    .reduce((pre, cur) => {
      const preScore = calculateTimeAndDiversityScore(player1, pre) 
        + calculateTimeAndDiversityScore(player2, pre);
      const curScore = calculateTimeAndDiversityScore(player1, cur) 
        + calculateTimeAndDiversityScore(player2, cur);
      return preScore < curScore ? pre : cur;
    });
  team1.push(player3);
  queue.splice(queue.indexOf(player3), 1);
}

function selectFourthPlayer(player1, player2, player3, x = 6) {
  let player4 = null;
  const candidates = queue.slice(0, x);
  while (!player4 || !isSkillOkay(player4, player1, player2, player3)) {
    player4 = candidates.reduce((pre, cur) => {
      const preScore = calculateTimeAndDiversityScore(player1, pre) 
        + calculateTimeAndDiversityScore(player2, pre) 
        + calculateTimeAndDiversityScore(player3, pre);
      const curScore = calculateTimeAndDiversityScore(player1, cur) 
        + calculateTimeAndDiversityScore(player2, cur) 
        + calculateTimeAndDiversityScore(player3, cur);
      return preScore < curScore ? pre : cur;
    });
  }
  team2.push(player4);
  queue.splice(queue.indexOf(player4), 1);
}