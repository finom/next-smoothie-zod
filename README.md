<p align="middle">
<a href="https://github.com/finom/vovk"><img valign="middle" src="https://github.com/finom/vovk/assets/1082083/86bfbbbb-3600-435b-a74c-c07bd0c4af4b" height="150" /></a> &nbsp;&nbsp;<img valign="middle" alt="plus" src="https://github.com/finom/vovk-zod/assets/1082083/50a15051-51a8-4f9b-a251-e4376576f9e7" width="30" /> <a href="https://zod.dev/"><img valign="middle" src="https://github.com/finom/vovk-zod/assets/1082083/308ef538-43b5-4ea5-ab1e-a660b4e21b65"  height="150" /></a> <img valign="middle" alt="plus" src="https://github.com/finom/vovk-zod/assets/1082083/50a15051-51a8-4f9b-a251-e4376576f9e7" width="30" /> <a href="https://ajv.js.org/"><img valign="middle" src="https://camo.githubusercontent.com/985f4bca44ac720873daf94ec77043eabb44c45b1f3e83555d2b180e7b46c6bc/68747470733a2f2f616a762e6a732e6f72672f696d672f616a762e737667" height="100" /></a>
</p>
<h1 align="center">vovk-zod</h1>
<p align="center">Isomorphic [Zod](https://zod.dev/) validation for <a href="https://github.com/finom/vovk">Vovk.ts</a> controllers on server and client</p>
<p align="center">
  <a href="https://badge.fury.io/js/vovk-zod">
    <img src="https://badge.fury.io/js/vovk-zod.svg" alt="npm version" />
  </a>
  <a href="http://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript" />
  </a>
  <a href="https://github.com/finom/vovk-zod/actions">
    <img src="https://github.com/finom/vovk-zod/actions/workflows/main.yml/badge.svg" alt="Build status" />
  </a>
</p>

**vovk-zod** exports `vovkZod` decorator fabric that validates request body and incoming query string providing Zod models.

```ts
// vovk/user/UserController.ts
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
    static controllerName = 'UserController';

    static userService = UserService;

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

To enable validation on client, you can pass `zodValidateOnClient` imported from **vovk-zod** as `validateOnClient` option for `clientizeController` function. Doing that will make all requests made with the clientized controller (if API handler is wrapped by `@vovkZod`) validated with **Ajv** on client-side, before they got sent to back-end.


```ts
// vovk/user/UserState.ts
import { clientizeController, type DefaultFetcherOptions } from 'vovk/client';
import { zodValidateOnClient } from 'vovk-zod';
import type UserController from './UserController';
import metadata from '../vovk-metadata.json';

const controller = clientizeController<typeof StreamingController>(metadata.UserController, {
    validateOnClient: zodValidateOnClient,
});

export function updateUser(id: string, { name, email }: { name: string; email: string }) {
    return this.controller.updateUser({
        query: { id },
        body: { name, email },
    });
}
```

Example usage in a component:

```ts
// app/page.tsx
'use client';
import React from 'react';
import { updateUser } from '../vovk/UserState';

const MyPage = () => {
    useEffect(() => {
        void updateUser('69420', { 
            name: 'John Doe', 
            email: 'john@example.ts' 
        }).then(/* ... */)
    }, []);

    return (
        // ...
    )
}

export default MyPage;
```

## Working with `FormData`

The library doesn't support `FormData` validation yet, but you still can validate your query.

```ts
// vovk/hello/HelloController.ts
import { post } from 'vovk';
import vovkZod from 'vovk-zod';

export default class HelloController {
    @post()
    @vovkZod(null, z.object({
        something: z.string()
    }).strict())
    static postFormData(req: VovkRequest<FormData, { something: string }>) {
        const formData = await req.formData();
        const something = req.nextUrl.searchParams.get('something');

        // ...
    }
}

```

## How it works

The library (as well as Vovk.ts itself) is built thanks to fantastic job made by other people.

- When `@vovkZod` is initialised, it converts [Zod](https://zod.dev/) schemas to JSON Schemas with [zod-to-json-schema](https://www.npmjs.com/package/zod-to-json-schema) and makes `onMetadata` handler to receive it as client validation object.
- `@vovkZod` performs Zod validation on server-side.
- When clientized controller method gets called `zodValidateOnClient` performs validation on client-side with [Ajv](https://ajv.js.org/).

Enjoy!