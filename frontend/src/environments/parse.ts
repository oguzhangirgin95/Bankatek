export function parse(raw: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator > 0) {
      values[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
    }
  }

  return values;
}

export function list(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
