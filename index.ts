import type { VovkClientOptions } from 'vovk/client';
import { HttpException, HttpStatus, createDecorator } from 'vovk';
import { z } from 'zod';
import { default as zodToJsonSchema } from 'zod-to-json-schema';
import Ajv from 'ajv';

type KnownAny = any; // eslint-disable-line @typescript-eslint/no-explicit-any

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

type ZodObject = z.ZodObject<KnownAny> | z.ZodRecord<KnownAny>;

const vovkZod = createDecorator(
  async (req, next, bodyModel?: ZodObject | null, queryModel?: ZodObject | null) => {
    if (bodyModel) {
      const body: unknown = await req.json();
      try {
        bodyModel.parse(body);
      } catch (e) {
        const err = (e as z.ZodError).errors.map((er) => `${er.message} (${er.path.join('/')})`).join(', ');
        throw new HttpException(HttpStatus.BAD_REQUEST, `Invalid body on server. ${err}`);
      }
      req.json = () => Promise.resolve(body);
    }

    if (queryModel) {
      const query = Object.fromEntries(req.nextUrl.searchParams.entries());
      try {
        queryModel.parse(query);
      } catch (e) {
        const err = (e as z.ZodError).errors.map((er) => `${er.message} (${er.path.join('/')})`).join(', ');
        throw new HttpException(HttpStatus.BAD_REQUEST, `Invalid query on server. ${err}`);
      }
    }

    return next();
  },
  (bodyModel?: ZodObject | null, queryModel?: ZodObject | null) => {
    return {
      clientValidators: {
        body: bodyModel ? zodToJsonSchema(bodyModel) : null,
        query: queryModel ? zodToJsonSchema(queryModel) : null,
      },
    };
  }
);

export default vovkZod;
