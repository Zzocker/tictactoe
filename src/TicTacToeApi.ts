import {
  AgentContext,
  ConnectionService,
  MessageHandlerRegistry,
  MessageSender,
  OutboundMessageContext,
  injectable,
} from "@credo-ts/core";

import { MoveMessageHandler } from "./handlers/MoveMessageHandler";
import { OutcomeMessageHandler } from "./handlers/OutcomeMessageHandler";
import { TicTacToeService } from "./services";

@injectable()
export class TicTacToeApi {
  private connectionService: ConnectionService;
  private agentContext: AgentContext;
  private tictacToeService: TicTacToeService;
  private messageSender: MessageSender;

  public constructor(
    connectionService: ConnectionService,
    agentContext: AgentContext,
    tictacToeService: TicTacToeService,
    messageSender: MessageSender,
    messageHandlerRegistry: MessageHandlerRegistry
  ) {
    this.connectionService = connectionService;
    this.agentContext = agentContext;
    this.tictacToeService = tictacToeService;
    this.messageSender = messageSender;
    this.registerMessageHandlers(messageHandlerRegistry);
  }

  async startGame(connectionId: string, move?: string) {
    const connection = await this.connectionService.getById(
      this.agentContext,
      connectionId
    );

    const { message: moveMessage, record: tictactoeGameRecord } =
      await this.tictacToeService.createGame(
        this.agentContext,
        connection,
        move
      );

    const outboundMessageContext = new OutboundMessageContext(moveMessage, {
      agentContext: this.agentContext,
      connection: connection,
    });

    await this.messageSender.sendMessage(outboundMessageContext);
    return tictactoeGameRecord;
  }

  async makeMove(gameId: string, move: string) {
    const { message: moveMessage, record: tictactoeGameRecord } =
      await this.tictacToeService.makeMove(this.agentContext, gameId, move);
    const connection = await this.connectionService.findById(
      this.agentContext,
      tictactoeGameRecord.connectionId
    );
    const outboundMessageContext = new OutboundMessageContext(moveMessage, {
      agentContext: this.agentContext,
      connection: connection,
    });

    await this.messageSender.sendMessage(outboundMessageContext);
    return tictactoeGameRecord;
  }

  private registerMessageHandlers(
    messageHandlerRegistry: MessageHandlerRegistry
  ) {
    messageHandlerRegistry.registerMessageHandler(
      new MoveMessageHandler(this.tictacToeService)
    );
    messageHandlerRegistry.registerMessageHandler(
      new OutcomeMessageHandler(this.tictacToeService)
    );
  }
}
