/* eslint-disable new-cap */
import {
  AgentMessage,
  IsValidMessageType,
  parseMessageType,
} from "@credo-ts/core";
import { Expose } from "class-transformer";
import { IsOptional, IsString, Matches } from "class-validator";

export const MoveRegExp = /^[XO]:[ABC][123]$/;

export interface MoveMessageOptions {
  id?: string;
  move?: string;
  comment?: string;
}

/**
 * Agent message is ultimately transferred from agent-to-agent
 * and responsible for change state machine of agents
 */
export class MoveMessage extends AgentMessage {
  constructor(options: MoveMessageOptions) {
    super();
    if (options) {
      this.id = options.id ?? this.generateId();
      this.move = options.move;
      this.comment = options.comment;
    }
  }

  @IsValidMessageType(MoveMessage.type)
  readonly type = MoveMessage.type.messageTypeUri;
  static readonly type = parseMessageType(
    "https://didcomm.org/tictactoe/1.0/move"
  );

  @Expose()
  @IsOptional()
  @IsString()
  @Matches(MoveRegExp)
  move?: string;

  @Expose()
  @IsOptional()
  @IsString()
  comment?: string;
}
