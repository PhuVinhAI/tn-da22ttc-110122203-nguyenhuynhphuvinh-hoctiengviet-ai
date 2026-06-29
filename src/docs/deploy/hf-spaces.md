# Deploy backend lên Hugging Face Spaces + CockroachDB + Aiven Valkey

Hướng dẫn end-to-end để deploy NestJS backend của LinVNix lên Hugging Face Spaces, dùng **CockroachDB Serverless/Standard** (Postgres-compatible) và **Aiven for Valkey** (Redis-compatible). Tất cả 3 service đều có free tier không cần thẻ tín dụng, hoặc trial credit nếu cần plan paid trong 30 ngày.

> Tài liệu này sẽ giúp bạn deploy lại từ đầu nếu phải đổi account (lỡ bị limit/ban), update code mới, hay debug khi build fail. Đọc theo thứ tự lần đầu, sau đó nhảy đến mục liên quan khi cần.

> **Lịch sử**: Stack cũ dùng Neon (0.5 GB) + Upstash (256 MB / 500K cmds-month). Đã migrate sang CockroachDB + Aiven Valkey vì: (a) CockroachDB Basic free 10 GB không sleep idle (vs Neon 0.5 GB + 5 phút sleep); (b) Aiven Valkey default `noeviction` đúng cho Bull queue (Upstash dùng `allkeys-lru` có bug evict job silently); (c) Aiven throughput-based pricing phù hợp Bull polling, Upstash command-based đốt quota nhanh.

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
                │ CockroachDB  │  │ Aiven Valkey │  │ HF Space     │
                │ Postgres-    │  │ Redis-compat │  │ /data        │
                │ compat 26257 │  │ TLS 16xxx    │  │ (uploads MP3)│
                │ Basic 10 GB  │  │ Free or paid │  │              │
                └──────────────┘  └──────────────┘  └──────────────┘
```

- **Code repo**: HF Space `tomisakae/linvnix` (git repo, public). Push code → HF tự build Docker, deploy.
- **Secrets**: lưu trong HF Space settings (KHÔNG trong code repo). Inject thành env var khi container chạy.
- **Persistent storage**: Docker image bake sẵn seed audio (A1.1) qua `COPY --from=builder /app/backend/uploads ./backend/uploads`. MP3 user upload runtime ephemeral — mất khi rebuild trừ khi attach Storage Bucket (cần làm tay ở HF Settings UI).
- **CockroachDB compat**: dùng `type: 'postgres'` trong TypeORM, wire protocol tương thích. PK `@PrimaryGeneratedColumn('uuid')` thay vì SERIAL (CockroachDB SERIAL ≠ Postgres SERIAL).

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

## 4. Tạo CockroachDB Postgres-compatible

CockroachDB Cloud có 3 plan:
- **Basic** (serverless): 10 GB storage + 50M RU/tháng free forever, không cần card, không sleep.
- **Standard**: dedicated capacity, không throttle, charge theo vCPU. Free trial $400/30 ngày.
- **Advanced**: enterprise, không dùng cho project nhỏ.

### 4.A. Basic plan (recommended cho production dài hạn free)

1. https://cockroachlabs.cloud/signup → sign in GitHub (no card)
2. **Create cluster**:
   - Plan: **Basic**
   - Cloud: **AWS**
   - Region: **N. Virginia (us-east-1)** — match HF Spaces US East cho latency thấp
   - Spend limit: **$0** (chỉ dùng free resources, vượt là throttle, không charge)
3. **Finalize**:
   - Cluster name: `linvnix-prod`
   - SQL user: `linvnix`
   - Password: **Generate & save** → copy lưu 1Password ngay (chỉ hiện 1 lần)
4. Sau khi cluster RUNNING → tab **Connect** → **General connection string** → copy URL dạng:
   ```
   postgresql://linvnix:<password>@<cluster>.aws-us-east-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
   ```
5. **Sửa `sslmode=verify-full` → `sslmode=require`** trước khi paste vào HF secret (code dùng `rejectUnauthorized: false` nên không cần root.crt trong container).

**Free Basic limits**:
- 10 GB storage
- 50M Request Units/tháng
- Không sleep, không hết hạn
- Single region

### 4.B. Standard plan (nếu cần dedicated capacity test 30 ngày)

Tương tự Basic nhưng chọn **Standard** + 2-4 vCPUs. $400 trial credit chạy được ~30 ngày tùy size.

⚠️ **Trial expire = cluster có thể bị charge $165-330/tháng** nếu đã add card, hoặc bị paused/deleted nếu chưa. **Đặt reminder 2 ngày trước expire** → downgrade về Basic hoặc migrate.

**Reset password** (khi cần rotate): CockroachDB Console → cluster → **SQL Users** → user → **Reset password** → URL mới.

## 5. Tạo Aiven for Valkey (Redis-compatible)

Aiven Valkey có 2 plan phù hợp:
- **Free**: indefinite free, no card, ~1 GB, throttle 125 KB/s. Tự shutdown khi idle dài.
- **Hobbyist/Startup/Business** (paid): có $300 trial credit / 30 ngày. No throttle.

> **Tại sao Valkey không phải Redis?** Valkey = fork open-source của Redis (sau khi Redis Inc đổi license 2024). Wire-compatible 100% với Redis 7.2, ioredis/Bull/BullMQ chạy unchanged.

### 5.A. Free plan (recommended cho production dài hạn)

1. https://console.aiven.io/signup → sign in GitHub/Google (no card)
2. **Create service**:
   - Service: **Aiven for Valkey**
   - Tier: **Free**
   - Cloud: **AWS**
   - Region: **us-east-1** (N. Virginia) — match HF + CockroachDB
   - Service name: `linvnix-valkey`
   - Version: Valkey 9.0 (default, OK)
3. Đợi RUNNING (~2-3 phút)
4. Tab **Overview** → **Connection information** → copy **Service URI**:
   ```
   rediss://default:<password>@linvnix-valkey-<project>.aivencloud.com:<random-port>
   ```
   - `rediss://` (s = TLS, Aiven bắt buộc)
   - Port random Aiven (vd 16642), KHÔNG phải 6379

