import { useState, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  BookX,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  EyeOff,
  FileQuestion,
  Volume2,
  Wand2,
} from 'lucide-react'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/admin/ErrorState'
import { learningPath } from '../../learning/route-utils'
import {
  useDashboardAttention,
  type AttentionGroup,
  type DashboardAttention,
} from '../../../features/dashboard'
import {
  AMBER,
  BLUE,
  CYAN,
  EmptyState,
  formatNumber,
  formatPercent,
  LESSON_TYPE_LABEL,
  QUESTION_TYPE_LABEL,
  ROSE,
  SectionCard,
  SLATE,
  VIOLET,
} from './dashboard-ui'

type GroupKey =
  | 'highErrorQuestions'
  | 'emptyLessons'
  | 'exercisesWithoutQuestions'
  | 'vocabulariesMissingAudio'
  | 'draftCourses'
  | 'failedGenerations'

const GROUP_META: {
  key: GroupKey
  label: string
  icon: ComponentType<{ className?: string }>
  tint: string
}[] = [
  { key: 'highErrorQuestions', label: 'Câu hỏi sai nhiều', icon: CircleAlert, tint: ROSE },
  { key: 'emptyLessons', label: 'Bài học trống', icon: BookX, tint: AMBER },
  { key: 'exercisesWithoutQuestions', label: 'Bài tập chưa có câu hỏi', icon: FileQuestion, tint: VIOLET },
  { key: 'vocabulariesMissingAudio', label: 'Từ vựng thiếu audio', icon: Volume2, tint: CYAN },
  { key: 'draftCourses', label: 'Khóa học chưa xuất bản', icon: EyeOff, tint: BLUE },
  { key: 'failedGenerations', label: 'Bài tập AI sinh lỗi', icon: Wand2, tint: SLATE },
]

/**
 * Trung tâm "Cần xử lý": các vấn đề nội dung sửa được ngay, mỗi mục dẫn
 * thẳng tới màn hình soạn tương ứng. Chip nhóm → danh sách mục của nhóm.
 */
