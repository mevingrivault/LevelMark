import fs from "node:fs/promises";
import path from "node:path";

export async function uniqueOutputPath(candidatePath: string, sourcePath: string, overwriteExisting: boolean): Promise<string> {
  if (overwriteExisting && path.resolve(candidatePath) !== path.resolve(sourcePath)) {
    return candidatePath;
  }

  const parsed = path.parse(candidatePath);
  let nextPath = candidatePath;
  let counter = 1;

  while (path.resolve(nextPath) === path.resolve(sourcePath) || (await exists(nextPath))) {
    nextPath = path.join(parsed.dir, `${parsed.name} (${counter})${parsed.ext}`);
    counter += 1;
  }

  return nextPath;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
