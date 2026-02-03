import { parseVersion } from "./version-validator";

/**
 * Compares two semantic version strings for sorting
 * @param versionA First version string (e.g., "V1.2.3")
 * @param versionB Second version string (e.g., "V2.0.1")
 * @returns Negative if A < B, 0 if equal, positive if A > B
 */
export function compareSemanticVersions(
  versionA: string,
  versionB: string,
): number {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);

  if (!parsedA || !parsedB) {
    // Invalid versions sort alphabetically
    return versionA.localeCompare(versionB);
  }

  // Compare major version
  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }

  // Compare minor version
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor - parsedB.minor;
  }

  // Compare patch version
  return parsedA.patch - parsedB.patch;
}
