import React, { useState } from 'react';
import { ConfirmDialogOptions, ConfirmDialogCallback, Player } from '../types/types'

type ConfirmDialogProps = {
  show: boolean,
  options: ConfirmDialogOptions,
  callback: ConfirmDialogCallback,
}

export default function ConfirmDialog({ show, options, callback }: ConfirmDialogProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(); // List of players included in the current session

  return show ? (
    <div className="fixed inset-0 m-auto bg-black/70 flex items-center justify-center">
      <div className="flex flex-col justify-between w-80 h-52 p-6 bg-white rounded gap-y-1">
        <h2 className="text-2xl font-semibold">
          {options.title}
        </h2>
        <p className="grow">
          {options.desc}
        </p>
        <div className="flex justify-between gap-x-6">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-32 p-3 rounded"
            onClick={() => callback(true, undefined)}>
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
