export interface AiMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  functionCall?: AiFunctionCall;
  functionResult?: AiFunctionResult;
}

export interface AiFunctionCall {
  id?: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AiFunctionResult {
  callId?: string;
  name: string;
  result: any;
}

export interface AiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface AiChatRequest {
  messages: AiMessage[];
  systemInstruction?: string;
  tools?: ToolDeclaration[];
  model?: string;
  functionResults?: AiFunctionResult[];
}

export interface AiChatResponse {
  text: string;
  functionCalls?: AiFunctionCall[];
  usageMetadata: AiUsageMetadata;
}

export interface AiChatChunk {
  text: string;
  functionCalls?: AiFunctionCall[];
  usageMetadata?: AiUsageMetadata;
}

export interface AiEmbedding {
  values: number[];
  index?: number;
}

export interface AiFileRef {
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes?: number;
}

export interface AiFileUpload {
  data: Buffer | Uint8Array;
  mimeType: string;
  displayName?: string;
}

export interface AiImageRef {
  data: Buffer | Uint8Array;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface AiImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numberOfImages?: number;
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}
