import * as RTE from "fp-ts/ReaderTaskEither";
import * as E from "fp-ts/Either";

export type ReaderResult<T> = T extends RTE.ReaderTaskEither<
  never,
  never,
  infer R
>
  ? R
  : never;

export type EitherResult<T> = T extends E.Either<never, infer Value>
  ? Value
  : never;
