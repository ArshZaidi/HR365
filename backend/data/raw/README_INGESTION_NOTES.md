# HR365 Knowledge Base — Ingestion Notes

## Active source corpus
Ingest only these 11 source files:
- 01_employee_handbook.md
- 02_attendance_policy.md
- 03_leave_policy.md
- 04_remote_work_policy.md
- 05_code_of_conduct.md
- 06_benefits_policy.md
- 07_payroll_policy.md
- 08_it_security_policy.md
- 09_hr_faq.md
- 10_workplace_safety_and_grievance.md
- 11_company_notices.md

## Excluded file
The consolidated `00_employee_handbook_master.md` file is intentionally excluded from the RAG corpus because it duplicates the 11 source documents and can cause duplicate retrievals and citation ambiguity.

## Notice handling
`11_company_notices.md` contains time-bounded notices. The ingestion pipeline should parse each notice's `Expiry Date` and exclude notices whose expiry date is before the current date from active retrieval. Expired notices may remain in the source file for historical/audit purposes.

## Metadata
Each source now includes `Document Type` and `Authority` metadata. These fields are intended to support future retrieval filtering and source-priority logic; the current RAG implementation does not need to use them immediately.

## No substantive policy changes
The policy facts, numbers, dates, eligibility rules, exceptions, responsibilities, and contacts were not rewritten. The changes are metadata/ingestion-safety improvements only.
