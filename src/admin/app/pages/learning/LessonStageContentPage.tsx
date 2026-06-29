import { Link, Navigate, useParams } from 'react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { useAdminLesson } from '../../features/learning/api/use-learning-admin'
import { LESSON_SECTIONS, stageOneTotal } from './authoring-meta'
import { GateCard, PageHero } from './authoring-ui'
import { learningPath } from './route-utils'

/**
 * Nội dung bài học — màn hình này chỉ làm MỘT việc: chọn 1 trong 3 khu soạn
 * (Nội dung bài / Từ vựng / Quy tắc ngữ pháp). Không soạn gì tại đây.
 */
export function LessonStageContentPage() {
  const { lessonId } = useParams()
  const { data: lesson } = useAdminLesson(lessonId)

  if (!lessonId) return <Navigate to={learningPath.courses()} replace />

  const total = stageOneTotal(lesson)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học', href: learningPath.lesson(lessonId) },
          { label: 'Nội dung bài học' },
        ]}
      />

      <PageHero
        Icon={BookOpen}
        title="Nội dung bài học"
        count={{ value: total, label: 'mục' }}
        description="Chọn khu soạn: Nội dung bài, Từ vựng hoặc Quy tắc ngữ pháp."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {LESSON_SECTIONS.map((section) => (
          <GateCard
            key={section.value}
            to={learningPath.lessonSection(lessonId, section.value)}
            Icon={section.Icon}
            label={section.label}
            description={section.hint}
            count={section.count(lesson)}
          />
        ))}
      </div>

      <div className="flex justify-end border-t-2 border-border pt-4">
        <Button asChild variant="outline">
          <Link to={learningPath.lessonStageExercises(lessonId)}>
            Tiếp theo: Bài tập
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
