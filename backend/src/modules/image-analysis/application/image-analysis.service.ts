import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';
import {
  GenaiService,
  Type,
} from '../../../infrastructure/genai/genai.service';
import {
  AnalyzeImageDto,
  SUPPORTED_IMAGE_MIME_TYPES,
} from '../dto/analyze-image.dto';

export interface ImageAnalysisLearner {
  nativeLanguage?: string | null;
  currentLevel?: string | null;
  preferredDialect?: string | null;
}

const ImageAnalysisVocabularySchema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  phonetic: z.string().nullable().optional(),
  partOfSpeech: z.string().nullable().optional(),
  exampleSentence: z.string().nullable().optional(),
  exampleTranslation: z.string().nullable().optional(),
  classifier: z.string().nullable().optional(),
});

const ImageAnalysisResponseSchema = z.object({
  text: z.string().min(1),
  vocabularies: z.array(ImageAnalysisVocabularySchema),
});

export type ImageAnalysisResponse = z.infer<typeof ImageAnalysisResponseSchema>;

const IMAGE_ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description:
        "Markdown answer in the learner's native language, with Vietnamese only for target words, quotes, and examples.",
      nullable: false,
    },
    vocabularies: {
      type: Type.ARRAY,
      description:
        'Vietnamese vocabulary extracted from the image when pedagogically relevant.',
      items: {
        type: Type.OBJECT,
        properties: {
          word: {
            type: Type.STRING,
            description: 'Vietnamese word or phrase with correct diacritics.',
            nullable: false,
          },
          translation: {
            type: Type.STRING,
            description: "Translation in the learner's native language.",
            nullable: false,
          },
          phonetic: {
            type: Type.STRING,
            description: 'Optional pronunciation guide.',
            nullable: true,
          },
          partOfSpeech: {
            type: Type.STRING,
            description: 'Flexible part of speech label.',
            nullable: true,
          },
          exampleSentence: {
            type: Type.STRING,
            description: 'Optional Vietnamese example sentence.',
            nullable: true,
          },
          exampleTranslation: {
            type: Type.STRING,
            description:
              "Optional translation of the example in the learner's native language.",
            nullable: true,
          },
          classifier: {
            type: Type.STRING,
            description: 'Optional Vietnamese classifier for nouns.',
            nullable: true,
          },
        },
        required: ['word', 'translation'],
      },
    },
  },
  required: ['text', 'vocabularies'],
};

@Injectable()
export class ImageAnalysisService {
  private readonly logger = new Logger(ImageAnalysisService.name);

  constructor(private readonly genaiService: GenaiService) {}

  async analyze(
    dto: AnalyzeImageDto,
    learner: ImageAnalysisLearner,
  ): Promise<ImageAnalysisResponse> {
    const prompt = dto.prompt?.trim();
    if (!prompt) {
      throw new BadRequestException('Prompt must not be empty');
    }

    if (!Array.isArray(dto.images) || dto.images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }
    if (dto.images.length > 5) {
      throw new BadRequestException(
        'A maximum of 5 images can be analyzed at once',
      );
    }

    const images = dto.images.map((image, index) => {
      const base64 = image.base64?.trim();
      if (!base64) {
        throw new BadRequestException(
          `Image ${index + 1} base64 data must not be empty`,
        );
      }
      if (!SUPPORTED_IMAGE_MIME_TYPES.includes(image.mimeType)) {
        throw new BadRequestException(
          `Image ${index + 1} has an unsupported mimeType`,
        );
      }
      return { ...image, base64 };
    });

    const chatHistory = (dto.chatHistory ?? []).map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

    const systemInstruction = this.genaiService.renderPrompt(
      'image-discovery',
      {
        user: {
          nativeLanguage: learner.nativeLanguage || 'English',
          currentLevel: learner.currentLevel || 'A1',
          preferredDialect: learner.preferredDialect || 'STANDARD',
        },
      },
    );

    const response = await this.callAi(
      prompt,
      images,
      chatHistory,
      systemInstruction,
    );
    return this.parseResponse(response.text);
  }

  private async callAi(
    prompt: string,
    images: AnalyzeImageDto['images'],
    chatHistory: NonNullable<AnalyzeImageDto['chatHistory']>,
    systemInstruction: string,
  ) {
    try {
      return await this.genaiService.chatStructured({
        messages: [
          ...chatHistory,
          {
            role: 'user',
            content: prompt,
            attachments: images.map((image) => ({
              type: 'image' as const,
              mimeType: image.mimeType,
              data: image.base64.trim(),
            })),
          },
        ],
        systemInstruction,
        responseSchema: IMAGE_ANALYSIS_RESPONSE_SCHEMA,
      });
    } catch (error) {
      this.logger.error(
        `Image analysis AI call failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new ServiceUnavailableException(
        'Image analysis failed. Please try again.',
      );
    }
  }

  parseResponse(rawText: string): ImageAnalysisResponse {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      this.logger.error('Failed to parse image analysis response as JSON');
      this.logger.debug(
        `Response text (first 500 chars): ${rawText.slice(0, 500)}`,
      );
      throw new BadRequestException(
        'AI response is not valid JSON. Please try again.',
      );
    }

    const result = ImageAnalysisResponseSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.error('Image analysis response schema validation failed');
      this.logger.debug(
        `Validation errors: ${JSON.stringify(result.error.errors)}`,
      );
      throw new BadRequestException(
        'AI response does not match expected schema. Please try again.',
      );
    }

    return result.data;
  }
}
