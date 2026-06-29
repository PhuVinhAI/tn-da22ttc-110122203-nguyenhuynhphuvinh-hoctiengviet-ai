import type {
  AiChatRequest,
  AiChatResponse,
  AiChatChunk,
  AiChatStructuredRequest,
  AiEmbedding,
  AiFileRef,
  AiFileUpload,
  AiImageRef,
  AiImageRequest,
} from './ai.js';

export interface IAiProvider {
  chat(req: AiChatRequest): Promise<AiChatResponse>;
  chatStream(req: AiChatRequest): AsyncIterable<AiChatChunk>;
  chatStructured<T = any>(req: AiChatStructuredRequest): Promise<T>;
  embed(texts: string[]): Promise<AiEmbedding[]>;
  uploadFile(file: AiFileUpload): Promise<AiFileRef>;
  generateImage(prompt: AiImageRequest): Promise<AiImageRef>;
}
