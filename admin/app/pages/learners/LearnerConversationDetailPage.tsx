import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  Bot, ArrowLeft, MessageSquare, Calendar,
  Wrench, ChevronDown, ChevronRight, AlertTriangle,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConversationSkeleton, MetricCardsSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { MarkdownContent } from '../../components/admin/MarkdownContent'
import { useAdminLearnerAnalytics, useAdminLearnerConversation } from '../../features/learners/api/use-learners-admin'
import type {
  ConversationMessage, ConversationMessageToolCall, ConversationMessageToolResult,
} from '../../features/learners/types'
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

export function LearnerConversationDetailPage() {
  const { learnerId, conversationId } = useParams()
  const { data: learnerData } = useAdminLearnerAnalytics(learnerId)
  const { data, isLoading, error, refetch, isFetching } = useAdminLearnerConversation(learnerId, conversationId)

  const learner = learnerData?.user
  const conversation = data?.conversation

  const allMessages = data?.messages ?? []
  const visibleMessages = allMessages.filter((m) => {
    if (m.role === 'user') return true
    if (m.role === 'assistant') {
      return m.content.trim().length > 0 || m.interrupted
    }
    if (m.role === 'tool') {
      return (m.toolCalls?.length ?? 0) > 0 || (m.toolResults?.length ?? 0) > 0
    }
    return false
  })
  const distinctTools = Array.from(
    new Set(
      allMessages
        .filter((m) => m.role === 'tool')
        .flatMap((m) =>
          (m.toolCalls ?? []).map((c) => c.name).concat(
            (m.toolResults ?? []).map((r) => r.name),
          ),
        ),
    ),
  )
  const lastActivity = conversation?.updatedAt
    ? new Date(conversation.updatedAt).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Học viên', href: learnerPath.learners() },
          { label: learner?.fullName ?? 'Chi tiết', href: learnerId ? learnerPath.learner(learnerId) : undefined },
          { label: conversation?.title || 'Hội thoại AI' },
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Bot className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">Hội thoại AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight truncate">
            {conversation?.title || 'Hội thoại AI'}
          </h1>
          {(conversation?.course?.title || conversation?.lesson?.title) && (
            <p className="text-sm text-muted-foreground mt-1">
              {[conversation?.course?.title, conversation?.lesson?.title].filter(Boolean).join(' › ')}
            </p>
          )}
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
            <Metric
              icon={MessageSquare}
              label="Tin nhắn"
              value={data.messages.length}
              tone="blue"
            />
            <ToolsMetric tools={distinctTools} />
            <Metric
              icon={Calendar}
              label="Cập nhật"
              value={lastActivity}
              tone="indigo"
            />
          </div>

          {/* Chat */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xl font-bold tracking-tight">Tin nhắn</h2>

            {visibleMessages.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Chưa có tin nhắn</p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 space-y-6">
                {visibleMessages.map((message) => (
                  <ConversationMessageRow
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

function ConversationMessageRow({
  message,
  learnerName,
  learnerId,
}: {
  message: ConversationMessage
  learnerName: string
  learnerId: string
}) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="flex flex-col items-end gap-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              {learnerName}
            </span>
            <div className="rounded-2xl border-2 border-border bg-card px-4 py-2.5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {message.content}
              </p>
            </div>
          </div>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold ${hashColor(learnerId)}`}
          >
            {getInitials(learnerName)}
          </div>
        </div>
      </div>
    )
  }

  if (isAssistant) {
    const hasContent = message.content.trim().length > 0
    if (!hasContent && !message.interrupted) return null

    return (
      <div className="w-full">
        {message.interrupted && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              Bị ngắt
            </span>
          </div>
        )}
        {hasContent && <MarkdownContent content={message.content} />}
      </div>
    )
  }

  if (message.role === 'tool') {
    const calls = message.toolCalls ?? []
    const results = message.toolResults ?? []
    return <ToolActivityBlock calls={calls} results={results} />
  }

  return null
}

function ToolActivityBlock({
  calls,
  results,
}: {
  calls: ConversationMessageToolCall[]
  results: ConversationMessageToolResult[]
}) {
  const resultByName = new Map(results.map((r) => [r.name, r.result]))
  const pairs = calls.length > 0
    ? calls.map((call) => ({ name: call.name, args: call.arguments, result: resultByName.get(call.name) }))
    : results.map((r) => ({ name: r.name, args: undefined, result: r.result }))

  return (
    <div className="w-full space-y-2">
      {pairs.map((pair, idx) => (
        <ToolActivityCard
          key={`${pair.name}-${idx}`}
          name={pair.name}
          args={pair.args}
          result={pair.result}
        />
      ))}
    </div>
  )
}

function ToolActivityCard({
  name,
  args,
  result,
}: {
  name: string
  args: unknown
  result: unknown
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-amber-100/40 dark:hover:bg-amber-950/30 transition-colors rounded-lg"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
        )}
        <Wrench className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Đã dùng tool
        </span>
        <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded">
          {name}
        </code>
      </button>
      {open && (
        <div className="border-t-2 border-amber-200 dark:border-amber-900 p-2.5 space-y-2">
          {args !== undefined && args !== null && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Tham số
              </p>
              <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-all overflow-x-auto bg-muted/60 rounded p-2 max-h-40">
                {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result !== undefined && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Kết quả
              </p>
              <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-all overflow-x-auto bg-muted/60 rounded p-2 max-h-60">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
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
  icon: React.ComponentType<{ className?: string }>
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

function ToolsMetric({ tools }: { tools: string[] }) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TONE_MAP.emerald}`}>
        <Wrench className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3">
        Tool đã dùng
      </p>
      {tools.length === 0 ? (
        <p className="text-sm font-semibold text-muted-foreground mt-1">—</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tools.slice(0, 6).map((name) => (
            <code
              key={name}
              className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground"
            >
              {name}
            </code>
          ))}
          {tools.length > 6 && (
            <span className="text-[10px] font-bold text-muted-foreground self-center">
              +{tools.length - 6}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
