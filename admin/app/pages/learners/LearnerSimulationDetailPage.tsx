import { Link, useParams } from 'react-router'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminLearner, useAdminLearnerSimulation } from '../../features/learners/api/use-learners-admin'
import { learnerPath } from './route-utils'

export function LearnerSimulationDetailPage() {
  const { learnerId, sessionId } = useParams()
  const { data: learnerData } = useAdminLearner(learnerId)
  const { data, isLoading, error } = useAdminLearnerSimulation(learnerId, sessionId)

  const learner = learnerData?.user
  const session = data?.session

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học viên', href: learnerPath.learners() },
          { label: learner?.fullName ?? 'Chi tiết', href: learnerId ? learnerPath.learner(learnerId) : undefined },
          { label: session?.scenario?.title ?? 'Phiên mô phỏng' },
        ]}
      />
      <PageHeader title={session?.scenario?.title ?? 'Phiên mô phỏng'} description={session?.chosenCharacter?.name} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
      ) : data ? (
        <>
          <Card>
            <CardContent className="grid gap-3 p-4 md:grid-cols-4">
              <Info label="Trạng thái" value={session?.status} />
              <Info label="Điểm" value={session?.totalScore === null || session?.totalScore === undefined ? '-' : String(session.totalScore)} />
              <Info label="Tin nhắn" value={String(session?.totalMessages ?? data.messages.length)} />
              <Info label="Tokens" value={String(session?.totalTokens ?? 0)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Luồng hội thoại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có tin nhắn</p>
              ) : (
                data.messages.map((message) => (
                  <div key={message.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant={message.isLearner ? 'default' : 'outline'}>
                        {message.isLearner ? 'Học viên' : message.speakerCharacter?.name ?? 'Nhân vật'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">#{message.orderIndex}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    {message.translation ? <p className="mt-2 text-sm text-muted-foreground">{message.translation}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {learnerId ? (
            <Link className="text-sm font-medium text-primary" to={learnerPath.learner(learnerId)}>
              Quay lại học viên
            </Link>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value ?? '-'}</p>
    </div>
  )
}
