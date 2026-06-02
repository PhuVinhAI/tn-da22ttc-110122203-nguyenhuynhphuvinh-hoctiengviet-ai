import { useNavigate, useParams } from 'react-router'
import {
  TrendingUp, Target, BookOpen, MessageSquare, Bot, Sparkles,
  Mail, Flame, Award, CheckCircle2, XCircle, Clock, Calendar,
  ChevronRight, ListChecks, TextCursorInput, ArrowLeftRight, ListOrdered,
  Languages, Headphones, Mic, BookMarked, User2, Image as ImageIcon,
  GraduationCap, Layers, FileQuestion, MessageCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Tabs, TabsContent } from '../../components/ui/tabs'
import { AdminTabsList, AdminTabTrigger } from '../../components/admin/AdminTabs'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { LearnerDetailSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { useAdminLearner } from '../../features/learners/api/use-learners-admin'
import type {
  Bookmark, ExerciseResult, ExerciseOptionsLike,
} from '../../features/learners/types'
import { learnerPath } from './route-utils'

const levelMeta: Record<string, { label: string; bg: string }> = {
  A1: { label: 'Mới bắt đầu', bg: 'bg-emerald-500' },
  A2: { label: 'Sơ cấp', bg: 'bg-teal-500' },
  B1: { label: 'Trung cấp', bg: 'bg-blue-500' },
  B2: { label: 'Trên trung cấp', bg: 'bg-indigo-500' },
  C1: { label: 'Cao cấp', bg: 'bg-purple-500' },
  C2: { label: 'Thông thạo', bg: 'bg-rose-500' },
}

const avatarColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-teal-500',
  'bg-fuchsia-500',
]

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function hashColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Hoàn thành',
  in_progress: 'Đang học',
  not_started: 'Chưa bắt đầu',
  active: 'Đang diễn ra',
  paused: 'Tạm dừng',
  abandoned: 'Bỏ dở',
  ended: 'Kết thúc',
  ACTIVE: 'Đang diễn ra',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  ABANDONED: 'Bỏ dở',
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  in_progress: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  not_started: 'bg-muted text-muted-foreground',
  active: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  paused: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  abandoned: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  ended: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  ACTIVE: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  PAUSED: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  ABANDONED: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  course: 'Khóa học',
  module: 'Chủ đề',
  lesson: 'Bài học',
}

const EXERCISE_TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; tone: string }
> = {
  multiple_choice: {
    label: 'Trắc nghiệm',
    icon: ListChecks,
    tone: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  },
  fill_blank: {
    label: 'Điền chỗ trống',
    icon: TextCursorInput,
    tone: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
  },
  matching: {
    label: 'Ghép cặp',
    icon: ArrowLeftRight,
    tone: 'bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300',
  },
  ordering: {
    label: 'Sắp xếp',
    icon: ListOrdered,
    tone: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  },
  translation: {
    label: 'Dịch',
    icon: Languages,
    tone: 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
  },
  listening: {
    label: 'Nghe',
    icon: Headphones,
    tone: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
  },
  speaking: {
    label: 'Nói',
    icon: Mic,
    tone: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  },
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: 'Danh từ',
  verb: 'Động từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  pronoun: 'Đại từ',
  preposition: 'Giới từ',
  conjunction: 'Liên từ',
  phrase: 'Cụm từ',
  interjection: 'Thán từ',
}

const VOCAB_SOURCE_LABELS: Record<string, string> = {
  IMAGE_DISCOVERY: 'Từ ảnh',
  MANUAL: 'Tự thêm',
}

function exerciseTypeMeta(type?: string) {
  if (!type) return { label: 'Bài tập', icon: FileQuestion, tone: 'bg-muted text-muted-foreground' }
  return (
    EXERCISE_TYPE_META[type] ?? {
      label: type.replaceAll('_', ' '),
      icon: FileQuestion,
      tone: 'bg-muted text-muted-foreground',
    }
  )
}

