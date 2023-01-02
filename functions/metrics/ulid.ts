// Copied from https://github.com/ulid/javascript,
// adjusted to not break in workers.

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

export function ulid(seedTime = Date.now()) {
  return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN);
}

function randomChar() {
  let rand = Math.floor(getRandomValue() * ENCODING_LEN);

  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }

  return ENCODING.charAt(rand);
}

function encodeTime(now: number, length: number) {
  let mod;
  let str = '';

  for (let current = 0; current < length - 1; current += 1) {
    mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }

  return str;
}

function encodeRandom(length: number) {
  let str = '';

  for (let current = 0; current < length - 1; current += 1) {
    str = randomChar() + str;
  }

  return str;
}

function getRandomValue() {
  const buffer = new Uint8Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0]! / 0xff;
}
