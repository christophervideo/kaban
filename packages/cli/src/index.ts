#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "node:module";
import { addCommand } from "./commands/add.js";
import { doneCommand } from "./commands/done.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { mcpCommand } from "./commands/mcp.js";
import { moveCommand } from "./commands/move.js";
import { schemaCommand } from "./commands/schema.js";
import { statusCommand } from "./commands/status.js";
import { tuiCommand } from "./commands/tui.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program.name("kaban").description("Terminal Kanban for AI Code Agents").version(pkg.version);

program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);
program.addCommand(moveCommand);
program.addCommand(doneCommand);
program.addCommand(statusCommand);
program.addCommand(schemaCommand);
program.addCommand(mcpCommand);
program.addCommand(tuiCommand);

program.parse();
