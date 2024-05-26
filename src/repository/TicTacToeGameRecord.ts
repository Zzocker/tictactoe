import type { MoveType, TicTacToeGameState } from "../models";

import { BaseRecord } from "@credo-ts/core";
import { uuid } from "@credo-ts/core/build/utils/uuid";

export interface TicTacToeGameRecordProps {
  id?: string;
  createdAt?: Date;
  moves: string[];
  state: TicTacToeGameState;
  myMove?: MoveType;
  connectionId: string;
  threadId: string;
  winner?: MoveType;
}

// Tag are used for querying records from wallet
export type DefaultTicTacToeGameRecordTags = {
  connectionId: string;
  myMove?: string;
  state: TicTacToeGameState;
  threadId: string;
  winner?: MoveType;
};

export class TicTacToeGameRecord extends BaseRecord<DefaultTicTacToeGameRecordTags> {
  state: TicTacToeGameState;
  myMove?: MoveType;
  moves: string[];
  connectionId: string;
  threadId: string;
  winner?: MoveType;

  static readonly type = "TicTacToeGameRecord";
  readonly type = TicTacToeGameRecord.type;

  constructor(props: TicTacToeGameRecordProps) {
    super();
    if (props) {
      this.id = props.id ?? uuid();
      this.createdAt = props.createdAt ?? new Date();
      this.moves = props.moves;
      this.state = props.state;
      this.myMove = props.myMove;
      this.connectionId = props.connectionId;
      this.threadId = props.threadId;
      this.winner = props.winner;
      this._tags = {};
    }
  }

  getTags() {
    return {
      ...this._tags,
      connectionId: this.connectionId,
      myMove: this.myMove,
      state: this.state,
      threadId: this.threadId,
      winner: this.winner,
    };
  }
}
