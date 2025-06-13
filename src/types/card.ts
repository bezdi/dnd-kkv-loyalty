export type SceneId = "a" | "b";

export interface Position {
  x: number;
  y: number;
}

export interface CardData {
  id: string;
  text: string;
  sets: string[];
  picked: Record<string, boolean>; // key = setId
  positions: Record<SceneId, Record<string, Position>>;
}
