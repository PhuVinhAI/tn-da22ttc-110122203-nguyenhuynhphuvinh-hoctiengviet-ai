import { Test, TestingModule } from '@nestjs/testing';
import { PersonalVocabulariesController } from './personal-vocabularies.controller';
import { PersonalVocabulariesService } from '../application/personal-vocabularies.service';
import { PersonalVocabularySort } from '../dto/personal-vocabulary-query.dto';
import { PersonalVocabularySource } from '../../../common/enums';

describe('PersonalVocabulariesController', () => {
  let controller: PersonalVocabulariesController;
  let service: jest.Mocked<PersonalVocabulariesService>;

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      createFromAnalysis: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalVocabulariesController],
      providers: [
        { provide: PersonalVocabulariesService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<PersonalVocabulariesController>(
      PersonalVocabulariesController,
    );
    service = module.get(PersonalVocabulariesService);
  });

  describe('POST /personal-vocabularies', () => {
    it('creates a personal vocabulary for the authenticated user', async () => {
      const dto = {
        word: 'bàn',
        translation: 'table',
        source: PersonalVocabularySource.IMAGE_DISCOVERY,
      };
      const created = { id: 'pv-1', userId: 'user-1', ...dto };
      service.create.mockResolvedValue(created as any);

      const result = await controller.create(mockUser as any, dto as any);

      expect(service.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(created);
    });
  });

  describe('POST /personal-vocabularies/from-analysis', () => {
    it('creates a personal vocabulary and bookmark from AI analysis', async () => {
      const dto = {
        word: 'cấm đỗ xe',
        translation: 'no parking',
        partOfSpeech: 'phrase',
      };
      const created = {
        id: 'pv-1',
        userId: 'user-1',
        source: PersonalVocabularySource.IMAGE_DISCOVERY,
        ...dto,
      };
      service.createFromAnalysis.mockResolvedValue(created as any);

      const result = await controller.createFromAnalysis(
        mockUser as any,
        dto as any,
      );

      expect(service.createFromAnalysis).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(created);
    });
  });

  describe('GET /personal-vocabularies', () => {
    it('returns paginated list with default params', async () => {
      const listResult = {
        data: [{ id: 'pv-1', word: 'bàn' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      service.list.mockResolvedValue(listResult as any);

      const result = await controller.list(mockUser as any, {
        page: 1,
        limit: 20,
        sort: PersonalVocabularySort.NEWEST,
      });

      expect(service.list).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 20,
        search: undefined,
        sort: PersonalVocabularySort.NEWEST,
      });
      expect(result.data).toHaveLength(1);
    });

    it('passes search and sort params', async () => {
      service.list.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await controller.list(mockUser as any, {
        page: 1,
        limit: 20,
        search: 'hello',
        sort: PersonalVocabularySort.AZ,
      });

      expect(service.list).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 20,
        search: 'hello',
        sort: PersonalVocabularySort.AZ,
      });
    });
  });

  describe('GET /personal-vocabularies/:id', () => {
    it('returns personal vocabulary detail', async () => {
      const pv = { id: 'pv-1', userId: 'user-1', word: 'bàn' };
      service.findById.mockResolvedValue(pv as any);

      const result = await controller.findById(mockUser as any, 'pv-1');

      expect(service.findById).toHaveBeenCalledWith('pv-1', 'user-1');
      expect(result).toEqual(pv);
    });
  });

  describe('DELETE /personal-vocabularies/:id', () => {
    it('soft-deletes personal vocabulary', async () => {
      service.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser as any, 'pv-1');

      expect(service.delete).toHaveBeenCalledWith('pv-1', 'user-1');
      expect(result).toEqual({
        message: 'Personal vocabulary deleted successfully',
      });
    });
  });
});
