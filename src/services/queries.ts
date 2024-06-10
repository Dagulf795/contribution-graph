import { RoamAPITimeResult, TimestampResult } from "../types/index";

const createTimes = (): TimestampResult => {
  // Cast the result to the expected type
  const data = window.roamAlphaAPI.data.fast.q(
    `[:find ?t :where [?e :create/time ?t]]`
  ) as unknown as RoamAPITimeResult[];

  return { timestamps: data };
};

export { createTimes };
