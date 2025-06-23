
export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export interface Position {
  x: number;
  y: number;
}

export enum GameState {
  Idle,
  Playing,
  GameOver,
}
