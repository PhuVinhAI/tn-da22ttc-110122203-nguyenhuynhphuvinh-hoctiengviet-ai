# Deploy backend lên Hugging Face Spaces + Neon Postgres + Upstash Redis

Hướng dẫn end-to-end để deploy NestJS backend của LinVNix lên Hugging Face Spaces, dùng Neon (Postgres free) và Upstash (Redis free). Tất cả 3 service đều free tier, không cần thẻ tín dụng.

> Tài liệu này sẽ giúp bạn deploy lại từ đầu nếu phải đổi account (lỡ bị limit/ban), update code mới, hay debug khi build fail. Đọc theo thứ tự lần đầu, sau đó nhảy đến mục liên quan khi cần.

## 1. Kiến trúc

```
┌──────────────────────┐       ┌───────────────────────┐
│  Mobile app          │  REST │  HF Space (Docker)    │  ──► Gemini API
│  (Flutter / APK)     │ ────► │  NestJS backend       │      (key pool)
└──────────────────────┘  /SSE │  /api/v1 + Swagger    │
                               └─────────┬─────────────┘
                                         │
                       ┌─────────────────┼─────────────────┐
                       ▼                 ▼                 ▼
                ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                │ Neon         │  │ Upstash      │  │ HF Space     │
                │ Postgres     │  │ Redis        │  │ /data        │
                │ (0.5 GB free)│  │ (256 MB free)│  │ (uploads MP3)│
                └──────────────┘  └──────────────┘  └──────────────┘
```

- **Code repo**: HF Space `tomisakae/linvnix` (git repo, public). Push code → HF tự build Docker, deploy.
- **Secrets**: lưu trong HF Space settings (KHÔNG trong code repo). Inject thành env var khi container chạy.
- **Persistent storage**: Docker image bake sẵn seed audio (A1.1). MP3 user upload runtime ephemeral — mất khi rebuild trừ khi attach Storage Bucket (cần làm tay ở HF Settings UI).

## 2. Yêu cầu trước khi bắt đầu

