import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as R from "fp-ts/Record";
import { config } from "@/config";
import { Logger } from "@/logger";

export const Default = pipe(
  config,
  E.map((config) => ({
    config: pipe(config, R.deleteAt("logLevel")),
    logger: Logger(config.logLevel),
  })),
);
