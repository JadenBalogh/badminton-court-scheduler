'use client'

import { Player, Court, SessionSettings, PlayerData } from '../types/types'
import ActiveCourts from './active-courts';
import { Scheduler } from './scheduler';
import React, { useState, useEffect, ChangeEvent } from 'react';

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
  let [sessionSettings, setSessionSettings] = useState<SessionSettings>({
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

  let [playerDatas, setPlayerDatas] = useState<PlayerData[]>([]); // Skill level data for all players in database (text file for now)
  let [registeredPlayers, setRegisteredPlayers] = useState<string[]>([]); // Generated list of registered players for the current session
  let [activePlayers, setActivePlayers] = useState<Player[]>([]); // Players who are actively included in the algorithm
  let [activeCourts, setActiveCourts] = useState<Court[]>([]);
  let [courtQueue, setCourtQueue] = useState<Court[]>([]);

  useEffect(() => {
    loadPlayerData();
    loadRegisteredPlayers();

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
      lastPlayedTimestamp: 0,
      lastPartneredTimestamp: {},
      lastScheduledEndTimestamp: 0
    };
    setActivePlayers(a => [...a, player]);
  }

  function removeActivePlayer(name: string) {
    setActivePlayers(a => [...a.filter(player => player.name != name)]);
  }

  function loadTestPlayers() {
    loadTestData();

    async function loadTestData() {
      let data = await fetch('./test-data.txt');
      let text = await data.text();

      setActivePlayers([]);

      let playerID = 0;
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        let fields = line.split(',');
        let player: Player = {
          name: fields[0],
          skillLevel: Number(fields[1]),
          lastPlayedTimestamp: Date.now() - 1800000 + Math.floor(playerID / 4) * 240000,
          lastPartneredTimestamp: lines
            .map((val, idx) => ({ id: val.split(',')[0], timestamp: Date.now() - 3600000 + Math.floor(idx / 4) * 480000 }))
            .reduce((obj, cur) => ({ ...obj, [cur.id]: cur.timestamp }), {}),
          lastScheduledEndTimestamp: 0
        };

        setActivePlayers(a => [...a, player]);

        playerID++;
      }

      setActiveCourts([]);

      for (let i = 0; i < COURT_COUNT; i++) {
        let court: Court = {
          id: i,
          players: []
        };

        setActiveCourts(a => [...a, court]);
      }
    }
  }

  function fillActiveCourts() {
    let newActiveCourts: Court[] = [];

    for (let i = 0; i < 4 * COURT_COUNT; i++) {
      let courtIdx = Math.floor(i / 4);
      let courtPlayerIdx = i % 4;

      if (courtIdx >= activeCourts.length) {
        break;
      }

      if (!newActiveCourts[courtIdx]) {
        newActiveCourts.push({
          id: courtIdx,
          players: []
        })
      }

      if (i < activePlayers.length) {
        newActiveCourts[courtIdx].players[courtPlayerIdx] = activePlayers[i];
        console.log(`Setting [Court ${courtIdx}, Player ${courtPlayerIdx}] = ${activePlayers[i].name}`);
      }
    }

    setActiveCourts(newActiveCourts);
    console.log("Filled active courts.");
  }

  function scheduleCourts() {
    Scheduler.generateQueue(activePlayers, 20, sessionSettings);
  }

  function printState() {
    console.log("PlayerDatas:");
    console.log(playerDatas);
    console.log("Players:");
    console.log(activePlayers);
    console.log("Courts:");
    console.log(activeCourts);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          This is the test page for Badminton Court Scheduler.
        </p>
      </div>

      <div className="flex flex-col">
        <button onClick={() => printState()}>
          Print the current state!
        </button>

        <button onClick={() => loadTestPlayers()}>
          Load test player data!
        </button>

        <button onClick={() => fillActiveCourts()}>
          Directly fill the active courts using the available players!
        </button>

        <button onClick={() => scheduleCourts()}>
          Run the scheduling algorithm to fill the active courts!
        </button>
      </div>

      <ActiveCourts courts={activeCourts} />

      <div className="flex flex-col py-12">
        <h2 className={`mb-3 text-2xl font-semibold`}>
          Active Players
        </h2>

        {registeredPlayers.map((player, idx) =>
          <div key={idx}>
            <input type="checkbox" value={player} onChange={(event) => onPlayerChecked(event)} /> {player}
          </div>
        )}
      </div>
    </main>
  );
}
