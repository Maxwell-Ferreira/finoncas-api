export const ExpenseType = {
  FIXED: 'FIXED',
  SINGLE: 'SINGLE',
} as const;

export type ExpenseType = keyof typeof ExpenseType;