- Tài khoản GitHub (để sign-in mọi nơi nhanh)
- Đã cài: `bun`, `git`, Python 3.10+, `uv` (https://docs.astral.sh/uv/) hoặc `pipx`
- Source code monorepo LinVNix (clone từ GitHub)
- Có API key Google Gemini (https://aistudio.google.com/app/apikey) — recommended: tạo 3 key cho key pool

## 3. Cài Hugging Face CLI + Claude Code skill

```bash
# Cài hf CLI isolated qua uv tool (không đụng các env Python khác)
uv tool install -U huggingface_hub

# Verify
hf version              # >= 1.16
hf skills --help        # phải có subcommand này

# Cài skill cho Claude Code (optional, nhưng hữu ích)
hf skills add --claude --global
```

Login HF account:

```bash
# 1. Vào https://huggingface.co/settings/tokens
# 2. Tạo token mới, scope "write" (cần write để tạo Space, push code, set secrets)
# 3. Copy token, chạy:
hf auth login --token <YOUR_TOKEN> --add-to-git-credential
hf auth whoami    # in ra username
```

## 4. Tạo Neon Postgres (free)

1. https://console.neon.tech/signup → sign in GitHub
2. **New Project**:
   - Name: `linvnix`
   - Postgres version: 17
   - **Region: AWS us-east-2 (Ohio)** — match region HF Spaces US East cho latency thấp
3. Trang Dashboard → box **Connection string**:
   - Dropdown chọn **Pooled connection** (NestJS pool connections, không cần thêm pgbouncer)
   - Copy URL dạng `postgresql://neondb_owner:<password>@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Lưu URL này ở nơi an toàn (1Password, Bitwarden...). Sẽ dùng làm `DATABASE_URL` secret.

**Free tier limits**:
- 0.5 GB storage
- 1 project, 10 branches
- Branch sleep sau 5 phút idle → cold start ~1s
- Không giới hạn computed time

**Reset password** (khi cần rotate): Neon Console → Project → **Settings** → **Reset password** → URL mới.

## 5. Tạo Upstash Redis (free)

1. https://console.upstash.com/login → sign in GitHub
2. **Create Database**:
   - Name: `linvnix-redis`
   - Type: **Redis**
   - Primary region: **US-EAST-1 (N. Virginia)** — gần HF
   - Variant: **Regional** (free, đủ dùng)
   - Eviction: ✅ enable, policy `allkeys-lru` (cache + queue, không cần TTL strict)
3. Tab **Connect to your database** → **Redis CLI** → copy phần URL:
   - **QUAN TRỌNG**: đổi `redis://` thành `rediss://` (s = TLS). Upstash bắt buộc TLS.
   - Format cuối: `rediss://default:<password>@<host>.upstash.io:6379`
4. Lưu URL — sẽ dùng làm `REDIS_URL` secret.

**Free tier limits**:
- 256 MB storage
- 10k commands/ngày
- 500 daily connections

**Regenerate password** (khi cần rotate): Upstash Console → DB → **Reset password** → URL mới.

## 6. Code adaptation (đã làm sẵn trong repo)

Backend đã được sửa để hỗ trợ HF deploy. Các file đã sửa:

- `backend/src/config/database.config.ts` — đọc `DATABASE_URL` (fallback HOST/PORT/...) + auto-detect SSL từ `sslmode=require` query
- `backend/src/config/redis.config.ts` — đọc `REDIS_URL` (fallback HOST/PORT/...) + auto-bật TLS khi scheme là `rediss://`
- `backend/src/infrastructure/queue/queue.module.ts` — propagate `tls` cho Bull
- `backend/src/infrastructure/cache/cache.service.ts` — propagate `tls` cho ioredis
- `backend/src/infrastructure/storage/storage.service.ts` — đọc `UPLOADS_DIR` env
- `backend/src/app.module.ts` — `ServeStaticModule.rootPath` đọc `UPLOADS_DIR`
- `backend/scripts/seed-lessons.ts` — đọc `DATABASE_URL` + SSL
- `packages/shared/tsconfig.json` — exclude `*.spec.ts` khỏi build (nếu không HF builder fail)

Trừ khi muốn refactor, không cần sửa thêm gì. Chỉ cần secrets đúng.

## 7. Tạo HF Space

```bash
hf repo create tomisakae/linvnix \
  --type space \
  --space-sdk docker \
  --private \
  --exist-ok
```

URL: `https://huggingface.co/spaces/tomisakae/linvnix`. Public app URL sau khi deploy: `https://tomisakae-linvnix.hf.space`.

> Free tier hardware mặc định là `cpu-basic` (2 vCPU, 16 GB RAM, không ngủ trên Docker SDK).
>
> Nếu tạo Public ngay: thay `--private` bằng `--public`. Khuyến nghị Public cho production vì mobile cần access; secrets vẫn an toàn.

## 8. Set secrets trên Space

```bash
# Cách 1 — upload trọn .env của backend
hf spaces secrets add tomisakae/linvnix --secrets-file backend/.env

# Cách 2 — override / thêm từng key
hf spaces secrets add tomisakae/linvnix \
  -s 'DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require' \
  -s 'REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379' \
  -s 'NODE_ENV=production' \
  -s 'DATABASE_SYNCHRONIZE=true' \
  -s 'UPLOADS_DIR=/data/uploads' \
  -s 'BASE_URL=https://tomisakae-linvnix.hf.space' \
  -s 'JWT_SECRET=<random-64-char-string>' \
  -s 'API_PREFIX=api' \
  -s 'API_VERSION=v1'

# Liệt kê secrets đã set
hf spaces secrets ls tomisakae/linvnix
```

**Secrets bắt buộc**: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GENAI_API_KEYS`.
**Bắt buộc cho production**: `NODE_ENV=production`, `BASE_URL`, `UPLOADS_DIR=/data/uploads`.
**Bắt buộc khi deploy lần đầu**: `DATABASE_SYNCHRONIZE=true` (TypeORM sync schema). Sau khi schema ổn thì xóa: `hf spaces secrets delete tomisakae/linvnix DATABASE_SYNCHRONIZE`.

**Generate JWT_SECRET**:
```bash
bun -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# hoặc:
openssl rand -base64 48
```

## 9. Push code lên Space

HF Space là git repo riêng (không phải GitHub). Quy trình mỗi lần deploy:

```bash
# 1. Clone Space repo (lần đầu)
git clone https://huggingface.co/spaces/tomisakae/linvnix /tmp/linvnix-space

# 2. Export tracked files từ monorepo (chỉ những path cần)
cd /path/to/LinVNix
git archive HEAD package.json bun.lock backend packages | tar -x -C /tmp/linvnix-space/

# 3. Copy file đã sửa (nếu chưa commit lên GitHub)
cp backend/src/config/database.config.ts /tmp/linvnix-space/backend/src/config/database.config.ts
cp backend/src/config/redis.config.ts    /tmp/linvnix-space/backend/src/config/redis.config.ts
cp backend/src/infrastructure/queue/queue.module.ts   /tmp/linvnix-space/backend/src/infrastructure/queue/queue.module.ts
cp backend/src/infrastructure/cache/cache.service.ts  /tmp/linvnix-space/backend/src/infrastructure/cache/cache.service.ts
cp backend/src/infrastructure/storage/storage.service.ts /tmp/linvnix-space/backend/src/infrastructure/storage/storage.service.ts
cp backend/src/app.module.ts /tmp/linvnix-space/backend/src/app.module.ts
cp packages/shared/tsconfig.json /tmp/linvnix-space/packages/shared/tsconfig.json
cp backend/scripts/seed-lessons.ts /tmp/linvnix-space/backend/scripts/seed-lessons.ts

# 4. Move Dockerfile lên root (HF expect Dockerfile at root)
cd /tmp/linvnix-space
mv backend/Dockerfile ./Dockerfile

# 5. Tạo README.md với HF metadata YAML frontmatter
cat > README.md <<'EOF'
---
title: LinVNix Backend
emoji: 📚
colorFrom: red
colorTo: yellow
sdk: docker
app_port: 3000
pinned: false
short_description: NestJS backend for LinVNix
---

NestJS backend cho LinVNix. Source: https://github.com/PhuVinhAI/LinVNix
EOF

# 6. .gitignore
cat > .gitignore <<'EOF'
node_modules/
dist/
out/
*.tgz
logs/
*.log
.env
.eslintcache
.cache
*.tsbuildinfo
debug/
EOF

# 7. Sửa Dockerfile để copy uploads/ từ builder sang runner (giữ seed audio trong image)
# Thêm dòng sau khi COPY templates:
#   COPY --from=builder /app/backend/uploads ./backend/uploads
# (Edit manual; xem repo Space hiện tại làm reference)

# 8. Commit + push
git add -A
git -c user.email="<you>@hf.local" -c user.name="<you>" commit -m "Deploy: ..."
git push origin main
```

HF tự build Docker khi push lên. Theo dõi build:

```bash
hf spaces logs tomisakae/linvnix --build       # build logs
hf spaces logs tomisakae/linvnix               # runtime logs (sau khi build xong)
hf spaces info tomisakae/linvnix --json | python -c "import sys,json; print(json.load(sys.stdin)['runtime']['stage'])"
# Stages: BUILDING → APP_STARTING → RUNNING (ready)
```

## 10. Chuyển Space sang Public (để mobile gọi được)

Cờ `--private/--public` của `hf repos settings` chỉ áp dụng lúc tạo. Để toggle Space đã tồn tại, dùng Python API:

```bash
/c/Users/tomis/AppData/Roaming/uv/tools/huggingface-hub/Scripts/python.exe -c "
from huggingface_hub import HfApi
HfApi().update_repo_settings(repo_id='tomisakae/linvnix', repo_type='space', private=False)
"
```

(Đường dẫn Python là venv của `uv tool install huggingface_hub`. Trên Linux/macOS thay bằng `python` thường.)

Verify:
```bash
hf spaces info tomisakae/linvnix --json | python -c "import sys,json; print('private:', json.load(sys.stdin).get('private'))"
curl -sI https://tomisakae-linvnix.hf.space/api/v1/courses    # phải trả 200 OK, không 404
```

## 11. Seed dữ liệu vào Neon

Sau khi backend lần đầu khởi động (schema được TypeORM sync), seed dữ liệu:

```bash
cd backend
export DATABASE_URL='postgresql://neondb_owner:<password>@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'

# 1) Courses + modules + lessons + vocab + grammar + exercises (raw pg client, không bootstrap NestJS)
bun run seed:lessons

# 2) Simulations — DÙNG STANDALONE SCRIPT (bypass Bull queue init bị Bun + Windows fail)
bun run seed:simulations:direct
```

> **Tránh `seed:simulations` thẳng từ local máy Windows**: nó bootstrap full NestJS AppModule → Bull queue init đụng lỗi `TypeError: data argument must be of type string` do Bun + Bull + Windows incompat. Dùng `seed:simulations:direct` (script `seed-simulations-direct.ts`) — tạo `DataSource` thẳng, không qua Bull.
>
> Trong production container (Linux + Bun), Bull chạy bình thường. Lỗi chỉ xảy ra khi seed từ local Windows.

### 11.1 Flush Redis cache sau khi seed

Backend cache 1h TTL. Nếu trước đó API đã được gọi (DB rỗng), kết quả `[]` bị cache. Sau seed phải flush:

```bash
REDIS_URL='rediss://default:<password>@<host>.upstash.io:6379' bun -e "
const Redis = require('ioredis');
const u = new URL(process.env.REDIS_URL);
const r = new Redis({ host: u.hostname, port: +u.port, password: decodeURIComponent(u.password), tls: {} });
await r.flushdb();
console.log('Flushed');
await r.quit();
"
```

### 11.2 Verify

```bash
# Courses là public endpoint
curl https://tomisakae-linvnix.hf.space/api/v1/courses | python -c "import sys,json; print(len(json.load(sys.stdin)['data']), 'courses')"

# Simulations endpoints cần JWT — register + login trước
TOKEN=$(curl -sX POST https://tomisakae-linvnix.hf.space/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@a.com","password":"Test1234!","fullName":"Test"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
curl -s -H "Authorization: Bearer $TOKEN" https://tomisakae-linvnix.hf.space/api/v1/simulations/categories \
  | python -c "import sys,json; print(len(json.load(sys.stdin)['data']), 'categories')"
```

Expected: 6 courses · 6 categories · 15 scenarios · 34 characters.

## 12. Update code (deploy lần thứ 2 trở đi)

Mỗi khi code GitHub thay đổi và muốn deploy:

```bash
# 1. Pull bản mới về monorepo
git -C /path/to/LinVNix pull

# 2. Sync sang Space repo (đã clone từ trước)
cd /tmp/linvnix-space
git pull        # đồng bộ với remote Space (nếu có ai commit)

# 3. Re-export tracked files
cd /path/to/LinVNix
git archive HEAD package.json bun.lock backend packages | tar -x -C /tmp/linvnix-space/

# 4. Re-apply patches root-level (Dockerfile move, uploads COPY trong Dockerfile)
cd /tmp/linvnix-space
mv backend/Dockerfile ./Dockerfile    # nếu git archive ghi đè

# 5. Commit + push
git add -A
git -c user.email="..." -c user.name="..." commit -m "Update from monorepo SHA <hash>"
git push origin main

# 6. HF tự rebuild. Theo dõi:
hf spaces logs tomisakae/linvnix --build
```

> Nếu update thường xuyên, tự động hoá bằng GitHub Action: trigger `hf push` mỗi khi main thay đổi. Hoặc thêm Space repo làm git remote thứ 2 trong monorepo và push branch.

## 13. Rotate credentials (urgent khi token/password bị lộ)

### HF token
```bash
# 1. Vào https://huggingface.co/settings/tokens, xoá token cũ
# 2. Tạo token mới (write scope)
hf auth login --token <NEW_TOKEN> --force --add-to-git-credential
```

### Neon DB password
```bash
# 1. Neon Console → Project → Settings → Reset password → copy URL mới
# 2. Update HF secret
hf spaces secrets add tomisakae/linvnix -s 'DATABASE_URL=<new-url>'
# 3. HF tự restart Space (~1 phút)
hf spaces restart tomisakae/linvnix   # hoặc force restart
```

### Upstash Redis password
```bash
# 1. Upstash Console → DB → Reset password → copy URL mới (giữ rediss://)
# 2. Update HF secret
hf spaces secrets add tomisakae/linvnix -s 'REDIS_URL=<new-url>'
# 3. Restart Space
hf spaces restart tomisakae/linvnix
```

### Gemini API keys
```bash
# 1. https://aistudio.google.com/app/apikey → revoke key cũ → tạo key mới
# 2. Update HF secret (key pool — phẩy ngăn cách)
hf spaces secrets add tomisakae/linvnix -s 'GENAI_API_KEYS=key1,key2,key3'
```

## 14. Migrate sang account mới (HF/Neon/Upstash bị limit/ban)

### HF account mới
```bash
# 1. Sign up HF account mới, lấy token mới
hf auth login --token <NEW_TOKEN> --force --add-to-git-credential

# 2. Tạo Space mới (đổi <new-username>)
hf repo create <new-username>/linvnix --type space --space-sdk docker --public

# 3. Set secrets (copy từ Space cũ — không có cách export trực tiếp; dùng .env local làm nguồn)
hf spaces secrets add <new-username>/linvnix --secrets-file backend/.env
hf spaces secrets add <new-username>/linvnix \
  -s 'DATABASE_URL=<...>' \
  -s 'REDIS_URL=<...>' \
  -s 'NODE_ENV=production' \
  -s 'BASE_URL=https://<new-username>-linvnix.hf.space' \
  -s 'UPLOADS_DIR=/data/uploads' \
  -s 'DATABASE_SYNCHRONIZE=true' \
  -s 'JWT_SECRET=<...>'

# 4. Clone Space mới và push code (xem mục 9)

# 5. Update mobile BASE URL
# Mobile dùng --dart-define API_URL=https://<new-username>-linvnix.hf.space khi build APK
```

### Neon account mới
```bash
# 1. Sign up Neon account mới, tạo project mới (region us-east-2)
# 2. Lấy DATABASE_URL mới
# 3. Update HF secret
hf spaces secrets add <space-id> -s 'DATABASE_URL=<new-url>'
hf spaces secrets add <space-id> -s 'DATABASE_SYNCHRONIZE=true'   # bật lại để sync schema
hf spaces restart <space-id>

# 4. Seed lại data
DATABASE_URL='<new-url>' bun run seed:lessons
DATABASE_URL='<new-url>' REDIS_URL='<...>' bun run seed:simulations

# 5. Sau khi confirm OK, xóa synchronize
hf spaces secrets delete <space-id> DATABASE_SYNCHRONIZE
```

### Upstash account mới
```bash
# 1. Sign up Upstash account mới, tạo Redis DB
# 2. Update HF secret
hf spaces secrets add <space-id> -s 'REDIS_URL=<new-rediss-url>'
hf spaces restart <space-id>
```

## 15. Troubleshooting

### Build fail: "fails to match the required pattern: /\\p{Extended_Pictographic}/u"
- Emoji trong README.md YAML frontmatter là flag (vd 🇻🇳) hoặc multi-codepoint.
- Đổi sang emoji đơn (📚, 🚀, 🎯…), commit lại, push.

### Build fail: "Cannot find name 'expect' / 'describe' / 'it'"
- `packages/shared` build compile `.spec.ts` file mà thiếu test runner types.
- Đã fix bằng `packages/shared/tsconfig.json` exclude `*.spec.ts`. Đảm bảo file này được copy sang Space repo.

### Runtime: "ECONNREFUSED Redis localhost:6379"
- `REDIS_URL` chưa set, code fallback sang localhost.
- Set `REDIS_URL=rediss://...` và restart.

### Runtime: Postgres "self signed certificate" / SSL error
- Neon yêu cầu SSL. Code đã auto-detect khi URL có `sslmode=require`.
- Nếu URL không có `sslmode=require`, set thêm: `hf spaces secrets add <space-id> -s 'DATABASE_SSL=true'`.

### API trả 404 cho anonymous request
- Space đang Private. Xem mục 10 để chuyển Public.

### Mobile gọi backend bị CORS
- Backend đã `app.enableCors()` không restrict origin. Nếu vẫn fail, kiểm tra `BASE_URL` có khớp host đang truy cập.

### MP3 user upload mất sau redeploy
- Chưa attach Storage Bucket / Volume. Truy cập HF Space Settings UI → Storage → Attach persistent storage (free tier có small bucket khi đã upgrade hardware; CPU Basic free thường không có /data persistent).
- Workaround: chuyển sang Cloudflare R2 (S3-compatible, 10GB free) — refactor `storage.service.ts` dùng S3 SDK.

### Space stuck "BUILDING" hơn 15 phút
- Bun install kéo dài. Check build log: `hf spaces logs <space-id> --build --follow`.
- Nếu lỗi network HF→registry, factory-reboot:
  ```bash
  hf spaces restart tomisakae/linvnix --factory-reboot
  ```

### Schema không sync (table không tồn tại sau khi seed)
- `DATABASE_SYNCHRONIZE` chưa bật.
- Set `DATABASE_SYNCHRONIZE=true` secret, restart Space, đợi backend boot xong (xem log `Nest application successfully started`), sau đó seed lại.

## 16. Quota / cost monitoring

| Service | Free tier limit | Cảnh báo khi |
|---------|----------------|--------------|
| Neon | 0.5 GB DB | DB ~400 MB → tính giải pháp upgrade hoặc archive |
| Upstash | 10k cmds/ngày, 256 MB | Bull queue có thể chạm trần nếu nhiều email/job |
| Gemini | $0.X/1M token (có miễn phí ban đầu) | Set quota alert trong Google Cloud Console |
| HF Spaces | CPU Basic, không ngủ | Hardware ổn — không lo |
| HF Storage (Bucket) | 5 GB private free | MP3 upload nhiều → cân nhắc R2 |

Check usage:
- Neon: Console → Project → **Monitoring**
- Upstash: Console → DB → **Metrics**
- HF: Settings → **Billing**
- Gemini: Google AI Studio → **API key usage**

## 17. Tham khảo lệnh hf nhanh

```bash
hf spaces info <id>                      # state, URL, hardware
hf spaces logs <id>                      # run logs
hf spaces logs <id> --build              # build logs
hf spaces logs <id> --follow             # stream
hf spaces secrets ls <id>                # list secret keys (không xem value)
hf spaces secrets add <id> -s KEY=value
hf spaces secrets delete <id> KEY
hf spaces restart <id>
hf spaces restart <id> --factory-reboot  # clear cache, rebuild
hf spaces pause <id>                     # giải phóng container, không tính giờ
hf spaces settings <id> --hardware cpu-basic
```

## 18. Build mobile APK cho production

Mobile (Flutter) đọc `API_URL` theo thứ tự ưu tiên: `--dart-define` → `assets/.env` → default `http://localhost:3000`. Production build chỉ cần `--dart-define`.

```bash
cd mobile

# Lần đầu hoặc sau khi sửa @freezed / @JsonSerializable / @riverpod
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# Build APK release trỏ về HF Space
flutter build apk --release \
  --dart-define=API_URL=https://tomisakae-linvnix.hf.space \
  --dart-define=GOOGLE_CLIENT_ID=<your-google-client-id>    # optional, cần cho Google Sign-In
```

Output: `mobile/build/app/outputs/flutter-apk/app-release.apk`.

Split-per-ABI để giảm size (3 APK riêng cho arm64/armv7/x86_64 thay vì 1 fat APK):
```bash
flutter build apk --release --split-per-abi --dart-define=API_URL=...
```

App Bundle (cho Play Store):
```bash
flutter build appbundle --release --dart-define=API_URL=...
```

## 19. Signing APK cho distribution

Mặc định `android/app/build.gradle.kts` đang ký release bằng **debug keystore** — APK cài được trên máy cá nhân nhưng **KHÔNG** lên Play Store được và mỗi máy build ra một signing khác nhau (không update được).

### Setup signing keystore (chỉ làm 1 lần)

```bash
# 1. Generate upload keystore (nhớ password!)
keytool -genkey -v -keystore mobile/android/app/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# 2. Tạo mobile/android/key.properties (GITIGNORED — không commit!)
cat > mobile/android/key.properties <<EOF
storePassword=<password đặt lúc tạo keystore>
keyPassword=<password đặt lúc tạo keystore>
keyAlias=upload
storeFile=upload-keystore.jks
EOF

# 3. Sửa android/app/build.gradle.kts:
```

Trong `mobile/android/app/build.gradle.kts`:
```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

Backup keystore + key.properties ở nơi an toàn (không cloud không versioning). **Mất keystore = mất khả năng update app trên Play Store** (phải tạo app mới).

### Distribute APK (sideload)

- Cho bản thân: copy `app-release.apk` qua USB / Drive / Email → cài đặt
- Cho beta tester: dùng Firebase App Distribution, TestFlight (iOS), hoặc Google Play Internal Testing
- Public: upload App Bundle lên Google Play Console

---

Nếu bị stuck ở bước nào, đọc lại mục **15. Troubleshooting** trước rồi mới mò log.
