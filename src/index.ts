import { Toolkit } from "./Toolkit";

export * from "./types";

export const createToolkit = () => {
  return new Toolkit();
};
