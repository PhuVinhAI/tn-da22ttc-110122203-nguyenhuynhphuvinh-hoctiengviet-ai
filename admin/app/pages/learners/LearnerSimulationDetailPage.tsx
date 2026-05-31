import { Link, useParams } from 'react-router'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { LoadingState } from '../../components/admin/LoadingState'
import { ErrorState } from '../../components/admin/ErrorState'
import { useAdminLearner, useAdminLearnerSimulation } from '../../features/learners/api/use-learners-admin'
import { learnerPath } from './route-utils'

export function LearnerSimulationDetailPage() {
  const { learnerId, sessionId } = useParams()
  const { data: learnerData } = useAdminLearner(learnerId)
  const { data, isLoading, error, refetch } = useAdminLearnerSimulation(learnerId, sessionId)

  const learner = learnerData?.user
  const session = data?.session

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học viên', href: learnerPath.learners() },
          { label: learner?.fullName ?? 'Chi tiết', href: learnerId ? learnerPath.learner(learnerId) : undefined },
          { label: session?.scenario?.title ?? 'Phiên mô phỏng' },
        ]}
      />

      <div className="flex items-center gap-4">
        {learnerId && (
          <Button asChild variant="ghost" size="icon-lg">
            <Link to={learnerPath.learner(learnerId)}>
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{session?.scenario?.title ?? 'Phiên mô phỏng'}</h1>
            <p className="text-lg text-muted-foreground mt-2">{session?.chosenCharacter?.name}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải phiên mô phỏng..." />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : 'Không tải được dữ liệu'} onRetry={() => refetch()} />
      ) : data ? (
        <>
          <div className="grid grid-cols-4 gap-6">
            <Metric label="Trạng thái" value={session?.status ?? '-'} />
            <Metric label="Điểm" value={session?.totalScore ?? '-'} />
            <Metric label="Tin nhắn" value={session?.totalMessages ?? data.messages.length} />
            <Metric label="Tokens" value={session?.totalTokens ?? 0} />
          </div>

          <div className="rounded-2xl border-2 border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-6">Luồng hội thoại</h2>
            <div className="space-y-4">
              {data.messages.length === 0 ? (
                <p className="text-center text-lg text-muted-foreground py-12">Chưa có tin nhắn</p>
              ) : (
                data.messages.map((message) => (
                  <div key={message.id} className="rounded-xl border-2 border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={message.isLearner ? 'default' : 'secondary'} className="text-base px-4 py-2">
                        {message.isLearner ? 'Học viên' : message.speakerCharacter?.name ?? 'Nhân vật'}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-semibold">#{message.orderIndex}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-base leading-relaxed mb-3">{message.content}</p>
                    {message.translation && (
                      <p className="text-base text-muted-foreground italic border-l-4 border-primary pl-4">{message.translation}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-6">
      <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
