import jwt from '@tsndr/cloudflare-worker-jwt';

const token = await jwt.sign(
  {git: {sha: 'imaginarysha'}, exp: Date.now() + 10 * 60 * 1_000},
  process.env.JWT_E2E_TEST_HEADER_SECRET!,
);

console.log(token);
