# Requirements Coverage Audit

Date: 2026-07-07

Requirement source:

- `研究院科研成果管理系统说明.html`

Audited project state:

- HEAD: `b7f54e8 docs: archive final ui polish acceptance`
- Scope audited: current repository code, Prisma schema, Web/API tests, and
  committed local-demo / synthetic acceptance documents.

Important boundary:

- This audit evaluates the current project as a local-demo / synthetic /
  local Docker production-like deliverable.
- It does not claim production/VPS/production DB acceptance.
- It does not include real external HR/SSO, DOI, patent, finance, email/SMS, or
  production backup execution.

## Summary

The project implements a substantial local-demo system, especially for:

- achievement registration for paper / patent / software copyright;
- workflow submission / review / archive / void paths;
- RBAC and department-scope enforcement;
- attachment metadata, upload/download, versioning, and access checks;
- fee ledger, fee status transitions, fee review, warnings, and voucher
  attachments;
- search, dashboard, custom reports, audit logs, settings API metadata, account
  lifecycle, department management, import jobs, and secret authorization;
- synthetic/mock interface demos and local acceptance evidence.

It does **not** fully implement the whole requirement file as a production-ready
system. The largest gaps are:

- real external integrations and real API acceptance;
- mobile / light-app implementation;
- production backup / restore / disaster recovery execution;
- performance and 50-concurrent-user proof;
- configurable workflow/rule/report/reminder builders for business users;
- Excel/PDF export and scheduled report push;
- full online preview/encrypted attachment storage guarantee;
- citation analysis and real literature/patent/finance/HR synchronization;
- full reminder UI and full notification delivery channels.

## Status Legend

- `Implemented`: direct code + tests or acceptance evidence supports the item
  in the current local-demo scope.
- `Partial`: implemented only as MVP, mock, read-only, local-demo/synthetic, or
  missing part of the requested behavior.
- `Not implemented / Not proven`: no direct evidence, or the requirement is
  outside the current project scope.

## 1. Project Goals

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Full lifecycle from registration, review, fee, maintenance, conversion, statistics to cancellation | Partial | Core modules exist: `achievements`, `workflow`, `fees`, `achievement-conversions`, `dashboard`, `reports`; cancellation/void is implemented. Full production lifecycle is not proven. |
| Automated interfaces reduce manual entry | Partial | `settings/api-integrations` supports mock demos and metadata; real DOI/patent/HR/finance calls are intentionally not used. |
| Multi-level warning to avoid overdue risks | Partial | Fee warning endpoint and reminder domain exist; full four-level + second escalation + delivery proof is not complete. |
| Multi-dimensional dashboards | Implemented | Dashboard API/Web and tests exist; local-demo evidence covers dashboard. |
| Connect existing HR / finance / literature systems | Partial | Interface metadata and mock demos exist; no real systems are called or accepted. |
| Phase 1 basic required version | Partial / mostly local-demo | Core registration, review, fees, warning, search, dashboard, RBAC, and mock API settings are present. Not production accepted. |
| Phase 2 full deepening version | Partial | Some Phase 2 items exist: conversions, custom reports, settings, account lifecycle. Mobile, deep external integrations, performance, monitoring are not complete. |

## 2. User Roles and Permission Boundaries

| Requirement | Status | Evidence / notes |
|---|---:|---|
| RBAC + department data isolation | Implemented | `authorization` guards/policies, `Role`, `Permission`, `UserRole`, department scope services, controller `RequirePermissions`. |
| Researcher: own achievements, attachments, reminders | Partial | Own-scope achievement and attachment policies exist; reminder confirmation exists. Full reminder UI and all receipt flows are not proven. |
| Research secretary: department review, fees, conversion, reports | Partial | Department review/fees/reports/conversions exist; export and full conversion workflow are partial. |
| Department administrator | Partial | Department management and account/role management exist, but exact role boundary from requirement is not separately proven. |
| Leader: whole-institute aggregate dashboard and drilldown | Partial | Aggregate dashboard/reports exist. Dedicated leader role and drilldown acceptance are not proven. |
| Secret achievement manager | Partial | Secret authorization read-only management and secret access policies exist. Full separate secret full-flow management is partial. |
| Auditor: read-only logs, archives, vouchers, approval records | Partial | Audit log UI/API and masked audit policy exist; export and complete immutable archive proof are not complete. |
| System administrator: global config, dictionary, reminders, interfaces, backup | Partial | Account/department/settings/interface management exist. Dictionary UI, full reminder rule UI, backup UI/execution are not complete. |

