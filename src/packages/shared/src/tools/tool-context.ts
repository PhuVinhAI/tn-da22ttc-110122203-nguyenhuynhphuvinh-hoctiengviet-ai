/**
 * Per-turn execution context passed to every tool invocation by the agent loop.
 *
 * Scopes a tool execution to a specific conversation owner so the LLM can never
 * (accidentally or maliciously) read or mutate data belonging to another user.
 *
 * - `userId`              — Conversation owner; tools use this for any user-scoped query.
 * - `conversationId`      — Active conversation; tools may persist follow-up artifacts.
 * - `screenContext`       — Frozen mobile snapshot taken at conversation creation time.
 * - `user`                — Hydrated user entity (shape kept generic to avoid a backend dep).
 */
export interface ToolContext<TUser = unknown> {
  userId: string;
  conversationId: string;
  screenContext: Record<string, unknown>;
  user: TUser;
}
