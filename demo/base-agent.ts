import type { LogLevel } from "@credo-ts/core";

import { AskarModule } from "@credo-ts/askar";
import {
  Agent,
  ConnectionsModule,
  ConsoleLogger,
  HttpOutboundTransport,
} from "@credo-ts/core";
import { HttpInboundTransport, agentDependencies } from "@credo-ts/node";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";
import { firstValueFrom, map, filter, first } from "rxjs";

import {
  TicTacToeGameEventType,
  TicTacToeGameStateChangeEvent,
} from "../src/TicTacToeGameStateChangeEvent";
import { TicTacToeModule } from "../src/index";
import { TicTacToeGameState } from "../src/models";

export function createAgent(
  label: string,
  port: number,
  logLevel: LogLevel
): Agent {
  const agent = new Agent({
    config: {
      endpoints: [`http://localhost:${port}`],
      label: label,
      walletConfig: {
        id: label,
        key: "pw",
      },
      logger: new ConsoleLogger(logLevel),
    },
    dependencies: agentDependencies,
    modules: {
      connections: new ConnectionsModule({ autoAcceptConnections: true }),
      ariesAskar: new AskarModule({
        ariesAskar: ariesAskar,
      }),
      tictactoe: new TicTacToeModule(),
    },
  });

  agent.registerOutboundTransport(new HttpOutboundTransport());
  agent.registerInboundTransport(new HttpInboundTransport({ port }));
  return agent;
}

export function waitForTurn(agent: Agent, winner = false) {
  const state = [TicTacToeGameState.NotStarted, TicTacToeGameState.MyMove];
  if (winner) {
    state.push(TicTacToeGameState.Done);
  }
  return firstValueFrom(
    agent.events
      .observable<TicTacToeGameStateChangeEvent>(
        TicTacToeGameEventType.TicTacToeGameStateChangeEvent
      )
      .pipe(
        map((event) => event.payload.tictactoeGameRecord),
        filter((gameRecord) => state.includes(gameRecord.state)),
        first()
      )
  );
}
