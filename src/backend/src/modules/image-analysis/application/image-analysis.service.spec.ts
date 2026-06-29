import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ImageAnalysisService } from './image-analysis.service';
import { AiProviderRouter } from '../../../infrastructure/ai/ai-provider-router';

describe('ImageAnalysisService', () => {
  let service: ImageAnalysisService;
  let mockProvider: { chatStructured: jest.Mock };
  let aiRouter: jest.Mocked<
    Pick<AiProviderRouter, 'forFeature' | 'renderPrompt'>
  >;

  const user = {
    id: 'user-1',
    nativeLanguage: 'English',
    currentLevel: 'A1',
    preferredDialect: 'STANDARD',
  };

  const request = {
    images: [
      { base64: 'base64-image-data', mimeType: 'image/png' },
      { base64: 'second-base64-image-data', mimeType: 'image/jpeg' },
    ],
    prompt: 'What does this sign say?',
    chatHistory: [
      { role: 'user' as const, content: 'What is the red sign?' },
      { role: 'assistant' as const, content: 'It is a traffic sign.' },
    ],
  };

  beforeEach(async () => {
    mockProvider = { chatStructured: jest.fn() };
    const routerMock = {
      renderPrompt: jest.fn().mockReturnValue('rendered image prompt'),
      forFeature: jest.fn().mockReturnValue(mockProvider),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageAnalysisService,
        { provide: AiProviderRouter, useValue: routerMock },
      ],
    }).compile();

    service = module.get(ImageAnalysisService);
    aiRouter = module.get(AiProviderRouter);
  });

  it('builds a multimodal structured chat request and returns validated output', async () => {
    mockProvider.chatStructured.mockResolvedValue({
      text: JSON.stringify({
        text: '**Biển này** có nghĩa là không đỗ xe.',
        vocabularies: [
          {
            word: 'cấm đỗ xe',
            translation: 'no parking',
            partOfSpeech: 'phrase',
            exampleSentence: 'Ở đây cấm đỗ xe.',
            exampleTranslation: 'Parking is forbidden here.',
            classifier: null,
          },
        ],
      }),
      usageMetadata: { totalTokenCount: 42 },
    } as any);

    const result = await service.analyze(request, user);

    expect(aiRouter.renderPrompt).toHaveBeenCalledWith(
      'image-discovery',
      expect.objectContaining({
        user: expect.objectContaining({
          nativeLanguage: 'English',
          currentLevel: 'A1',
          preferredDialect: 'STANDARD',
        }),
      }),
    );
    expect(aiRouter.forFeature).toHaveBeenCalledWith('image-analysis');
    expect(mockProvider.chatStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        systemInstruction: 'rendered image prompt',
        responseSchema: expect.any(Object),
        messages: [
          {
            role: 'user',
            content: 'What is the red sign?',
          },
          {
            role: 'assistant',
            content: 'It is a traffic sign.',
          },
          {
            role: 'user',
            content: 'What does this sign say?',
            attachments: [
              {
                type: 'image',
                mimeType: 'image/png',
                data: 'base64-image-data',
              },
              {
                type: 'image',
                mimeType: 'image/jpeg',
                data: 'second-base64-image-data',
              },
            ],
          },
        ],
      }),
    );
    expect(result).toEqual({
      text: '**Biển này** có nghĩa là không đỗ xe.',
      vocabularies: [
        {
          word: 'cấm đỗ xe',
          translation: 'no parking',
          partOfSpeech: 'phrase',
          exampleSentence: 'Ở đây cấm đỗ xe.',
          exampleTranslation: 'Parking is forbidden here.',
          classifier: null,
        },
      ],
    });
  });

  it('rejects an empty prompt', async () => {
    await expect(
      service.analyze({ ...request, prompt: '   ' }, user),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects more than five images with a clear error', async () => {
    await expect(
      service.analyze(
        {
          ...request,
          images: [
            { base64: 'one', mimeType: 'image/png' },
            { base64: 'two', mimeType: 'image/png' },
            { base64: 'three', mimeType: 'image/png' },
            { base64: 'four', mimeType: 'image/png' },
            { base64: 'five', mimeType: 'image/png' },
            { base64: 'six', mimeType: 'image/png' },
          ],
        },
        user,
      ),
    ).rejects.toThrow('A maximum of 5 images can be analyzed at once');
  });

  it('rejects unsupported image mime types', async () => {
    await expect(
      service.analyze(
        {
          ...request,
          images: [{ base64: 'abc', mimeType: 'application/pdf' }],
        },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when the AI response fails schema validation', async () => {
    mockProvider.chatStructured.mockResolvedValue({
      text: JSON.stringify({ text: '', vocabularies: [] }),
      usageMetadata: {},
    } as any);

    await expect(service.analyze(request, user)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a service error when the AI call fails', async () => {
    mockProvider.chatStructured.mockRejectedValue(new Error('AI unavailable'));

    await expect(service.analyze(request, user)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
