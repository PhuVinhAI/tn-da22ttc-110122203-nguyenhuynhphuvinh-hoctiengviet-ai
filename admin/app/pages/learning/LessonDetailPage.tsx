import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { ExerciseSet, GrammarRule, LessonContent, Vocabulary } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function LessonDetailPage() {
  const { lessonId } = useParams()
  const { data: lesson, isLoading, error } = useAdminLesson(lessonId)
  const mutations = useLearningAdminMutation()

  const removeChild = async (kind: string, id: string) => {
    try {
      await mutations.deleteLessonChild.mutateAsync({ kind, id })
      toast.success('Đã xóa')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học' },
        ]}
      />
      <PageHeader
        title={lesson?.title ?? 'Bài học'}
        description={lesson?.description}
        actions={lessonId ? <Button asChild variant="outline"><Link to={learningPath.lessonEdit(lesson?.moduleId ?? '', lessonId)}>Sửa bài học</Link></Button> : null}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
      ) : lesson && lessonId ? (
        <Tabs defaultValue="contents">
          <TabsList>
            <TabsTrigger value="contents">Nội dung</TabsTrigger>
            <TabsTrigger value="vocabularies">Từ vựng</TabsTrigger>
            <TabsTrigger value="grammar">Ngữ pháp</TabsTrigger>
            <TabsTrigger value="sets">Bộ bài tập</TabsTrigger>
          </TabsList>
          <TabsContent value="contents">
            <Section title="Nội dung bài" actionHref={learningPath.contentNew(lessonId)} actionLabel="Thêm nội dung">
              <DataTable
                data={lesson.contents ?? []}
                empty="Chưa có nội dung"
                columns={[
                  { key: 'text', header: 'Tiếng Việt', cell: (row: LessonContent) => row.vietnameseText },
                  { key: 'type', header: 'Kiểu', cell: (row) => row.contentType },
                  { key: 'order', header: 'Thứ tự', cell: (row) => row.orderIndex },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => <RowActions editHref={learningPath.contentEdit(lessonId, row.id)} onDelete={() => removeChild('contents', row.id)} /> },
                ]}
              />
            </Section>
          </TabsContent>
          <TabsContent value="vocabularies">
            <Section title="Từ vựng" actionHref={learningPath.vocabularyNew(lessonId)} actionLabel="Thêm từ vựng">
              <DataTable
                data={lesson.vocabularies ?? []}
                empty="Chưa có từ vựng"
                columns={[
                  { key: 'word', header: 'Từ', cell: (row: Vocabulary) => row.word },
                  { key: 'translation', header: 'Dịch', cell: (row) => row.translation },
                  { key: 'pos', header: 'Loại', cell: (row) => row.partOfSpeech },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => <RowActions editHref={learningPath.vocabularyEdit(lessonId, row.id)} onDelete={() => removeChild('vocabularies', row.id)} /> },
                ]}
              />
            </Section>
          </TabsContent>
          <TabsContent value="grammar">
            <Section title="Ngữ pháp" actionHref={learningPath.grammarNew(lessonId)} actionLabel="Thêm ngữ pháp">
              <DataTable
                data={lesson.grammarRules ?? []}
                empty="Chưa có ngữ pháp"
                columns={[
                  { key: 'title', header: 'Tên', cell: (row: GrammarRule) => row.title },
                  { key: 'structure', header: 'Cấu trúc', cell: (row) => row.structure ?? '-' },
                  { key: 'difficulty', header: 'Độ khó', cell: (row) => row.difficultyLevel },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => <RowActions editHref={learningPath.grammarEdit(lessonId, row.id)} onDelete={() => removeChild('grammar', row.id)} /> },
                ]}
              />
            </Section>
          </TabsContent>
          <TabsContent value="sets">
            <Section title="Bộ bài tập" actionHref={learningPath.exerciseSetNew(lessonId)} actionLabel="Thêm bộ bài tập">
              <DataTable
                data={lesson.exerciseSets ?? []}
                empty="Chưa có bộ bài tập"
                columns={[
                  { key: 'title', header: 'Tên', cell: (row: ExerciseSet) => <Link className="font-medium hover:text-primary" to={learningPath.exerciseSet(row.id)}>{row.title}</Link> },
                  { key: 'count', header: 'Bài tập', cell: (row) => row.exercises?.length ?? 0 },
                  { key: 'order', header: 'Thứ tự', cell: (row) => row.orderIndex },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => <RowActions openHref={learningPath.exerciseSet(row.id)} editHref={learningPath.exerciseSetEdit(lessonId, row.id)} onDelete={() => removeChild('exercise-sets', row.id)} /> },
                ]}
              />
            </Section>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}

function Section({ title, actionHref, actionLabel, children }: { title: string; actionHref: string; actionLabel: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button asChild><Link to={actionHref}>{actionLabel}</Link></Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function RowActions({ openHref, editHref, onDelete }: { openHref?: string; editHref: string; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      {openHref ? <Button asChild variant="outline" size="sm"><Link to={openHref}>Mở</Link></Button> : null}
      <Button asChild variant="ghost" size="sm"><Link to={editHref}>Sửa</Link></Button>
      <ConfirmAction title="Xóa học liệu" description="Mục này sẽ bị xóa khỏi bài học." onConfirm={onDelete} />
    </div>
  )
}
