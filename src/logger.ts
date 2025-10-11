import * as Console from "fp-ts/Console";
import { flow, pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as L from "logging-ts/lib/IO";
import type { Config } from "@/config";
import type { ReaderResult } from "@/utils/types";

export enum LogLevel {
  NONE,
  ERROR,
  WARN,
  INFO,
  DEBUG,
  ALL,
}

export type LogLevelString = keyof typeof LogLevel;

export interface Entry {
  message: string;
  time: Date;
  level: LogLevel;
}

const askForConfig = flow(
  RTE.ask<Config>,
  RTE.map((config) => config.config),
);

export const Logger = pipe(
  RTE.Do,
  RTE.bind("config", askForConfig),
  RTE.map(({ config }) => {
    const showEntry = (entry: Entry) =>
      `[${entry.time.toISOString()}] ${LogLevel[entry.level].toUpperCase()}: ${entry.message}`;

    const logger = L.filter(
      flow(showEntry, Console.log),
      (entry) => entry.level <= LogLevel[config.logLevel],
    );

    const error = (message: string) =>
      logger({ level: LogLevel.ERROR, time: new Date(), message });
    const warn = (message: string) =>
      logger({ level: LogLevel.WARN, time: new Date(), message });
    const info = (message: string) =>
      logger({ level: LogLevel.INFO, time: new Date(), message });
    const debug = (message: string) =>
      logger({ level: LogLevel.DEBUG, time: new Date(), message });

    return {
      debug,
      info,
      warn,
      error,
    };
  }),
  RTE.bindTo("logger"),
);

export type Logger = ReaderResult<typeof Logger>;
