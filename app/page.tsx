'use client'

import { Player, Court, SessionSettings, PlayerData, ConfirmDialogOptions, ConfirmDialogResult, ConfirmDialogCallback, ConfirmCallback } from '../types/types'
import ActiveCourts from './activeCourts';
import ConfirmDialog from './confirmDialog';
import CourtDisplay from './courtDisplay';
import PlayerInfo from './playerInfo';
import { Scheduler } from './scheduler';
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';

const SHOW_DEBUG_OPTIONS = false;

const COURT_COUNT = 3;
const QUEUE_LENGTH = 6;
const MAX_TEAM_SKILL_VARIANCE = 2;
const MAX_INDIVIDUAL_SKILL_VARIANCE = 3;

const EXPECTED_GAME_DURATION = 600000; // 10 minutes in milliseconds
const EXPECTED_GAME_DURATION_VARIANCE = 300000; // 5 minutes in milliseconds
const MAX_TIME_SCORE_WAIT_TIME = 1200000; // 20 minutes in milliseconds
const MAX_DIVERSITY_SCORE_PLAY_DELAY = 3600000; // 1 hour in milliseconds
const MAX_DIVERSITY_SCORE_PLAY_COUNT = 5;

const TIME_SCORE_WEIGHT = 4; // How important is wait time?
const DIVERSITY_SCORE_WEIGHT = 2; // How important is playing with a variety of people?
const BALANCE_SCORE_WEIGHT = 1; // How important is having balanced teams?
const SKILL_SCORE_WEIGHT = 1; // How important is playing with other players of the same skill level?

const DEFAULT_CONFIRM_OPTIONS: ConfirmDialogOptions = {
  title: "",
  desc: "",
  confirmText: "",
  cancelText: "",
  selectPlayer: false
}

const NEW_COURT_DURATION: number = 10000; // How long a court is considered "new" after starting

