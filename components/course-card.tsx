import { BookOpen, Clock, Sparkles, Users } from "lucide-react";
import { statusLabel, type MiniCourse, type ViewRole } from "@/lib/courses";

const statusStyles = {
  published: "bg-success/10 text-success",
  review: "bg-accent/10 text-accent",
  draft: "bg-surface-2 text-muted",
} as const;

type CourseCardProps = {
  course: MiniCourse;
  view: ViewRole;
};

export function CourseCard({ course, view }: CourseCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-muted/40">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{course.category}</span>
        <div className="flex items-center gap-2">
          {course.aiGenerated && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 px-2 py-0.5 text-xs text-accent">
              <Sparkles className="size-3" aria-hidden="true" />
              AI 生成
            </span>
          )}
          {view !== "student" && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[course.status]}`}>
              {statusLabel[course.status]}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-balance">{course.title}</h3>
        <p className="text-sm leading-relaxed text-muted text-pretty">{course.summary}</p>
      </div>

      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">课时</dt>
          <dd>{course.lessons} 课时</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">时长</dt>
          <dd>{course.durationMinutes} 分钟</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">学员</dt>
          <dd>{course.enrolled} 名学员</dd>
        </div>
        <div>
          <dt className="sr-only">难度</dt>
          <dd>{course.level}</dd>
        </div>
      </dl>

      <div className="mt-auto border-t border-border pt-4">
        {view === "student" && <StudentFooter progress={course.progress} />}
        {view === "instructor" && <ActionFooter meta={`更新于 ${course.updatedAt}`} action="编辑课程" />}
        {view === "admin" && (
          <ActionFooter
            meta={`讲师：${course.instructor}`}
            action={course.status === "review" ? "审核" : "管理"}
          />
        )}
      </div>
    </article>
  );
}

function StudentFooter({ progress }: { progress: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="学习进度"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-xs text-muted">{progress}%</span>
      <button
        type="button"
        className="rounded-md bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
      >
        {progress > 0 ? "继续学习" : "开始学习"}
      </button>
    </div>
  );
}

function ActionFooter({ meta, action }: { meta: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted">{meta}</span>
      <button
        type="button"
        className="rounded-md bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
      >
        {action}
      </button>
    </div>
  );
}
