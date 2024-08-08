'use client'

import { Player, Court, SessionSettings, PlayerData, ConfirmDialogOptions, ConfirmDialogCallback, Callback } from '../types/types'
import ActiveCourts from './activeCourts';
import ConfirmDialog from './confirmDialog';
import CourtDisplay from './courtDisplay';
import { Scheduler } from './scheduler';
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';

const COURT_COUNT = 3;
const MAX_TEAM_SKILL_VARIANCE = 0;
const MAX_INDIVIDUAL_SKILL_VARIANCE = 2;

const EXPECTED_GAME_DURATION = 600000; // 10 minutes in milliseconds
const MAX_TIME_SCORE_WAIT_TIME = 1800000; // 30 minutes in milliseconds
const MAX_DIVERSITY_SCORE_PLAY_DELAY = 3600000; // 1 hour in milliseconds

const TIME_SCORE_WEIGHT = 1;
const DIVERSITY_SCORE_WEIGHT = 1;
const BALANCE_SCORE_WEIGHT = 1;
const SKILL_SCORE_WEIGHT = 1;

const DEFAULT_CONFIRM_OPTIONS: ConfirmDialogOptions = {
  title: "",
  desc: "",
  confirmText: "",
  cancelText: "",
}

let playerDatas: PlayerData[] = [];
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
    balanceScoreWeight: BALANCE_SCORE_WEIGHT,
    skillScoreWeight: SKILL_SCORE_WEIGHT,
  });

  const [playerDatasState, setPlayerDatasState] = useState<PlayerData[]>([]); // Skill level data for all players in database (text file for now)
  const [activePlayersState, setActivePlayersState] = useState<Player[]>([]); // List of players included in the current session
  const [activeCourtsState, setActiveCourtsState] = useState<Court[]>([]);
  const [courtQueueState, setCourtQueueState] = useState<Court[]>([]);

  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmDialogOptions>(DEFAULT_CONFIRM_OPTIONS);
  const [confirmCallback, setConfirmCallback] = useState<ConfirmDialogCallback>(() => () => { });

  function refreshState() {
    setPlayerDatasState([...playerDatas]);
    setActivePlayersState([...activePlayers]);
    setActiveCourtsState([...activeCourts]);
    setCourtQueueState([...courtQueue]);

    saveSession();
  }

  function saveSession() {
    console.log("Saved session data.");

    window.sessionStorage.setItem("playerDatas", JSON.stringify(playerDatas));
    window.sessionStorage.setItem("activePlayers", JSON.stringify(activePlayers));
    window.sessionStorage.setItem("activeCourts", JSON.stringify(activeCourts));
    window.sessionStorage.setItem("courtQueue", JSON.stringify(courtQueue));
  }

  function loadSession() {
    console.log("Loaded session data.");

    playerDatas = JSON.parse(window.sessionStorage.getItem("playerDatas") ?? "[]");
    activePlayers = JSON.parse(window.sessionStorage.getItem("activePlayers") ?? "[]");
    activeCourts = JSON.parse(window.sessionStorage.getItem("activeCourts") ?? "[]");
    courtQueue = JSON.parse(window.sessionStorage.getItem("courtQueue") ?? "[]");
    refreshState();
  }

  // Load player data, load registered players and initialize empty courts
  useEffect(() => {
    loadSession();
    loadPlayerData();
    loadRegisteredPlayers();

    async function loadPlayerData() {
      if (playerDatas.length > 0) {
        return; // Player data is already loaded, don't overwrite
      }

      let data = await fetch('./player-data.txt');
      let text = await data.text();

      playerDatas = [];
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        let fields = line.split(',');
        let player: PlayerData = {
          username: toUsername(fields[0]),
          skillLevel: Number(fields[1])
        };

        playerDatas.push(player);
      }

      refreshState();
    }

    async function loadRegisteredPlayers() {
      if (activePlayers.length > 0) {
        return; // Players are already loaded, don't overwrite
      }

      let data = await fetch('./registered-players.txt');
      let text = await data.text();

      activePlayers = [];
      let lines = text.split(/[\r\n]+/);

      for (let line of lines) {
        let playerName = line.trim();
        addActivePlayer(playerName);
      }

      refreshState();
    }
  }, []);

  // Refresh state every 30 seconds. Ensures timers are always reasonably up to date.
  useEffect(() => {
    const interval = setInterval(() => {
      refreshState();
      console.log("Automatic state refresh complete.");
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function awaitConfirm(options: ConfirmDialogOptions, onConfirmed: Callback) {
    setConfirmOptions(options);
    setShowConfirm(true);

    let confirmed = await new Promise((resolve, reject) => {
      setConfirmCallback(() => (confirmed: boolean) => {
        clearTimeout(confirmTimeout);
        resolve(confirmed);
      });

      const confirmTimeout = setTimeout(() => {
        console.log("Confirmation timed out after 10 seconds.");
        resolve(false);
      }, 10000);
    });

    setShowConfirm(false);

    if (confirmed) {
      onConfirmed();
    }
  }

  function toUsername(name: string) {
    return name.trim().replace(/\s/g, '').toLowerCase();
  }

  function toFirstName(name: string) {
    let names = name.split(/\s/g);
    return names.length > 0 ? names.at(0) : "[Player]";
  }

  function getPlayerData(username: string) {
    return playerDatas.find(data => data.username == username);
  }

  function onPlayerChecked(event: ChangeEvent<HTMLInputElement>) {
    setPlayerEnabled(event.target.value, event.target.checked);
    generateCourtQueue();
    refreshState();
  }

  function addActivePlayer(name: string) {
    let username = toUsername(name);
    let playerData = getPlayerData(username);

    if (playerData === undefined) {
      console.log("Failed to find player by name: " + username);
      return;
    }

    let player: Player = {
      name: name,
      username: username,
      skillLevel: playerData ? playerData.skillLevel : 2,
      isEnabled: false,
      isPlaying: false,
      lastPlayedTimestamp: 0,
      lastPartneredTimestamp: {},
      lastScheduledEndTimestamp: 0
    };

    activePlayers.push(player);
  }

  function removeActivePlayer(name: string) {
    let username = toUsername(name);
    activePlayers = activePlayers.filter(player => player.username != username);
  }

  function isPlayerEnabled(name: string) {
    let username = toUsername(name);
    let player = activePlayers.find(p => p.username === username);
    return player !== undefined && player.isEnabled;
  }

  function setPlayerEnabled(name: string, enabled: boolean) {
    let username = toUsername(name);
    let player = activePlayers.find(p => p.username === username);
    if (player) {
      player.isEnabled = enabled;
    }
  }

  function getStartDelay(court: Court) {
    let startDelayMS = court.startTime - Date.now();
    let startDelayMins = startDelayMS / 1000 / 60; // Convert ms to mins
    return Math.round(startDelayMins);
  }

  function getWaitTimeText(court: Court) {
    let waitTime = getStartDelay(court);
    let minsText = waitTime === 1 ? "min" : "mins";
    let waitTimeText = waitTime <= 0 ? "soon!" : "in ~" + waitTime + " " + minsText + ".";
    return "Starting " + waitTimeText;
  }

  function resetPlayers() {
    for (let player of activePlayers) {
      player.isPlaying = false;
      player.lastPlayedTimestamp = 0;
      player.lastPartneredTimestamp = {};
      player.lastScheduledEndTimestamp = 0;
    }
  }

  function clearCourts() {
    let emptyCourts: Court[] = [];
    for (let i = 0; i < sessionSettings.courtCount; i++) {
      emptyCourts.push({
        id: i,
        players: [],
        startTime: 0
      });
    }
    activeCourts = [...emptyCourts];
    refreshState();
  }

  // Starts a specified game at the given court index
  function startGame(index: number, court: Court) {
    activeCourts[index].startTime = Date.now();
    activeCourts[index].players = court.players;

    for (let player of activeCourts[index].players) {
      player.isPlaying = true;
    }
  }

  function finishGame(index: number) {
    for (let player of activeCourts[index].players) {
      player.isPlaying = false;
      player.lastPlayedTimestamp = Date.now();
      activeCourts[index].players.filter(p => p.username !== player.username).forEach((p) => {
        player.lastPartneredTimestamp[p.username] = Date.now();
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
    let players = activePlayers.filter(p => p.isEnabled);
    courtQueue = Scheduler.generateQueue(players, activeCourts, 40, sessionSettings);
  }

  function getNextCourt() {
    let players = activePlayers.filter(p => p.isEnabled);
    return Scheduler.getNextCourt(courtQueue, players, sessionSettings);
  }

  function handleStartSession() {
    awaitConfirm({
      title: "Start session?",
      desc: "Starting the session will clear all existing player data.",
      confirmText: "Start",
      cancelText: "Cancel"
    }, onSessionStarted);
  }

  function onSessionStarted() {
    resetPlayers();
    clearCourts();
    generateCourtQueue();
    fillEmptyCourts();
    generateCourtQueue();
    refreshState();
  }

  function handleGameFinished(index: number) {
    awaitConfirm({
      title: "Finish game?",
      desc: "The court will be assigned to the next group in the queue.",
      confirmText: "Finish",
      cancelText: "Cancel"
    }, () => onGameFinished(index));
  }

  function onGameFinished(index: number) {
    finishGame(index);
    startGame(index, getNextCourt()); // TODO: Highlight the started court tile for 20 seconds
    generateCourtQueue();
    refreshState();
  }

  function handleSkipPlayer(player: Player) {
    awaitConfirm({
      title: "Skip " + toFirstName(player.name) + "?",
      desc: toFirstName(player.name) + " will be moved to the next available court.",
      confirmText: "Skip",
      cancelText: "Cancel"
    }, () => onPlayerSkipped(player));
  }

  // TODO: write algorithm to pick the best player to fill in the spot
  function onPlayerSkipped(player: Player) {
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
    if (!activePlayers || activePlayers.length === 0) {
      return;
    }

    let enabled = isPlayerEnabled(activePlayers[0].name);
    for (let player of activePlayers) {
      setPlayerEnabled(player.name, !enabled);
    }

    generateCourtQueue();
    refreshState();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between gap-y-8 pt-16">
      <ConfirmDialog
        show={showConfirm}
        options={confirmOptions}
        callback={confirmCallback}
      />

      <h2 className="mb-3 text-3xl font-semibold">
        Active Courts
      </h2>

      <ActiveCourts
        courts={activeCourtsState}
        handleGameFinished={handleGameFinished}
        handleSkipPlayer={handleSkipPlayer}
      />

      <div className="flex flex-col w-4/5 my-8">
        <h2 className={`mb-3 text-2xl font-semibold`}>
          Upcoming Games
        </h2>

        <div className="flex py-4 gap-x-4 w-full overflow-x-auto">
          {courtQueueState.map((court, i) =>
            <div className="flex flex-col w-80 items-center gap-y-2" key={i}>
              <CourtDisplay
                court={court}
                handleSkipPlayer={() => { }}
              />
              <p className="text-sm">{getWaitTimeText(court)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-y-2">
          <h2 className={`text-2xl font-semibold`}>
            Active Players
          </h2>

          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-40 p-3 rounded"
            onClick={handleStartSession}>
            Start Session
          </button>

          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-40 p-3 rounded"
            onClick={handleCheckAllPlayers}>
            Toggle All
          </button>

          <div>
            {activePlayersState.map((player, idx) =>
              <div key={idx}>
                <input
                  type="checkbox"
                  value={player.name}
                  checked={isPlayerEnabled(player.name)}
                  onChange={(event) => onPlayerChecked(event)}
                />
                {' '}{player.name}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <button onClick={printState}>
            Print the current state!
          </button>

          <button onClick={clearCourts}>
            Clear all courts!
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center text-xs w-full h-10 bg-slate-50 mt-8 gap-x-4">
        <div>
          <p>Made by Jaden Balogh and Chensheng Xu</p>
        </div>
        |
        <div>
          <a
            className="text-slate-600"
            target="_blank"
            href="https://icons8.com/icon/TWjhQj2xXDpL/badminton">
            badminton icon
          </a>
          {' '}by{' '}
          <a
            className="text-slate-600"
            target="_blank"
            href="https://icons8.com">
            Icons8
          </a>
        </div>
      </div>
    </main>
  );
}
