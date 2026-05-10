export type {
  AiMessage,
  AiFunctionCall,
  AiFunctionResult,
  AiUsageMetadata,
  AiChatRequest,
  AiChatResponse,
  AiChatChunk,
  AiEmbedding,
  AiFileRef,
  AiFileUpload,
  AiImageRef,
  AiImageRequest,
  ToolDeclaration,
} from './types/ai.js';

export type { IAiProvider } from './types/provider.js';

export type {
  PromptTemplateVariable,
  PromptTemplate,
  PromptTemplateCollection,
} from './types/prompt-template.js';

export {
  AiException,
  AiRateLimitException,
  AiQuotaExceededException,
  AiTimeoutException,
  AiSafetyBlockedException,
  AiInvalidRequestException,
  AiServiceUnavailableException,
} from './exceptions/ai.exception.js';

export { BaseTool } from './tools/base-tool.js';
