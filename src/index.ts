import { FilesystemStorage } from "./storage";
import { pipe } from 'fp-ts/function'
import * as RTE from 'fp-ts/ReaderTaskEither'

pipe(
  RTE.Do,
  RTE.bind('storage', () => FilesystemStorage),
  RTE.map(({storage}) => {
  })
)


const add = () => {}
const delte = () => {}
const update = () => {}
const makrInProgress = () => {}
const markIsDone = () => {}
const list = () => {}