let playerDatas: PlayerData[] = [];
let activePlayers: Player[] = [];
let activeCourts: Court[] = [];
let courtQueue: Court[] = [];
let sessionStarted: boolean = false;

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
  const [sessionStartedState, setSessionStartedState] = useState<boolean>(false);

  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmDialogOptions>(DEFAULT_CONFIRM_OPTIONS);
  const [confirmCallback, setConfirmCallback] = useState<ConfirmDialogCallback>(() => () => { });

  function refreshState() {
    setPlayerDatasState([...playerDatas]);
    setActivePlayersState([...activePlayers]);
    setActiveCourtsState([...activeCourts]);
    setCourtQueueState([...courtQueue]);
    setSessionStartedState(sessionStarted);

    saveSession();
  }

  function saveSession() {
    console.log("Saved session data.");

    window.sessionStorage.setItem("playerDatas", JSON.stringify(playerDatas));
    window.sessionStorage.setItem("activePlayers", JSON.stringify(activePlayers));
    window.sessionStorage.setItem("activeCourts", JSON.stringify(activeCourts));
    window.sessionStorage.setItem("courtQueue", JSON.stringify(courtQueue));
    window.sessionStorage.setItem("sessionStarted", sessionStarted ? "true" : "false");
  }

  function loadSession() {
    console.log("Loaded session data.");

    playerDatas = JSON.parse(window.sessionStorage.getItem("playerDatas") ?? "[]");
    activePlayers = JSON.parse(window.sessionStorage.getItem("activePlayers") ?? "[]");
    activeCourts = JSON.parse(window.sessionStorage.getItem("activeCourts") ?? "[]");
    courtQueue = JSON.parse(window.sessionStorage.getItem("courtQueue") ?? "[]");
    sessionStarted = (window.sessionStorage.getItem("sessionStarted") ?? "false") === "true";

    refreshState();
  }

  // Load player data, load registered players and initialize empty courts
  useEffect(() => {
    loadSession();
    loadPlayerData(false);
    loadRegisteredPlayers(false);

    if (activeCourts.length === 0) {
      resetCourts();
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

  async function loadPlayerData(force: boolean) {
    if (!force && playerDatas.length > 0) {
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

  async function loadRegisteredPlayers(force: boolean) {
    if (!force && activePlayers.length > 0) {
      return; // Players are already loaded, don't overwrite
    }

    let data = await fetch('./registered-players-oct27.txt');
    let text = await data.text();

    activePlayers = [];
    let lines = text.split(/[\r\n]+/);

    for (let line of lines) {
      let playerName = line.trim();
      addActivePlayer(playerName);
    }

    refreshState();
  }

  async function awaitConfirm(options: ConfirmDialogOptions, onConfirmed: ConfirmCallback) {
    setConfirmOptions(options);
    setShowConfirm(true);

    let confirmResult: ConfirmDialogResult = await new Promise((resolve, reject) => {
      setConfirmCallback(() => (confirmed: boolean, player: Player | undefined) => {
        resolve({
          confirmed,
          player
        });
      });
    });

    setShowConfirm(false);

    if (confirmResult.confirmed) {
      onConfirmed(confirmResult.player);
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

  function onPlayerChecked(username: string, checked: boolean) {
    setPlayerEnabled(username, checked);
    generateCourtQueue();
    refreshState();
  }

  function onPlayerEdited(username: string, newName: string, newSkill: number) {
    let player = getActivePlayer(username);
    if (!player) {
      return;
    }

    player.name = newName;
    player.skillLevel = newSkill;
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

  function removeActivePlayer(username: string) {
    activePlayers = activePlayers.filter(player => player.username != username);
  }

  function isPlayerEnabled(username: string) {
    let player = activePlayers.find(p => p.username === username);
    return player !== undefined && player.isEnabled;
  }

  function setPlayerEnabled(username: string, enabled: boolean) {
    let player = activePlayers.find(p => p.username === username);
    if (player) {
      player.isEnabled = enabled;
    }
  }

  function isPlayerAssigned(username: string) {
    for (let activeCourt of activeCourts) {
      if (activeCourt.playerIDs.includes(username)) {
        return true;
      }
    }
    return false;
  }

  function shuffleActivePlayers() {
    for (let i = activePlayers.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = activePlayers[i];
      activePlayers[i] = activePlayers[j];
      activePlayers[j] = temp;
    }
  }

  function getStartDelay(court: Court) {
    let startDelayMS = court.startTime - Scheduler.getCurrentTime();
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
      let hasAssignedPlayers = activeCourts[i].playerIDs.some((playerID) => playerID !== "");
      let assignedCourt = hasAssignedPlayers ? activeCourts[i] : getNextCourt();
      startGame(i, assignedCourt, Scheduler.getCurrentTime(), false);
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
      desc: "Starting the session will reset all games and player stats.",
      confirmText: "Start",
      cancelText: "Cancel",
      selectPlayer: false
    }, startSession);
  }

  function startSession() {
    shuffleActivePlayers();
    fillEmptyCourts();
    generateCourtQueue();
    sessionStarted = true;
    refreshState();
  }

  function handleClearSession() {
    awaitConfirm({
      title: "Clear session?",
      desc: "Clearing the session will fully wipe and reload all player data.",
      confirmText: "Confirm",
      cancelText: "Cancel",
      selectPlayer: false
    }, clearSession);
  }

  function clearSession() {
    sessionStarted = false;
    loadPlayerData(true);
    loadRegisteredPlayers(true);
    resetCourts();
    courtQueue = [];
    refreshState();
  }

  function resetSession() {
    resetPlayers();
    resetCourts();
    courtQueue = [];
    refreshState();
  }

  function handleGameFinished(index: number) {
    awaitConfirm({
      title: "Finish game?",
      desc: "The court will be assigned to the next group in the queue.",
      confirmText: "Finish",
      cancelText: "Cancel",
      selectPlayer: false
    }, () => onGameFinished(index));
  }

  function onGameFinished(index: number) {
    finishGame(index, Scheduler.getCurrentTime());
    startGame(index, getNextCourt(), Scheduler.getCurrentTime(), false);
    generateCourtQueue();
    refreshState();
  }

  function handlePlayerSelected(court: Court, player: Player, index: number) {
    if (sessionStarted) { // Skip player
      awaitConfirm({
        title: "Skip " + toFirstName(player.name) + "?",
        desc: toFirstName(player.name) + " will be moved to the next available court.",
        confirmText: "Skip",
        cancelText: "Cancel",
        selectPlayer: false
      }, () => onPlayerSkipped(court, player));
    } else if (!getActivePlayer(player.username)) { // Assign player
      awaitConfirm({
        title: "Assign Player",
        desc: "",
        confirmText: "Assign",
        cancelText: "Cancel",
        selectPlayer: true
      }, (selectedPlayer) => onPlayerAssigned(court, selectedPlayer, index));
    } else { // Clear assigned player
      awaitConfirm({
        title: "Clear " + toFirstName(player.name) + "?",
        desc: toFirstName(player.name) + " will no longer be assigned to this court.",
        confirmText: "Clear",
        cancelText: "Cancel",
        selectPlayer: false
      }, (selectedPlayer) => onPlayerAssigned(court, selectedPlayer, index));
    }
  }

  function onPlayerSkipped(court: Court, player: Player) {
    console.log("Skipping player: " + player.name);

    let skippedIndex = court.playerIDs.indexOf(player.username);
    let replacementPlayer = getBestPlayer(court, skippedIndex);
    court.playerIDs.splice(skippedIndex, 1, replacementPlayer.username);
    startGame(court.id, court, Scheduler.getCurrentTime(), false);

    player.isPlaying = false;
    player.lastPlayedTimestamp = 0; // Set the skipped player to the max wait time to ensure being prioritized next game

    generateCourtQueue();
    refreshState();
  }

  function onPlayerAssigned(court: Court, player: Player | undefined, index: number) {
    console.log("Assigning player: " + player?.name + " to court " + activeCourts.indexOf(court));

    for (let i = 0; i < 4; i++) {
      if (!court.playerIDs[i]) {
        court.playerIDs.push("");
      }
    }

    let activePlayer = getActivePlayer(court.playerIDs[index] ?? player?.username);
    if (activePlayer) {
      activePlayer.isPlaying = player !== undefined;
    }

    court.playerIDs.splice(index, 1, player ? player.username : "");
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
    let debugGamesPlayed = [];
    let courtSampleQueue = [];
    let courtIdx = -1;
    let currentTime = Scheduler.getCurrentTime();

    resetSession();
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

      let nextGame = getNextCourt();
      debugGamesPlayed.push(getCourtDebugString(nextGame));
      startGame(courtIdx, nextGame, currentTime, true);
      generateCourtQueue();
    }

    console.log("Simulated Games:");
    console.log({ debugGamesPlayed });

    for (let activePlayer of activePlayers) {
      printPlayerStats(activePlayer);
    }

    resetSession();
  }

  function printPlayerStats(player: Player) {
    console.log(player.name + ":");
    console.log({
      gamesPlayed: player.gamesPlayed,
      timesPartnered: player.timesPartnered
    });
  }

  function getCourtDebugString(court: Court) {
    let courtPlayers = court.playerIDs.map((playerID) => getActivePlayer(playerID));
    let team1Player1 = courtPlayers[0] ? courtPlayers[0].name : "[Unknown]";
    let team2Player1 = courtPlayers[1] ? courtPlayers[1].name : "[Unknown]";
    let team1Player2 = courtPlayers[2] ? courtPlayers[2].name : "[Unknown]";
    let team2Player2 = courtPlayers[3] ? courtPlayers[3].name : "[Unknown]";
    return "" + team1Player1 + " + " + team1Player2 + " vs. " + team2Player1 + " + " + team2Player2;
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

    let enabled = isPlayerEnabled(activePlayers[0].username);
    for (let player of activePlayers) {
      setPlayerEnabled(player.username, !enabled);
    }

    generateCourtQueue();
    refreshState();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between gap-y-16 pt-8">
      <meta name="mobile-web-app-capable" content="yes" />

      <ConfirmDialog
        show={showConfirm}
        options={confirmOptions}
        callback={confirmCallback}
        players={activePlayersState.filter((player) => !isPlayerAssigned(player.username))}
      />

      <div className="flex flex-col items-center gap-y-4">
        <h2 className="mb-3 text-3xl font-semibold">
          Active Courts
        </h2>

        <ActiveCourts
          courts={activeCourtsState}
          players={activePlayersState}
          started={sessionStartedState}
          handleGameFinished={handleGameFinished}
          handlePlayerSelected={handlePlayerSelected}
        />
      </div>

      <div className="flex flex-col w-4/5">
        <h2 className={`mb-3 text-2xl font-semibold`}>
          Upcoming Games {"->"}
        </h2>

        {sessionStartedState ?
          <div className="flex py-4 gap-x-4 w-full overflow-x-auto">
            {courtQueueState.map((court, i) =>
              <div className="flex flex-col w-80 items-center gap-y-2" key={i}>
                <CourtDisplay
                  isActive={false}
                  court={court}
                  players={activePlayersState}
                  handlePlayerSelected={() => { }}
                />
                <p className="text-sm">{getWaitTimeText(court)}</p>
              </div>
            )}
          </div> :
          <p>No games have been scheduled yet.</p>
        }
      </div>

      <div className="flex gap-4 mt-16">
        <div className="flex flex-col gap-y-2">
          <h2 className={`text-2xl font-semibold`}>
            ADMIN
          </h2>

          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold w-40 p-3 rounded"
            onClick={handleClearSession}>
            Clear Session
          </button>

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

          <p>---</p>

          <div className="flex flex-col gap-y-1">
            {activePlayersState.toSorted((a, b) => a.username.localeCompare(b.username)).map((player, idx) =>
              <PlayerInfo
                player={player}
                key={idx}
                checked={isPlayerEnabled(player.username)}
                onPlayerChecked={(event) => onPlayerChecked(player.username, event.target.checked)}
                onPlayerEdited={onPlayerEdited}
              />
            )}
          </div>
        </div>

        {SHOW_DEBUG_OPTIONS ? <div className="flex flex-col">
          <button onClick={() => runSampleGames(100)}>
            Sample 100 games
          </button>

          <button onClick={clearSession}>
            Clear session
          </button>

          <button onClick={resetDebugTime}>
            Reset debug time
          </button>

          <button onClick={() => addDebugTime(300000)}>
            Increment debug time by 5 minutes
          </button>

          <button onClick={printState}>
            Print the current state
          </button>
        </div> : <></>}
      </div>

      <div className="flex items-center justify-center text-xs w-full h-10 bg-slate-50 mt-8 gap-x-4">
        <div>
          <p>Made by Jaden Balogh and Chensheng Xu</p>
        </div>
        |
        <div>
          <p>Special thanks to Yiann Chen</p>
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
