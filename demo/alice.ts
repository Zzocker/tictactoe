import {
  ConnectionEventTypes,
  ConnectionStateChangedEvent,
  DidExchangeState,
  LogLevel,
} from "@credo-ts/core";
import { writeFileSync } from "fs";
import { firstValueFrom, map, filter } from "rxjs";

import { TicTacToeApi } from "../src";

import { createAgent, waitForTurn } from "./base-agent";

async function main() {
  const agent = createAgent("alice", 8080, LogLevel.debug);
  await agent.initialize();

  const oobInvitation = await agent.oob.createInvitation();
  writeFileSync(
    "invitation.json",
    JSON.stringify(oobInvitation.outOfBandInvitation.toJSON(), null, 2)
  );

  const connection = await firstValueFrom(
    agent.events
      .observable<ConnectionStateChangedEvent>(
        ConnectionEventTypes.ConnectionStateChanged
      )
      .pipe(
        map((data) => data.payload.connectionRecord),
        filter(
          (connectionRecord) =>
            connectionRecord.state == DidExchangeState.Completed
        )
      )
  );

  console.log(
    "connection established, starting a tic-tac-toe game",
    connection.id
  );
  const ticTacToeApi = agent.dependencyManager.resolve(TicTacToeApi);
  const aliceBobGame = await ticTacToeApi.startGame(connection.id, "X:A1");
  await waitForTurn(agent);
  await ticTacToeApi.makeMove(aliceBobGame.id, "X:A2");
  await waitForTurn(agent);
  await ticTacToeApi.makeMove(aliceBobGame.id, "X:A3");
  const completedGame = await waitForTurn(agent, true);
  console.log(completedGame);
}

main();
