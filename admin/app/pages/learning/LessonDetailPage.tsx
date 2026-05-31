import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Plus, Edit, BookOpen, FileText, BookMarked, Lightbulb, ClipboardList, Clock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { LoadingState } from '../../components/admin/LoadingState'
import { ErrorState } from '../../components/admin/ErrorState'
import { EmptyState } from '../../components/admin/EmptyState'
import { DataTable } from '../../components/admin/DataTable'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { ExerciseSet, GrammarRule, LessonContent, Vocabulary } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function LessonDetailPage() {
  const { lessonId } = useParams()
  const { data: lesson, isLoading, error, refetch } = useAdminLesson(lessonId)
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
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học' },
        ]}
      />

      {/* Lesson Header */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        {/* Cover Area */}
        <div className="h-32 bg-accent/10 flex items-center justify-center relative border-b-2 border-border">
          <BookOpen className="h-16 w-16 text-accent/30" />
          {lessonId && lesson && (
            <Button asChild variant="secondary" size="lg" className="absolute top-4 right-6">
              <Link to={learningPath.lessonEdit(lesson.moduleId, lessonId)}>
                <Edit className="h-5 w-5" />
                Sửa bài học
              </Link>
            </Button>
          )}
        </div>

        {/* Lesson Info */}
        <div className="p-8 space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="secondary" className="text-base px-4 py-2">
                {lesson?.lessonType}
              </Badge>
              {lesson?.estimatedDuration && (
                <div className="flex items-center gap-2 text-base text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">{lesson.estimatedDuration} phút</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">{lesson?.title ?? 'Bài học'}</h1>
            {lesson?.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{lesson.description}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{lesson?.contents?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Nội dung</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <BookMarked className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <p className="text-2xl font-bold">{lesson?.vocabularies?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Từ vựng</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <Lightbulb className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{lesson?.grammarRules?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Ngữ pháp</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <ClipboardList className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{lesson?.exerciseSets?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Bộ bài tập</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải bài học..." />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Không tải được dữ liệu'}
          onRetry={() => refetch()}
        />
      ) : lesson && lessonId ? (
        <Tabs defaultValue="contents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14">
            <TabsTrigger value="contents" className="text-base">
              <FileText className="h-5 w-5 mr-2" />
              Nội dung
            </TabsTrigger>
            <TabsTrigger value="vocabularies" className="text-base">
              <BookMarked className="h-5 w-5 mr-2" />
              Từ vựng
            </TabsTrigger>
            <TabsTrigger value="grammar" className="text-base">
              <Lightbulb className="h-5 w-5 mr-2" />
              Ngữ pháp
            </TabsTrigger>
            <TabsTrigger value="sets" className="text-base">
              <ClipboardList className="h-5 w-5 mr-2" />
              Bộ bài tập
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contents">
            <Section
              title="Nội dung bài học"
              icon={FileText}
              actionHref={learningPath.contentNew(lessonId)}
              actionLabel="Thêm nội dung"
              emptyIcon={FileText}
              emptyTitle="Chưa có nội dung"
              emptyDescription="Thêm nội dung đầu tiên cho bài học này"
            >
              <DataTable
                data={lesson.contents ?? []}
                empty="Chưa có nội dung"
                columns={[
                  { key: 'text', header: 'Tiếng Việt', cell: (row: LessonContent) => <span className="font-medium">{row.vietnameseText}</span> },
                  { key: 'type', header: 'Kiểu', cell: (row) => <Badge variant="outline">{row.contentType}</Badge> },
                  { key: 'order', header: 'Thứ tự', cell: (row) => <span className="font-semibold">#{row.orderIndex}</span> },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => <RowActions editHref={learningPath.contentEdit(lessonId, row.id)} onDelete={() => removeChild('contents', row.id)} /> },
                ]}
              />
            </Section>
          </TabsContent>

          <TabsContent value="vocabularies">
            <Section
              title="Từ vựng"
              icon={BookMarked}
              actionHref={learningPath.vocabularyNew(lessonId)}
              actionLabel="Thêm từ vựng"
              emptyIcon={BookMarked}
              emptyTitle="Chưa có từ vựng"
              emptyDescription="Thêm từ vựng đầu tiên cho bài học này"
            >
              <DataTable
                data={lesson.vocabularies ?? []}
                empty="Chưa có từ vựng"
                columns={[
                  { key: 'word', header: 'Từ', cell: (row: Vocabulary) => <span className="font-bold text-lg">{row.word}</span> },
                  { key: 'translation', header: 'Dịch', cell: (row) => <span className="text-base">{row.translation}</span> },
                  { key: 'pos', header: 'Loại', cell: (row) => <Badge variant="secondary">{row.partOfSpeech}</Badge> },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => <RowActions editHref={learningPath.vocabularyEdit(lessonId, row.id)} onDelete={() => removeChild('vocabularies', row.id)} /> },
                ]}
              />
            </Section>
          </TabsContent>

          <TabsContent value="grammar">
            <Section
              title="Ngữ pháp"
              icon={Lightbulb}
              actionHref={learningPath.grammarNew(lessonId)}
              actionLabel="Thêm ngữ pháp"
              emptyIcon={Lightbulb}
              emptyTitle="Chưa có ngữ pháp"
              emptyDescription="Thêm điểm ngữ pháp đầu tiên cho bài học này"
            >
              <DataTable
                data={lesson.grammarRules ?? []}
                empty="Chưa có ngữ pháp"
                columns={[
                  { key: 'title', header: 'Tên', cell: (row: GrammarRule) => <span className="font-bold text-base">{row.title}</span> },
                  { key: 'structure', header: 'Cấu trúc', cell: (row) => <code className="text-sm bg-muted px-2 py-1 rounded">{row.structure ?? '-'}</code> },
                  { key: 'difficulty', header: 'Độ khó', cell: (row) => <Badge>{row.difficultyLevel}</Badge> },
                  { key: 'actions', header: '', className: 'text-right', cell: (row) => <RowActions editHref={learningPath.grammarEdit(lessonId, row.id)} onDelete={() => removeChild('grammar', row.id)} /> },
                ]}
              />
            </Section>
          </TabsContent>

          <TabsContent value="sets">
            <Section
              title="Bộ bài tập"
              icon={ClipboardList}
              actionHref={learningPath.exerciseSetNew(lessonId)}
              actionLabel="Thêm bộ bài tập"
              emptyIcon={ClipboardList}
              emptyTitle="Chưa có bộ bài tập"
              emptyDescription="Tạo bộ bài tập đầu tiên cho bài học này"
            >
              <DataTable
                data={lesson.exerciseSets ?? []}
                empty="Chưa có bộ bài tập"
                columns={[
                  { key: 'title', header: 'Tên', cell: (row: ExerciseSet) => <Link className="font-bold text-base hover:text-primary transition-colors" to={learningPath.exerciseSet(row.id)}>{row.title}</Link> },
                  { key: 'count', header: 'Bài tập', cell: (row) => <Badge variant="secondary" className="text-base">{row.exercises?.length ?? 0} bài</Badge> },
                  { key: 'order', header: 'Thứ tự', cell: (row) => <span className="font-semibold">#{row.orderIndex}</span> },
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

function Section({
  title,
  icon: Icon,
  actionHref,
  actionLabel,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children
}: {
  title: string
  icon: any
  actionHref: string
  actionLabel: string
  emptyIcon: any
  emptyTitle: string
  emptyDescription: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Button asChild size="lg">
          <Link to={actionHref}>
            <Plus className="h-5 w-5" />
            {actionLabel}
          </Link>
        </Button>
      </div>
      {children}
    </div>
  )
}

function RowActions({ openHref, editHref, onDelete }: { openHref?: string; editHref: string; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      {openHref && (
        <Button asChild variant="default" size="sm">
          <Link to={openHref}>Mở</Link>
        </Button>
      )}
      <Button asChild variant="outline" size="sm">
        <Link to={editHref}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (window.confirm('Xác nhận xóa?')) {
            onDelete()
          }
        }}
        className="text-destructive hover:text-destructive"
      >
        Xóa
      </Button>
    </div>
  )
}
