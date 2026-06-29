export type {
  AiMessage,
  AiFunctionCall,
  AiFunctionResult,
  AiUsageMetadata,
  AiChatRequest,
  AiChatResponse,
  AiChatChunk,
  AiAttachment,
  AiStructuredMessage,
  AiChatStructuredRequest,
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
export type { ToolContext } from './tools/tool-context.js';
export { ProposeTool } from './tools/propose-tool.js';
export {
  DEFAULT_PROPOSAL_LABELS,
  isProposalPayload,
} from './tools/proposal-payload.js';
export type {
  ProposalPayload,
  ProposalPayloadLabels,
} from './tools/proposal-payload.js';