## 3. Functional Requirements

### 3.1 Achievement Registration

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Unified registration for papers, patents, software copyrights | Implemented | `Achievement`, `PaperDetail`, `PatentDetail`, `SoftwareCopyrightDetail`; Web `AchievementForm`; API `AchievementController`. |
| Paper fields: title, author list, internal/external author, cooperation unit, department, journal, ISSN/CN, year, DOI, inclusion, IF, partition, status, abstract | Partial | Core fields and contributors exist. Missing or not directly modeled: volume/page, cooperation unit as first-class paper field, online/formal publication status, project dependency. |
| Paper attachment types and version management | Partial | Generic attachment model has relation, file name, version, status, secret level; specific paper attachment category taxonomy is not complete. |
| Attachment online preview | Not implemented / Not proven | Download exists; no direct preview implementation found. |
| Attachment encrypted storage | Not implemented / Not proven | Local storage adapter exists; encryption at rest is not proven. |
| Attachment download permission checks | Implemented | Attachment controller uses permission guard and service access checks; tests cover denied/download audit cases. |
| DOI automatic completion | Partial | Mock DOI scenario exists in interface settings; integrated DOI auto-fill in achievement form is not proven. |
| DOI uniqueness | Implemented | `PaperDetail.doiNormalized @unique`. |
| Secret paper access control | Partial | Secret-level fields, access policies, resource grants, and Secret Authorization view exist; full secret paper attachment flow is partial. |
| Patent fields | Partial | Application/grant number, type, dates, next fee date, amount, legal status exist. Missing or not first-class: country, agency, PCT stage/state, patent identifier ordinary/defense/secret, project, fund source. |
| Patent status sync from official source | Partial | Mock patent status scenario exists; no real CNIPA/provider sync. |
| Patent status links to fees/reminders | Partial | Patent details, fee records, reminders exist; automatic status sync linkage is not fully proven. |
| Software copyright fields | Partial | Registration number, version, type, dates, run environment exist. Missing or not first-class: intro, cooperation unit, project. |
| Configurable approval workflow | Partial | Workflow engine supports submit/review/archive. Business-user configurable workflow nodes/rules are not complete. |
| Basic flow: researcher submit -> department review -> admin archive | Implemented | Achievement controller has submit/archive; workflow task review exists. |
| Differential workflow by type/level/secret | Partial | Policies exist, but fully configurable differential workflow is not proven. |
| Full audit logs for create/update/delete/status/attachment upload/download | Partial | `AuditLog` supports old/new value, IP, user agent; services record many events. Complete "all operations" and deletion immutability proof is not exhaustive. |
| Achievement void/cancel with reason and permanent archive | Partial | `void` action and `voidReason` exist. Permanent archival policy/retention proof is not complete. |

### 3.2 Achievement Conversion Tracking

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Transfer, license, equity conversion types | Partial | `AchievementConversionType` exists. Need exact enum mapping verification for all requested subtypes. |
| License subtypes: exclusive, sole, ordinary | Partial | Not proven as distinct first-class subtypes. |
| Contract number, counterparty, amount, received amount, date, distribution ratio, achievement relation | Partial | Conversion model has counterparty, contract/revenue amounts, conversion date, benefit distribution JSON/summary, achievement relation. Contract number and actual distribution ledger are not fully proven. |
| Distribution ledger, voucher, actual payout records | Partial / Not proven | Benefit JSON/summary exists; separate distribution ledger/voucher/payout table is not present. |
| Standard nodes: contract, receipt, invoice, complete | Partial | Contract/revenue status fields exist; custom nodes/invoice full flow not proven. |
| Custom business nodes | Not implemented / Not proven | No evidence of configurable node builder. |
| Contract stop/fail/void with reason/evidence/audit | Partial | Status fields and remarks exist; full evidence/audit flow not proven. |
| 3/6/12-month post-conversion benefit reminders | Partial | Reminder domain exists; exact conversion evaluation reminder schedule not proven. |
| Custom benefit indicators | Not implemented / Not proven | No business-user indicator config evidence. |
| Conversion funnel statistics | Implemented | Dashboard/reports include conversion funnel; closure docs confirm Route B conversion MVP. |