5. **Verify eviction policy = `noeviction`** (BullMQ yêu cầu):
   ```bash
   REDIS_URL='rediss://...' bun -e "
   const Redis = require('ioredis');
   const r = new Redis(process.env.REDIS_URL, { tls: {} });
   console.log(await r.config('GET', 'maxmemory-policy'));
   await r.quit();
   "
   # Expected: [ 'maxmemory-policy', 'noeviction' ]
   ```
   Nếu khác → Aiven Console → service → **Advanced configuration** → add `valkey_maxmemory_policy` = `noeviction` → Save.

### 5.B. Paid plan (Business-4 cho test 30 ngày)

Bước 2 đổi:
- Tier: **Professional** → click **Use trial credits**
- Plan family: **Business**
- Plan size: **Business-4** (~$250/mo, vừa khít $300 trial)

⚠️ **Cùng warning với CockroachDB Standard trial**: hết 30 ngày phải delete/downgrade trước khi bị charge.

**Reset password** (khi cần rotate): Aiven Console → service → tab **Users** → user `default` → **Reset password** → URL mới.

## 6. Code adaptation (đã làm sẵn trong repo)

Backend đã được sửa để hỗ trợ HF deploy + CockroachDB + Aiven Valkey. Các file đã sửa:

- `backend/src/config/database.config.ts` — đọc `DATABASE_URL` (fallback HOST/PORT/...) + auto-detect SSL từ `sslmode=require`. Dùng `ssl: { rejectUnauthorized: false }` để bypass strict cert verify (CockroachDB Cloud cert hợp lệ nhưng container không có root.crt).
- `backend/src/config/redis.config.ts` — đọc `REDIS_URL` (fallback HOST/PORT/...) + auto-bật TLS khi scheme là `rediss://`
- `backend/src/infrastructure/queue/queue.module.ts` — propagate `tls` cho Bull
- `backend/src/infrastructure/cache/cache.service.ts` — propagate `tls` cho ioredis
- `backend/src/infrastructure/storage/storage.service.ts` — đọc `UPLOADS_DIR` env
- `backend/src/app.module.ts` — `ServeStaticModule.rootPath` đọc `UPLOADS_DIR`
- `backend/scripts/seed-lessons.ts` — đọc `DATABASE_URL` + SSL
- `backend/scripts/seed-simulations-direct.ts` — bypass Bull để seed từ local Windows (xem mục 11)
- `packages/shared/tsconfig.json` — exclude `*.spec.ts` khỏi build (nếu không HF builder fail)
- `Dockerfile` (root, copy từ `backend/Dockerfile` khi sync) — `COPY --from=builder /app/backend/uploads ./backend/uploads` để bake seed audio vào image runner

