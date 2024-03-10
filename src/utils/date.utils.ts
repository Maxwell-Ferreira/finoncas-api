export const convert = (str: string, type: 'min' | 'max' = null) => {
  const [year, month, day] = str
    .split('T')[0]
    .split('-')
    .map((i) => +i);

  const date = new Date(year, month - 1, day);

  if (!type) {
    return new Date(year, month - 1, day);
  }

  if (type === 'min') {
    return new Date(date.setHours(0, 0, 0));
  }

  if (type === 'max') {
    return new Date(date.setHours(23, 59, 59));
  }
};
