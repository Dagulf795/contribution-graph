export const PAGE_KEYS = ["string", "time", "title", "uid"] as const;


export type RoamAPITimeResult = [number]; // Assuming each entry is a tuple with one number

export type TimestampResult = { timestamps: number[][] };

export type Page = {
  [key in typeof PAGE_KEYS[number]]: string;
};
