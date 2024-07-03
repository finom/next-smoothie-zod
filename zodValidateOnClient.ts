import type { VovkClientOptions } from 'vovk/client';
import Ajv from 'ajv';
import { HttpException, HttpStatus } from 'vovk';
import addFormats from 'ajv-formats';

const ajv = new Ajv();

addFormats(ajv);

const zodValidateOnClient: VovkClientOptions['validateOnClient'] = (input, validators) => {
  if (validators.body) {
    const isValid = ajv.validate(validators.body, input.body);

    if (!isValid) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('[zodValidateOnClient in dev env] The error below is caused by an invalid body', input.body);
      }
      throw new HttpException(HttpStatus.NULL, `Invalid request body on client for ${input.endpoint}. ${ajv.errorsText()}`);
    }
  }

  if (validators.query) {
    const isValid = ajv.validate(validators.query, input.query);

    if (!isValid) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('[zodValidateOnClient in dev env] The error below is caused by an invalid query', input.query);
      }
      throw new HttpException(HttpStatus.NULL, `Invalid request query on client for ${input.endpoint}. ${ajv.errorsText()}`);
    }
  }
};

export default zodValidateOnClient;