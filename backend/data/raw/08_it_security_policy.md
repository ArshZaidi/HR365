# IT Security Policy

- Document ID: HR365-POL-008
- Document Type: Policy
- Authority: Authoritative
- Version: 2.0
- Effective Date: 2026-01-01
- Review Date: 2026-12-31
- Owner: IT Department
- Approved By: Head of IT
- Status: Active
- Applies To: All employees, contractors, and interns
- Confidentiality: Internal
- Supersedes: 1.0
- Related Documents: HR365-POL-004, HR365-POL-005

---

## 1. Purpose

Defines the rules employees must follow to protect NimbusWorks accounts, devices, data, and systems from unauthorized access, loss, or compromise.

## 2. Scope

Applies to all employees using:

- Company-provided systems
- Company-connected personal devices (where permitted)
- Company networks or VPN
- Company data (in any form)

Whether on-site or remote.

## 3. Definitions

| Term | Definition |
|---|---|
| Company Systems | Email, HR365 portal, code repos, finance tools, and any system accessed with company credentials |
| Endpoint | Laptop, desktop, mobile device, or tablet used for company work |
| MFA | Multi-Factor Authentication |
| VPN | Virtual Private Network |
| Phishing | Deceptive email or message attempting to extract credentials or deliver malware |
| Security Incident | Any unauthorized access, loss, or breach involving company systems or data |
| Approved Software | Software vetted by IT and available via the Company catalog |
| Company Data | Any non-public information belonging to the Company, clients, or employees |
| Encryption | Encoding of data so it cannot be read without a key |

## 4. Accounts

- Each employee is issued **one** company email/account on joining
- Account sharing between employees is **strictly prohibited**
- Accounts are deactivated within **24 hours** of exit
- Contractors receive time-bound accounts (max 90 days, renewable)
- Employees must not create personal accounts on company systems without IT approval

## 5. Passwords and MFA

### 5.1 Password Rules

- Minimum **12 characters**
- Must combine upper/lower case, numbers, and symbols
- Changed every **90 days**
- Cannot reuse the last **5** passwords
- Must not be shared with anyone (including IT)

### 5.2 Multi-Factor Authentication

- **Mandatory** for email, VPN, HR365 portal, and all core business systems
- MFA methods: Authenticator app (preferred), hardware token, SMS (fallback)
- Do not approve MFA prompts you did not initiate
- Report suspicious MFA prompts to it-security@nimbusworks.example immediately

## 6. Company Devices

### 6.1 Required Protections

- **Disk encryption** must be enabled at all times
- **Endpoint protection** software must be active and updated
- **Automatic updates** for OS and critical software must be enabled
- **Screen lock** after 5 minutes of inactivity

### 6.2 Software Installation

- Install only **approved software** from the Company catalog
- Unapproved software requires IT approval via the HR365 IT Request module
- No software from untrusted sources
- No personal cloud storage or file-sharing apps

### 6.3 Device Care

- Devices must not be left unattended in public spaces
- Devices must be transported in protective cases
- Damage due to negligence may be recovered per HR365-POL-007

## 7. VPN

- **Mandatory** for remote access to internal systems
- **Mandatory** for any work over public Wi-Fi
- Sessions auto-disconnect after **8 hours** of inactivity
- Re-authentication (with MFA) is required on reconnect
- Personal VPNs must not be used for company work

## 8. Data Handling

### 8.1 Storage

- Confidential Company or client data must not be stored on personal devices
- Personal cloud storage (Google Drive personal, iCloud, Dropbox personal) is prohibited
- Company data must be stored only in approved Company systems
- Removable media (USB drives) is prohibited without IT approval

### 8.2 Sharing

- Share data only via approved Company tools
- Never email confidential data to personal email addresses
- Verify recipient identity before sharing sensitive information
- Use password-protected archives for highly sensitive files

### 8.3 Classification

| Level | Examples | Handling |
|---|---|---|
| Public | Marketing materials, public website | Standard |
| Internal | Policies, internal memos | Company-only sharing |
| Confidential | Client contracts, financials, employee PII | Need-to-know, encrypted |
| Restricted | Source code, trade secrets, security configs | Highest protection, access-controlled |

## 9. Security Incident Reporting

### 9.1 What Counts as an Incident

- Lost or stolen device
- Suspected phishing
- Unauthorized access to an account
- Malware infection
- Data leak or accidental disclosure
- Suspicious MFA prompts
- Ransomware or suspicious encryption

### 9.2 Reporting Timeline

| Incident | Report Within |
|---|---|
| Lost or stolen device | **2 hours** |
| Phishing email received | Immediately (do not click) |
| Suspected account compromise | **1 hour** |
| Data leak | **Immediately** |
| Malware infection | Immediately |

### 9.3 Reporting Channels

- **it-security@nimbusworks.example** (primary)
- **24×7 IT hotline** (see HR365 portal)
- For phishing: use the "Report Phishing" button in the company email client

### 9.4 Investigation

- All incidents are logged and reviewed by IT Security within **24 hours**
- Root cause analysis is performed
- Affected employees are notified if their data was involved
- Corrective actions are tracked to closure

## 10. Email and Communication

- Company email is for business use; incidental personal use is permitted
- Do not open attachments or click links from unknown senders
- Verify unexpected requests for sensitive information (even from known senders) via a separate channel
- Do not auto-forward company email to personal accounts
- Company email may be monitored for security purposes per applicable law

## 11. Remote Access

- Follow HR365-POL-004 for WFH rules
- Use only Company-issued laptops for remote work
- Personal devices may not be used to access company email or internal systems
- Public computers (cafés, libraries, hotels) must not be used for company work
- Use VPN at all times

## 12. Contractor Access

- Contractors requiring system access must have **time-bound accounts** (max 90 days, renewable)
- Approved by IT and the sponsoring manager
- Access scope limited to what the engagement requires
- Contractor accounts are deactivated at the end of engagement or at 90 days, whichever is earlier

## 13. Physical Security

- Lock your workstation when leaving your desk
- Do not allow unauthorized persons to use your device
- Report suspicious persons on premises to security
- Do not share access cards
- Visitor badges must be returned at exit

## 14. Compliance and Enforcement

- Compliance with this policy is mandatory
- Violations may result in access revocation and disciplinary action per HR365-POL-005
- Serious violations (data theft, unauthorized access to restricted systems) may result in termination and legal action

## 15. Responsibilities

**Employee:** Follow password/MFA rules, use approved devices, report incidents promptly.
**Manager:** Ensure team compliance, sponsor contractor access with review.
**IT Department:** Provision/deprovision accounts, monitor security incidents, maintain approved software catalog.
**IT Security:** Investigate incidents, update policy based on evolving threats.

## 16. Contact and Escalation

| Purpose | Contact |
|---|---|
| IT support | it-support@nimbusworks.example |
| Security incidents | it-security@nimbusworks.example |
| Urgent / after-hours | 24×7 IT hotline (see portal) |
| Escalation | Head of IT |

## 17. Change History

| Version | Date | Change | Approved By |
|---|---|---|---|
| 1.0 | 2026-01-01 | Initial version | Head of IT |
| 2.0 | 2026-01-01 | Expanded with data classification, incident SLAs, and contractor rules. No substantive policy changes. | Head of IT |