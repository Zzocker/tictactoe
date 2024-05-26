import {
  AgentContext,
  ConnectionRecord,
  EventEmitter,
  CredoError,
  injectable,
  InboundMessageContext,
  inject,
  InjectionSymbols,
  Logger,
} from "@credo-ts/core";

import {
  TicTacToeGameEventType,
  TicTacToeGameStateChangeEvent,
} from "../TicTacToeGameStateChangeEvent";
import { MoveMessage, MoveRegExp, OutcomeMessage } from "../messages";
import { MoveType, TicTacToeGameState } from "../models";
import { TicTacToeGameRecord, TicTacToeGameRepository } from "../repository";

@injectable()
export class TicTacToeService {
  private readonly tictactoeGameRepository: TicTacToeGameRepository;
  private readonly eventEmitter: EventEmitter;
  private readonly logger: Logger;

  constructor(
    tictactoeGameRepository: TicTacToeGameRepository,
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger
  ) {
    this.tictactoeGameRepository = tictactoeGameRepository;
    this.eventEmitter = eventEmitter;
    this.logger = logger;
  }

  async createGame(
    agentContext: AgentContext,
    connectionRecord: ConnectionRecord,
    move?: string
  ) {
    if (move && !MoveRegExp.test(move)) {
      throw new CredoError("invalid move");
    }

    const moveMessage = new MoveMessage({ move });

    const gameRecord = new TicTacToeGameRecord({
      connectionId: connectionRecord.id,
      moves: move ? [move] : [],
      state: move
        ? TicTacToeGameState.TheirMove
        : TicTacToeGameState.NotStarted,
      ...(move && {
        myMove: move[0] == "X" ? MoveType.Cross : MoveType.Circle,
      }),
      threadId: moveMessage.id,
    });

    await this.tictactoeGameRepository.save(agentContext, gameRecord);
    return {
      message: moveMessage,
      record: gameRecord,
    };
  }

  async processMove(messageContext: InboundMessageContext<MoveMessage>) {
    const { message } = messageContext;
    const gameRecord = await this.tictactoeGameRepository.findSingleByQuery(
      messageContext.agentContext,
      {
        threadId: message.threadId,
      }
    );
    if (!gameRecord) {
      this.logger.debug("tic-tac-toe game not found, starting a new one");
      const gameRecord = new TicTacToeGameRecord({
        connectionId: messageContext.connection.id,
        moves: message.move ? [message.move] : [],
        state: message.move
          ? TicTacToeGameState.MyMove
          : TicTacToeGameState.NotStarted,
        ...(message.move && {
          myMove:
            message.move[0] == MoveType.Cross
              ? MoveType.Circle
              : MoveType.Cross,
        }),
        threadId: message.threadId,
      });
      await this.tictactoeGameRepository.save(
        messageContext.agentContext,
        gameRecord
      );
      this.emitStateChangedEvent(messageContext.agentContext, gameRecord, null);
      return gameRecord;
    }
    if (!message.move) {
      throw new CredoError("cannot make empty move");
    }
    const [player, ,] = this.decodeMove(message.move);
    if (gameRecord.myMove && player == gameRecord.myMove) {
      throw new CredoError("illegal move, cannot use opponent mark");
    }
    if (
      ![TicTacToeGameState.NotStarted, TicTacToeGameState.TheirMove].includes(
        gameRecord.state
      )
    ) {
      throw new CredoError("illegal move, not your turn");
    }
    this.validateMove(gameRecord, message.move);
    gameRecord.moves.push(message.move);
    if (!gameRecord.myMove) {
      gameRecord.myMove =
        player == MoveType.Cross ? MoveType.Circle : MoveType.Cross;
    }
    const previousState = gameRecord.state;
    gameRecord.state = TicTacToeGameState.MyMove;
    const winner = this.checkWinner(gameRecord);
    if (winner) {
      gameRecord.winner = winner;
      gameRecord.state = TicTacToeGameState.Done;
    }
    await this.tictactoeGameRepository.update(
      messageContext.agentContext,
      gameRecord
    );
    this.emitStateChangedEvent(
      messageContext.agentContext,
      gameRecord,
      previousState
    );
    return gameRecord;
  }

