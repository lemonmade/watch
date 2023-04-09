import {execSync} from 'child_process';
import {writeFile, mkdir} from 'fs/promises';
import {stripIndent} from 'common-tags';

const name = process.argv[2];

await mkdir(`packages/clips/source/components/${name}`);
await writeFile(
  `packages/clips/source/components/${name}/${name}.ts`,
  stripIndent`
    import {createRemoteComponent} from '@remote-ui/core';

    export interface ${name}Props {

    }

    /**
     * 
     */
    export const ${name} = createRemoteComponent<'${name}', ${name}Props>('${name}');
  `,
);
await writeFile(
  `packages/clips/source/components/${name}/index.ts`,
  stripIndent`
    export {${name}, type ${name}Props} from './${name}';
  `,
);

await writeFile(
  `packages/clips-react/source/components/${name}.tsx`,
  stripIndent`
    import {${name} as Base${name}} from '@watching/clips';
    import {createRemoteReactComponent} from './shared.ts';
    
    export const ${name} = createRemoteReactComponent(Base${name});
  `,
);

execSync(`pnpm lint --fix`, {stdio: 'inherit'});
