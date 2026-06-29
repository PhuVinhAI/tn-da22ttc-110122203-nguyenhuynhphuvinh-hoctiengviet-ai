import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipResponseTransform';

/**
 * Marks a route as opting out of `TransformInterceptor` (which wraps every
 * response body in `{ data }`).
 *
 * Use for Server-Sent Events routes — the SSE wire format is incompatible
 * with the `{ data }` envelope. NestJS's `@Sse()` writes each yielded
 * `MessageEvent` directly to the wire; wrapping the event in `{ data }`
 * loses the `type` field and produces unnamed SSE events.
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
