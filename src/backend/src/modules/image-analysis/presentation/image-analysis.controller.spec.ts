import { Test, TestingModule } from '@nestjs/testing';
import { ImageAnalysisController } from './image-analysis.controller';
import { ImageAnalysisService } from '../application/image-analysis.service';

describe('ImageAnalysisController', () => {
  let controller: ImageAnalysisController;
  let service: jest.Mocked<ImageAnalysisService>;

  const user = {
    id: 'user-1',
    nativeLanguage: 'English',
    currentLevel: 'A1',
    preferredDialect: 'STANDARD',
  };

  const dto = {
    images: [{ base64: 'base64-image-data', mimeType: 'image/png' }],
    prompt: 'What is written here?',
  };

  beforeEach(async () => {
    const serviceMock = {
      analyze: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageAnalysisController],
      providers: [{ provide: ImageAnalysisService, useValue: serviceMock }],
    }).compile();

    controller = module.get(ImageAnalysisController);
    service = module.get(ImageAnalysisService);
  });

  it('analyzes an image for the authenticated user', async () => {
    const response = {
      text: 'This sign says **cấm đỗ xe**.',
      vocabularies: [
        {
          word: 'cấm đỗ xe',
          translation: 'no parking',
        },
      ],
    };
    service.analyze.mockResolvedValue(response as any);

    const result = await controller.analyze(user as any, dto as any);

    expect(service.analyze).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual(response);
  });
});
