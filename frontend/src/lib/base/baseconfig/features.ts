export const Features = {
  SIM_000: 'BNK-000',
} as const;

/** Geçerli özellik kodları. */
export type FeatureCode = (typeof Features)[keyof typeof Features];
