/**
 * Safe array utilities to prevent C.map errors in production
 */

export const safeMap = <T, U>(
  array: T[] | null | undefined,
  callback: (item: T, index: number) => U
): U[] => {
  if (!Array.isArray(array)) {
    console.warn('safeMap: Expected array but got:', typeof array, array);
    return [];
  }
  return array.map(callback);
};

export const safeFilter = <T>(
  array: T[] | null | undefined,
  callback: (item: T, index: number) => boolean
): T[] => {
  if (!Array.isArray(array)) {
    console.warn('safeFilter: Expected array but got:', typeof array, array);
    return [];
  }
  return array.filter(callback);
};

export const safeFind = <T>(
  array: T[] | null | undefined,
  callback: (item: T, index: number) => boolean
): T | undefined => {
  if (!Array.isArray(array)) {
    console.warn('safeFind: Expected array but got:', typeof array, array);
    return undefined;
  }
  return array.find(callback);
};

export const safeReduce = <T, U>(
  array: T[] | null | undefined,
  callback: (accumulator: U, currentValue: T, index: number) => U,
  initialValue: U
): U => {
  if (!Array.isArray(array)) {
    console.warn('safeReduce: Expected array but got:', typeof array, array);
    return initialValue;
  }
  return array.reduce(callback, initialValue);
};

export const safeLength = (array: any[] | null | undefined): number => {
  if (!Array.isArray(array)) {
    return 0;
  }
  return array.length;
};

export const safeSlice = <T>(
  array: T[] | null | undefined,
  start?: number,
  end?: number
): T[] => {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.slice(start, end);
};

export const safeConcat = <T>(
  array1: T[] | null | undefined,
  array2: T[] | null | undefined
): T[] => {
  const safe1 = Array.isArray(array1) ? array1 : [];
  const safe2 = Array.isArray(array2) ? array2 : [];
  return safe1.concat(safe2);
};

export const safeSort = <T>(
  array: T[] | null | undefined,
  compareFn?: (a: T, b: T) => number
): T[] => {
  if (!Array.isArray(array)) {
    return [];
  }
  return [...array].sort(compareFn);
};

export const safeIncludes = <T>(
  array: T[] | null | undefined,
  searchElement: T,
  fromIndex?: number
): boolean => {
  if (!Array.isArray(array)) {
    return false;
  }
  return array.includes(searchElement, fromIndex);
};

export const safeIndexOf = <T>(
  array: T[] | null | undefined,
  searchElement: T,
  fromIndex?: number
): number => {
  if (!Array.isArray(array)) {
    return -1;
  }
  return array.indexOf(searchElement, fromIndex);
};
