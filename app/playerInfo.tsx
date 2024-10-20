import { ChangeEvent, useEffect, useState } from 'react';
import { Player } from '../types/types';

type PlayerInfoProps = {
  player: Player;
  checked: boolean;
  onPlayerChecked: (event: ChangeEvent<HTMLInputElement>) => void;
  onPlayerEdited: (username: string, newName: string, newSkill: number) => void;
}

export default function PlayerInfo({ player, checked, onPlayerChecked, onPlayerEdited }: PlayerInfoProps) {
  const [editing, setEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [skillLevel, setSkillLevel] = useState<string>("");

  useEffect(() => {
    setDisplayName(player.name);
    setSkillLevel("" + player.skillLevel);
  }, [editing])

  function applyChanges() {
    onPlayerEdited(player.username, displayName, Number.parseInt(skillLevel));
    setEditing(false);
  }

  function onSkillChanged(value: string) {
    let skillValue = Number.parseInt(value);
    if (!isNaN(skillValue)) {
      skillValue = Math.max(1, Math.min(skillValue, 8));
      setSkillLevel("" + skillValue);
    } else {
      setSkillLevel("");
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-x-2 justify-between">
        <div className="font-semibold">
          <input
            type="checkbox"
            id={"c" + player.name}
            value={player.name}
            checked={checked}
            onChange={(event) => onPlayerChecked(event)}
          />
          <label htmlFor={"c" + player.name}>{" " + player.name}</label>
        </div>
        <div className="flex gap-x-2 items-center">
          <p className="text-sm pl-6">{"(Played: " + player.gamesPlayed + ")"}</p>
          <button
            className="rounded-sm border border-gray-500 bg-gray-200 px-2 text-sm"
            onClick={() => setEditing(!editing)}>
            Edit
          </button>
        </div>
      </div>
      {editing ?
        <div className="flex flex-col gap-y-1 py-1 text-sm">
          <div className="flex gap-x-2">
            <p>{"->"}</p>
            <label htmlFor={"n" + player.name}>{"Display Name: "}</label>
            <input
              type="text"
              id={"n" + player.name}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="flex gap-x-2">
            <p>{"->"}</p>
            <label htmlFor={"s" + player.name}>{"Skill Level: "}</label>
            <input
              type="number"
              id={"s" + player.name}
              value={skillLevel}
              onChange={(event) => onSkillChanged(event.target.value)}
            />
          </div>
          <button
            className="rounded-sm border border-gray-500 bg-gray-200 px-2 text-sm"
            onClick={() => applyChanges()}>
            Apply Changes
          </button>
        </div> : <></>
      }
    </div>
  );
}
