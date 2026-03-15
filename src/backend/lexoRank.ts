const LEXO_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const LEXO_BASE = LEXO_ALPHABET.length;
const LEXO_RANK_LENGTH = 10;

function pow(base: number, exponent: number): number {
  let value = 1;

  for (let index = 0; index < exponent; index += 1) {
    value *= base;
  }

  return value;
}

const MAX_RANK_VALUE = pow(LEXO_BASE, LEXO_RANK_LENGTH) - 1;
const INITIAL_RANK_VALUE = pow(LEXO_BASE, LEXO_RANK_LENGTH - 1);

export function allocateLexoRanks(count: number): string[] {
  if (count <= 0) {
    return [];
  }

  const step = Math.floor(MAX_RANK_VALUE / (count + 1));

  if (step <= 0) {
    throw new Error('No lexo-rank space available for allocation.');
  }

  return Array.from({ length: count }, (_, index) => toLexoString(step * (index + 1)));
}

function fromLexoString(value: string): number {
  return value.toLowerCase().split('').reduce((accumulator, character) => {
    const digit = LEXO_ALPHABET.indexOf(character);

    if (digit === -1) {
      throw new Error(`Invalid lexo-rank character: ${character}`);
    }

    return (accumulator * LEXO_BASE) + digit;
  }, 0);
}

function toLexoString(value: number): string {
  return value.toString(36).padStart(LEXO_RANK_LENGTH, '0');
}

function charIndexAt(value: string, position: number): number {
  if (position >= value.length) {
    return -1;
  }

  const digit = LEXO_ALPHABET.indexOf(value[position]!.toLowerCase());
  if (digit === -1) {
    throw new Error(`Invalid lexo-rank character: ${value[position]}`);
  }

  return digit;
}

export function nextLexoRank(previousRank: string | null | undefined): string {
  if (!previousRank) {
    return toLexoString(INITIAL_RANK_VALUE);
  }

  const current = fromLexoString(previousRank);
  const next = current + 1;

  if (next > MAX_RANK_VALUE) {
    throw new Error('No lexo-rank space available. Rebalancing is required.');
  }

  return toLexoString(next);
}

export function lexoRankBetween(
  previousRank: string | null | undefined,
  nextRank: string | null | undefined,
): string {
  const lower = previousRank?.toLowerCase() ?? '';
  const upper = nextRank?.toLowerCase() ?? null;

  if (upper && lower >= upper) {
    throw new Error('Invalid rank bounds. previousRank must be lower than nextRank.');
  }

  let result = '';
  let position = 0;

  while (result.length < LEXO_DB_FIELD_SIZE) {
    const lowerDigit = charIndexAt(lower, position);
    const upperDigit = upper ? (position < upper.length ? charIndexAt(upper, position) : LEXO_BASE) : LEXO_BASE;

    if ((lowerDigit + 1) < upperDigit) {
      const midpoint = Math.floor((lowerDigit + upperDigit) / 2);
      return `${result}${LEXO_ALPHABET[midpoint]}`;
    }

    if (position < lower.length) {
      result += lower[position];
    } else {
      result += LEXO_ALPHABET[0];
    }

    position += 1;
  }

  throw new Error('No lexo-rank space available between provided bounds. Rebalancing is required.');
}

export const LEXO_DB_FIELD_SIZE = 16;
