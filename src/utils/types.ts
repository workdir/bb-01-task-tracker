import type * as E from "fp-ts/Either";
import type * as RTE from "fp-ts/ReaderTaskEither";

export type ReaderResult<T> = T extends RTE.ReaderTaskEither<
  never,
  unknown,
  infer Requirements
>
  ? Requirements
  : never;

export type EitherResult<T> = T extends E.Either<never, infer Value>
  ? Value
  : never;