Trừ khi muốn refactor, không cần sửa thêm gì. Chỉ cần secrets đúng.

**TypeORM compatibility note**: dialect `type: 'postgres'` chạy wire-compatible với CockroachDB. PK dùng `@PrimaryGeneratedColumn('uuid')` (đã setup trong `base.entity.ts`), KHÔNG dùng `SERIAL` vì CockroachDB SERIAL = `unique_rowid()` (8 bytes int) khác Postgres SERIAL (auto-increment).

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
  -s 'DATABASE_URL=postgresql://linvnix:<password>@<cluster>.aws-us-east-1.cockroachlabs.cloud:26257/defaultdb?sslmode=require' \
  -s 'REDIS_URL=rediss://default:<password>@<host>.aivencloud.com:<port>' \
  -s 'NODE_ENV=production' \
  -s 'DATABASE_SYNCHRONIZE=true' \
  -s 'BASE_URL=https://tomisakae-linvnix.hf.space' \
  -s 'JWT_SECRET=<random-64-char-string>' \
  -s 'API_PREFIX=api' \
  -s 'API_VERSION=v1'

# Cleanup: xóa secrets legacy split-format (nếu trước đó dùng Neon/Upstash HOST/PORT)
for k in DATABASE_HOST DATABASE_PORT DATABASE_USER DATABASE_PASSWORD DATABASE_NAME REDIS_HOST REDIS_PORT REDIS_PASSWORD REDIS_DB; do
  hf spaces secrets delete tomisakae/linvnix "$k" --yes 2>/dev/null
done

# Liệt kê secrets đã set
hf spaces secrets ls tomisakae/linvnix
```

**Secrets bắt buộc**: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GENAI_API_KEYS`.
**Bắt buộc cho production**: `NODE_ENV=production`, `BASE_URL`.
**Bắt buộc khi deploy lần đầu**: `DATABASE_SYNCHRONIZE=true` (TypeORM sync schema). Sau khi schema ổn thì xóa: `hf spaces secrets delete tomisakae/linvnix DATABASE_SYNCHRONIZE --yes`.

> ⚠️ **KHÔNG set `UPLOADS_DIR=/data/uploads` ngay lúc deploy đầu** — `/data` chỉ tồn tại khi đã attach persistent storage. Set sai → `GET /uploads/...` trả 500 (`path must be absolute or specify root`). Cứ để code dùng default `/app/backend/uploads` (ephemeral, nhưng seed audio baked sẵn vào Docker image vẫn phục vụ được). Xem mục **20** để bật persistent storage khi cần.

**Generate JWT_SECRET**:
```bash
bun -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# hoặc:
openssl rand -base64 48
```

## 8.A. Setup Google OAuth (nếu dùng Google Sign-In)

Backend có route `/api/v1/auth/google` (redirect) và `/api/v1/auth/google/callback` (callback). Mobile dùng `google_sign_in` package gọi `serverClientId` (Web client ID).

### Google Cloud Console

https://console.cloud.google.com/apis/credentials

**1. OAuth 2.0 Client ID — loại Web application** (đã có, edit để thêm URL HF):

| Field | Thêm value |
|-------|-----------|
| Authorized JavaScript origins | `https://tomisakae-linvnix.hf.space` |
| Authorized redirect URIs | `https://tomisakae-linvnix.hf.space/api/v1/auth/google/callback` |

Giữ `http://localhost:3000` + callback localhost để dev local vẫn chạy.

