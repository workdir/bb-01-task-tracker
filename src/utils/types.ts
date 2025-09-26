import type * as E from "fp-ts/Either";
import type * as RTE from "fp-ts/ReaderTaskEither";

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
