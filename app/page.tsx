'use client'

import { Player, Court, SessionSettings, PlayerData } from '../types/types'
import ActiveCourts from './active-courts';
import { Scheduler } from './scheduler';
import React, { useState, useEffect } from 'react';

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

  let [playerDatas, setPlayerDatas] = useState<PlayerData[]>([]);
  let [activePlayers, setActivePlayers] = useState<Player[]>([]);
  let [activeCourts, setActiveCourts] = useState<Court[]>([]);
  let [courtQueue, setCourtQueue] = useState<Court[]>([]);

  useEffect(() => {
    loadPlayerData();

    async function loadPlayerData() {
      let data = await fetch('./player-data.txt');
      let text = await data.text();

      setPlayerDatas([]);
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        let fields = line.split(',');
        let player: PlayerData = {
          name: fields[0],
          skillLevel: Number(fields[1])
        };

        setPlayerDatas(arr => [...arr, player]);
      }
    }
  }, []);

  function getPlayerData(name: string) {
    return playerDatas.find(data => data.name.trim().toLowerCase() == name.trim().toLowerCase());
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
          id: playerID,
          name: fields[0],
          skillLevel: Number(fields[1]),
          lastPlayedTimestamp: Date.now() - 1800000 + Math.floor(playerID / 4) * 240000,
          lastPartneredTimestamp: lines
            .map((val, idx) => ({ id: idx, timestamp: Date.now() - 3600000 + Math.floor(idx / 4) * 480000 }))
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

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Docs{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Learn{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Templates{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Explore starter templates for Next.js.
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Deploy{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50 text-balance`}>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
    </main>
  );
}
