import type { Args } from "./Args";
import type { Options } from "./Options";

type Command = {};

type Config = {
  name: string;
  version: string;
};

const Command = {};

export const make = <Params extends Record<string, Args | Options>>(
  name: string,
  params: Params,
  handler: (params: Params) => void
) => {};
const run = (command: Command, config: Config) => {};

make("run", {}, () => {});
