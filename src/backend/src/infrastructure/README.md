# Infrastructure Layer

Lớp infrastructure chứa các service hỗ trợ cho ứng dụng.

## 📦 Modules

### 1. Cache Service
Service quản lý cache với in-memory storage (có thể mở rộng sang Redis).

**Features:**
- ✅ Set/Get/Delete cache
- ✅ TTL (Time To Live) support
- ✅ Pattern-based invalidation
- ✅ Get-or-set pattern
- ✅ Cache decorators

**Usage:**
```typescript
import { CacheService } from './infrastructure/cache/cache.service';

// Inject service
constructor(private cacheService: CacheService) {}

// Set cache
await this.cacheService.set('user:123', userData, 3600);

// Get cache
const user = await this.cacheService.get('user:123');

// Get or set
const courses = await this.cacheService.getOrSet(
  'courses:all',
  () => this.coursesRepository.findAll(),
  3600
);

// Invalidate pattern
await this.cacheService.invalidatePattern('user:*');
```

**Decorators:**
```typescript
import { Cacheable, CacheEvict } from './infrastructure/cache/cache.decorator';

@Cacheable('courses:all', 3600)
async findAll() {
  return this.repository.find();
}

@CacheEvict('courses:*')
async create(data) {
  return this.repository.save(data);
}
```

---

### 2. Storage Service
Service quản lý file upload (audio, images, documents).

**Features:**
- ✅ File upload (generic)
- ✅ Audio upload
- ✅ Image upload
- ✅ File deletion
- ✅ File info retrieval
- ✅ URL generation

**Usage:**
```typescript
import { StorageService } from './infrastructure/storage/storage.service';

// Inject service
constructor(private storageService: StorageService) {}

// Upload audio
const audioFile = await this.storageService.uploadAudio(
  buffer,
  'pronunciation.mp3'
);
// Returns: { filename, url, size, mimetype, ... }

// Upload image
const imageFile = await this.storageService.uploadImage(
  buffer,
  'vocabulary.jpg'
);

// Delete file
await this.storageService.deleteFile(filename);

// Get file URL
const url = this.storageService.getFileUrl(filename);
```

**File Structure:**
```
uploads/
├── audio/          # Audio files
├── images/         # Image files
└── [other files]   # Generic uploads
```

---

### 3. Logging Service
Service quản lý logging với file-based storage.

**Features:**
- ✅ Multiple log levels (error, warn, info, debug, verbose)
- ✅ File-based logging
- ✅ Separate error logs
- ✅ Request logging
- ✅ Query logging
- ✅ Metadata support
- ✅ Old log cleanup

**Usage:**
```typescript
import { LoggingService } from './infrastructure/logging/logging.service';

// Inject service
constructor(private loggingService: LoggingService) {}

// Basic logging
this.loggingService.log('User logged in', 'AuthService');
this.loggingService.error('Database connection failed', trace, 'Database');
this.loggingService.warn('Cache miss', 'CacheService');
this.loggingService.debug('Query executed', 'Repository');

// Log with metadata
this.loggingService.logWithMetadata(
  LogLevel.INFO,
  'User created',
  { userId: '123', email: 'user@example.com' },
  'UsersService'
);

// Log HTTP request
this.loggingService.logRequest('GET', '/api/users', 200, 45);

// Log database query
this.loggingService.logQuery('SELECT * FROM users', 12);

// Clear old logs (older than 30 days)
this.loggingService.clearOldLogs(30);
```

**Interceptor:**
```typescript
import { LoggingInterceptor } from './infrastructure/logging/logging.interceptor';

// In controller
@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {}
```

**Log Files:**
```
logs/
├── app.log       # All logs
└── error.log     # Error logs only
```

---

## 🔧 Configuration

### Environment Variables
```env
# Storage
BASE_URL=http://localhost:3000

# Logging
NODE_ENV=development  # Enable debug/verbose logs
```

---

## 🚀 Future Enhancements

### Cache Service
- [ ] Redis integration
- [ ] Distributed caching
- [ ] Cache statistics
- [ ] Cache warming

### Storage Service
- [ ] AWS S3 integration
- [ ] Image resizing
- [ ] File compression
- [ ] CDN integration
- [ ] File validation (size, type)

### Logging Service
- [ ] Log rotation
- [ ] Remote logging (e.g., Elasticsearch)
- [ ] Log aggregation
- [ ] Performance metrics
- [ ] Alert system

---

## 📝 Notes

- Cache service hiện tại sử dụng in-memory storage, phù hợp cho development
- Storage service lưu file local, production nên dùng S3
- Logging service ghi file local, production nên dùng centralized logging
- Tất cả services đều là Global modules, có thể inject ở bất kỳ đâu
