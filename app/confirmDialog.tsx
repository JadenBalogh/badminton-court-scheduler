import React, { useState, useEffect } from 'react';
import { ConfirmDialogOptions, ConfirmDialogCallback, Player } from '../types/types'

type ConfirmDialogProps = {
  show: boolean,
  options: ConfirmDialogOptions,
  callback: ConfirmDialogCallback
}

export default function ConfirmDialog({ show, options, callback }: ConfirmDialogProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(); // List of players included in the current session

  useEffect(() => {
    setSelectedPlayer(undefined);
  }, [show])

  return show ? (
    <div className="fixed inset-0 m-auto bg-black/70 flex items-center justify-center">
      <div className="flex flex-col justify-between w-80 min-h-52 p-6 bg-white rounded gap-y-1">
        <h2 className="text-2xl font-semibold">
          {options.title}
        </h2>
        <p className="grow">
          {options.desc}
        </p>
        <div className="grow max-h-60 mb-2 pl-1 overflow-auto bg-zinc-100 rounded">
          {options.defaultOption ?
            <div className="font-semibold py-1">
              <input
                type="radio"
                name="player"
                id="default"
                value={options.defaultOption}
                checked={selectedPlayer === undefined}
                onChange={() => setSelectedPlayer(undefined)}
              />
              <label htmlFor="default">{" " + options.defaultOption}</label>
            </div>
            : <></>}
          {options.players.length > 0 ? options.players.toSorted((a, b) => a.username.localeCompare(b.username)).map((player, idx) =>
            <div className="font-semibold py-1" key={idx}>
              <input
                type="radio"
                name="player"
                id={player.name}
                value={player.name}
                checked={selectedPlayer?.name === player.name}
                onChange={() => setSelectedPlayer(player)}
              />
              <label htmlFor={player.name}>{" " + player.name}</label>
            </div>
          ) : <></>}
        </div>
        <div className="flex justify-between gap-x-6">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-32 p-3 rounded"
            onClick={() => callback(true, selectedPlayer)}>
            {options.confirmText}
          </button>
          <button
            className="bg-white hover:bg-blue-700 border-2 border-blue-500 text-blue-500 font-bold w-32 p-3 rounded"
            onClick={() => callback(false, undefined)}>
            {options.cancelText}
          </button>
        </div>
      </div>
    </div>
  ) : <></>;
}