function exercisePrompt(row: ExerciseResult): string {
  const ex = row.exercise
  if (!ex) return 'Không có dữ liệu bài tập'
  if (ex.question && ex.question.trim().length > 0) return ex.question
  const opts: ExerciseOptionsLike | null | undefined = ex.options
  if (!opts) return '—'
  switch (ex.exerciseType) {
    case 'fill_blank':
      return opts.sentence?.replaceAll('___', '____') ?? 'Điền vào chỗ trống'
    case 'translation':
      return opts.sourceText ?? 'Dịch câu sau'
    case 'speaking':
      return opts.promptText ?? 'Bài luyện nói'
    case 'listening':
      return opts.audioUrl ? 'Nghe đoạn ghi âm' : 'Bài luyện nghe'
    case 'matching':
      if (opts.pairs?.length) {
        const preview = opts.pairs.slice(0, 2).map((p) => `${p.left} ↔ ${p.right}`).join(' · ')
        return `${opts.pairs.length} cặp ghép — ${preview}${opts.pairs.length > 2 ? '…' : ''}`
      }
      return 'Bài ghép cặp'
    case 'ordering':
      if (opts.items?.length) return `Sắp xếp ${opts.items.length} mục`
      return 'Bài sắp xếp'
    default:
      return '—'
  }
}

