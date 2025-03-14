import type {
  App as DatabaseApp,
  AppInstallation as DatabaseAppInstallation,
} from '@prisma/client';

import {createSignedToken} from '~/global/tokens.ts';

import {
  addResolvedType,
  createResolver,
  createResolverWithGid,
  createQueryResolver,
  createMutationResolver,
  createUnionResolver,
} from '../shared/resolvers.ts';
import {toHandle} from '../shared/handle.ts';
import {fromGid, toGid} from '../shared/id.ts';

declare module '../types' {
  export interface GraphQLValues {
    App: DatabaseApp;
    AppInstallation: DatabaseAppInstallation;
  }
}

export const Query = createQueryResolver({
  app(_, {id}, {prisma}) {
    return prisma.app.findUnique({where: {id: fromGid(id).id}});
  },
  apps(_, __, {prisma}) {
    return prisma.app.findMany({take: 50});
  },
});

export const Mutation = createMutationResolver({
  async createApp(_, {name, handle}, {prisma, user}) {
    const normalizedHandle = handle ?? toHandle(name);
    const existingAppWithName = await prisma.app.findFirst({
      where: {handle: normalizedHandle, userId: user.id},
    });

    if (existingAppWithName) {
      throw new Error(
        `Existing app found with name ${JSON.stringify(name)} (id: ${
          existingAppWithName.id
        })`,
      );
    }

    const app = await prisma.app.create({
      data: {name, handle: normalizedHandle, userId: user.id},
    });

    return {app};
  },
  async updateApp(_, {id, name}, {prisma}) {
    const app = await prisma.app.update({
      where: {id: fromGid(id).id},
      data: name == null ? {} : {name},
    });

    return {app};
  },
  async deleteApp(_, {id}, {prisma}) {
    // await prisma.app.delete({where: {id: fromGid(id).id}});
    // @see https://github.com/prisma/prisma/issues/2057
    await prisma.$executeRaw`delete from "App" where id=${fromGid(id).id}`;
    return {deletedId: id};
  },
  async installApp(_, {id}, {user, prisma}) {
    const {app, ...installation} = await prisma.appInstallation.create({
      data: {appId: fromGid(id).id, userId: user.id},
      include: {app: true},
    });

    return {app, installation};
  },
  async createAppSecret(_, {id}, {env, prisma}) {
    // Ensure the app exists
    await prisma.app.findUniqueOrThrow({
      where: {id: fromGid(id).id},
    });

    const secret = await createSecret();

    const encryptedSecret = await encryptSecret(secret, {
      key: env.APP_SECRET_ENCRYPTION_KEY,
    });

    const app = await prisma.app.update({
      where: {id: fromGid(id).id},
      data: {secret: encryptedSecret},
    });

    return {app, secret};
  },
});

export const App = createResolverWithGid('App', {
  async extensions({id}, _, {prisma}) {
    const extensions = await prisma.clipsExtension.findMany({
      where: {appId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return extensions.map((extension) =>
      addResolvedType('ClipsExtension', extension),
    );
  },
  async isInstalled({id}, _, {prisma, user}) {
    const installation = await prisma.appInstallation.findFirst({
      where: {appId: id, userId: user.id},
    });

    return installation != null;
  },
  hasSecret({secret}) {
    return secret != null;
  },
  async userDetailsJWT({secret: encryptedSecret}, _, {user, env}) {
    if (encryptedSecret == null) {
      return null;
    }

    const [secret] = await Promise.all([
      decryptSecret(encryptedSecret, {
        key: env.APP_SECRET_ENCRYPTION_KEY,
      }),
    ]);

    const data = await createSignedToken(
      {user: {id: toGid(user.id, 'User')}},
      {
        secret,
        expiresIn: 5 * 60 * 1_000,
      },
    );

    return data;
  },
});

async function createSecret() {
  // Generate a 256-bit (32-byte) random value for the shared secret
  const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

  // Convert it to a base64 URL-safe string for easier storage and transfer
  return btoa(String.fromCharCode(...sharedSecret));
}

async function encryptSecret(
  secret: string,
  {key: encryptionKey}: {key: string},
) {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();
  const encodedText = encoder.encode(secret);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {name: 'AES-CBC', length: 256},
    false,
    ['encrypt'],
  );

  const encrypted = await crypto.subtle.encrypt(
    {name: 'AES-CBC', iv},
    key,
    encodedText,
  );

  // Concatenate salt, IV, and encrypted data into a single buffer
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Return Base64 encoded string
  return btoa(String.fromCharCode(...result));
}

async function decryptSecret(
  secret: string,
  {key: encryptionKey}: {key: string},
) {
  const encryptedArray = new Uint8Array(
    atob(secret)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );

  const salt = encryptedArray.slice(0, 16);
  const iv = encryptedArray.slice(16, 32);
  const encrypted = encryptedArray.slice(32);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {name: 'AES-CBC', length: 256},
    false,
    ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    {name: 'AES-CBC', iv},
    key,
    encrypted,
  );

  return new TextDecoder().decode(decrypted);
}

export const AppInstallation = createResolverWithGid('AppInstallation', {
  app: ({appId}, _, {prisma}) =>
    prisma.app.findUniqueOrThrow({where: {id: appId}}),
  async extensions({id}, _, {prisma}) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {appInstallationId: id},
      include: {
        extension: {
          include: {
            activeVersion: true,
          },
        },
      },
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return installations.map((installation) =>
      addResolvedType('ClipsExtensionInstallation', installation),
    );
  },
});

export const AppExtension = createUnionResolver();

export const AppExtensionInstallation = createUnionResolver();

export const User = createResolver('User', {
  app(_, {id, handle}, {prisma, user}) {
    if (!id && !handle) {
      throw new Error('You must supply either an id or a handle');
    }

    return prisma.app.findUnique({
      where: {
        id: id ? fromGid(id).id : undefined,
        handle_userId: handle ? {handle, userId: user.id} : undefined,
        userId: user.id,
      },
    });
  },
  apps(_, __, {prisma, user}) {
    return prisma.app.findMany({take: 50, where: {userId: user.id}});
  },
});
