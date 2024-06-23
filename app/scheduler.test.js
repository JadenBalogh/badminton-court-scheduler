const makeTeams = require("./scheduler");

describe("makeTeams function with skillVariance of 1", () => {
  const players = [
    { id: 1, name: "Player 1", skill: 1, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
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

  test("makes first match of teams", () => {
    const [team1, team2] = makeTeams(players);
    const [player1, player2, player3, player4] = [team1[0], team2[0], team1[1], team2[1]];
    expect(player1.id).toBe(1);
    expect(player2.id).toBe(2);
    expect(player3.id).toBe(3);
    expect(player4.id).toBe(6);
  });

  test("makes second match of teams", () => {
    // console.log(players);
    const [team1, team2] = makeTeams(players);
    const [player1, player2, player3, player4] = [team1[0], team2[0], team1[1], team2[1]];
    expect(player1.id).toBe(4);
    expect(player2.id).toBe(5);
    expect(player3.id).toBe(7);
    expect(player4.id).toBe(8);
  });
});

describe("makeTeams function with skillVariance of 3", () => {
  const players = [
    { id: 1, name: "Player 1", skill: 1, timeStartedWaiting: Date.now(), playersPlayedAt: {} },
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

  test("makes first match of teams", () => {
    const [team1, team2] = makeTeams(players, 6, 3);
    const [player1, player2, player3, player4] = [team1[0], team2[0], team1[1], team2[1]];
    expect(player1.id).toBe(1);
    expect(player2.id).toBe(2);
    expect(player3.id).toBe(3);
    expect(player4.id).toBe(4);
  });

  test("makes second match of teams", () => {
    const [team1, team2] = makeTeams(players, 6, 3);
    const [player1, player2, player3, player4] = [team1[0], team2[0], team1[1], team2[1]];
    expect(player1.id).toBe(5);
    expect(player2.id).toBe(6);
    expect(player3.id).toBe(7);
    expect(player4.id).toBe(8);
  });
});