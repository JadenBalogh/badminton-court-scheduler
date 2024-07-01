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

  const [playerDatas, setPlayerDatas] = useState<PlayerData[]>([]); // Skill level data for all players in database (text file for now)
  const [registeredPlayers, setRegisteredPlayers] = useState<string[]>([]); // Generated list of registered players for the current session
  const [activePlayers, setActivePlayers] = useState<Player[]>([]); // Players who are actively included in the algorithm
  const [activeCourts, setActiveCourts] = useState<Court[]>([]);
  const [courtQueue, setCourtQueue] = useState<Court[]>([]);
  const [newGame, setNewGame] = useState<Court>();

  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load player data, load registered players and initialize empty courts
  useEffect(() => {
    loadPlayerData();
    loadRegisteredPlayers();
    clearCourts();

    async function loadPlayerData() {
      let data = await fetch('./player-data.txt');
      let text = await data.text();

      setPlayerDatas([]);
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        let fields = line.split(',');
        let player: PlayerData = {
          name: fields[0].trim().toLowerCase(),
          skillLevel: Number(fields[1])
        };

        setPlayerDatas(arr => [...arr, player]);
      }
    }

    async function loadRegisteredPlayers() {
      let data = await fetch('./registered-players.txt');
      let text = await data.text();

      setRegisteredPlayers([]);
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        setRegisteredPlayers(arr => [...arr, line.trim().toLowerCase()]);
      }
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
    setActiveCourts(emptyCourts);
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
    setActivePlayers(a => [...a, player]);
  }

  function removeActivePlayer(name: string) {
    setActivePlayers(a => [...a.filter(player => player.name != name)]);
  }

  // Starts a specified game at the given court index
  function startGame(index: number, court: Court) {
    // Update the active court to the specified player list
    setActiveCourts(prevActiveCourts =>
      prevActiveCourts.map((activeCourt, i) => {
        if (i === index) {
          activeCourt.players = [...court.players];
        }
        return activeCourt;
      })
    );

    // Set all game players to "playing" status
    setActivePlayers(prevActivePlayers =>
      prevActivePlayers.map(activePlayer => {
        if (court.players.some((player) => player.name === activePlayer.name)) {
          activePlayer.isPlaying = true;
        }
        return activePlayer;
      })
    );
  }

  function fillEmptyCourts(queue: Court[]) {
    let i = 0;

    setActiveCourts(
      activeCourts.map(court => {
        if (court.players.length === 0 && queue[i]) {
          console.log("Court", court.id, "is empty, filling with game queue number", i, "for players", queue[i].players);
          const newPlayers = queue[i].players;
          i++;
          return { ...court, players: newPlayers };
        }
        return court;
      })
    );

    if (i > 0) {
      setCourtQueue(courtQueue => courtQueue.slice(i));
    }
  }

  function generateCourtQueue(): Court[] {
    const newCourtQueue = Scheduler.generateQueue(activePlayers, 5, sessionSettings);
    setCourtQueue(newCourtQueue);
    return newCourtQueue;
  }

  function handleScheduleCourts() {
    const generatedCourts = generateCourtQueue();
    fillEmptyCourts(generatedCourts);
  }

  function handleGameFinished(i: number) {
    console.log("Finishing game " + i + " at " + Date.now());

    // Remove players from court
    setActiveCourts(
      activeCourts.map((court) => {
        if (court.id === i) {
          return { ...court, players: [] };
        }
        return court;
      })
    );
    console.log("Removed players from court " + i);

    function isPlayerInCourt(player: Player, court: Court) {
      return court.players.some(p => p.name === player.name);
    }

    function updateLastPartneredTimestamp(player: Player, players: Player[]) {
      players.filter(p => p.name !== player.name).forEach((p) => {
        player.lastPartneredTimestamp[p.name] = Date.now();
      });
    }

    // Update players last played timestamps and last partnered timestamps
    setActivePlayers(
      activePlayers.map((player) => {
        if (isPlayerInCourt(player, activeCourts[i])) {
          updateLastPartneredTimestamp(player, activeCourts[i].players);
          return { ...player, lastPlayedTimestamp: Date.now() };
        }
        return player;
      })
    );
    console.log("Updated players last played timestamps and last partnered timestamps");

    // Pop next game from court queue and set it as the new game
    const nextGame = courtQueue[0];
    setNewGame(nextGame);
    setCourtQueue(prevCourtQueue => prevCourtQueue.slice(1));
  }

  // Fill in the empty court with the next game popped from the queue
  // Rerun the algorithm and update the court queue
  useEffect(() => {
    if (newGame) {
      setActiveCourts(
        activeCourts.map(court => {
          if (court.players.length === 0) {
            console.log("Court", court.id, "is empty, filling with players", newGame.players);
            const newPlayers = newGame.players;
            return { ...court, players: newPlayers };
          }
          return court;
        })
      );

      // Rerun the algorithm and update the court queue
      generateCourtQueue();
    }
  }, [newGame]);

  // TODO: write algorithm to pick the best player to fill in the spot
  function handleSkipPlayer(player: Player) {
    console.log("Skipping player", player.name);

    setActiveCourts(
      activeCourts.map((court) => {
        if (court.players.some(p => p.name === player.name)) {
          return { ...court, players: court.players.filter(p => p.name !== player.name) };
        }
        return court;
      })
    );

    setActivePlayers(
      activePlayers.map((p) => {
        if (p.name === player.name) {
          return { ...p, lastPlayedTimestamp: Date.now() - MAX_TIME_SCORE_WAIT_TIME };
        }
        return p;
      })
    )

    // TODO: add it here
  }

  function handleStartSession() {
    clearCourts();
    const generatedCourts = generateCourtQueue();
    fillEmptyCourts(generatedCourts);
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

        <button onClick={handleScheduleCourts}>
          Run the scheduling algorithm to fill the active courts!
        </button>

        <button onClick={clearCourts}>
          Clear all courts!
        </button>
      </div>

      <ActiveCourts
        courts={activeCourts}
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

          {registeredPlayers.map((player, idx) =>
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

          {courtQueue.map((game, i) =>
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
