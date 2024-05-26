import {
  ConnectionEventTypes,
  ConnectionStateChangedEvent,
  DidExchangeState,
  LogLevel,
  OutOfBandInvitation,
} from "@credo-ts/core";
import { readFileSync } from "fs";
import { firstValueFrom, map, filter, first } from "rxjs";

import { TicTacToeApi } from "../src";

import { createAgent, waitForTurn } from "./base-agent";

async function main() {
  const agent = createAgent("bob", 8081, LogLevel.debug);
  await agent.initialize();

  const invitation = JSON.parse(
    readFileSync("invitation.json").toString("utf8")
  );

  await agent.oob.receiveInvitation(OutOfBandInvitation.fromJson(invitation));

  await firstValueFrom(
    agent.events
      .observable<ConnectionStateChangedEvent>(
        ConnectionEventTypes.ConnectionStateChanged
      )
      .pipe(
        map((data) => data.payload.connectionRecord),
        filter(
          (connectionRecord) =>
            connectionRecord.state == DidExchangeState.Completed
        ),
        first()
      )
  );
  console.log("connection established");
  const tictactoeApi = agent.dependencyManager.resolve(TicTacToeApi);

  const game = await waitForTurn(agent);
  await tictactoeApi.makeMove(game.id, "O:B1");
  await waitForTurn(agent);
  await tictactoeApi.makeMove(game.id, "O:B2");
}

main();