### 3.3 IP Fee Management

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Fee ledger linked to patent/software copyright | Partial | `FeeRecord` links to `Achievement`; type includes fee categories. Direct "only patent/soft copyright" constraints not fully proven. |
| Fund source, amount, paid date, due date, voucher number, status | Implemented | `FeeRecord` has `FundSource`, amount, due/paid date, voucher no, pay status. |
| Single payment and periodic annual-fee plan generation/edit/pause | Partial / Not proven | Fee records exist. Automatic periodic plan generation/edit/pause is not proven. |
| Online fee approval: submit -> department -> finance -> payment -> voucher archive | Partial | Fee review approve/reject/history exists. Finance approval/payment/voucher archive full chain is partial. |
| Four-level warnings: 30/15/7/overdue | Partial | Fee warnings/reminder rule engine exists; exact four-level delivery acceptance not complete. |
| Second escalation to department head | Not implemented / Not proven | No direct evidence. |
| Batch generate payment orders, batch mark paid | Not implemented / Not proven | Current UI/API show single-record operations; batch operation not proven. |
| Historical arrears trace query | Partial | Fee list/warnings/history exist; dedicated arrears trace query not proven. |
| Fee statistics by department/year/patent/fund source | Partial | Dashboard/custom reports include fee risk summaries; full dimensions are partial. |

### 3.4 Statistics and Reports

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Annual achievement trend | Implemented | Custom report `achievement-trend`. |
| Achievement type distribution | Implemented | Dashboard and custom report. |
| Department achievement ranking | Implemented | Dashboard summary includes department ranking. |
| Patent valid/invalid ratio | Partial | Patent legal status exists; direct dashboard ratio not clearly proven. |
| Conversion contract vs received amount | Implemented / Partial | Dashboard conversion totals include contract/revenue totals; local-demo only. |
| Conversion funnel rate | Implemented | Dashboard/report conversion funnel exists. |
| Citation analysis: personal/department/institute, citation count, H-index, average citation | Not implemented / Not proven | No direct citation sync/analysis implementation found. |
| Custom reports and multidimensional filters | Implemented | `reports` API, `CustomReports` Web, closure docs. |
| Personal/department/institute report permissions | Partial | Backend uses readable policy/department scope. Explicit personal/department/institute report types are partial. |
| Scheduled report push by month/quarter/year | Not implemented / Not proven | No scheduled report delivery evidence. |
| Export Excel/PDF with charts | Not implemented / Not proven | Closure explicitly says no export/download for custom reports. |

### 3.5 Reminders

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Reminder types: project, awards, patent annual fee, software maintenance, conversion evaluation, secret periodic check | Partial | `ReminderTargetType`, reminder rules, fee facts, notifications exist. Full set of types and UI are not proven. |
| Admin-configurable reminder name, deadline, N days, department/person, urgency | Partial | Reminder model/rule engine exists; admin UI/rule builder not proven. |
| In-app + email, SMS reserved, urgent popup | Partial | Mock in-app notification exists; account lifecycle mailer exists. General reminder email/SMS/global popup not complete. |
| Templates, batch creation, receipt confirmation, second escalation | Partial | Confirmation endpoint exists; templates/batch/second escalation not proven. |