export function AttentionSection() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardAttention()
  const [selected, setSelected] = useState<GroupKey>('highErrorQuestions')

  const totalIssues = data?.totalIssues ?? 0

  return (
    <SectionCard
      title="Cần xử lý"
      hint={
        data
          ? totalIssues === 0
            ? 'Nội dung đang ở trạng thái tốt'
            : `${formatNumber(totalIssues)} vấn đề nội dung đang chờ`
          : 'Các vấn đề nội dung sửa được ngay'
      }
      icon={CircleAlert}
      iconTint={totalIssues > 0 ? ROSE : AMBER}
    >
      {isError ? (
        <ErrorState
          title="Không tải được danh sách cần xử lý"
          message={error instanceof Error ? error.message : 'Lỗi không xác định'}
          onRetry={() => refetch()}
          retrying={isFetching}
          size="sm"
        />
      ) : isLoading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : totalIssues === 0 ? (
        <EmptyState
          icon={CircleCheck}
          message="Tuyệt vời — không có vấn đề nội dung nào cần xử lý."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {GROUP_META.map((meta) => {
              const count = data[meta.key].count
              const active = selected === meta.key
              return (
                <button
                  key={meta.key}
                  type="button"
                  onClick={() => setSelected(meta.key)}
                  className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <meta.icon className="h-4 w-4" />
                  {meta.label}
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums ${
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : count > 0
                          ? 'text-card'
                          : 'bg-muted text-muted-foreground'
                    }`}
                    style={
                      active || count === 0
                        ? undefined
                        : { backgroundColor: meta.tint }
                    }
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <GroupList groupKey={selected} data={data} />
        </div>
      )}
    </SectionCard>
  )
}

function GroupList({
  groupKey,
  data,
}: {
  groupKey: GroupKey
  data: DashboardAttention
}) {
  switch (groupKey) {
    case 'highErrorQuestions':
      return (
        <IssueList
          group={data.highErrorQuestions}
          emptyMessage="Không có câu hỏi nào sai nhiều."
          render={(item) => (
            <IssueRow
              key={item.questionId}
              to={learningPath.questionEdit(item.exerciseId, item.questionId)}
              title={item.question?.trim() || '(Câu hỏi không có nội dung chữ)'}
              meta={`${QUESTION_TYPE_LABEL[item.type] ?? item.type} · ${formatNumber(item.totalAttempts)} lượt làm · ${formatNumber(item.incorrectCount)} lượt sai`}
              badge={
                <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  sai {formatPercent(item.errorRate)}
                </span>
              }
            />
          )}
        />
      )
    case 'emptyLessons':
      return (
        <IssueList
          group={data.emptyLessons}
          emptyMessage="Không có bài học trống."
          render={(item) => (
            <IssueRow
              key={item.lessonId}
              to={learningPath.lessonStageContent(item.lessonId)}
              title={item.title}
              meta={`${LESSON_TYPE_LABEL[item.lessonType] ?? item.lessonType} · ${item.courseTitle} › ${item.moduleTitle}`}
              badge={<NeutralBadge>chưa có nội dung</NeutralBadge>}
            />
          )}
        />
      )
    case 'exercisesWithoutQuestions':
      return (
        <IssueList
          group={data.exercisesWithoutQuestions}
          emptyMessage="Bài tập nào cũng đã có câu hỏi."
          render={(item) => (
            <IssueRow
              key={item.exerciseId}
              to={learningPath.exercise(item.exerciseId)}
              title={item.title}
              meta={item.scopeTitle ? `Thuộc: ${item.scopeTitle}` : 'Bài tập công khai'}
              badge={<NeutralBadge>0 câu hỏi</NeutralBadge>}
            />
          )}
        />
      )
    case 'vocabulariesMissingAudio':
      return (
        <IssueList
          group={data.vocabulariesMissingAudio}
          emptyMessage="Từ vựng nào cũng đã có audio."
          render={(item) => (
            <IssueRow
              key={item.vocabularyId}
              to={learningPath.vocabEdit(item.lessonId, item.vocabularyId)}
              title={`${item.word} — ${item.translation}`}
              meta={`Bài học: ${item.lessonTitle}`}
              badge={<NeutralBadge>thiếu audio</NeutralBadge>}
            />
          )}
        />
      )
    case 'draftCourses':
      return (
        <IssueList
          group={data.draftCourses}
          emptyMessage="Mọi khóa học đều đã xuất bản."
          render={(item) => (
            <IssueRow
              key={item.courseId}
              to={learningPath.course(item.courseId)}
              title={item.title}
              meta={`Cấp độ ${item.level} · ${formatNumber(item.lessonCount)} bài học`}
              badge={<NeutralBadge>bản nháp</NeutralBadge>}
            />
          )}
        />
      )
    case 'failedGenerations':
      return (
        <IssueList
          group={data.failedGenerations}
          emptyMessage="Không có bài tập AI nào sinh lỗi."
          render={(item) => (
            <IssueRow
              key={item.exerciseId}
              to={learningPath.exercise(item.exerciseId)}
              title={item.title}
              meta={
                item.ownerName
                  ? `Chủ sở hữu: ${item.ownerName} (${item.ownerEmail})`
                  : 'Không rõ chủ sở hữu'
              }
              badge={
                <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                  sinh thất bại
                </span>
              }
            />
          )}
        />
      )
  }
}

function IssueList<T>({
  group,
  emptyMessage,
  render,
}: {
  group: AttentionGroup<T>
  emptyMessage: string
  render: (item: T) => ReactNode
}) {
  if (group.count === 0) {
    return <EmptyState icon={CircleCheck} message={emptyMessage} />
  }
  return (
    <div className="space-y-2">
      {group.items.map(render)}
      {group.count > group.items.length && (
        <p className="px-1 pt-1 text-xs text-muted-foreground">
          … và {formatNumber(group.count - group.items.length)} mục khác cùng loại
        </p>
      )}
    </div>
  )
}

function IssueRow({
  to,
  title,
  meta,
  badge,
}: {
  to: string
  title: string
  meta: string
  badge?: ReactNode
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border-2 border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">{meta}</p>
      </div>
      {badge}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function NeutralBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground whitespace-nowrap">
      {children}
    </span>
  )
}
