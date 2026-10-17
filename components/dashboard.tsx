"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { CourseCard } from "@/components/course-card";
import { StatsRow } from "@/components/stats-row";
import { miniCourses, type ViewRole } from "@/lib/courses";

const headings: Record<ViewRole, { title: string; subtitle: string }> = {
  student: { title: "我的 Mini-courses", subtitle: "继续你的学习旅程，按自己的节奏完成课程。" },
  instructor: { title: "我的课程", subtitle: "管理课程内容，借助 AI 快速创建新的 Mini-course。" },
  admin: { title: "全部 Mini-courses", subtitle: "查看平台课程状态并处理待审核内容。" },
};

export function Dashboard() {
  const [view, setView] = useState<ViewRole>("student");
  const { title, subtitle } = headings[view];

  const courses =
    view === "student" ? miniCourses.filter((course) => course.status === "published") : miniCourses;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar activeView={view} onViewChange={setView} />

      <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
              <p className="text-sm text-muted">{subtitle}</p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Generate New Course with AI
            </button>
          </header>

          <StatsRow view={view} courses={courses} />

          <section aria-labelledby="course-list-heading" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="course-list-heading" className="text-sm font-medium">
                Mini-courses
              </h2>
              <span className="font-mono text-xs text-muted">{courses.length} 门课程</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} view={view} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
