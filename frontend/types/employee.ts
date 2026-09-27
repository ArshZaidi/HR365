export interface EmployeeProfile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: "employee" | "hr" | "admin";
  department: string | null;
  designation: string | null;
  phone?: string | null;
  joining_date?: string | null;
  manager_id?: string | null;
  is_active: boolean;
}