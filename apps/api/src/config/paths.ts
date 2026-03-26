import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const ensureStoragePath = (storageRoot: string, ...parts: string[]) => {
  const dir = resolve(storageRoot, ...parts);
  mkdirSync(dir, { recursive: true });
  return dir;
};
