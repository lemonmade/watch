import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {git: {sha: 'imaginarysha'}},
  process.env.JWT_E2E_TEST_HEADER_SECRET!,
  {
    expiresIn: '10 minutes',
  },
);

console.log(token);
