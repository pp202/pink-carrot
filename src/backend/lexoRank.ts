const LEXO_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const LEXO_BASE = LEXO_ALPHABET.length;
const LEXO_RANK_LENGTH = 10;
export const LEXO_DB_FIELD_SIZE = 16;

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
  const lower = previousRank ? fromLexoString(previousRank) : -1;
  const upper = nextRank ? fromLexoString(nextRank) : (MAX_RANK_VALUE + 1);

  if (lower >= upper) {
    throw new Error('Invalid rank bounds. previousRank must be lower than nextRank.');
  }

  const midpoint = Math.floor((lower + upper) / 2);

  if (midpoint <= lower || midpoint >= upper || midpoint < 0 || midpoint > MAX_RANK_VALUE) {
    throw new Error('No lexo-rank space available between provided bounds. Rebalancing is required.');
  }

  return toLexoString(midpoint);
}
