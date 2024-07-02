'use client'

import { Player, Court, SessionSettings, PlayerData } from '../types/types'
import ActiveCourts from './activeCourts';
import { Scheduler } from './scheduler';
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';

const COURT_COUNT = 3;
const MAX_TEAM_SKILL_VARIANCE = 0;
const MAX_INDIVIDUAL_SKILL_VARIANCE = 2;

const EXPECTED_GAME_DURATION = 480000; // 8 minutes in milliseconds
const MAX_TIME_SCORE_WAIT_TIME = 1800000; // 30 minutes in milliseconds
const MAX_DIVERSITY_SCORE_PLAY_DELAY = 3600000; // 1 hour in milliseconds

const TIME_SCORE_WEIGHT = 1;
const DIVERSITY_SCORE_WEIGHT = 1;
const SKILL_SCORE_WEIGHT = 1;

let playerDatas: PlayerData[] = [];
let registeredPlayers: string[] = [];
let activePlayers: Player[] = [];
let activeCourts: Court[] = [];
let courtQueue: Court[] = [];

export default function Home() {
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    courtCount: COURT_COUNT,
    maxTeamSkillVariance: MAX_TEAM_SKILL_VARIANCE,
    maxIndividualSkillVariance: MAX_INDIVIDUAL_SKILL_VARIANCE,
    expectedGameDuration: EXPECTED_GAME_DURATION,
    maxTimeScoreWaitTime: MAX_TIME_SCORE_WAIT_TIME,
    maxDiversityScoreWaitTime: MAX_DIVERSITY_SCORE_PLAY_DELAY,
    timeScoreWeight: TIME_SCORE_WEIGHT,
    diversityScoreWeight: DIVERSITY_SCORE_WEIGHT,
    skillScoreWeight: SKILL_SCORE_WEIGHT,
  });

  const [playerDatasState, setPlayerDatasState] = useState<PlayerData[]>([]); // Skill level data for all players in database (text file for now)
  const [registeredPlayersState, setRegisteredPlayersState] = useState<string[]>([]); // Generated list of registered players for the current session
  const [activePlayersState, setActivePlayersState] = useState<Player[]>([]); // Players who are actively included in the algorithm
  const [activeCourtsState, setActiveCourtsState] = useState<Court[]>([]);
  const [courtQueueState, setCourtQueueState] = useState<Court[]>([]);
  // const [newGame, setNewGame] = useState<Court>();

  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);

  function refreshState() {
    setPlayerDatasState(playerDatas);
    setRegisteredPlayersState(registeredPlayers);
    setActivePlayersState(activePlayers);
    setActiveCourtsState(activeCourts);
    setCourtQueueState(courtQueue);
  }

  // Load player data, load registered players and initialize empty courts
  useEffect(() => {
    loadPlayerData();
    loadRegisteredPlayers();
    clearCourts();

    async function loadPlayerData() {
      let data = await fetch('./player-data.txt');
      let text = await data.text();

      playerDatas = [];
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        let fields = line.split(',');
        let player: PlayerData = {
          name: fields[0].trim().toLowerCase(),
          skillLevel: Number(fields[1])
        };

        playerDatas.push(player);
      }

      refreshState();
    }

    async function loadRegisteredPlayers() {
      let data = await fetch('./registered-players.txt');
      let text = await data.text();

      registeredPlayers = [];
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        registeredPlayers.push(line.trim().toLowerCase());
      }

      refreshState();
    }
  }, []);

  function clearCourts() {
    let emptyCourts: Court[] = [];
    for (let i = 0; i < sessionSettings.courtCount; i++) {
      emptyCourts.push({
        id: i,
        players: []
      });
    }
    activeCourts = [...emptyCourts];
    refreshState();
  }

  function getPlayerData(name: string) {
    return playerDatas.find(data => data.name == name);
  }

  function onPlayerChecked(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.checked) {
      addActivePlayer(event.target.value);
    } else {
      removeActivePlayer(event.target.value);
    }

    refreshState();
  }

  function addActivePlayer(name: string) {
    let playerData = getPlayerData(name);

    if (playerData === undefined) {
      console.log("Failed to find player by name: " + name);
      return;
    }

    let player: Player = {
      name: name,
      skillLevel: playerData ? playerData.skillLevel : 2,
      isPlaying: false,
      lastPlayedTimestamp: Date.now(),
      lastPartneredTimestamp: {},
      lastScheduledEndTimestamp: 0
    };

    activePlayers.push(player);
  }

  function removeActivePlayer(name: string) {
    activePlayers = activePlayers.filter(player => player.name != name);
  }

  // Starts a specified game at the given court index
  function startGame(index: number, court: Court) {
    activeCourts[index].players = court.players;

    for (let player of activeCourts[index].players) {
      player.isPlaying = true;
    }
  }

  function finishGame(index: number) {
    for (let player of activeCourts[index].players) {
      player.isPlaying = false;
      player.lastPlayedTimestamp = Date.now();
      activeCourts[index].players.filter(p => p.name !== player.name).forEach((p) => {
        player.lastPartneredTimestamp[p.name] = Date.now();
      });
    }

    activeCourts[index].players = [];
  }

  function fillEmptyCourts() {
    for (let i = 0; i < activeCourts.length; i++) {
      if (activeCourts[i].players.length === 0 && courtQueue[i]) {
        startGame(i, courtQueue[i]);
      }
    }
  }

  function generateCourtQueue() {
    courtQueue = Scheduler.generateQueue(activePlayers, 20, sessionSettings);
  }

  function handleStartSession() {
    clearCourts();
    generateCourtQueue();
    fillEmptyCourts();
    generateCourtQueue();
    refreshState();
  }

  function handleGameFinished(index: number) {
    finishGame(index);
    startGame(index, courtQueue[0]);
    refreshState();
  }

  // TODO: write algorithm to pick the best player to fill in the spot
  function handleSkipPlayer(player: Player) {
    console.log("Skipping player", player.name);

    // setActiveCourts(
    //   activeCourts.map((court) => {
    //     if (court.players.some(p => p.name === player.name)) {
    //       return { ...court, players: court.players.filter(p => p.name !== player.name) };
    //     }
    //     return court;
    //   })
    // );

    // setActivePlayers(
    //   activePlayers.map((p) => {
    //     if (p.name === player.name) {
    //       return { ...p, lastPlayedTimestamp: Date.now() - MAX_TIME_SCORE_WAIT_TIME };
    //     }
    //     return p;
    //   })
    // )

    // TODO: add it here
  }

  function printState() {
    // console.log("PlayerDatas:");
    // console.log(playerDatas);
    console.log("Players:");
    console.log(activePlayers);
    console.log("Courts:");
    console.log(activeCourts);
    console.log("Court Queue:");
    console.log(courtQueue);
  }

  function handleCheckAllPlayers() {
    checkboxRefs.current.forEach(ref => {
      if (ref && !ref.checked) {
        ref.checked = true;
        addActivePlayer(ref.value);
      } else if (ref) {
        ref.checked = false;
        removeActivePlayer(ref.value);
      }
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col">
        <button onClick={printState}>
          Print the current state!
        </button>

        <button onClick={handleCheckAllPlayers}>
          Check and uncheck all players!
        </button>

        <button onClick={clearCourts}>
          Clear all courts!
        </button>
      </div>

      <ActiveCourts
        courts={activeCourtsState}
        handleGameFinished={handleGameFinished}
        handleSkipPlayer={handleSkipPlayer}
      />

      <div className="flex gap-2">
        <div className="flex flex-col py-12">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Active Players
          </h2>

          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 rounded"
            onClick={handleStartSession}>
            Start Session
          </button>

          {registeredPlayersState.map((player, idx) =>
            <div key={idx}>
              <input
                type="checkbox"
                value={player}
                onChange={(event) => onPlayerChecked(event)}
                ref={el => checkboxRefs.current[idx] = el}
              />
              {player}
            </div>
          )}
        </div>

        <div className="flex flex-col py-12">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Next Games
          </h2>

          {courtQueueState.map((game, i) =>
            <div key={i}>
              <p>{game.players[0].name} + {game.players[1].name}</p>
              <p>vs</p>
              <p>{game.players[2].name} + {game.players[3].name}</p>
              <p>--------------------</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
