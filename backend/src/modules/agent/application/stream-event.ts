/**
 * Typed stream events emitted by `AgentService.runTurnStream`.
 *
 * The agent yields these at every interesting boundary of a turn; the AI
 * controller's SSE encoder converts them to wire-format SSE messages the
 * mobile client consumes.
 *
 * Keep the shape in sync with the PRD streaming protocol (see `PRD.md`,
 * "Streaming protocol — single SSE endpoint with typed events").
 */
export type StreamEvent =
  | ConversationStartedEvent
  | ToolStartEvent
  | ToolResultEvent
  | TextChunkEvent
  | ProposeEvent
  | ErrorEvent
  | DoneEvent;

/**
 * Emitted exactly once per turn, as the very first event after the
 * agent has resolved (or lazy-created) the target conversation. Mobile
 * clients persist this so subsequent "Soạn tiếp" follow-ups can reuse
 * the same `conversationId`, and so a "Reset" can drop it to spin up
 * a fresh conversation with the current `screenContext`.
 */
export interface ConversationStartedEvent {
  type: 'conversation_started';
  conversationId: string;
}

export interface ToolStartEvent {
  type: 'tool_start';
  name: string;
  displayName: string;
  args: Record<string, any>;
}

export interface ToolResultEvent {
  type: 'tool_result';
  name: string;
  ok: boolean;
}

export interface TextChunkEvent {
  type: 'text_chunk';
  text: string;
}

// `propose` is reserved for the propose-tools slice (#07). It is exported here
// so the encoder + protocol contract is locked in by the streaming tracer.
export interface ProposeEvent {
  type: 'propose';
  kind: string;
  title: string;
  description: string;
  endpoint: string;
  payload: Record<string, any>;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export interface DoneEvent {
  type: 'done';
  messageId: string;
  interrupted: boolean;
}
