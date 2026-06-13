import { Link, useParams } from 'react-router'
import {
  ArrowLeft, MessageSquare, Trophy, Activity, Sparkles,
  AlertCircle, CheckCircle2, MessageCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConversationSkeleton, MetricCardsSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { useAdminLearnerAnalytics, useAdminLearnerSimulation } from '../../features/learners/api/use-learners-admin'
import type { SimulationMessage } from '../../features/learners/types'
import { learnerPath } from './route-utils'

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

const STATUS_META: Record<string, { label: string; tone: string }> = {
  ACTIVE: {
    label: 'Đang diễn ra',
    tone: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  },
  PAUSED: {
    label: 'Tạm dừng',
    tone: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    tone: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  },
  ABANDONED: {
    label: 'Bỏ dở',
    tone: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  },
}

const END_REASON_LABELS: Record<string, string> = {
  COMPLETED: 'Hoàn thành kịch bản',
  USER_ENDED: 'Học viên kết thúc',
  TIMEOUT: 'Hết thời gian',
  ERROR: 'Lỗi hệ thống',
}

function statusMeta(status?: string) {
  if (!status) return { label: '—', tone: 'bg-muted text-muted-foreground' }
  return (
    STATUS_META[status.toUpperCase()] ?? {
      label: status,
      tone: 'bg-muted text-muted-foreground',
    }
  )
}

export function LearnerSimulationDetailPage() {
  const { learnerId, sessionId } = useParams()
  const { data: learnerData } = useAdminLearnerAnalytics(learnerId)
  const { data, isLoading, error, refetch, isFetching } = useAdminLearnerSimulation(learnerId, sessionId)

  const learner = learnerData?.user
  const session = data?.session
  const meta = statusMeta(session?.status)
  const messages = data?.messages ?? []
  const totalScore = session?.totalScore ?? null
  const criteriaScores = session?.criteriaScores ?? []
  const hasCriteria = criteriaScores.length > 0
  const aiSummary = session?.aiSummary?.trim() ?? ''

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Học viên', href: learnerPath.learners() },
          { label: learner?.fullName ?? 'Chi tiết', href: learnerId ? learnerPath.learner(learnerId) : undefined },
          { label: session?.scenario?.title ?? 'Phiên mô phỏng' },
        ]}
      />

      <div className="flex items-center gap-3">
        {learnerId && (
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 mt-0.5">
            <Link to={learnerPath.learner(learnerId)}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">Phiên mô phỏng</span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}>
              {meta.label}
            </span>
            {session?.chosenCharacter?.name && (
              <span className="inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Vai · {session.chosenCharacter.name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight truncate">
            {session?.scenario?.title ?? 'Phiên mô phỏng'}
          </h1>
        </div>
      </div>

      {isLoading ? (
        <>
          <MetricCardsSkeleton count={4} columns="md:grid-cols-4" />
          <ConversationSkeleton count={6} />
        </>
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data ? (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatusMetric status={session?.status} />
            <Metric
              icon={Trophy}
              label="Điểm"
              value={totalScore != null ? totalScore : '—'}
              tone="amber"
            />
            <Metric
              icon={MessageSquare}
              label="Tin nhắn"
              value={messages.length}
              tone="blue"
            />
          </div>

          {/* Criteria scores / summary */}
          {(hasCriteria || aiSummary) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {hasCriteria && (
                <div className="lg:col-span-2 rounded-xl border-2 border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Điểm chi tiết</h3>
                  </div>
                  <div className="space-y-3">
                    {criteriaScores.map((c, idx) => (
                      <CriteriaRow key={`${c.name}-${idx}`} criteria={c} />
                    ))}
                  </div>
                </div>
              )}
              {aiSummary && (
                <div className="rounded-xl border-2 border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Nhận xét AI</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {aiSummary}
                  </p>
                  {session?.endReason && (
                    <p className="mt-3 pt-3 border-t-2 border-border text-xs text-muted-foreground">
                      Lý do kết thúc: <span className="font-semibold text-foreground">{END_REASON_LABELS[session.endReason] ?? session.endReason}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xl font-bold tracking-tight">Hội thoại</h2>

            {messages.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Chưa có tin nhắn</p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 space-y-4">
                {messages.map((message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    learnerName={learner?.fullName ?? 'Học viên'}
                    learnerId={learner?.id ?? 'learner'}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function MessageRow({
  message,
  learnerName,
  learnerId,
}: {
  message: SimulationMessage
  learnerName: string
  learnerId: string
}) {
  const isOpening = !message.isLearner && !message.speakerCharacterId
  if (isOpening) {
    return <OpeningMessage message={message} />
  }

  const isLearner = message.isLearner
  const speakerName = isLearner
    ? learnerName
    : message.speakerCharacter?.name ?? 'Nhân vật'
  const speakerId = isLearner
    ? learnerId
    : message.speakerCharacter?.id ?? 'character'

  return (
    <div className={`flex gap-2.5 ${isLearner ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${hashColor(speakerId)}`}
      >
        {getInitials(speakerName)}
      </div>
      <div className={`flex-1 min-w-0 flex flex-col ${isLearner ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {speakerName}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            #{message.orderIndex}
          </span>
          {message.feedback?.corrections && message.feedback.corrections.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              {message.feedback.corrections.length} chỉnh sửa
            </span>
          )}
        </div>
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-2.5 border-2 ${
            isLearner
              ? 'bg-primary/8 border-primary/30'
              : 'bg-muted/40 border-border'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {message.content}
          </p>
          {message.translation && message.translation.trim() && (
            <p className="text-xs italic text-muted-foreground mt-1.5 pt-1.5 border-t-2 border-border/60">
              {message.translation}
            </p>
          )}
        </div>
        {message.feedback?.review && message.feedback.reviewAvailable && (
          <div className="mt-1.5 max-w-[85%] rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-900 px-3 py-2">
            <div className="flex items-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Nhận xét
            </div>
            <p className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-100">
              {message.feedback.review}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function OpeningMessage({ message }: { message: SimulationMessage }) {
  return (
    <div className="flex justify-center py-2">
      <div className="max-w-[90%] text-center">
        <p className="text-xs italic text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        {message.translation && message.translation.trim() && (
          <p className="text-[11px] italic text-muted-foreground/60 mt-1 leading-relaxed whitespace-pre-wrap">
            {message.translation}
          </p>
        )}
      </div>
    </div>
  )
}

function CriteriaRow({
  criteria,
}: {
  criteria: { name: string; score: number; maxScore: number; comment: string }
}) {
  const percent =
    criteria.maxScore > 0
      ? Math.round((criteria.score / criteria.maxScore) * 100)
      : 0
  const color =
    percent >= 80
      ? 'bg-emerald-500'
      : percent >= 50
        ? 'bg-amber-500'
        : 'bg-rose-500'
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-foreground">{criteria.name}</span>
        <span className="text-sm font-bold tabular-nums">
          {criteria.score}/{criteria.maxScore}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      {criteria.comment && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {criteria.comment}
        </p>
      )}
    </div>
  )
}

const TONE_MAP = {
  blue: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  indigo: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
  rose: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  purple: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
} as const

type Tone = keyof typeof TONE_MAP

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  tone: Tone
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TONE_MAP[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
    </div>
  )
}

function StatusMetric({ status }: { status?: string }) {
  const meta = statusMeta(status)
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${meta.tone}`}>
        <Activity className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3">
        Trạng thái
      </p>
      <p className="text-lg font-bold text-foreground mt-1">{meta.label}</p>
    </div>
  )
}
