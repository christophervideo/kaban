export interface Task {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  position: number;
  createdBy: string;
  assignedTo: string | null;
  parentId: string | null;
  dependsOn: string[];
  files: string[];
  labels: string[];
  blockedReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface Column {
  id: string;
  name: string;
  position: number;
  wipLimit: number | null;
  isTerminal: boolean;
}

export interface Board {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Config {
  board: {
    name: string;
  };
  columns: Array<{
    id: string;
    name: string;
    wipLimit?: number;
    isTerminal?: boolean;
  }>;
  defaults: {
    column: string;
    agent: string;
  };
}

export const DEFAULT_CONFIG: Config = {
  board: {
    name: "Kaban Board",
  },
  columns: [
    { id: "backlog", name: "Backlog" },
    { id: "todo", name: "Todo" },
    { id: "in_progress", name: "In Progress", wipLimit: 3 },
    { id: "review", name: "Review" },
    { id: "done", name: "Done", isTerminal: true },
  ],
  defaults: {
    column: "todo",
    agent: "user",
  },
};

export class KabanError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
    this.name = "KabanError";
  }
}

export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NOT_FOUND: 2,
  CONFLICT: 3,
  VALIDATION: 4,
} as const;
