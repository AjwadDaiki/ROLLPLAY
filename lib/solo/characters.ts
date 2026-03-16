export type CharacterOption = {
  id: string;
  label: string;
  face: string;
  idle: string;
  walk: string;
};

const BASE =
  "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters";

function buildCharacter(id: string, label: string): CharacterOption {
  return {
    id,
    label,
    face: `${BASE}/${id}/Faceset.png`,
    idle: `${BASE}/${id}/SeparateAnim/Idle.png`,
    walk: `${BASE}/${id}/SeparateAnim/Walk.png`,
  };
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  buildCharacter("Boy", "Boy"),
  buildCharacter("Cavegirl", "Cavegirl"),
  buildCharacter("Hunter", "Hunter"),
  buildCharacter("NinjaBlue", "Ninja Blue"),
  buildCharacter("NinjaRed", "Ninja Red"),
  buildCharacter("Samurai", "Samurai"),
  buildCharacter("SorcererOrange", "Sorcerer"),
  buildCharacter("Princess", "Princess"),
];

export function resolveCharacter(characterId: string | null | undefined): CharacterOption {
  const wanted = (characterId || "").trim();
  const found = CHARACTER_OPTIONS.find((entry) => entry.id === wanted);
  return found ?? CHARACTER_OPTIONS[0];
}
