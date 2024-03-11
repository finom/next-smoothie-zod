<p align="middle">
<a href="https://github.com/finom/vovk"><img valign="middle" src="https://github.com/finom/vovk/assets/1082083/86bfbbbb-3600-435b-a74c-c07bd0c4af4b" height="150" /></a> &nbsp;&nbsp;<img valign="middle" alt="plus" src="https://github.com/finom/vovk-zod/assets/1082083/50a15051-51a8-4f9b-a251-e4376576f9e7" width="30" /> <a href="https://zod.dev/"><img valign="middle" src="https://github.com/finom/vovk-zod/assets/1082083/308ef538-43b5-4ea5-ab1e-a660b4e21b65"  height="150" /></a> <img valign="middle" alt="plus" src="https://github.com/finom/vovk-zod/assets/1082083/50a15051-51a8-4f9b-a251-e4376576f9e7" width="30" /> <a href="https://ajv.js.org/"><img valign="middle" src="https://github.com/finom/vovk-zod/assets/1082083/0165a210-aba2-461a-ba02-37350f09cd23" height="100" /></a>
</p>
<h1 align="center">vovk-zod</h1>
<p align="center">Isomorphic <a href="https://zod.dev/">Zod</a> validation for <a href="https://github.com/finom/vovk">Vovk.ts</a> controllers on server and client</p>
<p align="center">
  <a href="https://badge.fury.io/js/vovk-zod"><img src="https://badge.fury.io/js/vovk-zod.svg" alt="npm version" /></a>
  <a href="http://www.typescriptlang.org/"><img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript" /></a>
  <a href="https://github.com/finom/vovk-zod/actions"><img src="https://github.com/finom/vovk-zod/actions/workflows/main.yml/badge.svg" alt="Build status" /></a>
</p>



**vovk-zod** exports `vovkZod` decorator fabric that validates request body and incoming query string with Zod models.

```ts
// /src/models/user/UserController.ts
import { z } from 'zod';
import vovkZod from 'vovk-zod';
import { put, type VovkRequest } from 'vovk';
import UserService from './UserService';

const UpdateUserModel = z.object({
    name: z.string(),
    email: z.string(),
}).strict();

const UpdateUserQueryModel = z.object({
    id: z.string(),
}).strict();

export default class UserController {
    private static userService = UserService;

    @put()
    @vovkZod(UpdateUserModel, UpdateUserQueryModel)
    static updateUser(
        req: VovkRequest<z.infer<typeof UpdateUserModel>, z.infer<typeof UpdateUserQueryModel>>
    ) {
        const { name, email } = await req.json();
        const id = req.nextUrl.searchParams.get('id');

        return this.userService.updateUser(id, { name, email });
    }
}

```


```ts
'use client';
import React from 'react';
import { UserController } from 'vovk-client';

const MyPage = () => {
    useEffect(() => {
        void UserController.updateUser({
            query: { id: '696969' },
            body: { name: 'John Doe', email: 'john@example.com' },
            // optionally, disable client validation for debugging purpose
            disableClientValidation: true, 
        }).then(/* ... */);
    }, []);

    return (
        // ...
    )
}

export default MyPage;
```

When **vovk-zod** is installed [zodValidateOnClient](https://github.com/finom/vovk-zod/blob/main/zodValidateOnClient.ts) is enabled by default as `validateOnClient` config option to validate incoming reqests on the client-side. Please check [customization docs](https://docs.vovk.dev/docs/customization) for more info.

Hint: To produce less variables you can also declare Zod models as `static` (with an optional `private` prefix) class members of the controller to access them within the `@vovkZod` decorator and `VovkRequest`.

```ts
// ...

export default class UserController {
    private static userService = UserService;

    static UpdateUserModel = z.object({
        name: z.string(),
        email: z.string(),
    }).strict();

    static UpdateUserQueryModel = z.object({
        id: z.string(),
    }).strict();

    @put()
    @vovkZod(UserController.UpdateUserModel, UserController.UpdateUserQueryModel)
    static updateUser(
        req: VovkRequest<
            z.infer<typeof UserController.UpdateUserModel>, 
            z.infer<typeof UserController.UpdateUserQueryModel>
        >
    ) {
       // ...
    }
}
```

## Working with `FormData`

The library doesn't support `FormData` validation, but you can still validate query by setting body validation to `null`.

```ts
// ...

export default class HelloController {
    @post()
    @vovkZod(null, z.object({ something: z.string() }).strict())
    static postFormData(req: VovkRequest<FormData, { something: string }>) {
        const formData = await req.formData();
        const something = req.nextUrl.searchParams.get('something');

        // ...
    }
}
```

## How it works

The library (as well as Vovk.ts itself) is built thanks to fantastic job made by other people.

- When `@vovkZod` is initialised, it converts [Zod](https://zod.dev/) schemas to JSON Schemas with [zod-to-json-schema](https://www.npmjs.com/package/zod-to-json-schema) and makes metadata handler to receive it as client validation object.
- `@vovkZod` performs Zod validation on server-side.
- When clientized controller method gets called `zodValidateOnClient` performs validation on client-side with [Ajv](https://ajv.js.org/). Since client-side and server-side validation is implemented by different libraries, error messages are going to be different.
