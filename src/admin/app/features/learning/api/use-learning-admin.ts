import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { learningAdminRepository } from './learning-admin.repository'

export function useAdminCourses() {
  return useQuery({
    queryKey: ['admin-learning', 'courses'],
    queryFn: () => learningAdminRepository.getCourses(),
  })
}

export function useAdminCourse(courseId?: string) {
  return useQuery({
    queryKey: ['admin-learning', 'course', courseId],
    queryFn: () => learningAdminRepository.getCourse(courseId as string),
    enabled: !!courseId,
  })
}

export function useAdminModule(moduleId?: string) {
  return useQuery({
    queryKey: ['admin-learning', 'module', moduleId],
    queryFn: () => learningAdminRepository.getModule(moduleId as string),
    enabled: !!moduleId,
  })
}

export function useAdminLesson(lessonId?: string) {
  return useQuery({
    queryKey: ['admin-learning', 'lesson', lessonId],
    queryFn: () => learningAdminRepository.getLesson(lessonId as string),
    enabled: !!lessonId,
  })
}

export function useAdminExercise(exerciseId?: string) {
  return useQuery({
    queryKey: ['admin-learning', 'exercise', exerciseId],
    queryFn: () => learningAdminRepository.getExercise(exerciseId as string),
    enabled: !!exerciseId,
  })
}

export function useLearningAdminMutation() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-learning'] })

  return {
    createCourse: useMutation({
      mutationFn: (payload: Record<string, unknown>) => learningAdminRepository.createCourse(payload),
      onSuccess: invalidate,
    }),
    updateCourse: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.updateCourse(id, payload),
      onSuccess: invalidate,
    }),
    setCoursePublished: useMutation({
      mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
        learningAdminRepository.setCoursePublished(id, isPublished),
      onSuccess: invalidate,
    }),
    deleteCourse: useMutation({
      mutationFn: (id: string) => learningAdminRepository.deleteCourse(id),
      onSuccess: invalidate,
    }),
    createModule: useMutation({
      mutationFn: ({ courseId, payload }: { courseId: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.createModule(courseId, payload),
      onSuccess: invalidate,
    }),
    updateModule: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.updateModule(id, payload),
      onSuccess: invalidate,
    }),
    deleteModule: useMutation({
      mutationFn: (id: string) => learningAdminRepository.deleteModule(id),
      onSuccess: invalidate,
    }),
    createLesson: useMutation({
      mutationFn: ({ moduleId, payload }: { moduleId: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.createLesson(moduleId, payload),
      onSuccess: invalidate,
    }),
    updateLesson: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.updateLesson(id, payload),
      onSuccess: invalidate,
    }),
    deleteLesson: useMutation({
      mutationFn: (id: string) => learningAdminRepository.deleteLesson(id),
      onSuccess: invalidate,
    }),
    createLessonChild: useMutation({
      mutationFn: ({ kind, lessonId, payload }: { kind: string; lessonId: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.createLessonChild(kind, lessonId, payload),
      onSuccess: invalidate,
    }),
    updateLessonChild: useMutation({
      mutationFn: ({ kind, id, payload }: { kind: string; id: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.updateLessonChild(kind, id, payload),
      onSuccess: invalidate,
    }),
    deleteLessonChild: useMutation({
      mutationFn: ({ kind, id }: { kind: string; id: string }) => learningAdminRepository.deleteLessonChild(kind, id),
      onSuccess: invalidate,
    }),
    updateExercise: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.updateExercise(id, payload),
      onSuccess: invalidate,
    }),
    deleteExercise: useMutation({
      mutationFn: (id: string) => learningAdminRepository.deleteExercise(id),
      onSuccess: invalidate,
    }),
    createQuestion: useMutation({
      mutationFn: ({ exerciseId, payload }: { exerciseId: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.createQuestion(exerciseId, payload),
      onSuccess: invalidate,
    }),
    updateQuestion: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        learningAdminRepository.updateQuestion(id, payload),
      onSuccess: invalidate,
    }),
    deleteQuestion: useMutation({
      mutationFn: (id: string) => learningAdminRepository.deleteQuestion(id),
      onSuccess: invalidate,
    }),
    reorderCourses: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderCourses(items),
      onSuccess: invalidate,
    }),
    reorderModules: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderModules(items),
      onSuccess: invalidate,
    }),
    reorderLessons: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderLessons(items),
      onSuccess: invalidate,
    }),
    reorderExercises: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderExercises(items),
      onSuccess: invalidate,
    }),
    reorderQuestions: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderQuestions(items),
      onSuccess: invalidate,
    }),
    reorderContents: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderContents(items),
      onSuccess: invalidate,
    }),
    reorderVocabularies: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderVocabularies(items),
      onSuccess: invalidate,
    }),
    reorderGrammar: useMutation({
      mutationFn: (items: { id: string; orderIndex: number }[]) =>
        learningAdminRepository.reorderGrammar(items),
      onSuccess: invalidate,
    }),
  }
}