  async processOutcome(messageContext: InboundMessageContext<OutcomeMessage>) {
    const { message } = messageContext;
    const gameRecord = await this.tictactoeGameRepository.findSingleByQuery(
      messageContext.agentContext,
      {
        threadId: message.threadId,
      }
    );
    if (!gameRecord) {
      throw new CredoError("game not found");
    }
    const previousState = gameRecord.state;
    const winner = this.checkWinner(gameRecord);
    if (message.winner != winner) {
      throw new CredoError("wrong winner");
    }
    gameRecord.winner = message.winner;
    gameRecord.state = TicTacToeGameState.Done;
    await this.tictactoeGameRepository.update(
      messageContext.agentContext,
      gameRecord
    );
    this.emitStateChangedEvent(
      messageContext.agentContext,
      gameRecord,
      previousState
    );
  }

  async createOutcome(tictactoeGameRecord: TicTacToeGameRecord) {
    const message = new OutcomeMessage({
      winner: tictactoeGameRecord.winner,
    });
    message.setThread({
      threadId: tictactoeGameRecord.threadId,
    });
    return {
      message: message,
      record: tictactoeGameRecord,
    };
  }

  async makeMove(agentContext: AgentContext, gameId: string, move: string) {
    if (!MoveRegExp.test(move)) {
      throw new CredoError("invalid move");
    }
    const gameRecord = await this.tictactoeGameRepository.findById(
      agentContext,
      gameId
    );
    if (!gameRecord) {
      throw new CredoError("game not found");
    }
    const [player, ,] = this.decodeMove(move);
    if (gameRecord.myMove && player != gameRecord.myMove) {
      throw new CredoError("illegal move, cannot use opponent mark");
    }
    if (
      ![TicTacToeGameState.NotStarted, TicTacToeGameState.MyMove].includes(
        gameRecord.state
      )
    ) {
      throw new CredoError("illegal move, not your turn");
    }
    this.validateMove(gameRecord, move);
    gameRecord.moves.push(move);
    if (!gameRecord.myMove) {
      gameRecord.myMove = player;
    }
    const previousState = gameRecord.state;
    gameRecord.state = TicTacToeGameState.TheirMove;
    const moveMessage = new MoveMessage({ move: move });
    moveMessage.setThread({
      threadId: gameRecord.threadId,
    });
    await this.tictactoeGameRepository.update(agentContext, gameRecord);
    this.emitStateChangedEvent(agentContext, gameRecord, previousState);
    return { message: moveMessage, record: gameRecord };
  }

  private checkWinner(gameRecord: TicTacToeGameRecord): MoveType | undefined {
    const board = this.createBoard(gameRecord.moves);
    const candidates = [
      // row ->>
      [board[0][0], board[0][1], board[0][2]],
      [board[1][0], board[1][1], board[1][2]],
      [board[2][0], board[2][1], board[2][2]],
      // column -->
      [board[0][0], board[1][0], board[2][0]],
      [board[0][1], board[1][1], board[2][1]],
      [board[0][2], board[1][2], board[2][2]],
      // diagonal
      [board[0][0], board[1][1], board[2][2]],
      [board[0][2], board[1][1], board[2][0]],
    ];

    return Object.values(MoveType).find((player) =>
      candidates.some((candidate) => candidate.every((c) => c == player))
    );
  }

  private validateMove(gameRecord: TicTacToeGameRecord, move: string) {
    const board = this.createBoard(gameRecord.moves);
    const [_, i, j] = this.decodeMove(move);
    if (board[i][j] != "") {
      throw new CredoError("illegal move, cannot move already taken place");
    }
  }

  private createBoard(moves: string[]) {
    // B1 : column row
    const board: (MoveType | "")[][] = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
    moves.forEach((move) => {
      const [player, i, j] = this.decodeMove(move);
      board[i][j] = player as MoveType;
    });
    return board;
  }

  private decodeMove(move: string): [MoveType, number, number] {
    const [player, pos] = move.split(":");
    const i = +pos[1] - 1;
    const j = pos[0] == "A" ? 0 : pos[0] == "B" ? 1 : 2;
    return [player as MoveType, i, j];
  }

  private emitStateChangedEvent(
    agentContext: AgentContext,
    tictactoeGameRecord: TicTacToeGameRecord,
    previousState: TicTacToeGameState | null
  ) {
    this.eventEmitter.emit<TicTacToeGameStateChangeEvent>(agentContext, {
      type: TicTacToeGameEventType.TicTacToeGameStateChangeEvent,
      payload: {
        tictactoeGameRecord: tictactoeGameRecord,
        previousState: previousState,
      },
    });
  }
}