**2. OAuth 2.0 Client ID — loại Android** (cho APK):

| Field | Value |
|-------|-------|
| Package name | `com.linvnix.app` |
| SHA-1 | Lấy bằng `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` |

Khi build APK release thật bằng upload keystore (mục 19), thêm SHA-1 keystore đó nữa.

**3. OAuth consent screen** (`Credentials/consent`):
- **Testing mode**: chỉ email trong "Test users" mới đăng nhập được → add list email muốn cho test.
- **Production**: cần publish app. Scope `email + profile` thường không cần Google verification.

### Update HF secret

```bash
hf spaces secrets add tomisakae/linvnix \
  -s 'GOOGLE_CALLBACK_URL=https://tomisakae-linvnix.hf.space/api/v1/auth/google/callback'
hf spaces restart tomisakae/linvnix
```

`GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` thường đã được upload từ `backend/.env` (bước 8 mục Cách 1).

### Verify

```bash
curl -sI https://tomisakae-linvnix.hf.space/api/v1/auth/google 2>&1 | head -3
# Expected: HTTP/1.1 302 Found với Location về accounts.google.com,
# redirect_uri=https%3A%2F%2Ftomisakae-linvnix.hf.space%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback
```

### Mobile build với Google Sign-In

```bash
cd mobile
flutter build apk --release \
  --dart-define=API_URL=https://tomisakae-linvnix.hf.space \
  --dart-define=GOOGLE_CLIENT_ID=<WEB_CLIENT_ID>.apps.googleusercontent.com
```

> Dùng **Web Client ID** (KHÔNG phải Android Client ID) cho `--dart-define=GOOGLE_CLIENT_ID`. Android Client ID chỉ được Google dùng nội bộ để verify SHA-1.

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

## 11. Seed dữ liệu vào CockroachDB

Sau khi backend lần đầu khởi động (schema được TypeORM sync), seed dữ liệu:

```bash
cd backend
export DATABASE_URL='postgresql://linvnix:<password>@<cluster>.aws-us-east-1.cockroachlabs.cloud:26257/defaultdb?sslmode=require'

# 1) Courses + modules + lessons + vocab + grammar + exercises (raw pg client, không bootstrap NestJS)
bun run seed:lessons

# 2) Simulations — DÙNG STANDALONE SCRIPT (bypass Bull queue init bị Bun + Windows fail)
bun run seed:simulations:direct
```

> **Tránh `seed:simulations` thẳng từ local máy Windows**: nó bootstrap full NestJS AppModule → Bull queue init đụng lỗi `TypeError: data argument must be of type string` do Bun + Bull + Windows incompat. Dùng `seed:simulations:direct` (script `seed-simulations-direct.ts`) — tạo `DataSource` thẳng, không qua Bull.
>
> Trong production container (Linux + Bun), Bull chạy bình thường. Lỗi chỉ xảy ra khi seed từ local Windows.

> **CockroachDB note**: TypeORM dialect `postgres` + driver `pg` chạy ngon với CockroachDB qua wire protocol. Port 26257 (KHÔNG phải 5432). Warning `SSL modes 'require' treated as 'verify-full'` từ pg-connection-string là cảnh báo deprecation, không ảnh hưởng functionality.

### 11.1 Flush Aiven Valkey cache sau khi seed

Backend cache 1h TTL. Nếu trước đó API đã được gọi (DB rỗng), kết quả `[]` bị cache. Sau seed phải flush:

```bash
cd backend  # cần để bun resolve ioredis dependency
REDIS_URL='rediss://default:<password>@<host>.aivencloud.com:<port>' bun -e "
const Redis = require('ioredis');
const r = new Redis(process.env.REDIS_URL, { tls: {} });
const before = await r.dbsize();
await r.flushdb();
const after = await r.dbsize();
console.log('Flushed:', before, '->', after);
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

Expected: 6 courses · 30 modules · 106 lessons · 677 vocab · 411 exercises · 6 categories · 15 scenarios · 34 characters.

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

### CockroachDB password
```bash
# 1. CockroachDB Console → cluster → SQL Users → user `linvnix` → Reset password → copy URL mới
# 2. Update HF secret
hf spaces secrets add tomisakae/linvnix -s 'DATABASE_URL=<new-url>'
# 3. Restart Space
hf spaces restart tomisakae/linvnix
```

### Aiven Valkey password
```bash
# 1. Aiven Console → service `linvnix-valkey` → Users → user `default` → Reset password → copy URL mới (giữ rediss://)
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

