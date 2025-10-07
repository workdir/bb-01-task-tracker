import type * as E from "fp-ts/Either";
import type * as HKT from "fp-ts/HKT";
import type * as RTE from "fp-ts/ReaderTaskEither";

type T2 = HKT.HKT<string, string>;

type T3 = T2;

export type ReaderResult<T> = T extends RTE.ReaderTaskEither<
  never,
  never,
  infer Requirements
>
  ? Requirements
  : never;

export type EitherResult<T> = T extends E.Either<never, infer Value>
  ? Value
  : never;
