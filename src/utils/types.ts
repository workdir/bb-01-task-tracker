import * as RTE from 'fp-ts/ReaderTaskEither';

export type ReaderResult<T> = T extends RTE.ReaderTaskEither<never, never, infer R> ? R : never; 
