/* eslint-disable new-cap */
import { AgentMessage, parseMessageType } from "@credo-ts/core";
import { Expose } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { MoveType } from "../models";

export interface OutcomeMessageOptions {
  id?: string;
  winner: MoveType;
  comment?: string;
}

export class OutcomeMessage extends AgentMessage {
  constructor(options: OutcomeMessageOptions) {
    super();
    if (options) {
      this.id = options.id ?? this.generateId();
      this.winner = options.winner;
      this.comment = options.comment;
    }
  }

  readonly type = OutcomeMessage.type.messageTypeUri;
  static readonly type = parseMessageType(
    "https://didcomm.org/tictactoe/1.0/outcome"
  );

  @Expose()
  @IsEnum(MoveType)
  winner: MoveType;

  @Expose()
  @IsOptional()
  @IsString()
  comment?: string;
}
