import { BaseEvent } from "@credo-ts/core";

import { TicTacToeGameState } from "./models";
import { TicTacToeGameRecord } from "./repository";

export enum TicTacToeGameEventType {
  TicTacToeGameStateChangeEvent = "TicTacToeGameStateChangeEvent",
}

export interface TicTacToeGameStateChangeEvent extends BaseEvent {
  type: typeof TicTacToeGameEventType.TicTacToeGameStateChangeEvent;
  payload: {
    tictactoeGameRecord: TicTacToeGameRecord;
    previousState: TicTacToeGameState | null;
  };
}
