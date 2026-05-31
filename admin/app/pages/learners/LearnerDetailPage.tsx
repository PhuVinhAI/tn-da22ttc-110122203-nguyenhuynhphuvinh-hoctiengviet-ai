import { Link, useParams } from 'react-router'
import type { ReactNode } from 'react'
import { User, TrendingUp, Target, BookOpen, MessageSquare, Bot } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { DataTable } from '../../components/admin/DataTable'
import { LoadingState } from '../../components/admin/LoadingState'
import { ErrorState } from '../../components/admin/ErrorState'
import { useAdminLearner } from '../../features/learners/api/use-learners-admin'
import { learnerPath } from './route-utils'

export function LearnerDetailPage() {
  const { learnerId } = useParams()
  const { data, isLoading, error, refetch } = useAdminLearner(learnerId)

  const learner = data?.user

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Học viên', href: learnerPath.learners() }, { label: learner?.fullName ?? 'Chi tiết' }]} />

      {isLoading ? (
        <LoadingState message="Đang tải thông tin học viên..." />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : 'Không tải được dữ liệu'} onRetry={() => refetch()} />
      ) : data ? (
        <>
          <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
            <div className="h-32 bg-primary/10 flex items-center justify-center border-b-2 border-border">
              <User className="h-16 w-16 text-primary/30" />
            </div>
            <div className="p-8">
              <h1 className="text-4xl font-bold mb-2">{learner?.fullName ?? 'Học viên'}</h1>
              <p className="text-lg text-muted-foreground mb-6">{learner?.email}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Level</p>
                  <p className="text-xl font-bold">{learner?.currentLevel}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Vai trò</p>
                  <Badge variant="secondary" className="text-base">{learner?.role}</Badge>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Giọng ưu tiên</p>
                  <p className="text-xl font-bold">{learner?.preferredDialect}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <Metric label="Tiến độ hoàn tất" value={`${data.summary.completedProgressCount}/${data.summary.progressCount}`} />
                <Metric label="Bài tập đúng" value={`${data.summary.correctExerciseResultsCount}/${data.summary.exerciseResultsCount}`} />
                <Metric label="Từ cá nhân" value={data.summary.personalVocabularyCount} />
                <Metric label="Streak" value={`${data.summary.currentStreak}/${data.summary.longestStreak}`} />
              </div>
            </div>
          </div>

          <Tabs defaultValue="progress" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 h-14">
              <TabsTrigger value="progress" className="text-base"><TrendingUp className="h-5 w-5 mr-2" />Tiến độ</TabsTrigger>
              <TabsTrigger value="goals" className="text-base"><Target className="h-5 w-5 mr-2" />Mục tiêu</TabsTrigger>
              <TabsTrigger value="exercises" className="text-base"><BookOpen className="h-5 w-5 mr-2" />Bài tập</TabsTrigger>
              <TabsTrigger value="vocabulary" className="text-base"><BookOpen className="h-5 w-5 mr-2" />Từ vựng</TabsTrigger>
              <TabsTrigger value="simulations" className="text-base"><MessageSquare className="h-5 w-5 mr-2" />Mô phỏng</TabsTrigger>
              <TabsTrigger value="ai" className="text-base"><Bot className="h-5 w-5 mr-2" />AI</TabsTrigger>
            </TabsList>

            <TabsContent value="progress">
              <Section title="Tiến độ học tập" icon={TrendingUp}>
                <DataTable data={data.progress} empty="Chưa có tiến độ" columns={[
                  { key: 'unit', header: 'Hạng mục', cell: (row) => <span className="font-semibold">{row.lesson?.title ?? row.module?.title ?? row.course?.title ?? row.unitType}</span> },
                  { key: 'type', header: 'Loại', cell: (row) => <Badge variant="outline">{row.unitType}</Badge> },
                  { key: 'status', header: 'Trạng thái', cell: (row) => <Badge>{row.status}</Badge> },
                  { key: 'score', header: 'Điểm', cell: (row) => <span className="font-bold text-lg">{row.score ?? '-'}</span> },
                  { key: 'time', header: 'Thời gian', cell: (row) => `${row.timeSpent}s` },
                ]} />
              </Section>
            </TabsContent>

            <TabsContent value="goals">
              <Section title="Mục tiêu hằng ngày" icon={Target}>
                <DataTable data={data.dailyGoals} empty="Chưa có mục tiêu" columns={[
                  { key: 'type', header: 'Loại', cell: (row) => <Badge variant="secondary" className="text-base">{row.goalType}</Badge> },
                  { key: 'target', header: 'Mục tiêu', cell: (row) => <span className="font-bold text-lg">{row.targetValue}</span> },
                ]} />
              </Section>
            </TabsContent>

            <TabsContent value="exercises">
              <Section title="Kết quả bài tập" icon={BookOpen}>
                <DataTable data={data.exerciseResults} empty="Chưa có kết quả" columns={[
                  { key: 'question', header: 'Câu hỏi', cell: (row) => <span className="font-semibold">{row.exercise?.question ?? '-'}</span> },
                  { key: 'type', header: 'Kiểu', cell: (row) => <Badge variant="outline">{row.exercise?.exerciseType ?? '-'}</Badge> },
                  { key: 'correct', header: 'Đúng', cell: (row) => <Badge variant={row.isCorrect ? 'default' : 'destructive'}>{row.isCorrect ? 'Có' : 'Không'}</Badge> },
                  { key: 'score', header: 'Điểm', cell: (row) => <span className="font-bold text-lg">{row.bestScore || row.score}</span> },
                  { key: 'attempts', header: 'Lần làm', cell: (row) => row.attemptCount },
                ]} />
              </Section>
            </TabsContent>

            <TabsContent value="vocabulary">
              <Section title="Từ vựng cá nhân" icon={BookOpen}>
                <DataTable data={data.personalVocabularies} empty="Chưa có từ cá nhân" columns={[
                  { key: 'word', header: 'Từ', cell: (row) => <span className="font-bold text-lg">{row.word}</span> },
                  { key: 'translation', header: 'Dịch', cell: (row) => row.translation },
                  { key: 'source', header: 'Nguồn', cell: (row) => <Badge variant="outline">{row.source}</Badge> },
                  { key: 'pos', header: 'Loại', cell: (row) => row.partOfSpeech ?? '-' },
                ]} />
              </Section>
            </TabsContent>

            <TabsContent value="simulations">
              <Section title="Phiên mô phỏng" icon={MessageSquare}>
                <DataTable data={data.simulations} empty="Chưa có phiên mô phỏng" columns={[
                  { key: 'scenario', header: 'Tình huống', cell: (row) => <span className="font-semibold">{row.scenario?.title ?? '-'}</span> },
                  { key: 'character', header: 'Nhân vật', cell: (row) => row.chosenCharacter?.name ?? '-' },
                  { key: 'status', header: 'Trạng thái', cell: (row) => <Badge>{row.status}</Badge> },
                  { key: 'score', header: 'Điểm', cell: (row) => <span className="font-bold text-lg">{row.totalScore ?? '-'}</span> },
                  { key: 'messages', header: 'Tin nhắn', cell: (row) => row.totalMessages },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => learnerId ? <Link className="text-base font-semibold text-primary hover:underline" to={learnerPath.simulation(learnerId, row.id)}>Xem</Link> : null },
                ]} />
              </Section>
            </TabsContent>

            <TabsContent value="ai">
              <Section title="Hội thoại AI" icon={Bot}>
                <DataTable data={data.conversations} empty="Chưa có hội thoại" columns={[
                  { key: 'title', header: 'Tiêu đề', cell: (row) => <span className="font-semibold">{row.title || 'Không tiêu đề'}</span> },
                  { key: 'model', header: 'Model', cell: (row) => <Badge variant="secondary">{row.model}</Badge> },
                  { key: 'scope', header: 'Ngữ cảnh', cell: (row) => row.lesson?.title ?? row.course?.title ?? '-' },
                  { key: 'tokens', header: 'Tokens', cell: (row) => <span className="font-semibold">{row.totalTokens}</span> },
                  { key: 'updated', header: 'Cập nhật', cell: (row) => formatDate(row.updatedAt) },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => learnerId ? <Link className="text-base font-semibold text-primary hover:underline" to={learnerPath.conversation(learnerId, row.id)}>Xem</Link> : null },
                ]} />
              </Section>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-6">
      <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: ReactNode }) {
  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN')
}
