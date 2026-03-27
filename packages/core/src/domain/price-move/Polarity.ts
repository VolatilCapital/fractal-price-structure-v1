export const Polarity = { Up: "up", Down: "down" } as const;
export type Polarity = (typeof Polarity)[keyof typeof Polarity];
