import {
  MessageHandler,
  MessageHandlerInboundMessage,
  OutboundMessageContext,
} from "@credo-ts/core";

import { MoveMessage } from "../messages";
import { TicTacToeGameState } from "../models";
import { TicTacToeService } from "../services";

export class MoveMessageHandler implements MessageHandler {
  supportedMessages = [MoveMessage];
  private readonly tictactoeService: TicTacToeService;

  constructor(tictactoeService: TicTacToeService) {
    this.tictactoeService = tictactoeService;
  }

  async handle(
    messageContext: MessageHandlerInboundMessage<MoveMessageHandler>
  ) {
    const connection = messageContext.assertReadyConnection();
    const gameRecord = await this.tictactoeService.processMove(messageContext);
    if (gameRecord.state == TicTacToeGameState.Done) {
      const { message } = await this.tictactoeService.createOutcome(gameRecord);
      return new OutboundMessageContext(message, {
        agentContext: messageContext.agentContext,
        connection: connection,
      });
    }
  }
}