## 14. Migrate sang account mới (HF/CockroachDB/Aiven bị limit/ban)

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
  -s 'DATABASE_SYNCHRONIZE=true' \
  -s 'JWT_SECRET=<...>'

# 4. Clone Space mới và push code (xem mục 9)

# 5. Update mobile BASE URL
# Mobile dùng --dart-define API_URL=https://<new-username>-linvnix.hf.space khi build APK
```

### CockroachDB account mới
```bash
# 1. Sign up CockroachDB account mới, tạo cluster mới (region us-east-1, Basic plan)
# 2. Lấy DATABASE_URL mới (sửa sslmode=verify-full → require)
# 3. Update HF secret
hf spaces secrets add <space-id> -s 'DATABASE_URL=<new-url>'
hf spaces secrets add <space-id> -s 'DATABASE_SYNCHRONIZE=true'   # bật lại để sync schema
hf spaces restart <space-id>

# 4. Seed lại data
DATABASE_URL='<new-url>' bun run seed:lessons
DATABASE_URL='<new-url>' bun run seed:simulations:direct

# 5. Sau khi confirm OK, xóa synchronize
hf spaces secrets delete <space-id> DATABASE_SYNCHRONIZE --yes
```

### Aiven Valkey account mới
```bash
# 1. Sign up Aiven account mới (GitHub/Google, no card), tạo Valkey service Free plan
# 2. Verify maxmemory-policy=noeviction (mục 5.A bước 5)
# 3. Update HF secret
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
- CockroachDB yêu cầu SSL. Code đã auto-detect khi URL có `sslmode=require` hoặc `verify-full`.
- Code dùng `ssl: { rejectUnauthorized: false }` để bypass cert verification — không cần root.crt trong container.
- Nếu URL không có `sslmode=*`, set thêm: `hf spaces secrets add <space-id> -s 'DATABASE_SSL=true'`.

### Log: "SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'"
- Cảnh báo deprecation từ `pg-connection-string@2.x`. Không phải lỗi, app vẫn boot OK.
- Sẽ break ở pg v9.0 — lúc đó upgrade dependency thì sửa.

### API trả 404 cho anonymous request
- Space đang Private. Xem mục 10 để chuyển Public.

### Mobile gọi backend bị CORS
- Backend đã `app.enableCors()` không restrict origin. Nếu vẫn fail, kiểm tra `BASE_URL` có khớp host đang truy cập.

### MP3 user upload mất sau redeploy
- Chưa attach Storage Bucket / Volume. Truy cập HF Space Settings UI → Storage → Attach persistent storage (free tier có small bucket khi đã upgrade hardware; CPU Basic free thường không có /data persistent).
- Workaround: chuyển sang Cloudflare R2 (S3-compatible, 10GB free) — refactor `storage.service.ts` dùng S3 SDK.

### Runtime: `GET /uploads/...` trả 500 "path must be absolute or specify root to res.sendFile"
- `UPLOADS_DIR` được set tới một thư mục KHÔNG TỒN TẠI trong container (thường là `/data/uploads` khi chưa attach persistent storage).
- ServeStaticModule init với rootPath không hợp lệ → mọi request file bị 500.
- Fix nhanh: xóa secret để fallback về `/app/backend/uploads` (đã có seed audio baked vào image):
  ```bash
  hf spaces secrets delete tomisakae/linvnix UPLOADS_DIR --yes
  hf spaces restart tomisakae/linvnix
  ```
- Fix đúng (cho persistent): xem mục **20 — Bật persistent storage cho MP3**.