### 3.6 Full-Text Search

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Search scope: title, abstract, author/inventor, keywords, application/patent number, contract number | Partial | Search API/Web exists over achievements/fees; exact full scope is partial. |
| Chinese word segmentation | Not implemented / Not proven | No search-engine/segmentation evidence. |
| Fuzzy matching | Partial | Database search adapter likely supports basic DB matching; search-engine-grade fuzzy relevance is not proven. |
| Keyword highlight | Not implemented / Not proven | No direct UI evidence. |
| Relevance sorting | Not implemented / Not proven | No direct evidence. |
| Advanced multi-field / multi-condition search | Partial | Web supports multiple filters; not full advanced search builder. |
| Filters by type, department, year, secret level, legal status | Partial | Type/status/department filters exist; year/secret/legal status coverage is not fully proven. |
| Permission filtering | Implemented | Search controller uses user context / permission guard; policies exist. |
| Search logs and hot keyword statistics | Partial | `SearchLog` model exists; hot keyword statistics not proven. |

## 4. Non-Functional Requirements

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Search <1s, dashboard <3s, normal page <2s, advanced search <2s | Not implemented / Not proven | No current performance benchmark proving these targets. |
| 50 concurrent users | Not implemented / Not proven | No load/concurrency test evidence. |
| RBAC + department isolation + secret independent permissions | Implemented / Partial | Strong code evidence for policies and grants. Production security acceptance is not complete. |
| Logs retained 5 years, immutable, undeletable | Partial | AuditLog model has no delete route found; retention policy/immutability controls are not proven. |
| Daily full DB backup, retain 30 days, manual instant backup | Partial / Not proven | Backup runbooks/checklists and attachment backup utility exist. Executed scheduled DB backup/restore proof is missing. |
| Attachment/detail access checks and no over-permission download/view | Implemented / Partial | Policies and tests exist; full penetration/security acceptance not complete. |
| Mobile/light-app support | Not implemented / Not proven | Web is responsive in parts, but no mobile/light-app feature acceptance. |
| RTO <= 4h, RPO <= 30m | Not implemented / Not proven | Runbooks may exist; no disaster recovery drill evidence. |
| Chrome/Edge/360, Windows/macOS compatibility | Partial / Not proven | Browser acceptance uses local Chromium/Chrome. Full matrix not proven. |
| 100k+ data performance design: partition/archive/index optimization | Partial | Many indexes exist; partition/archive design and large-data proof are not complete. |

## 5. External API Requirements

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Visual switch/config, online test, custom timeout | Partial | `ApiIntegration` metadata includes enabled/timeout and Web settings; mock demo run exists. |
| Retry max 3, failure logs, admin alert | Partial | API call logs and mock result modes exist; generic real retry/alert mechanism not proven. |
| Secrets via config/env, no hardcoding | Partial | Config and safety tests exist; this audit did not read env. Full secret-management acceptance not performed. |
| Manual-entry fallback | Partial | Manual forms exist for core entities; interface-specific fallback flows are partial. |
| DOI auto-completion API | Partial | Mock DOI lookup exists; real/integrated auto-fill not complete. |
| Citation data API | Not implemented / Not proven | No direct implementation evidence. |
| Patent legal status / annual fee sync API | Partial | Mock patent status sync exists; no real sync. |
| HR/SSO sync/login realtime validation | Partial | Auth/session/account lifecycle exists; real HR/SSO not called. |
| Email notification API | Partial | Account lifecycle mailer / Aliyun DirectMail adapter exists; general reminder/report email acceptance not complete. |
| SMS API | Not implemented / Not proven | No direct implementation evidence. |
| Finance API | Partial | Mock finance scenario exists; no real integration. |
| Multi-source priority/conflict cleaning/original raw logs | Not implemented / Not proven | No full implementation evidence. |
| Rate limiting / async queue | Not implemented / Not proven | No direct implementation evidence for external API calls. |
| Interface monitoring dashboard | Partial | Mock API call logs and dashboard metrics exist; real monitoring dashboard is partial. |
| Field mapping definitions | Partial | Mock scenario mappings exist; complete external mapping documentation not proven. |

## 6. Data Model Requirements

