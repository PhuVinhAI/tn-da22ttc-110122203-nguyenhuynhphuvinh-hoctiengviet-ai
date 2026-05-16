import { MessageEvent } from '@nestjs/common';
import { StreamEvent } from '../../agent/application/stream-event';

/**
 * Encodes typed agent stream events into NestJS `MessageEvent`s that NestJS's
 * `@Sse()` runtime serializes to the SSE wire format:
 *   - `MessageEvent.type` → SSE `event:` line
 *   - `MessageEvent.data` → SSE `data:` line (must be a single line)
 *
 * `JSON.stringify` produces a single-line string with all newlines escaped
 * as `\n` (or `\r\n`), which is exactly what the SSE spec wants on the
 * `data:` line. The encoder relies on that — there is no separate "escape
 * multi-line text" pass — and `sse-event-encoder.spec.ts` locks the
 * single-line invariant in.
 */
export class SseEventEncoder {
  encode(event: StreamEvent): MessageEvent {
    switch (event.type) {
      case 'conversation_started':
        return {
          type: 'conversation_started',
          data: JSON.stringify({ conversationId: event.conversationId }),
        };
      case 'tool_start':
        return {
          type: 'tool_start',
          data: JSON.stringify({
            name: event.name,
            displayName: event.displayName,
            args: event.args,
          }),
        };
      case 'tool_result':
        return {
          type: 'tool_result',
          data: JSON.stringify({ name: event.name, ok: event.ok }),
        };
      case 'text_chunk':
        return {
          type: 'text_chunk',
          data: JSON.stringify({ text: event.text }),
        };
      case 'propose':
        return {
          type: 'propose',
          data: JSON.stringify({
            kind: event.kind,
            title: event.title,
            description: event.description,
            endpoint: event.endpoint,
            payload: event.payload,
          }),
        };
      case 'error':
        return {
          type: 'error',
          data: JSON.stringify({ code: event.code, message: event.message }),
        };
      case 'done':
        return {
          type: 'done',
          data: JSON.stringify({
            messageId: event.messageId,
            interrupted: event.interrupted,
          }),
        };
    }
  }
}
