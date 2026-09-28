"use client";

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

  if (
    data.tasks_found === 0 &&
    !data.error
  ) {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)]/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-[var(--foreground)]">
            Task reassignment
          </h4>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Automatic workload redistribution triggered by approved leave.
          </p>
        </div>

        <div className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--foreground)]">
          {data.tasks_reassigned} reassigned
        </div>
      </div>

      {data.error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          {data.error}
        </div>
      )}

      {data.assignments && data.assignments.length > 0 && (
        <div className="mt-4 space-y-3">
          {data.assignments.map((assignment) => (
            <div
              key={assignment.task_id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="font-medium text-[var(--foreground)]">
                {assignment.task_title}
              </div>

              <div className="mt-2 text-sm text-[var(--muted)]">
                Reassigned to{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {assignment.new_employee_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.unassigned && data.unassigned.length > 0 && (
        <div className="mt-4 space-y-3">
          {data.unassigned.map((task) => (
            <div
              key={task.task_id}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
            >
              <div className="font-medium text-[var(--foreground)]">
                {task.task_title}
              </div>

              <div className="mt-1 text-sm text-[var(--muted)]">
                {task.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}