import { VocabulariesService } from './vocabularies.service';
import { VocabulariesRepository } from './repositories/vocabularies.repository';
import { BookmarksService } from './bookmarks.service';
import { Dialect } from '../../../common/enums';

describe('VocabulariesService.search', () => {
  let service: VocabulariesService;
  let repo: jest.Mocked<VocabulariesRepository>;
  let bookmarks: jest.Mocked<BookmarksService>;

  beforeEach(() => {
    repo = {
      search: jest.fn(),
    } as unknown as jest.Mocked<VocabulariesRepository>;
    bookmarks = {} as jest.Mocked<BookmarksService>;
    service = new VocabulariesService(repo, bookmarks);
  });

  it('returns [] for empty / whitespace-only query without touching the repo', async () => {
    await expect(service.search({ query: '' })).resolves.toEqual([]);
    await expect(service.search({ query: '   ' })).resolves.toEqual([]);
    expect(repo.search).not.toHaveBeenCalled();
  });

  it('forwards a plain query (no filters) to the repo with trimmed text', async () => {
    repo.search.mockResolvedValue([{ id: 'v1', word: 'xe đạp' } as any]);

    const result = await service.search({ query: '  xe đạp  ' });

    expect(repo.search).toHaveBeenCalledWith({ query: 'xe đạp' });
    expect(result).toEqual([{ id: 'v1', word: 'xe đạp' }]);
  });

  it('forwards lessonId filter to the repo when supplied', async () => {
    repo.search.mockResolvedValue([]);

    await service.search({ query: 'xe', lessonId: 'lesson-1' });

    expect(repo.search).toHaveBeenCalledWith({
      query: 'xe',
      lessonId: 'lesson-1',
    });
  });

  it('forwards dialect filter to the repo when supplied', async () => {
    repo.search.mockResolvedValue([]);

    await service.search({ query: 'xe', dialect: Dialect.NORTHERN });

    expect(repo.search).toHaveBeenCalledWith({
      query: 'xe',
      dialect: Dialect.NORTHERN,
    });
  });

  it('forwards both lessonId and dialect when both supplied', async () => {
    repo.search.mockResolvedValue([]);

    await service.search({
      query: 'xe',
      lessonId: 'lesson-1',
      dialect: Dialect.SOUTHERN,
    });

    expect(repo.search).toHaveBeenCalledWith({
      query: 'xe',
      lessonId: 'lesson-1',
      dialect: Dialect.SOUTHERN,
    });
  });
});
