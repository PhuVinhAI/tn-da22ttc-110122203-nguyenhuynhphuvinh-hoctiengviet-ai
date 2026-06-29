import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BookMarked, FileText, Lightbulb, Plus, Volume2, FileSpreadsheet } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { useAdminListReorder } from '../../components/admin/hooks/use-admin-list-reorder'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { GrammarRule, Lesson, LessonContent, Vocabulary } from '../../features/learning/types'
import { lessonSectionMeta } from './authoring-meta'
import { ConfirmDeleteDialog, PageHero, SectionHeader, SortableItemRow } from './authoring-ui'
import { POS_OPTIONS } from '../../components/admin/lesson-editors/shared/PartOfSpeechPicker'
import { learningPath } from './route-utils'
import { BulkImportVocabDialog } from './BulkImportVocabDialog'

const POS_LABEL = Object.fromEntries(POS_OPTIONS.map((o) => [o.value, o.label]))

/**
 * Khu soạn nội dung bài học — mỗi màn một việc duy nhất (ADR 0002):
 * - Nội dung bài / Từ vựng / Quy tắc ngữ pháp: CHỌN MỤC để mở form soạn riêng,
 *   hoặc thêm mục mới.
 */
export function LessonSectionPage() {
  const { lessonId, section } = useParams()
  const { data: lesson } = useAdminLesson(lessonId)
  const meta = lessonSectionMeta(section)

  if (!lessonId) return <Navigate to={learningPath.courses()} replace />
  if (!meta) return <Navigate to={learningPath.lesson(lessonId)} replace />

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học', href: learningPath.lesson(lessonId) },
          { label: 'Nội dung bài học', href: learningPath.lessonStageContent(lessonId) },
          { label: meta.label },
        ]}
      />

      <PageHero
        Icon={meta.Icon}
        title={meta.label}
        description={meta.description}
      />

      {meta.value === 'materials' && <MaterialList lessonId={lessonId} lesson={lesson} />}
      {meta.value === 'vocabulary' && <VocabularyList lessonId={lessonId} lesson={lesson} />}
      {meta.value === 'grammar' && <GrammarList lessonId={lessonId} lesson={lesson} />}
    </div>
  )
}

/* ── Nội dung bài (văn bản tiếng Việt + bản dịch) ─────────────────────────── */

