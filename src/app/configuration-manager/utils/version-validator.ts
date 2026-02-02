/**
 * Validates version string format: V#.#.#
 * @param version Version string to validate
 * @returns true if valid, false otherwise
 */
export function isValidVersion(version: string): boolean {
  const versionRegex = /^V\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

/**
 * Parses a version string into its components
 * @param version Version string (e.g., "V1.2.3")
 * @returns Object with major, minor, patch numbers or null if invalid
 */
export function parseVersion(
  version: string,
): { major: number; minor: number; patch: number } | null {
  if (!isValidVersion(version)) {
    return null;
  }

  const parts = version.substring(1).split(".").map(Number);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
}
