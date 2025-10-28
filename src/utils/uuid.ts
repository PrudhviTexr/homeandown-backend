// Mock implementations for missing dependencies
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const v4 = generateUniqueId;