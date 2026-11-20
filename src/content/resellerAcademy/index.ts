import type { Lesson, Module } from './types';
import { MODULES_1_4 } from './modules-1-4';
import { MODULES_5_6 } from './modules-5-6';
import { MODULES_7_9 } from './modules-7-9';
import { MODULES_10_12 } from './modules-10-12';
import { MODULES_13 } from './modules-13';

export type { Lesson, Module, FollowStep, ResourceLink, AppPanelKind } from './types';
export { GLOSSARY } from './glossary';

export const MODULES: Module[] = [...MODULES_1_4, ...MODULES_5_6, ...MODULES_7_9, ...MODULES_10_12, ...MODULES_13];

export const ALL_LESSONS: Lesson[] = MODULES.flatMap((m) => m.lessons);

export const LESSON_IDS: string[] = ALL_LESSONS.map((l) => l.id);

export function getLesson(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getModuleOf(lessonId: string): Module | undefined {
  return MODULES.find((m) => m.lessons.some((l) => l.id === lessonId));
}

export function nextLessonId(lessonId: string): string | null {
  const i = LESSON_IDS.indexOf(lessonId);
  return i >= 0 && i + 1 < LESSON_IDS.length ? LESSON_IDS[i + 1] : null;
}

export function prevLessonId(lessonId: string): string | null {
  const i = LESSON_IDS.indexOf(lessonId);
  return i > 0 ? LESSON_IDS[i - 1] : null;
}
