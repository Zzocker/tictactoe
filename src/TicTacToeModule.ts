import {
  DependencyManager,
  FeatureRegistry,
  Module,
  Protocol,
} from "@credo-ts/core";

import { TicTacToeApi } from "./TicTacToeApi";
import { TicTacToeGameRepository } from "./repository";
import { TicTacToeService } from "./services";

/*
    credo-ts begin a pluggable framework for developing SSI
    agent. By implementing Module interface, we can
    register new protocols and extend the features of the agent

    Usage:
        const agent = new Agent({
            modules: {
                // ...
                tictactoe: new TicTacToeModule(),
                // ...
            }
        })
*/
export class TicTacToeModule implements Module {
  public readonly api = TicTacToeApi;

  register(
    dependencyManager: DependencyManager,
    featureRegistry: FeatureRegistry
  ): void {
    // Services
    dependencyManager.registerSingleton(TicTacToeService);

    // Repositories
    dependencyManager.registerSingleton(TicTacToeGameRepository);

    featureRegistry.register(
      new Protocol({
        id: "https://didcomm.org/tictactoe/1.0",
        roles: ["player"],
      })
    );
  }
}
