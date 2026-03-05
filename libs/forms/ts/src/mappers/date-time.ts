const ensureValidDate = (value: Date, fieldName: string): Date => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Invalid Date for "${fieldName}".`);
  }
  return value;
};

export const toIsoDateTime = (value: Date, fieldName: string): string =>
  ensureValidDate(value, fieldName).toISOString();

export const fromIsoDateTime = (value: string, fieldName: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date-time for "${fieldName}": ${value}`);
  }
  return date;
};
