import fs from "fs/promises";

export async function safeUnlink(filePath: string) {
  try {
    if (!filePath) return;
    await fs.unlink(filePath);
  } catch {
    // ignore (file already removed / path invalid)
  }
}