### Google Sign-In: `redirect_uri_mismatch` hoặc `invalid_client`
- Cloud Console chưa add URL HF Space vào OAuth client. Xem mục **8.A**.
- Hoặc HF secret `GOOGLE_CALLBACK_URL` chưa update — vẫn trỏ `http://localhost:3000/...`:
  ```bash
  hf spaces secrets add tomisakae/linvnix \
    -s 'GOOGLE_CALLBACK_URL=https://tomisakae-linvnix.hf.space/api/v1/auth/google/callback'
  hf spaces restart tomisakae/linvnix
  ```

### Mobile login Google trả lỗi `DEVELOPER_ERROR` (code 10) trên Android
- SHA-1 của keystore ký APK chưa được add vào Android OAuth Client. Lấy SHA-1:
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
- Add vào Google Cloud Console → Credentials → Android OAuth Client → SHA-1 fingerprints.
- Build APK release với upload keystore → cần thêm SHA-1 của upload keystore nữa.

### `findAll` API vẫn trả `[]` sau khi seed thành công
- CacheService cache 1h TTL trên Aiven Valkey. Kết quả `[]` từ lần gọi trước (DB rỗng) bị cache.
- Flush cache:
  ```bash
  cd backend
  REDIS_URL='rediss://...' bun -e "
  const Redis = require('ioredis');
  const r = new Redis(process.env.REDIS_URL, { tls: {} });
  await r.flushdb(); console.log('Flushed'); await r.quit();
  "
  ```

### Aiven Valkey "ETIMEDOUT" hoặc "Connection is closed"
- Aiven Free tier shutdown nếu idle dài → service POWER_OFF state.
- Vào Aiven Console → service → click **Power on**. Service quay lại RUNNING sau 1-2 phút.
- Workaround: setup cron ping mỗi 30 phút, hoặc upgrade lên paid plan.

### Bull job mất silently sau khi enqueue
- Eviction policy SAI (`allkeys-lru` thay vì `noeviction`).
- Verify config:
  ```bash
  REDIS_URL='rediss://...' bun -e "
  const Redis = require('ioredis');
  const r = new Redis(process.env.REDIS_URL, { tls: {} });
  console.log(await r.config('GET', 'maxmemory-policy'));
  await r.quit();
  "
  # Expected: [ 'maxmemory-policy', 'noeviction' ]
  ```
- Aiven default đã đúng. Nếu khác → Advanced configuration → set `valkey_maxmemory_policy=noeviction`.

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
| CockroachDB Basic | 10 GB + 50M RU/tháng | RU sắp chạm 40M → check hot queries, tăng cache TTL |
| CockroachDB Standard (trial) | $400 credit / 30 ngày | Credit < $50 hoặc <5 ngày → quyết định downgrade/migrate |
| Aiven Valkey Free | ~1 GB + 125 KB/s throughput | Throughput sustained > 100 KB/s → cân nhắc paid |
| Aiven Valkey paid (trial) | $300 credit / 30 ngày | Credit < $50 → quyết định downgrade/migrate |
| Gemini | $0.X/1M token (có miễn phí ban đầu) | Set quota alert trong Google Cloud Console |
| HF Spaces | CPU Basic, không ngủ | Hardware ổn — không lo |
| HF Storage (Bucket) | 5 GB private free | MP3 upload nhiều → cân nhắc R2 |

Check usage:
- CockroachDB: Console → cluster → **Monitoring** + **Billing → Usage**
- Aiven: Console → service → **Metrics** + organization **Billing**
- HF: Settings → **Billing**
- Gemini: Google AI Studio → **API key usage**

### ⚠️ Trial expiration reminders

Nếu dùng paid trial (CockroachDB Standard / Aiven Business), **đặt Google Calendar reminder 2 ngày trước expire**:
- CockroachDB Standard trial: ~30 ngày từ ngày tạo
- Aiven Business trial: ~30 ngày từ ngày tạo

Trước expire phải làm 1 trong:
1. **Downgrade về Free plan** trong UI (giữ data, miễn phí forever)
2. **Migrate sang account/service free khác** (xem mục 14)
3. **Add card** (chấp nhận charge ~$200-330/tháng)

