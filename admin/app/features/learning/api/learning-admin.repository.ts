import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type { Course, ExerciseSet, Lesson, Module } from '../types'

function unwrap<T>(response: { data: T | { data: T } }): T {
  return (response.data as { data?: T }).data ?? (response.data as T)
}

export class LearningAdminRepository {
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get<{ data: Course[] }>('/admin/learning/courses')
    return unwrap(response)
  }

  async getCourse(courseId: string): Promise<Course> {
    const response = await apiClient.get<{ data: Course }>(`/admin/learning/courses/${courseId}`)
    return unwrap(response)
  }

  async getModule(moduleId: string): Promise<Module> {
    const response = await apiClient.get<{ data: Module }>(`/admin/learning/modules/${moduleId}`)
    return unwrap(response)
  }

  async getLesson(lessonId: string): Promise<Lesson> {
    const response = await apiClient.get<{ data: Lesson }>(`/admin/learning/lessons/${lessonId}`)
    return unwrap(response)
  }

  async getExerciseSet(setId: string): Promise<ExerciseSet> {
    const response = await apiClient.get<{ data: ExerciseSet }>(`/admin/learning/exercise-sets/${setId}`)
    return unwrap(response)
  }

  async createCourse(payload: Record<string, unknown>) {
    const response = await apiClient.post('/admin/learning/courses', payload)
    return unwrap(response)
  }

  async updateCourse(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/learning/courses/${id}`, payload)
    return unwrap(response)
  }

  async deleteCourse(id: string) {
    await apiClient.delete(`/admin/learning/courses/${id}`)
  }

  async createModule(courseId: string, payload: Record<string, unknown>) {
    const response = await apiClient.post(`/admin/learning/courses/${courseId}/modules`, payload)
    return unwrap(response)
  }

  async updateModule(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/learning/modules/${id}`, payload)
    return unwrap(response)
  }

  async deleteModule(id: string) {
    await apiClient.delete(`/admin/learning/modules/${id}`)
  }

  async createLesson(moduleId: string, payload: Record<string, unknown>) {
    const response = await apiClient.post(`/admin/learning/modules/${moduleId}/lessons`, payload)
    return unwrap(response)
  }

  async updateLesson(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/learning/lessons/${id}`, payload)
    return unwrap(response)
  }

  async deleteLesson(id: string) {
    await apiClient.delete(`/admin/learning/lessons/${id}`)
  }

  async createLessonChild(kind: string, lessonId: string, payload: Record<string, unknown>) {
    const response = await apiClient.post(`/admin/learning/lessons/${lessonId}/${kind}`, payload)
    return unwrap(response)
  }

  async updateLessonChild(kind: string, id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/learning/${kind}/${id}`, payload)
    return unwrap(response)
  }

  async deleteLessonChild(kind: string, id: string) {
    await apiClient.delete(`/admin/learning/${kind}/${id}`)
  }

  async createExercise(setId: string, payload: Record<string, unknown>) {
    const response = await apiClient.post(`/admin/learning/exercise-sets/${setId}/exercises`, payload)
    return unwrap(response)
  }

  async updateExercise(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/learning/exercises/${id}`, payload)
    return unwrap(response)
  }

  async deleteExercise(id: string) {
    await apiClient.delete(`/admin/learning/exercises/${id}`)
  }
}

export const learningAdminRepository = new LearningAdminRepository()
