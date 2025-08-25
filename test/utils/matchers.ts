import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
declare module "bun:test" {
  // augment basic Matchers
  interface Matchers<T> extends TestingLibraryMatchers<T, T> {}
}
