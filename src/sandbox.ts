import * as Compound from 'schema.compound'
import * as Simple from 'schema.simple'
import { stringifyValidationErrors } from './PathReporter'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

const result = pipe(
  Simple.Description.decode(''),
  E.mapLeft(stringifyValidationErrors)
)

if(E.isLeft(result)) {
  console.log(result.left)
}
