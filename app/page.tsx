'use client'

import { Player, Court, SessionSettings, PlayerData, ConfirmDialogOptions, ConfirmDialogCallback, Callback } from '../types/types'
import ActiveCourts from './activeCourts';
import ConfirmDialog from './confirmDialog';
import CourtDisplay from './courtDisplay';
import { Scheduler } from './scheduler';
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';

const COURT_COUNT = 3;
const QUEUE_LENGTH = 6;
const MAX_TEAM_SKILL_VARIANCE = 1;
const MAX_INDIVIDUAL_SKILL_VARIANCE = 2;

const EXPECTED_GAME_DURATION = 600000; // 10 minutes in milliseconds
const EXPECTED_GAME_DURATION_VARIANCE = 300000; // 5 minutes in milliseconds
const MAX_TIME_SCORE_WAIT_TIME = 1800000; // 30 minutes in milliseconds
const MAX_DIVERSITY_SCORE_PLAY_DELAY = 3600000; // 1 hour in milliseconds
const MAX_DIVERSITY_SCORE_PLAY_COUNT = 5;

const TIME_SCORE_WEIGHT = 3; // How important is wait time?
const DIVERSITY_SCORE_WEIGHT = 2; // How important is playing with a variety of people?
const BALANCE_SCORE_WEIGHT = 2; // How important is having balanced teams?
const SKILL_SCORE_WEIGHT = 1; // How important is playing with other players of the same skill level?

const DEFAULT_CONFIRM_OPTIONS: ConfirmDialogOptions = {
  title: "",
  desc: "",
  confirmText: "",
  cancelText: "",
}

const NEW_COURT_DURATION: number = 10000; // How long a court is considered "new" after starting

let playerDatas: PlayerData[] = [];
let activePlayers: Player[] = [];
let activeCourts: Court[] = [];
let courtQueue: Court[] = [];

export function getCurrentTime(): number {
  let debugTimeOffset = Number.parseInt(window.sessionStorage.getItem("debugTimeOffset") ?? "0");
  return Date.now() + debugTimeOffset;
}

