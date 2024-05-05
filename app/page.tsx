'use client'

import { Player, Court } from '../types/types'
import ActiveCourts from './active-courts';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const COURT_COUNT = 3; // TODO: Replace with admin settings
  let [activePlayers, setActivePlayers] = useState<Player[]>([]);
  let [activeCourts, setActiveCourts] = useState<Court[]>([]);

  useEffect(() => {
    loadData();

    async function loadData() {
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
          skillLevel: Number(fields[1])
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
  }, []);

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

  function printState() {
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

        <button onClick={() => fillActiveCourts()}>
          Fill the active courts using the available players!
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
