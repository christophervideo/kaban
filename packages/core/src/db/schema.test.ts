import { describe, expect, test } from "bun:test";
import { tasks } from "./schema.js";

describe("tasks schema", () => {
  test("has archived column defined", () => {
    expect(tasks.archived).toBeDefined();
    expect(tasks.archivedAt).toBeDefined();
  });
});
