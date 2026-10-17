import type { MiniCourse, ViewRole } from "@/lib/courses";

type Stat = { label: string; value: string };

function getStats(view: ViewRole, courses: MiniCourse[]): Stat[] {
  if (view === "student") {
    const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100).length;
    const avg = Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / (courses.length || 1));
    const minutes = courses.reduce((sum, c) => sum + Math.round((c.durationMinutes * c.progress) / 100), 0);
    return [
      { label: "进行中课程", value: String(inProgress) },
      { label: "平均进度", value: `${avg}%` },
      { label: "已学习时长", value: `${minutes} 分钟` },
    ];
  }

  const enrolled = courses.reduce((sum, c) => sum + c.enrolled, 0);
  const aiCount = courses.filter((c) => c.aiGenerated).length;

  if (view === "instructor") {
    return [
      { label: "课程总数", value: String(courses.length) },
      { label: "学员总数", value: String(enrolled) },
      { label: "AI 生成课程", value: String(aiCount) },
    ];
  }

  return [
    { label: "已发布", value: String(courses.filter((c) => c.status === "published").length) },
    { label: "待审核", value: String(courses.filter((c) => c.status === "review").length) },
    { label: "平台学员", value: String(enrolled) },
  ];
}

export function StatsRow({ view, courses }: { view: ViewRole; courses: MiniCourse[] }) {
  const stats = getStats(view, courses);

  return (
    <dl className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 px-5 py-4">
          <dt className="text-xs text-muted">{stat.label}</dt>
          <dd className="font-mono text-xl font-semibold">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
