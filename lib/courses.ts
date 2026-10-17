export type ViewRole = "student" | "instructor" | "admin";

export type CourseStatus = "published" | "draft" | "review";

export type MiniCourse = {
  id: string;
  title: string;
  summary: string;
  category: string;
  lessons: number;
  durationMinutes: number;
  level: "入门" | "进阶" | "高级";
  instructor: string;
  enrolled: number;
  progress: number;
  status: CourseStatus;
  aiGenerated: boolean;
  updatedAt: string;
};

export const miniCourses: MiniCourse[] = [
  {
    id: "fundamentals-of-software-engineering",
    title: "Fundamentals of Software Engineering",
    summary: "从需求分析、设计模式到测试与版本控制，建立扎实的软件工程基础。",
    category: "软件工程",
    lessons: 12,
    durationMinutes: 180,
    level: "入门",
    instructor: "Dr. Chen",
    enrolled: 248,
    progress: 64,
    status: "published",
    aiGenerated: false,
    updatedAt: "2026-10-12",
  },
  {
    id: "using-ai-coding-agents",
    title: "Using AI Coding Agents",
    summary: "学习如何与 AI 编程助手协作：提示设计、代码审查与安全的自动化工作流。",
    category: "生成式 AI",
    lessons: 8,
    durationMinutes: 120,
    level: "进阶",
    instructor: "Prof. Wong",
    enrolled: 312,
    progress: 25,
    status: "published",
    aiGenerated: true,
    updatedAt: "2026-10-15",
  },
  {
    id: "prompt-engineering-essentials",
    title: "Prompt Engineering Essentials",
    summary: "掌握结构化提示、少样本示例与评估方法，让大模型输出更可靠。",
    category: "生成式 AI",
    lessons: 6,
    durationMinutes: 90,
    level: "入门",
    instructor: "Prof. Wong",
    enrolled: 187,
    progress: 0,
    status: "review",
    aiGenerated: true,
    updatedAt: "2026-10-16",
  },
  {
    id: "testing-and-continuous-integration",
    title: "Testing and Continuous Integration",
    summary: "单元测试、集成测试与 CI 流水线实践，保障团队交付质量。",
    category: "软件工程",
    lessons: 10,
    durationMinutes: 150,
    level: "进阶",
    instructor: "Dr. Chen",
    enrolled: 0,
    progress: 0,
    status: "draft",
    aiGenerated: false,
    updatedAt: "2026-10-17",
  },
];

export const statusLabel: Record<CourseStatus, string> = {
  published: "已发布",
  review: "待审核",
  draft: "草稿",
};
