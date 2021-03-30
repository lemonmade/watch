To generate, run the following script with an access token for the Github API:

```ts
import fetch from 'node-fetch';
import {printSchema, buildClientSchema} from 'graphql';

async function run() {
  const response = await fetch('https://api.github.com/graphql', {
    headers: {
      Authorization: 'bearer ACCESS_TOKEN',
    },
  });

  const result = await response.json();
  console.log(printSchema(buildClientSchema(result.data)));
}
```