function MaterialList({ lessonId, lesson }: { lessonId: string; lesson: Lesson | undefined }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<LessonContent | null>(null)

  const lessonKey = ['admin-learning', 'lesson', lessonId] as const

  const { sensors, handleDragEnd } = useAdminListReorder<LessonContent>({
    getItems: () => qc.getQueryData<Lesson>(lessonKey)?.contents ?? [],
    setItems: (next) =>
      qc.setQueryData<Lesson>(lessonKey, (prev) => (prev ? { ...prev, contents: next } : prev)),
    reorder: (items) => mutations.reorderContents.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại nội dung'),
  })

  const rows = [...(lesson?.contents ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteLessonChild.mutateAsync({ kind: 'contents', id: pendingDelete.id })
      toast.success('Đã xóa nội dung')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const addButton = (
    <Button asChild>
      <Link to={learningPath.materialNew(lessonId)}>
        <Plus className="h-4 w-4" />
        Thêm nội dung
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Danh sách nội dung"
        description="Kéo để sắp xếp lại thứ tự hiển thị cho học viên."
        actions={addButton}
      />

      {rows.length === 0 ? (
        <EmptySection
          Icon={FileText}
          title="Chưa có nội dung"
          hint="Thêm đoạn văn đầu tiên cho bài học này"
          cta={addButton}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rows.map((row) => (
                <SortableItemRow
                  key={row.id}
                  id={row.id}
                  onOpen={() => navigate(learningPath.materialEdit(lessonId, row.id))}
                  onDelete={() => setPendingDelete(row)}
                  leading={
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-600 text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                  }
                  title={materialRowTitle(row)}
                  meta={
                    row.translation ? (
                      <span className="truncate">{row.translation}</span>
                    ) : (
                      <span className="italic text-muted-foreground/70">Chưa có bản dịch</span>
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        resource="nội dung"
        label={materialRowTitle(pendingDelete ?? undefined) || 'Nội dung'}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function materialRowTitle(row: LessonContent | undefined): string {
  if (!row) return ''
  const text = row.vietnameseText?.trim() ?? ''
  if (!text) return 'Chưa có nội dung'
  return text.length > 80 ? `${text.slice(0, 80)}…` : text
}

/* ── Từ vựng: chọn MỤC ───────────────────────────────────────────────────── */

function VocabularyList({ lessonId, lesson }: { lessonId: string; lesson: Lesson | undefined }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Vocabulary | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const lessonKey = ['admin-learning', 'lesson', lessonId] as const
  const { sensors, handleDragEnd } = useAdminListReorder<Vocabulary>({
    getItems: () => qc.getQueryData<Lesson>(lessonKey)?.vocabularies ?? [],
    setItems: (next) =>
      qc.setQueryData<Lesson>(lessonKey, (prev) => (prev ? { ...prev, vocabularies: next } : prev)),
    reorder: (items) => mutations.reorderVocabularies.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại từ vựng'),
  })

  const rows = [...(lesson?.vocabularies ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteLessonChild.mutateAsync({ kind: 'vocabularies', id: pendingDelete.id })
      toast.success('Đã xóa từ vựng')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const addButton = (
    <Button asChild>
      <Link to={learningPath.vocabNew(lessonId)}>
        <Plus className="h-4 w-4" />
        Thêm từ vựng
      </Link>
    </Button>
  )

  const bulkButton = (
    <Button variant="outline" onClick={() => setBulkOpen(true)}>
      <FileSpreadsheet className="h-4 w-4" />
      Nhập từ Excel
    </Button>
  )

  const actionButtons = (
    <div className="flex items-center gap-2">
      {bulkButton}
      {addButton}
    </div>
  )

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Danh sách từ vựng"
        description="Kéo để sắp xếp lại thứ tự giới thiệu từ cho học viên."
        actions={actionButtons}
      />

      {rows.length === 0 ? (
        <EmptySection
          Icon={BookMarked}
          title="Chưa có từ vựng"
          hint="Thêm từ đầu tiên cho bài học này"
          cta={actionButtons}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rows.map((row) => (
                <SortableItemRow
                  key={row.id}
                  id={row.id}
                  onOpen={() => navigate(learningPath.vocabEdit(lessonId, row.id))}
                  onDelete={() => setPendingDelete(row)}
                  leading={
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      {row.audioUrl ? <Volume2 className="h-5 w-5" /> : <BookMarked className="h-5 w-5" />}
                    </div>
                  }
                  title={
                    <span>
                      {row.word || <span className="italic text-muted-foreground">Chưa có từ</span>}
                      <span className="text-muted-foreground font-normal"> — {row.translation || '…'}</span>
                    </span>
                  }
                  meta={
                    <>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                        {POS_LABEL[row.partOfSpeech] ?? row.partOfSpeech}
                      </span>
                      {row.audioUrl && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-xs font-bold">
                          <Volume2 className="h-3 w-3" />
                          audio
                        </span>
                      )}
                      {row.imageUrl && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                          hình
                        </span>
                      )}
                    </>
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        resource="từ vựng"
        label={pendingDelete?.word ?? ''}
        onConfirm={confirmDelete}
      />

      <BulkImportVocabDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        existingCount={rows.length}
        onImport={async (items) => {
          let nextOrderIndex = rows.length
          for (const item of items) {
            await mutations.createLessonChild.mutateAsync({
              kind: 'vocabularies',
              lessonId,
              payload: { ...item, orderIndex: nextOrderIndex++ },
            })
          }
        }}
      />
    </div>
  )
}

/* ── Quy tắc ngữ pháp: chọn MỤC ──────────────────────────────────────────── */

function GrammarList({ lessonId, lesson }: { lessonId: string; lesson: Lesson | undefined }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<GrammarRule | null>(null)

  const lessonKey = ['admin-learning', 'lesson', lessonId] as const
  const { sensors, handleDragEnd } = useAdminListReorder<GrammarRule>({
    getItems: () => qc.getQueryData<Lesson>(lessonKey)?.grammarRules ?? [],
    setItems: (next) =>
      qc.setQueryData<Lesson>(lessonKey, (prev) => (prev ? { ...prev, grammarRules: next } : prev)),
    reorder: (items) => mutations.reorderGrammar.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại quy tắc'),
  })

  const rows = [...(lesson?.grammarRules ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteLessonChild.mutateAsync({ kind: 'grammar', id: pendingDelete.id })
      toast.success('Đã xóa quy tắc ngữ pháp')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const addButton = (
    <Button asChild>
      <Link to={learningPath.grammarNew(lessonId)}>
        <Plus className="h-4 w-4" />
        Thêm quy tắc
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Danh sách quy tắc ngữ pháp"
        description="Kéo để sắp xếp lại thứ tự dạy quy tắc cho học viên."
        actions={addButton}
      />

      {rows.length === 0 ? (
        <EmptySection
          Icon={Lightbulb}
          title="Chưa có quy tắc ngữ pháp"
          hint="Thêm quy tắc đầu tiên cho bài học này"
          cta={addButton}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rows.map((row) => {
                const examples = Array.isArray(row.examples) ? row.examples : []
                return (
                  <SortableItemRow
                    key={row.id}
                    id={row.id}
                    onOpen={() => navigate(learningPath.grammarEdit(lessonId, row.id))}
                    onDelete={() => setPendingDelete(row)}
                    leading={
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                    }
                    title={row.title || <span className="italic text-muted-foreground">Chưa có tiêu đề</span>}
                    meta={
                      <>
                        {row.structure && (
                          <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-bold">
                            {row.structure}
                          </code>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                          {examples.length} ví dụ
                        </span>
                      </>
                    }
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        resource="quy tắc ngữ pháp"
        label={pendingDelete?.title ?? ''}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function EmptySection({
  Icon,
  title,
  hint,
  cta,
}: {
  Icon: React.ComponentType<{ className?: string }>
  title: string
  hint: string
  cta: React.ReactNode
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
      <Icon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{hint}</p>
      {cta}
    </div>
  )
}
