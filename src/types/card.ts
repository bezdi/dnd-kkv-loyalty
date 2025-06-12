export type SceneId = "a" | "b";

export interface Position {
  x: number;
  y: number;
}

export interface CardData {
  id: string;
  text: string;
  set: string;
  picked: boolean;
  positions: Record<SceneId, Position>;
}
