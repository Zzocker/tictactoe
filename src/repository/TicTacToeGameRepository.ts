import {
  EventEmitter,
  StorageService,
  InjectionSymbols,
  Repository,
  inject,
  injectable,
} from "@credo-ts/core";

import { TicTacToeGameRecord } from "./TicTacToeGameRecord";

@injectable()
export class TicTacToeGameRepository extends Repository<TicTacToeGameRecord> {
  constructor(
    @inject(InjectionSymbols.StorageService)
    storageService: StorageService<TicTacToeGameRecord>,
    eventEmitter: EventEmitter
  ) {
    super(TicTacToeGameRecord, storageService, eventEmitter);
  }
}
