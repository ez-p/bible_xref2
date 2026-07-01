import { randomUUID } from "crypto";
import type { StudyData } from "@/lib/types";

const TTL_MS = 3 * 60 * 1000;
const MAX_SESSIONS = 500;

const sessions = new Map<string, StudyData>();

export function createSession(data: StudyData): string {
  if (sessions.size >= MAX_SESSIONS) {
    const oldestKey = sessions.keys().next().value;
    if (oldestKey !== undefined) sessions.delete(oldestKey);
  }

  const token = randomUUID();
  sessions.set(token, data);
  setTimeout(() => sessions.delete(token), TTL_MS).unref();
  return token;
}

export function getSession(token: string): StudyData | undefined {
  return sessions.get(token);
}
