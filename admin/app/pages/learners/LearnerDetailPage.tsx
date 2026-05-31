import { Link, useParams } from 'react-router'
import type { ReactNode } from 'react'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminLearner } from '../../features/learners/api/use-learners-admin'
import { learnerPath } from './route-utils'

export function LearnerDetailPage() {
  const { learnerId } = useParams()
  const { data, isLoading, error } = useAdminLearner(learnerId)

  const learner = data?.user

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Há»c viÃªn', href: learnerPath.learners() }, { label: learner?.fullName ?? 'Chi tiáº¿t' }]} />
      <PageHeader title={learner?.fullName ?? 'Học viên'} description={learner?.email} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Äang táº£i...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'KhÃ´ng táº£i Ä‘Æ°á»£c dá»¯ liá»‡u'}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Tiáº¿n Ä‘á»™ hoÃ n táº¥t" value={`${data.summary.completedProgressCount}/${data.summary.progressCount}`} />
            <Metric label="BÃ i táº­p Ä‘Ãºng" value={`${data.summary.correctExerciseResultsCount}/${data.summary.exerciseResultsCount}`} />
            <Metric label="Tá»« cÃ¡ nhÃ¢n" value={data.summary.personalVocabularyCount} />
            <Metric label="Streak" value={`${data.summary.currentStreak}/${data.summary.longestStreak}`} />
          </div>
          <Card>
            <CardContent className="grid gap-3 p-4 md:grid-cols-3">
              <Info label="Level" value={learner?.currentLevel} />
              <Info label="Vai trÃ²" value={learner?.role} />
              <Info label="Provider" value={learner?.provider} />
              <Info label="Giá»ng Æ°u tiÃªn" value={learner?.preferredDialect} />
              <Info label="Email" value={learner?.emailVerified ? 'ÄÃ£ xÃ¡c thá»±c' : 'ChÆ°a xÃ¡c thá»±c'} />
              <Info label="Onboarding" value={learner?.onboardingCompleted ? 'HoÃ n táº¥t' : 'ChÆ°a hoÃ n táº¥t'} />
            </CardContent>
          </Card>
          <Tabs defaultValue="progress">
            <TabsList>
              <TabsTrigger value="progress">Tiáº¿n Ä‘á»™</TabsTrigger>
              <TabsTrigger value="goals">Má»¥c tiÃªu</TabsTrigger>
              <TabsTrigger value="exercises">BÃ i táº­p</TabsTrigger>
              <TabsTrigger value="vocabulary">Tá»« vá»±ng</TabsTrigger>
              <TabsTrigger value="simulations">MÃ´ phá»ng</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>
            <TabsContent value="progress">
              <Section title="Tiáº¿n Ä‘á»™ há»c táº­p">
                <DataTable
                  data={data.progress}
                  empty="ChÆ°a cÃ³ tiáº¿n Ä‘á»™"
                  columns={[
                    { key: 'unit', header: 'Háº¡ng má»¥c', cell: (row) => row.lesson?.title ?? row.module?.title ?? row.course?.title ?? row.unitType },
                    { key: 'type', header: 'Loáº¡i', cell: (row) => row.unitType },
                    { key: 'status', header: 'Tráº¡ng thÃ¡i', cell: (row) => <Badge variant="outline">{row.status}</Badge> },
                    { key: 'score', header: 'Äiá»ƒm', cell: (row) => row.score ?? '-' },
                    { key: 'time', header: 'Thá»i gian', cell: (row) => `${row.timeSpent}s` },
                  ]}
                />
              </Section>
            </TabsContent>
            <TabsContent value="goals">
              <Section title="Má»¥c tiÃªu háº±ng ngÃ y">
                <DataTable
                  data={data.dailyGoals}
                  empty="ChÆ°a cÃ³ má»¥c tiÃªu"
                  columns={[
                    { key: 'type', header: 'Loáº¡i', cell: (row) => row.goalType },
                    { key: 'target', header: 'Má»¥c tiÃªu', cell: (row) => row.targetValue },
                  ]}
                />
              </Section>
              <Section title="Lá»‹ch sá»­ má»¥c tiÃªu">
                <DataTable
                  data={data.dailyProgress}
                  empty="ChÆ°a cÃ³ lá»‹ch sá»­"
                  columns={[
                    { key: 'date', header: 'NgÃ y', cell: (row) => row.date },
                    { key: 'lessons', header: 'BÃ i há»c', cell: (row) => row.lessonsCompleted },
                    { key: 'exercises', header: 'BÃ i táº­p', cell: (row) => row.exercisesCompleted },
                  ]}
                />
              </Section>
            </TabsContent>
            <TabsContent value="exercises">
              <Section title="Káº¿t quáº£ bÃ i táº­p">
                <DataTable
                  data={data.exerciseResults}
                  empty="ChÆ°a cÃ³ káº¿t quáº£"
                  columns={[
                    { key: 'question', header: 'CÃ¢u há»i', cell: (row) => row.exercise?.question ?? '-' },
                    { key: 'type', header: 'Kiá»ƒu', cell: (row) => row.exercise?.exerciseType ?? '-' },
                    { key: 'correct', header: 'ÄÃºng', cell: (row) => (row.isCorrect ? 'CÃ³' : 'KhÃ´ng') },
                    { key: 'score', header: 'Äiá»ƒm', cell: (row) => row.bestScore || row.score },
                    { key: 'attempts', header: 'Láº§n lÃ m', cell: (row) => row.attemptCount },
                  ]}
                />
              </Section>
            </TabsContent>
            <TabsContent value="vocabulary">
              <Section title="Tá»« vá»±ng cÃ¡ nhÃ¢n">
                <DataTable
                  data={data.personalVocabularies}
                  empty="ChÆ°a cÃ³ tá»« cÃ¡ nhÃ¢n"
                  columns={[
                    { key: 'word', header: 'Tá»«', cell: (row) => row.word },
                    { key: 'translation', header: 'Dá»‹ch', cell: (row) => row.translation },
                    { key: 'source', header: 'Nguá»“n', cell: (row) => row.source },
                    { key: 'pos', header: 'Loáº¡i', cell: (row) => row.partOfSpeech ?? '-' },
                  ]}
                />
              </Section>
              <Section title="Bookmark">
                <DataTable
                  data={data.bookmarks}
                  empty="ChÆ°a cÃ³ bookmark"
                  columns={[
                    { key: 'word', header: 'Tá»«', cell: (row) => row.vocabulary?.word ?? row.personalVocabulary?.word ?? '-' },
                    { key: 'translation', header: 'Dá»‹ch', cell: (row) => row.vocabulary?.translation ?? row.personalVocabulary?.translation ?? '-' },
                    { key: 'created', header: 'NgÃ y lÆ°u', cell: (row) => formatDate(row.createdAt) },
                  ]}
                />
              </Section>
            </TabsContent>
            <TabsContent value="simulations">
              <Section title="PhiÃªn mÃ´ phá»ng">
                <DataTable
                  data={data.simulations}
                  empty="ChÆ°a cÃ³ phiÃªn mÃ´ phá»ng"
                  columns={[
                    { key: 'scenario', header: 'TÃ¬nh huá»‘ng', cell: (row) => row.scenario?.title ?? '-' },
                    { key: 'character', header: 'NhÃ¢n váº­t', cell: (row) => row.chosenCharacter?.name ?? '-' },
                    { key: 'status', header: 'Tráº¡ng thÃ¡i', cell: (row) => <Badge variant="outline">{row.status}</Badge> },
                    { key: 'score', header: 'Äiá»ƒm', cell: (row) => row.totalScore ?? '-' },
                    { key: 'messages', header: 'Tin nháº¯n', cell: (row) => row.totalMessages },
                    {
                      key: 'actions',
                      header: '',
                      className: 'text-right',
                      cell: (row) =>
                        learnerId ? (
                          <Link className="text-sm font-medium text-primary" to={learnerPath.simulation(learnerId, row.id)}>
                            Xem
                          </Link>
                        ) : null,
                    },
                  ]}
                />
              </Section>
            </TabsContent>
            <TabsContent value="ai">
              <Section title="Há»™i thoáº¡i AI">
                <DataTable
                  data={data.conversations}
                  empty="ChÆ°a cÃ³ há»™i thoáº¡i"
                  columns={[
                    { key: 'title', header: 'TiÃªu Ä‘á»', cell: (row) => row.title || 'KhÃ´ng tiÃªu Ä‘á»' },
                    { key: 'model', header: 'Model', cell: (row) => row.model },
                    { key: 'scope', header: 'Ngá»¯ cáº£nh', cell: (row) => row.lesson?.title ?? row.course?.title ?? '-' },
                    { key: 'tokens', header: 'Tokens', cell: (row) => row.totalTokens },
                    { key: 'updated', header: 'Cáº­p nháº­t', cell: (row) => formatDate(row.updatedAt) },
                    {
                      key: 'actions',
                      header: '',
                      className: 'text-right',
                      cell: (row) =>
                        learnerId ? (
                          <Link className="text-sm font-medium text-primary" to={learnerPath.conversation(learnerId, row.id)}>
                            Xem
                          </Link>
                        ) : null,
                    },
                  ]}
                />
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
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN')
}

