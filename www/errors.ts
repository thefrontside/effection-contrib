/**
 * Thrown when attempting to import a private package
 */
export class PrivatePackageError extends Error {
  constructor(packageName: string) {
    super(`Could not import ${packageName} because it's private`);
  }
}
