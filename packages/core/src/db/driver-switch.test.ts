import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { createDb } from "./index.js";

const TEST_DIR = ".kaban-driver-test";
const TEST_DB = `${TEST_DIR}/test.db`;

describe("Driver Switching", () => {
  const originalEnv = process.env.KABAN_DB_DRIVER;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    process.env.KABAN_DB_DRIVER = undefined;
  });

  afterEach(async () => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    process.env.KABAN_DB_DRIVER = originalEnv;
  });

  test("uses bun:sqlite by default in Bun environment", async () => {
    const db = await createDb(TEST_DB);
    const client = db.$client;
    
    if (!("prepare" in client)) {
      throw new Error("Expected bun:sqlite client");
    }
    
    expect(typeof client.prepare).toBe("function");
    
    await db.$close();
  });

  test("uses libsql when KABAN_DB_DRIVER=libsql", async () => {
    process.env.KABAN_DB_DRIVER = "libsql";
    const db = await createDb(TEST_DB);
    const client = db.$client;

    if (!("execute" in client)) {
      throw new Error("Expected libsql client");
    }

    expect(typeof client.execute).toBe("function");
    expect(typeof client.executeMultiple).toBe("function");
    
    await db.$close();
  });

  test("uses bun:sqlite when KABAN_DB_DRIVER=bun-sqlite", async () => {
    process.env.KABAN_DB_DRIVER = "bun-sqlite";
    const db = await createDb(TEST_DB);
    const client = db.$client;

    if (!("prepare" in client)) {
      throw new Error("Expected bun:sqlite client");
    }

    expect(typeof client.prepare).toBe("function");
    
    await db.$close();
  });
});
