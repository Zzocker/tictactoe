import { MessageHandler, MessageHandlerInboundMessage } from "@credo-ts/core";

import { OutcomeMessage } from "../messages";
import { TicTacToeService } from "../services";

export class OutcomeMessageHandler implements MessageHandler {
  supportedMessages = [OutcomeMessage];
  private readonly tictactoeService: TicTacToeService;

  constructor(tictactoeService: TicTacToeService) {
    this.tictactoeService = tictactoeService;
  }

  async handle(
    messageContext: MessageHandlerInboundMessage<OutcomeMessageHandler>
  ) {
    await this.tictactoeService.processOutcome(messageContext);
  }
}
