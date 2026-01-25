import { describe, expect, test } from "bun:test";
import { AddTaskInputSchema } from "./schemas";

describe("AddTaskInputSchema", () => {
  test("accepts createdBy parameter", () => {
    const result = AddTaskInputSchema.safeParse({
      title: "Test",
      createdBy: "claude",
    });
    expect(result.success).toBe(true);
  });

  test("prefers createdBy over agent", () => {
    const result = AddTaskInputSchema.parse({
      title: "Test",
      createdBy: "claude",
      agent: "gemini",
    });
    // After transform, should use createdBy
    expect(result.createdBy ?? result.agent).toBe("claude");
  });

  test("falls back to agent when createdBy not provided", () => {
    const result = AddTaskInputSchema.parse({
      title: "Test",
      agent: "gemini",
    });
    expect(result.agent).toBe("gemini");
  });

  test("accepts assignedTo parameter", () => {
    const result = AddTaskInputSchema.safeParse({
      title: "Test",
      createdBy: "claude",
      assignedTo: "human",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignedTo).toBe("human");
    }
  });
});