Bỏ qua = service bị paused/deleted hoặc bị charge tự động (nếu đã add card).

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

## 20. Bật persistent storage cho MP3 runtime upload (optional)

Mặc định MP3 baked vào Docker image (seed) phục vụ OK; MP3 user upload runtime nằm trong `/app/backend/uploads` (ephemeral, mất khi rebuild). Để giữ runtime uploads:

### Option A — HF Space Storage Bucket (free tier có 5 GB private)

1. https://huggingface.co/spaces/tomisakae/linvnix/settings → tab **Storage** → **Attach storage bucket**
2. Tạo Bucket mới hoặc chọn existing, mount path = `/data`
3. Sau khi attach (Space auto-restart), set lại `UPLOADS_DIR`:
   ```bash
   hf spaces secrets add tomisakae/linvnix -s 'UPLOADS_DIR=/data/uploads'
   hf spaces restart tomisakae/linvnix
   ```
4. Trong container, code tự tạo `/data/uploads` nhờ `storage.service.ts:ensureUploadDir()`.

Verify:
```bash
# Upload thử qua API (cần JWT)
curl -X POST https://tomisakae-linvnix.hf.space/api/v1/vocabularies/upload-audio \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./test.mp3"
# → trả URL kiểu /uploads/audio/<uuid>.mp3

# Restart Space:
hf spaces restart tomisakae/linvnix
# → file vẫn truy cập được nhờ /data persistent
```

### Option B — Migrate seed audio sang /data sau khi attach Bucket

Sau khi attach Bucket nhưng `/data` rỗng → seed audio (đang ở `/app/backend/uploads` baked image) không serve được nữa nếu set `UPLOADS_DIR=/data/uploads`.

Cần copy seed audio sang `/data` lần đầu. Có 2 cách:

**Cách 1 — Build-time copy** (sửa Dockerfile):
```dockerfile
# Trong runner stage, thêm vào CMD entrypoint hoặc script:
CMD sh -c "mkdir -p /data/uploads && cp -rn /app/backend/uploads/* /data/uploads/ 2>/dev/null; bun dist/main.js"
```
`-n` flag = no-clobber: không ghi đè file đã có trên /data.

**Cách 2 — Upload qua hf sync** (sau khi attach Bucket):
```bash
# hf CLI có thể sync files vào Space Bucket
hf sync ./backend/uploads/ hf://spaces/tomisakae/linvnix:/data/uploads/ --apply
```

### Option C — Cloudflare R2 (S3-compatible, 10 GB free, no egress fee)

Phù hợp khi audio nhiều, không muốn phụ thuộc HF storage.

1. https://dash.cloudflare.com → R2 → Create bucket `linvnix-uploads`
2. Tạo API token: R2 → Manage R2 API Tokens → Create → permissions: Object Read+Write
3. Lấy `Access Key ID`, `Secret Access Key`, `Endpoint` (`https://<account>.r2.cloudflarestorage.com`)
4. **Refactor cần làm** (chưa có trong code):
   - Cài `@aws-sdk/client-s3`
   - Sửa `storage.service.ts` thay vì `fs.writeFile` thì gọi `s3.send(new PutObjectCommand(...))`
   - Đổi URL trả về: dùng presigned URL hoặc public R2 URL nếu bucket public
   - Thay `ServeStaticModule.forRoot({rootPath: ...})` bằng redirect controller proxy đến R2
5. Set HF secrets:
   ```bash
   hf spaces secrets add tomisakae/linvnix \
     -s 'R2_ACCESS_KEY_ID=...' \
     -s 'R2_SECRET_ACCESS_KEY=...' \
     -s 'R2_BUCKET=linvnix-uploads' \
     -s 'R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com'
   hf spaces restart tomisakae/linvnix
   ```

R2 ưu thế dài hạn (no egress fee → stream MP3 thoải mái), nhưng đòi 1 đợt refactor.

---

Nếu MVP còn nhỏ và seed audio đủ dùng → cứ ephemeral, bỏ qua mục này.

---

Nếu bị stuck ở bước nào, đọc lại mục **15. Troubleshooting** trước rồi mới mò log.
