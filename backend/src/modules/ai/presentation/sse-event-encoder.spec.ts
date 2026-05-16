import { SseEventEncoder } from './sse-event-encoder';
import { StreamEvent } from '../../agent/application/stream-event';

describe('SseEventEncoder', () => {
  let encoder: SseEventEncoder;

  beforeEach(() => {
    encoder = new SseEventEncoder();
  });

  it('encodes conversation_started with conversationId', () => {
    const out = encoder.encode({
      type: 'conversation_started',
      conversationId: 'conv-abc',
    });

    expect(out.type).toBe('conversation_started');
    expect(typeof out.data).toBe('string');
    expect(JSON.parse(out.data as string)).toEqual({
      conversationId: 'conv-abc',
    });
  });

  it('encodes tool_start with name, displayName, args', () => {
    const event: StreamEvent = {
      type: 'tool_start',
      name: 'search_vocabulary',
      displayName: 'Đang tra cứu từ vựng...',
      args: { query: 'xin chào', dialect: 'NORTHERN' },
    };

    const out = encoder.encode(event);

    expect(out.type).toBe('tool_start');
    expect(typeof out.data).toBe('string');
    expect(JSON.parse(out.data as string)).toEqual({
      name: 'search_vocabulary',
      displayName: 'Đang tra cứu từ vựng...',
      args: { query: 'xin chào', dialect: 'NORTHERN' },
    });
  });

  it('encodes tool_result with name and ok flag', () => {
    const out = encoder.encode({
      type: 'tool_result',
      name: 'search_vocabulary',
      ok: true,
    });

    expect(out.type).toBe('tool_result');
    expect(JSON.parse(out.data as string)).toEqual({
      name: 'search_vocabulary',
      ok: true,
    });
  });

  it('encodes tool_result with ok=false when the tool failed', () => {
    const out = encoder.encode({
      type: 'tool_result',
      name: 'search_vocabulary',
      ok: false,
    });

    expect(JSON.parse(out.data as string)).toEqual({
      name: 'search_vocabulary',
      ok: false,
    });
  });

  it('encodes text_chunk with text', () => {
    const out = encoder.encode({
      type: 'text_chunk',
      text: 'Bạn có thể ',
    });

    expect(out.type).toBe('text_chunk');
    expect(JSON.parse(out.data as string)).toEqual({ text: 'Bạn có thể ' });
  });

  it('encodes propose with kind, title, description, endpoint, payload', () => {
    const out = encoder.encode({
      type: 'propose',
      kind: 'create_daily_goal',
      title: 'Tạo mục tiêu hằng ngày?',
      description: 'Học 30 phút mỗi ngày',
      endpoint: 'POST /daily-goals',
      payload: { goalType: 'STUDY_MINUTES', targetValue: 30 },
    });

    expect(out.type).toBe('propose');
    expect(JSON.parse(out.data as string)).toEqual({
      kind: 'create_daily_goal',
      title: 'Tạo mục tiêu hằng ngày?',
      description: 'Học 30 phút mỗi ngày',
      endpoint: 'POST /daily-goals',
      payload: { goalType: 'STUDY_MINUTES', targetValue: 30 },
    });
  });

  it('encodes error with code and message', () => {
    const out = encoder.encode({
      type: 'error',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Rate limit hit',
    });

    expect(out.type).toBe('error');
    expect(JSON.parse(out.data as string)).toEqual({
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Rate limit hit',
    });
  });

  it('encodes done with messageId and interrupted flag', () => {
    const out = encoder.encode({
      type: 'done',
      messageId: 'msg-abc',
      interrupted: false,
    });

    expect(out.type).toBe('done');
    expect(JSON.parse(out.data as string)).toEqual({
      messageId: 'msg-abc',
      interrupted: false,
    });
  });

  it('encodes done with interrupted=true when the turn was aborted', () => {
    const out = encoder.encode({
      type: 'done',
      messageId: 'msg-abc',
      interrupted: true,
    });

    expect(JSON.parse(out.data as string).interrupted).toBe(true);
  });

  describe('multi-line data escaping', () => {
    // SSE wire format treats a literal '\n' inside the `data:` line as a
    // record terminator, so any newline that appears inside an event payload
    // MUST be JSON-escaped. `JSON.stringify` already does this, but we lock
    // it in here so a refactor (e.g. switching to a hand-rolled serializer)
    // doesn't regress.
    it('serializes text_chunk text containing a single \\n as escaped JSON', () => {
      const out = encoder.encode({
        type: 'text_chunk',
        text: 'line one\nline two',
      });

      expect(out.data as string).not.toMatch(/[\r\n]/);
      expect(out.data as string).toContain('line one\\nline two');
      expect(JSON.parse(out.data as string)).toEqual({
        text: 'line one\nline two',
      });
    });

    it('serializes text_chunk text containing multiple newlines and CR safely', () => {
      const out = encoder.encode({
        type: 'text_chunk',
        text: 'a\nb\nc\r\nd',
      });

      expect(out.data as string).not.toMatch(/[\r\n]/);
      expect(JSON.parse(out.data as string).text).toBe('a\nb\nc\r\nd');
    });

    it('serializes propose payload containing newlines as escaped JSON', () => {
      const out = encoder.encode({
        type: 'propose',
        kind: 'create_daily_goal',
        title: 'A\nB',
        description: 'multi\nline\ndescription',
        endpoint: 'POST /daily-goals',
        payload: { note: 'has\nnewline' },
      });

      expect(out.data as string).not.toMatch(/[\r\n]/);
      const parsed = JSON.parse(out.data as string);
      expect(parsed.title).toBe('A\nB');
      expect(parsed.description).toBe('multi\nline\ndescription');
      expect(parsed.payload.note).toBe('has\nnewline');
    });

    it('emits a single-line data: payload regardless of text content', () => {
      const out = encoder.encode({
        type: 'text_chunk',
        text: 'paragraph 1\n\nparagraph 2\nparagraph 3',
      });

      expect((out.data as string).split('\n')).toHaveLength(1);
      expect((out.data as string).split('\r')).toHaveLength(1);
    });
  });
});
