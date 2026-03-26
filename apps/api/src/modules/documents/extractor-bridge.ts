import { spawn } from "node:child_process";
import type { NoticeExtractionResult } from "@ring/types";

export const extractNotice = async (
  scriptPath: string,
  filePath: string,
  extension: "hwp" | "hwpx",
): Promise<NoticeExtractionResult> =>
  await new Promise((resolve, reject) => {
    const child = spawn("python", [scriptPath, "--input", filePath, "--type", extension], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `extractor exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as NoticeExtractionResult);
      } catch (error) {
        reject(error);
      }
    });
  });