| Requirement | Status | Evidence / notes |
|---|---:|---|
| History archive tables for all main tables | Partial / Not implemented | AuditLog and ImportJob history exist; dedicated history archive tables for every main table are not present. |
| Primary keys, foreign keys, business indexes | Implemented | Prisma schema has UUID PKs, relations, unique constraints and indexes for core entities. |
| DOI/application/registration uniqueness | Implemented | Unique normalized fields exist for DOI, patent application/grant, software registration. |
| Independent attachment and dictionary tables | Partial | Attachment exists. Generic data dictionary table is not evident. |
| Clear relations for fees/conversions to paper/patent/software | Partial | Fees/conversions relate to `Achievement`, not polymorphic paper/patent/software tables directly; works through unified achievement. |
| User/department relationships for data isolation | Implemented | User/Department/UserRole and department IDs across business tables. |
| Search log table | Implemented | `SearchLog` model exists. |
| Interface config table | Implemented | `ApiIntegration` and `ApiCallLog` models exist. |

## 7. Acceptance Standards

| Requirement | Status | Evidence / notes |
|---|---:|---|
| Complete all functions in requirement file | Not implemented / Not proven | Many core functions are implemented, but mobile, production backup, real APIs, exports, performance and full configurability remain gaps. |
| Attachment versioning, permission control, audit logs, receipt confirmation | Partial | Attachment version/access and audit are implemented; reminder receipt confirmation endpoint exists; complete UI/business acceptance is partial. |
| Multi-level approval, differential workflow, batch operations, custom reports | Partial | Workflow/custom reports implemented. Differential configurable workflow and batch operations are incomplete. |
| 10,000-record search <=1s and 50 concurrent users | Not implemented / Not proven | No current benchmark/load proof. |
| DOI auto-fill and email notification API accepted, mock allowed in demo | Partial | Mock DOI/settings and account lifecycle email adapter exist; integrated demo acceptance for both as required is partial. |
| API retry, alert, switch, timeout, degradation | Partial | Settings metadata/mock supports part of this; full operational behavior not proven. |
| API extension documentation | Partial | Runbooks/design docs exist, but full extension documentation for every API is not proven. |
| RBAC, department isolation, secret control without overreach | Implemented / Partial | Strong code evidence and local acceptance; no production security audit. |
| Audit log query/export, immutable logs | Partial | Query exists; export/immutability proof incomplete. |
| Daily backup and restore | Not implemented / Not proven | Runbooks/utilities exist; scheduled backup/restore acceptance missing. |
| Operations: settings, dictionary, interface management, logs | Partial | Settings/interface/logs exist; dictionary management not evident. |
| Browser/OS/mobile compatibility | Partial / Not proven | Local browser acceptance exists; matrix/mobile acceptance missing. |
| Disaster recovery and abnormal alerts | Not implemented / Not proven | No drill evidence. |
| Business-user self-maintenance for workflow/reminder/report/benefit configs | Partial / Not implemented | Custom report templates are fixed in code; full self-service config is not complete. |

## Overall Conclusion

The current project is **not a full implementation of every requirement in the
HTML specification**.

It is best characterized as:

- a strong local-demo / competition-grade implementation of the core research
  achievement, workflow, fee, report, search, settings, account, department,
  audit, import, and secret-authorization surfaces;
- with many Phase 1 requirements covered or mostly covered;
- with selected Phase 2 items implemented as MVP/read-only/mock/synthetic;
- but without production-level proof for real integrations, performance,
  mobile, backups, disaster recovery, export, scheduled delivery, and fully
  configurable business-rule builders.

Recommended next step:

1. Decide whether the target is still competition/local-demo delivery or a full
   requirement-file production implementation.
2. If local-demo: prepare a final delivery statement that explicitly marks the
   above gaps as out of scope / future work.
3. If full implementation: split remaining work into separate epics:
   external integrations, export/report scheduling, reminder UI/rules,
   mobile/responsive acceptance, backup/DR, performance/load testing, and
   configurable workflow/rule builders.
