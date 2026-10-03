"use client";

import { ArrowRight, UserPlus, UserX } from "lucide-react";

interface Assignment {
  task_id: string;
  task_title: string;
  new_employee_id: string;
  new_employee_name: string;
  reason: string;
}

interface UnassignedTask {
  task_id: string;
  task_title: string;
  reason: string;
}

interface TaskReassignmentData {
  tasks_found: number;
  tasks_reassigned: number;
  tasks_unassigned: number;
  assignments?: Assignment[];
  unassigned?: UnassignedTask[];
  error?: string;
}

interface TaskReassignmentProps {
  data: TaskReassignmentData | null;
}

export default function TaskReassignment({
  data,
}: TaskReassignmentProps) {
  if (!data) return null;
  if (data.tasks_found === 0 && !data.error) return null;

  return (
    <div
      className="
        mt-5 rounded-2xl border p-5
        border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl
        shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-xs)]
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[15.5px] font-medium tracking-[-0.01em]">
            Task reassignment
          </p>
          <p className="mt-1 text-[12.5px] text-[var(--muted)]">
            Automatic workload redistribution triggered by approved leave.
          </p>
        </div>

        <span
          className="shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold tabular-nums"
          style={{
            background: "var(--accent-3-soft)",
            color: "var(--accent-3)",
          }}
        >
          {data.tasks_reassigned} reassigned
        </span>
      </div>

      {data.error && (
        <div
          className="mt-4 rounded-xl border p-3 text-[13px]"
          style={{
            borderColor: "var(--danger)",
            background: "var(--danger-soft)",
            color: "var(--danger)",
          }}
        >
          {data.error}
        </div>
      )}

      {data.assignments && data.assignments.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {data.assignments.map((assignment) => (
            <div
              key={assignment.task_id}
              className="
                flex items-center gap-3 rounded-xl border p-3.5
                border-[var(--border)]
                bg-[var(--surface)]/40 backdrop-blur-xl
              "
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-4), var(--accent-3))",
                }}
              >
                <UserPlus size={14} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">
                  {assignment.task_title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                  <span>Reassigned to</span>
                  <ArrowRight size={11} />
                  <span className="font-medium text-[var(--foreground)]">
                    {assignment.new_employee_name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.unassigned && data.unassigned.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {data.unassigned.map((task) => (
            <div
              key={task.task_id}
              className="
                flex items-center gap-3 rounded-xl border p-3.5
              "
              style={{
                borderColor: "var(--warning)",
                background: "var(--warning-soft)",
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: "var(--warning-soft)",
                  color: "var(--warning)",
                  boxShadow: "inset 0 0 0 1px var(--warning)",
                }}
              >
                <UserX size={14} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">
                  {task.task_title}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                  {task.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}