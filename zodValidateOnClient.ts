import type { VovkClientOptions } from 'vovk/client';
import Ajv from 'ajv';
import { HttpException, HttpStatus } from 'vovk';

const ajv = new Ajv();

export const zodValidateOnClient: VovkClientOptions['validateOnClient'] = (input, validators) => {
    if (validators.body) {
      const isValid = ajv.validate(validators.body, input.body);
  
      if (!isValid) {
        throw new HttpException(HttpStatus.NULL, `Invalid body on client. ${ajv.errorsText()}`);
      }
    }
  
    if (validators.query) {
      const isValid = ajv.validate(validators.query, input.query);
  
      if (!isValid) {
        throw new HttpException(HttpStatus.NULL, `Invalid query on client. ${ajv.errorsText()}`);
      }
    }
  };