export function LearnerDetailPage() {
  const { learnerId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch, isFetching } = useAdminLearner(learnerId)

  const learner = data?.user
  const meta = levelMeta[learner?.currentLevel ?? ''] ?? { label: '—', bg: 'bg-muted' }
  const progressPercent = data
    ? data.summary.progressCount > 0
      ? Math.round((data.summary.completedProgressCount / data.summary.progressCount) * 100)
      : 0
    : 0
  const accuracyPercent = data
    ? data.summary.exerciseResultsCount > 0
      ? Math.round(
          (data.summary.correctExerciseResultsCount / data.summary.exerciseResultsCount) * 100
        )
      : 0
    : 0

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Học viên', href: learnerPath.learners() },
          { label: learner?.fullName ?? 'Chi tiết' },
        ]}
      />

      {isLoading ? (
        <LearnerDetailSkeleton />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data ? (
        <>
          {/* Profile hero */}
          <div className="rounded-xl border-2 border-border bg-card p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-white text-2xl font-bold ${hashColor(learner?.id ?? '')}`}
              >
                {getInitials(learner?.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white ${meta.bg}`}
                  >
                    {learner?.currentLevel ?? '—'} · {meta.label}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground capitalize">
                    {learner?.role ?? '—'}
                  </span>
                  {learner?.preferredDialect && (
                    <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Giọng {learner.preferredDialect}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {learner?.fullName ?? 'Học viên'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {learner?.email}
                </p>
                {learner?.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Tham gia: {formatDate(learner.createdAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StreakBadge
                  current={data.summary.currentStreak}
                  longest={data.summary.longestStreak}
                />
              </div>
            </div>

            {/* Progress bars */}
            <div className="mt-4 pt-4 border-t-2 border-border grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgressBar
                label="Tiến độ học"
                hint={`${data.summary.completedProgressCount} / ${data.summary.progressCount} hạng mục`}
                percent={progressPercent}
                color="bg-primary"
              />
              <ProgressBar
                label="Độ chính xác bài tập"
                hint={`${data.summary.correctExerciseResultsCount} / ${data.summary.exerciseResultsCount} câu đúng`}
                percent={accuracyPercent}
                color="bg-emerald-500"
              />
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={BookOpen}
              label="Bài tập đã làm"
              value={data.summary.exerciseResultsCount}
              tone="blue"
            />
            <MetricCard
              icon={Sparkles}
              label="Từ vựng cá nhân"
              value={data.summary.personalVocabularyCount}
              tone="purple"
            />
            <MetricCard
              icon={MessageSquare}
              label="Phiên mô phỏng"
              value={data.summary.simulationCount}
              tone="rose"
            />
            <MetricCard
              icon={Bot}
              label="Hội thoại AI"
              value={data.summary.conversationCount}
              tone="amber"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="progress" className="space-y-4">
            <AdminTabsList>
              <AdminTabTrigger value="progress" icon={TrendingUp} label="Tiến độ" count={data.progress.length} />
              <AdminTabTrigger value="exercises" icon={BookOpen} label="Bài tập" count={data.exerciseResults.length} />
              <AdminTabTrigger value="vocabulary" icon={Sparkles} label="Từ vựng" count={data.bookmarks.length} />
              <AdminTabTrigger value="simulations" icon={MessageSquare} label="Mô phỏng" count={data.simulations.length} />
              <AdminTabTrigger value="ai" icon={Bot} label="Hội thoại AI" count={data.conversations.length} />
              <AdminTabTrigger value="goals" icon={Target} label="Mục tiêu" count={data.dailyGoals.length} />
            </AdminTabsList>

            {/* PROGRESS — timeline-style list */}
            <TabsContent value="progress" className="mt-4 space-y-2.5">
              {data.progress.length === 0 ? (
                <EmptyState icon={TrendingUp} message="Chưa có tiến độ học tập" />
              ) : (
                data.progress.map((row) => {
                  const { icon: UnitIcon, tone: unitTone } = unitTypeMeta(row.unitType)
                  const title =
                    row.lesson?.title ?? row.module?.title ?? row.course?.title ??
                    UNIT_TYPE_LABELS[row.unitType] ?? row.unitType
                  const hasRealScore = row.score != null && row.score > 0
                  return (
                    <div
                      key={row.id}
                      className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4"
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${unitTone}`}>
                        <UnitIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate">
                          {title}
                        </p>
                        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="font-semibold">
                            {UNIT_TYPE_LABELS[row.unitType] ?? row.unitType}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatSeconds(row.timeSpent)}
                          </span>
                          {row.completedAt && (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              {formatDate(row.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasRealScore && (
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Điểm
                          </p>
                          <p className="text-lg font-bold tabular-nums text-foreground leading-tight">
                            {formatScore(row.score!)}
                          </p>
                        </div>
                      )}
                      <StatusPill status={row.status} />
                    </div>
                  )
                })
              )}
            </TabsContent>

            {/* EXERCISES — per-type prompt cards */}
            <TabsContent value="exercises" className="mt-4 space-y-2.5">
              {data.exerciseResults.length === 0 ? (
                <EmptyState icon={BookOpen} message="Chưa có kết quả bài tập" />
              ) : (
                data.exerciseResults.map((row) => {
                  const typeMeta = exerciseTypeMeta(row.exercise?.exerciseType)
                  const TypeIcon = typeMeta.icon
                  const prompt = exercisePrompt(row)
                  const setTitle = row.exercise?.exerciseSet?.title
                  const lastCorrect = row.lastAttempt?.isCorrect ?? row.isCorrect
                  return (
                    <div
                      key={row.id}
                      className="flex items-start gap-4 rounded-xl border-2 border-border bg-card p-4"
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${typeMeta.tone}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeMeta.tone}`}>
                            {typeMeta.label}
                          </span>
                          {row.exercise?.difficultyLevel != null && (
                            <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Độ khó {row.exercise.difficultyLevel}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              lastCorrect
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {lastCorrect ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {lastCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                        <p className="text-[15px] font-semibold text-foreground line-clamp-2 leading-snug">
                          {prompt}
                        </p>
                        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2 flex-wrap">
                          {setTitle && (
                            <span className="inline-flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[200px]">{setTitle}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <ListOrdered className="h-3.5 w-3.5" />
                            {row.attemptCount} lần làm
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(row.attemptedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Điểm cao nhất
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-foreground leading-none mt-0.5">
                          {row.bestScore || row.score}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </TabsContent>

            {/* VOCABULARY — full bookmarks, grouped by source */}
            <TabsContent value="vocabulary" className="mt-4 space-y-6">
              {data.bookmarks.length === 0 ? (
                <EmptyState icon={Sparkles} message="Chưa có từ vựng đã lưu" />
              ) : (
                (() => {
                  const systemBookmarks = data.bookmarks.filter((b) => b.vocabulary)
                  const personalBookmarks = data.bookmarks.filter((b) => b.personalVocabulary)
                  return (
                    <>
                      {systemBookmarks.length > 0 && (
                        <BookmarkGroup
                          title="Từ vựng hệ thống"
                          hint="Từ trong bài học mà học viên đã lưu"
                          icon={BookMarked}
                          count={systemBookmarks.length}
                          bookmarks={systemBookmarks}
                        />
                      )}
                      {personalBookmarks.length > 0 && (
                        <BookmarkGroup
                          title="Từ vựng cá nhân"
                          hint="Từ học viên tự thêm hoặc bóc từ ảnh"
                          icon={User2}
                          count={personalBookmarks.length}
                          bookmarks={personalBookmarks}
                        />
                      )}
                    </>
                  )
                })()
              )}
            </TabsContent>

            {/* SIMULATIONS — rich cards matching other tabs */}
            <TabsContent value="simulations" className="mt-4 space-y-2.5">
              {data.simulations.length === 0 ? (
                <EmptyState icon={MessageSquare} message="Chưa có phiên mô phỏng" />
              ) : (
                data.simulations.map((row) => {
                  const messageCount = row.messageCount ?? row.totalMessages ?? 0
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() =>
                        learnerId && navigate(learnerPath.simulation(learnerId, row.id))
                      }
                      className="w-full flex items-start gap-4 rounded-xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Mô phỏng
                          </span>
                          <StatusPill status={row.status} />
                          {row.chosenCharacter?.name && (
                            <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Vai · {row.chosenCharacter.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] font-bold text-foreground line-clamp-2 leading-snug">
                          {row.scenario?.title ?? 'Tình huống'}
                        </p>
                        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {messageCount} tin nhắn
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(row.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Điểm
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-foreground leading-none mt-0.5">
                          {row.totalScore != null ? row.totalScore : '—'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                    </button>
                  )
                })
              )}
            </TabsContent>

            {/* AI — rich conversation cards */}
            <TabsContent value="ai" className="mt-4 space-y-2.5">
              {data.conversations.length === 0 ? (
                <EmptyState icon={Bot} message="Chưa có hội thoại AI" />
              ) : (
                data.conversations.map((row) => {
                  const contextLabel =
                    [row.course?.title, row.lesson?.title].filter(Boolean).join(' › ')
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() =>
                        learnerId && navigate(learnerPath.conversation(learnerId, row.id))
                      }
                      className="w-full flex items-start gap-4 rounded-xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Hội thoại AI
                          </span>
                          {contextLabel && (
                            <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">
                              {contextLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] font-bold text-foreground line-clamp-2 leading-snug">
                          {row.title || 'Hội thoại không có tiêu đề'}
                        </p>
                        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2 flex-wrap">
                          {row.messageCount != null && (
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {row.messageCount} tin nhắn
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(row.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                    </button>
                  )
                })
              )}
            </TabsContent>

            {/* GOALS — chip list */}
            <TabsContent value="goals" className="mt-4">
              {data.dailyGoals.length === 0 ? (
                <EmptyState icon={Target} message="Chưa có mục tiêu hàng ngày" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.dailyGoals.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-lg border-2 border-border bg-card p-4 flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Target className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Mục tiêu / ngày
                        </p>
                        <p className="text-base font-bold text-foreground capitalize">
                          {row.goalType}
                        </p>
                      </div>
                      <p className="text-xl font-bold tabular-nums text-primary shrink-0">
                        {row.targetValue}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: number
  tone: 'blue' | 'purple' | 'rose' | 'amber'
}) {
  const toneMap = {
    blue: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    rose: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  }
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneMap[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
    </div>
  )
}

function ProgressBar({
  label,
  hint,
  percent,
  color,
}: {
  label: string
  hint: string
  percent: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  )
}

function StreakBadge({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-card px-3 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
        <Flame className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Streak
        </p>
        <p className="text-lg font-bold tabular-nums">
          {current} <span className="text-xs font-normal text-muted-foreground">ngày</span>
        </p>
      </div>
      <div className="h-10 w-0.5 bg-border hidden sm:block" aria-hidden />
      <div className="hidden sm:block">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Award className="h-3 w-3" />
          Kỷ lục
        </p>
        <p className="text-sm font-bold tabular-nums">{longest} ngày</p>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status.replace('_', ' ')
  const color = STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${color}`}
    >
      {label}
    </span>
  )
}

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
      <Icon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN')
}

function formatSeconds(value?: number | null) {
  if (value == null || value <= 0) return '0 giây'
  const total = Math.round(value)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h} giờ ${m} phút`
  if (m > 0) return `${m} phút ${s} giây`
  return `${s} giây`
}

function formatScore(value: number) {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

function unitTypeMeta(unitType: string): { icon: LucideIcon; tone: string } {
  switch (unitType) {
    case 'course':
      return {
        icon: GraduationCap,
        tone: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
      }
    case 'module':
      return {
        icon: Layers,
        tone: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
      }
    case 'lesson':
    default:
      return {
        icon: BookOpen,
        tone: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
      }
  }
}

function BookmarkGroup({
  title,
  hint,
  icon: Icon,
  count,
  bookmarks,
}: {
  title: string
  hint: string
  icon: LucideIcon
  count: number
  bookmarks: Bookmark[]
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-full px-2 text-xs font-bold tabular-nums bg-muted text-muted-foreground">
              {count}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bookmarks.map((b) => (
          <BookmarkCard key={b.id} bookmark={b} />
        ))}
      </div>
    </section>
  )
}

function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
  const isSystem = !!bookmark.vocabulary
  const ref = bookmark.vocabulary ?? bookmark.personalVocabulary
  if (!ref) return null
  const partOfSpeech = ref.partOfSpeech
  const personal = bookmark.personalVocabulary
  const region = bookmark.vocabulary?.region
  const sourceLabel = personal ? VOCAB_SOURCE_LABELS[personal.source] ?? personal.source : null

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 flex flex-col">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isSystem
              ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
              : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
          }`}
        >
          {isSystem ? (
            <>
              <BookMarked className="h-3 w-3" />
              Hệ thống
            </>
          ) : (
            <>
              {personal?.source === 'IMAGE_DISCOVERY' ? (
                <ImageIcon className="h-3 w-3" />
              ) : (
                <User2 className="h-3 w-3" />
              )}
              {sourceLabel ?? 'Cá nhân'}
            </>
          )}
        </span>
        {partOfSpeech && (
          <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {PART_OF_SPEECH_LABELS[partOfSpeech] ?? partOfSpeech}
          </span>
        )}
        {region && (
          <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Giọng {region}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-foreground leading-tight">{ref.word}</p>
      {ref.phonetic && (
        <p className="text-xs font-mono text-muted-foreground mt-0.5">/{ref.phonetic}/</p>
      )}
      <p className="text-sm text-foreground/80 mt-1.5 line-clamp-2">{ref.translation}</p>
      {ref.exampleSentence && (
        <p className="text-xs italic text-muted-foreground mt-2 line-clamp-2 border-t-2 border-border pt-2">
          “{ref.exampleSentence}”
        </p>
      )}
      <p className="text-[10px] text-muted-foreground/70 mt-auto pt-2.5 tabular-nums">
        Đã lưu {formatDate(bookmark.createdAt)}
      </p>
    </div>
  )
}
