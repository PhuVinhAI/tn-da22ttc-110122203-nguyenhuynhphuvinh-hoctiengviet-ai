import { Link, useParams } from 'react-router'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminLearner, useAdminLearnerConversation } from '../../features/learners/api/use-learners-admin'
import { learnerPath } from './route-utils'

export function LearnerConversationDetailPage() {
  const { learnerId, conversationId } = useParams()
  const { data: learnerData } = useAdminLearner(learnerId)
  const { data, isLoading, error } = useAdminLearnerConversation(learnerId, conversationId)

  const learner = learnerData?.user
  const conversation = data?.conversation

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học viên', href: learnerPath.learners() },
          { label: learner?.fullName ?? 'Chi tiết', href: learnerId ? learnerPath.learner(learnerId) : undefined },
          { label: conversation?.title || 'Hội thoại AI' },
        ]}
      />
      <PageHeader title={conversation?.title || 'Hội thoại AI'} description={conversation?.model} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
      ) : data ? (
        <>
          <Card>
            <CardContent className="grid gap-3 p-4 md:grid-cols-4">
              <Info label="Model" value={conversation?.model} />
              <Info label="Tokens" value={String(conversation?.totalTokens ?? 0)} />
              <Info label="Khóa học" value={conversation?.course?.title ?? '-'} />
              <Info label="Bài học" value={conversation?.lesson?.title ?? '-'} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tin nhắn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có tin nhắn</p>
              ) : (
                data.messages.map((message) => (
                  <div key={message.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline">{message.role}</Badge>
                      <span className="text-xs text-muted-foreground">{message.tokenCount} tokens</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
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
