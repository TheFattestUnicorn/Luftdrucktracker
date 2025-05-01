/**
 * @hidden
 */
export const extractValue = (value: number, mask: number, offset: number) => (value & mask) >>> offset;

/**
 * @hidden
 */
export const lookUp = <T extends string>(table: { [K in T]: number }) => (
  key?: T,
  defaultValue: number = 0,
): number => {
  const found = table[key as T];

  return (Number.isInteger(found) && found) || defaultValue;
};

/**
 * @hidden
 */
export const reverseLookUp = <T extends string>(table: { [K in T]: number }) => {
  const entries = Object.entries(table) as Array<[T, number]>;

  return (registerValue: number): T => {
    const foundValue = entries.find(([, value]) => value === registerValue);

    return foundValue ? foundValue[0] : entries[0][0];
  };
};