export default function Home() {
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    courtCount: COURT_COUNT,
    maxTeamSkillVariance: MAX_TEAM_SKILL_VARIANCE,
    maxIndividualSkillVariance: MAX_INDIVIDUAL_SKILL_VARIANCE,
    expectedGameDuration: EXPECTED_GAME_DURATION,
    maxTimeScoreWaitTime: MAX_TIME_SCORE_WAIT_TIME,
    maxDiversityScoreWaitTime: MAX_DIVERSITY_SCORE_PLAY_DELAY,
    maxDiversityScorePlayCount: MAX_DIVERSITY_SCORE_PLAY_COUNT,
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

  function queueRefresh(delay: number) {
    setTimeout(() => {
      refreshState();
      console.log("Queued state refresh complete.");
    }, delay);
  }

  function toUsername(name: string) {
    return name.trim().replace(/\s/g, '').toLowerCase();
  }

  function toFirstName(name: string) {
    let names = name.split(/\s/g);
    return names.length > 0 ? names.at(0) : "[Player]";
  }

  function getPlayerData(username: string) {
    return playerDatas.find(data => data.username === username);
  }

  function onPlayerChecked(event: ChangeEvent<HTMLInputElement>) {
    setPlayerEnabled(event.target.value, event.target.checked);
    generateCourtQueue();
    refreshState();
  }

  function getActivePlayer(username: string) {
    return activePlayers.find(player => player.username === username);
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
      gamesPlayed: 0,
      timesPartnered: {},
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
    let startDelayMS = court.startTime - getCurrentTime();
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
      player.gamesPlayed = 0;
      player.timesPartnered = {};
      player.lastScheduledEndTimestamp = 0;
    }
  }

  function resetCourts() {
    let emptyCourts: Court[] = [];
    for (let i = 0; i < sessionSettings.courtCount; i++) {
      emptyCourts.push({
        id: i,
        playerIDs: [],
        startTime: 0
      });
    }
    activeCourts = [...emptyCourts];
  }

  // Starts a specified game at the given court index
  function startGame(index: number, court: Court, startTime: number, debug: boolean) {
    activeCourts[index].startTime = startTime;
    activeCourts[index].playerIDs = [...court.playerIDs];

    for (let playerID of activeCourts[index].playerIDs) {
      let player = getActivePlayer(playerID);
      if (!player) {
        continue;
      }

      player.isPlaying = true;
    }

    if (!debug) {
      queueRefresh(NEW_COURT_DURATION + 100);
    }
  }

  function finishGame(index: number, finishTime: number) {
    if (activeCourts[index].playerIDs.length === 0) {
      return;
    }

    for (let playerID of activeCourts[index].playerIDs) {
      let player = getActivePlayer(playerID);
      if (!player) {
        continue;
      }

      player.isPlaying = false;
      player.lastPlayedTimestamp = finishTime;
      player.gamesPlayed++;
      activeCourts[index].playerIDs.filter(otherID => otherID !== playerID).forEach((otherID) => {
        let otherPlayer = getActivePlayer(otherID);
        if (otherPlayer) {
          otherPlayer.lastPartneredTimestamp[playerID] = finishTime;
          otherPlayer.timesPartnered[playerID] = otherPlayer.timesPartnered[playerID] + 1 || 1;
        }
      });
    }

    activeCourts[index].playerIDs = [];
  }

  function fillEmptyCourts() {
    for (let i = 0; i < activeCourts.length; i++) {
      if (activeCourts[i].playerIDs.length === 0 && courtQueue[i]) {
        startGame(i, courtQueue[i], getCurrentTime(), false);
      }
    }
  }

  function generateCourtQueue() {
    let players = activePlayers.filter(p => p.isEnabled);
    courtQueue = Scheduler.generateQueue(players, activeCourts, QUEUE_LENGTH, sessionSettings);
  }

  function getNextCourt() {
    let players = activePlayers.filter(p => p.isEnabled);
    return Scheduler.getNextCourt(courtQueue, players, sessionSettings);
  }

  function getBestPlayer(court: Court, index: number) {
    let players = activePlayers.filter(p => p.isEnabled);
    return Scheduler.getBestPlayer(court, index, players, sessionSettings);
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
    resetCourts();
    generateCourtQueue();
    fillEmptyCourts();
    generateCourtQueue();
    refreshState();
  }

  function clearSession() {
    resetPlayers();
    activeCourts = [];
    courtQueue = [];
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
    finishGame(index, getCurrentTime());
    startGame(index, getNextCourt(), getCurrentTime(), false);
    generateCourtQueue();
    refreshState();
  }

  function handleSkipPlayer(court: Court, player: Player) {
    awaitConfirm({
      title: "Skip " + toFirstName(player.name) + "?",
      desc: toFirstName(player.name) + " will be moved to the next available court.",
      confirmText: "Skip",
      cancelText: "Cancel"
    }, () => onPlayerSkipped(court, player));
  }

  function onPlayerSkipped(court: Court, player: Player) {
    console.log("Skipping player: " + player.name);

    let skippedIndex = court.playerIDs.indexOf(player.username);
    let replacementPlayer = getBestPlayer(court, skippedIndex);
    court.playerIDs.splice(skippedIndex, 1, replacementPlayer.username);
    startGame(court.id, court, getCurrentTime(), false);

    player.isPlaying = false;
    player.lastPlayedTimestamp = 0; // Set the skipped player to the max wait time to ensure being prioritized next game

    generateCourtQueue();
    refreshState();
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

  // Test algorithm:
  // 1. If the sample queue is full, remove the oldest court from the queue and set the current time to that timestamp
  // 2. Start a game and add to the sample queue
  function runSampleGames(count: number) {
    let courtSampleQueue = [];
    let courtIdx = -1;
    let currentTime = getCurrentTime();

    clearSession();
    resetCourts();
    generateCourtQueue();

    for (let i = 0; i < count; i++) {
      if (courtSampleQueue.length >= activeCourts.length) {
        let sampleCourt = courtSampleQueue.splice(0, 1)[0];
        courtIdx = sampleCourt.courtIdx;
        currentTime = sampleCourt.gameEndTime;
        finishGame(courtIdx, currentTime);
      } else {
        courtIdx++;
      }

      let gameEndTime = currentTime + EXPECTED_GAME_DURATION + Math.floor((Math.random() * 2 * EXPECTED_GAME_DURATION_VARIANCE) + 1) - EXPECTED_GAME_DURATION_VARIANCE;
      courtSampleQueue.push({ courtIdx, gameEndTime });
      courtSampleQueue.sort((a, b) => a.gameEndTime - b.gameEndTime);
      startGame(courtIdx, getNextCourt(), currentTime, true);
      generateCourtQueue();
    }

    for (let activePlayer of activePlayers) {
      printPlayerStats(activePlayer);
    }

    clearSession();
  }

  function printPlayerStats(player: Player) {
    console.log(player.name + ":");
    console.log({
      gamesPlayed: player.gamesPlayed,
      timesPartnered: player.timesPartnered
    });
  }

  function resetDebugTime() {
    window.sessionStorage.setItem("debugTimeOffset", "0");
    refreshState();
  }

  function addDebugTime(amount: number) {
    let debugTimeOffset = Number.parseInt(window.sessionStorage.getItem("debugTimeOffset") ?? "0");
    window.sessionStorage.setItem("debugTimeOffset", (debugTimeOffset + amount).toString());
    refreshState();
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
    <main className="relative flex min-h-screen flex-col items-center justify-between gap-y-16 pt-8">
      <ConfirmDialog
        show={showConfirm}
        options={confirmOptions}
        callback={confirmCallback}
      />

      <div className="flex flex-col items-center gap-y-4">
        <h2 className="mb-3 text-3xl font-semibold">
          Active Courts
        </h2>

        <ActiveCourts
          courts={activeCourtsState}
          players={activePlayersState}
          handleGameFinished={handleGameFinished}
          handleSkipPlayer={handleSkipPlayer}
        />
      </div>

      <div className="flex flex-col w-4/5">
        <h2 className={`mb-3 text-2xl font-semibold`}>
          Upcoming Games {"->"}
        </h2>

        <div className="flex py-4 gap-x-4 w-full overflow-x-auto">
          {courtQueueState.map((court, i) =>
            <div className="flex flex-col w-80 items-center gap-y-2" key={i}>
              <CourtDisplay
                isActive={false}
                court={court}
                players={activePlayersState}
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
          <button onClick={() => runSampleGames(100)}>
            Sample 100 games
          </button>

          <button onClick={clearSession}>
            Clear session
          </button>

          <button onClick={() => resetDebugTime}>
            Reset debug time
          </button>

          <button onClick={() => addDebugTime(300000)}>
            Increment debug time by 5 minutes
          </button>

          <button onClick={printState}>
            Print the current state
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
