"use client";

import { GraduationCap, Presentation, ShieldCheck, Sparkles } from "lucide-react";
import type { ViewRole } from "@/lib/courses";

const views: { id: ViewRole; label: string; description: string; icon: typeof GraduationCap }[] = [
  { id: "student", label: "Student View", description: "学习进度与课程", icon: GraduationCap },
  { id: "instructor", label: "Instructor View", description: "课程管理与学员", icon: Presentation },
  { id: "admin", label: "Admin View", description: "平台与审核", icon: ShieldCheck },
];

type SidebarProps = {
  activeView: ViewRole;
  onViewChange: (view: ViewRole) => void;
};

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface md:h-screen md:w-64 md:border-r md:border-b-0 md:sticky md:top-0">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">LearnGen</p>
          <p className="text-xs text-muted">GenAI 学习平台</p>
        </div>
      </div>

      <nav aria-label="视图切换" className="px-3 pb-4 md:flex-1">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-muted">视图</p>
        <ul className="flex gap-1 md:flex-col">
          {views.map(({ id, label, description, icon: Icon }) => {
            const isActive = activeView === id;
            return (
              <li key={id} className="flex-1 md:flex-none">
                <button
                  type="button"
                  onClick={() => onViewChange(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                    isActive
                      ? "bg-surface-2 text-foreground"
                      : "text-muted hover:bg-surface-2/60 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`size-4 shrink-0 ${isActive ? "text-accent" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="hidden text-xs text-muted md:block">{description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden border-t border-border px-5 py-4 md:block">
        <p className="text-xs text-muted">COMP5241 · 2026 秋季学期</p>
      </div>
    </aside>
  );
}
