/* eslint-disable @typescript-eslint/no-require-imports */
/* global console, process, require */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ids = {
  departments: {
    institute: "10000000-0000-4000-8000-000000000001",
    ai: "10000000-0000-4000-8000-000000000002",
    materials: "10000000-0000-4000-8000-000000000003",
    admin: "10000000-0000-4000-8000-000000000004",
  },
  roles: {
    researcher: "20000000-0000-4000-8000-000000000001",
    secretary: "20000000-0000-4000-8000-000000000002",
    systemAdmin: "20000000-0000-4000-8000-000000000003",
    auditor: "20000000-0000-4000-8000-000000000004",
    leader: "20000000-0000-4000-8000-000000000005",
    secretManager: "20000000-0000-4000-8000-000000000006",
    departmentAdmin: "20000000-0000-4000-8000-000000000007",
    financeReviewer: "20000000-0000-4000-8000-000000000008",
  },
  permissions: {
    achievementCreate: "30000000-0000-4000-8000-000000000001",
    achievementReadOwn: "30000000-0000-4000-8000-000000000002",
    achievementUpdateOwn: "30000000-0000-4000-8000-000000000003",
    achievementSubmit: "30000000-0000-4000-8000-000000000004",
    achievementReadDepartment: "30000000-0000-4000-8000-000000000005",
    achievementReviewDepartment: "30000000-0000-4000-8000-000000000006",
    achievementArchive: "30000000-0000-4000-8000-000000000007",
    feeManageDepartment: "30000000-0000-4000-8000-000000000008",
    reminderReadDepartment: "30000000-0000-4000-8000-000000000009",
    auditRead: "30000000-0000-4000-8000-000000000010",
    dashboardReadInstitute: "30000000-0000-4000-8000-000000000011",
    secretGrant: "30000000-0000-4000-8000-000000000012",
    systemConfig: "30000000-0000-4000-8000-000000000013",
    userContextRead: "30000000-0000-4000-8000-000000000014",
    attachmentReadMetadata: "30000000-0000-4000-8000-000000000015",
    attachmentDownload: "30000000-0000-4000-8000-000000000016",
    auditReadMasked: "30000000-0000-4000-8000-000000000017",
    departmentReadDepartment: "30000000-0000-4000-8000-000000000018",
    feeReadDepartment: "30000000-0000-4000-8000-000000000019",
    resourceGrantCreate: "30000000-0000-4000-8000-000000000020",
    resourceGrantRevoke: "30000000-0000-4000-8000-000000000021",
    accountInvite: "30000000-0000-4000-8000-000000000022",
    accountResetPassword: "30000000-0000-4000-8000-000000000023",
    feeReviewDepartment: "30000000-0000-4000-8000-000000000024",
  },
  users: {
    researcher: "40000000-0000-4000-8000-000000000001",
    secretary: "40000000-0000-4000-8000-000000000002",
    admin: "40000000-0000-4000-8000-000000000003",
    auditor: "40000000-0000-4000-8000-000000000004",
    leader: "40000000-0000-4000-8000-000000000005",
    secretManager: "40000000-0000-4000-8000-000000000006",
  },
  userRoles: {
    researcher: "41000000-0000-4000-8000-000000000001",
    secretary: "41000000-0000-4000-8000-000000000002",
    admin: "41000000-0000-4000-8000-000000000003",
    auditor: "41000000-0000-4000-8000-000000000004",
    leader: "41000000-0000-4000-8000-000000000005",
    secretManager: "41000000-0000-4000-8000-000000000006",
    adminAiDepartmentAdmin: "41000000-0000-4000-8000-000000000007",
    adminAiFinanceReviewer: "41000000-0000-4000-8000-000000000008",
  },
  achievements: {
    paper: "50000000-0000-4000-8000-000000000001",
    patent: "50000000-0000-4000-8000-000000000002",
    software: "50000000-0000-4000-8000-000000000003",
  },
  contributors: {
    paperOne: "51000000-0000-4000-8000-000000000001",
    paperTwo: "51000000-0000-4000-8000-000000000002",
    patentOne: "51000000-0000-4000-8000-000000000003",
    softwareOne: "51000000-0000-4000-8000-000000000004",
  },
  fees: {
    patentAnnual: "60000000-0000-4000-8000-000000000001",
    softwareRegister: "60000000-0000-4000-8000-000000000002",
  },
  reminders: {
    patentAnnual30: "61000000-0000-4000-8000-000000000001",
    softwareRegister7: "61000000-0000-4000-8000-000000000002",
  },
  attachments: {
    paper: "70000000-0000-4000-8000-000000000001",
    patent: "70000000-0000-4000-8000-000000000002",
    software: "70000000-0000-4000-8000-000000000003",
    feeVoucher: "70000000-0000-4000-8000-000000000004",
  },
  workflowInstances: {
    patentArchive: "90000000-0000-4000-8000-000000000001",
    patentFeeReview: "90000000-0000-4000-8000-000000000002",
  },
  workflowTasks: {
    patentFeeReviewAdmin: "91000000-0000-4000-8000-000000000001",
  },
  workflowActions: {
    patentFeeReviewSubmit: "92000000-0000-4000-8000-000000000001",
  },
  conversions: {
    paperLicense: "93000000-0000-4000-8000-000000000001",
  },
  resourceAccessGrants: {
    patentDepartmentActive: "94000000-0000-4000-8000-000000000001",
    patentSecretManagerExpiring: "94000000-0000-4000-8000-000000000002",
    patentAttachmentExpired: "94000000-0000-4000-8000-000000000003",
    patentAttachmentRevoked: "94000000-0000-4000-8000-000000000004",
    patentAttachmentFuture: "94000000-0000-4000-8000-000000000005",
  },
  auditLogs: {
    patentGrantCreated: "95000000-0000-4000-8000-000000000001",
    patentAttachmentGrantRevoked: "95000000-0000-4000-8000-000000000002",
    patentAttachmentGrantExpired: "95000000-0000-4000-8000-000000000003",
  },
};

const dateOnly = (value) => new Date(`${value}T00:00:00.000Z`);
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const isMissingTableError = (error) => error?.code === "P2021";

async function seedDepartments() {
  await prisma.department.upsert({
    where: { id: ids.departments.institute },
    update: { code: "DEMO-INSTITUTE", name: "Demo Research Institute", status: "ACTIVE" },
    create: {
      id: ids.departments.institute,
      code: "DEMO-INSTITUTE",
      name: "Demo Research Institute",
      status: "ACTIVE",
    },
  });

  const childDepartments = [
    { id: ids.departments.ai, code: "DEMO-AI", name: "Demo AI Research Dept" },
    { id: ids.departments.materials, code: "DEMO-MATERIALS", name: "Demo Materials Dept" },
    { id: ids.departments.admin, code: "DEMO-ADMIN", name: "Demo Research Admin Office" },
  ];

  for (const department of childDepartments) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: {
        code: department.code,
        name: department.name,
        parentId: ids.departments.institute,
        status: "ACTIVE",
      },
      create: {
        ...department,
        parentId: ids.departments.institute,
        status: "ACTIVE",
      },
    });
  }
}

async function seedRolesAndPermissions() {
  const roles = [
    { key: "researcher", id: ids.roles.researcher, code: "RESEARCHER", name: "Demo Researcher" },
    { key: "secretary", id: ids.roles.secretary, code: "RESEARCH_SECRETARY", name: "Demo Research Secretary" },
    { key: "departmentAdmin", id: ids.roles.departmentAdmin, code: "DEPARTMENT_ADMIN", name: "Demo Department Admin" },
    { key: "systemAdmin", id: ids.roles.systemAdmin, code: "SYSTEM_ADMIN", name: "Demo System Admin" },
    { key: "financeReviewer", id: ids.roles.financeReviewer, code: "FINANCE_REVIEWER", name: "Demo Finance Reviewer" },
    { key: "auditor", id: ids.roles.auditor, code: "AUDITOR", name: "Demo Auditor" },
    { key: "leader", id: ids.roles.leader, code: "LEADER", name: "Demo Leader" },
    { key: "secretManager", id: ids.roles.secretManager, code: "SECRET_MANAGER", name: "Demo Secret Manager" },
  ];

  for (const role of roles) {
    const persisted = await prisma.role.upsert({
      where: { code: role.code },
      update: { code: role.code, name: role.name, status: "ACTIVE" },
      create: { id: role.id, code: role.code, name: role.name, status: "ACTIVE" },
    });
    ids.roles[role.key] = persisted.id;
  }

  const permissions = [
    [ids.permissions.achievementCreate, "achievement:create", "achievement", "create", "Create achievement", "ACTIVE"],
    [ids.permissions.achievementReadOwn, "achievement:read_own", "achievement", "read_own", "Read own achievements", "ACTIVE"],
    [ids.permissions.achievementUpdateOwn, "achievement:update_own", "achievement", "update_own", "Update own achievements", "ACTIVE"],
    [ids.permissions.achievementSubmit, "achievement:submit", "achievement", "submit", "Submit achievement", "ACTIVE"],
    [ids.permissions.achievementReadDepartment, "achievement:read_department", "achievement", "read_department", "Read department achievements", "ACTIVE"],
    [ids.permissions.achievementReviewDepartment, "achievement:review_department", "achievement", "review_department", "Review department achievements", "ACTIVE"],
    [ids.permissions.achievementArchive, "achievement:archive", "achievement", "archive", "Archive achievement", "ACTIVE"],
    [ids.permissions.feeManageDepartment, "fee:manage_department", "fee", "manage_department", "Manage department fees", "ACTIVE"],
    [ids.permissions.reminderReadDepartment, "reminder:read_department", "reminder", "read_department", "Read department reminders", "ACTIVE"],
    [ids.permissions.auditRead, "audit:read", "audit", "read", "Deprecated unmasked audit read", "ARCHIVED"],
    [ids.permissions.dashboardReadInstitute, "dashboard:read_institute", "dashboard", "read_institute", "Read institute dashboard", "ACTIVE"],
    [ids.permissions.secretGrant, "secret:grant", "secret", "grant", "Deprecated broad secret grant", "ARCHIVED"],
    [ids.permissions.systemConfig, "system:config", "system", "config", "Configure system", "ACTIVE"],
    [ids.permissions.userContextRead, "user_context:read", "user_context", "read", "Read current user context", "ACTIVE"],
    [ids.permissions.attachmentReadMetadata, "attachment:read_metadata", "attachment", "read_metadata", "Read attachment metadata", "ACTIVE"],
    [ids.permissions.attachmentDownload, "attachment:download", "attachment", "download", "Download attachment through authorized channel", "ACTIVE"],
    [ids.permissions.auditReadMasked, "audit:read_masked", "audit", "read_masked", "Read masked audit logs", "ACTIVE"],
    [ids.permissions.departmentReadDepartment, "department:read_department", "department", "read_department", "Read department-scoped department data", "ACTIVE"],
    [ids.permissions.feeReadDepartment, "fee:read_department", "fee", "read_department", "Read department fee records", "ACTIVE"],
    [ids.permissions.feeReviewDepartment, "fee:review_department", "fee", "review_department", "Review department fee records", "ACTIVE"],
    [ids.permissions.resourceGrantCreate, "resource_grant:create", "resource_grant", "create", "Create resource access grants", "ACTIVE"],
    [ids.permissions.resourceGrantRevoke, "resource_grant:revoke", "resource_grant", "revoke", "Revoke resource access grants", "ACTIVE"],
    [ids.permissions.accountInvite, "account:invite", "account", "invite", "Invite accounts", "ACTIVE"],
    [ids.permissions.accountResetPassword, "account:reset_password", "account", "reset_password", "Reset account passwords", "ACTIVE"],
  ];

  const permissionKeysById = Object.fromEntries(
    Object.entries(ids.permissions).map(([key, id]) => [id, key]),
  );

  for (const [id, code, resource, action, name, status] of permissions) {
    const persisted = await prisma.permission.upsert({
      where: { code },
      update: { code, resource, action, name, status },
      create: { id, code, resource, action, name, status },
    });
    ids.permissions[permissionKeysById[id]] = persisted.id;
  }

  const rolePermissions = [
    [ids.roles.researcher, ids.permissions.achievementCreate],
    [ids.roles.researcher, ids.permissions.achievementReadOwn],
    [ids.roles.researcher, ids.permissions.achievementUpdateOwn],
    [ids.roles.researcher, ids.permissions.achievementSubmit],
    [ids.roles.researcher, ids.permissions.userContextRead],
    [ids.roles.researcher, ids.permissions.attachmentReadMetadata],
    [ids.roles.secretary, ids.permissions.achievementReadDepartment],
    [ids.roles.secretary, ids.permissions.achievementReviewDepartment],
    [ids.roles.secretary, ids.permissions.feeManageDepartment],
    [ids.roles.secretary, ids.permissions.feeReadDepartment],
    [ids.roles.secretary, ids.permissions.reminderReadDepartment],
    [ids.roles.secretary, ids.permissions.departmentReadDepartment],
    [ids.roles.secretary, ids.permissions.userContextRead],
    [ids.roles.secretary, ids.permissions.attachmentReadMetadata],
    [ids.roles.departmentAdmin, ids.permissions.achievementReadDepartment],
    [ids.roles.departmentAdmin, ids.permissions.departmentReadDepartment],
    [ids.roles.departmentAdmin, ids.permissions.feeReadDepartment],
    [ids.roles.departmentAdmin, ids.permissions.reminderReadDepartment],
    [ids.roles.departmentAdmin, ids.permissions.userContextRead],
    [ids.roles.departmentAdmin, ids.permissions.attachmentReadMetadata],
    [ids.roles.systemAdmin, ids.permissions.achievementArchive],
    [ids.roles.systemAdmin, ids.permissions.feeReviewDepartment],
    [ids.roles.systemAdmin, ids.permissions.auditReadMasked],
    [ids.roles.systemAdmin, ids.permissions.systemConfig],
    [ids.roles.systemAdmin, ids.permissions.userContextRead],
    [ids.roles.systemAdmin, ids.permissions.accountInvite],
    [ids.roles.systemAdmin, ids.permissions.accountResetPassword],
    [ids.roles.financeReviewer, ids.permissions.userContextRead],
    [ids.roles.financeReviewer, ids.permissions.feeReadDepartment],
    [ids.roles.financeReviewer, ids.permissions.feeReviewDepartment],
    [ids.roles.auditor, ids.permissions.auditReadMasked],
    [ids.roles.auditor, ids.permissions.userContextRead],
    [ids.roles.leader, ids.permissions.dashboardReadInstitute],
    [ids.roles.leader, ids.permissions.userContextRead],
    [ids.roles.secretManager, ids.permissions.resourceGrantCreate],
    [ids.roles.secretManager, ids.permissions.resourceGrantRevoke],
    [ids.roles.secretManager, ids.permissions.userContextRead],
  ];

  await prisma.rolePermission.createMany({
    data: rolePermissions.map(([roleId, permissionId]) => ({ roleId, permissionId })),
    skipDuplicates: true,
  });
}

async function seedUsers() {
  const users = [
    [ids.users.researcher, "demo.researcher@example.invalid", "Demo Researcher", ids.departments.ai],
    [ids.users.secretary, "demo.secretary@example.invalid", "Demo Secretary", ids.departments.ai],
    [ids.users.admin, "demo.admin@example.invalid", "Demo System Admin", ids.departments.admin],
    [ids.users.auditor, "demo.auditor@example.invalid", "Demo Auditor", ids.departments.admin],
    [ids.users.leader, "demo.leader@example.invalid", "Demo Leader", ids.departments.institute],
    [ids.users.secretManager, "demo.secret.manager@example.invalid", "Demo Secret Manager", ids.departments.admin],
  ];

  for (const [id, email, name, departmentId] of users) {
    await prisma.user.upsert({
      where: { id },
      update: { email, name, departmentId, status: "ACTIVE" },
      create: { id, email, name, departmentId, status: "ACTIVE" },
    });
  }

  const userRoles = [
    [ids.userRoles.researcher, ids.users.researcher, ids.roles.researcher, "DEPARTMENT", ids.departments.ai, ids.departments.ai],
    [ids.userRoles.secretary, ids.users.secretary, ids.roles.secretary, "DEPARTMENT", ids.departments.ai, ids.departments.ai],
    [ids.userRoles.admin, ids.users.admin, ids.roles.systemAdmin, "GLOBAL", "GLOBAL", null],
    [ids.userRoles.adminAiDepartmentAdmin, ids.users.admin, ids.roles.departmentAdmin, "DEPARTMENT", ids.departments.ai, ids.departments.ai],
    [ids.userRoles.adminAiFinanceReviewer, ids.users.admin, ids.roles.financeReviewer, "DEPARTMENT", ids.departments.ai, ids.departments.ai],
    [ids.userRoles.auditor, ids.users.auditor, ids.roles.auditor, "GLOBAL", "GLOBAL", null],
    [ids.userRoles.leader, ids.users.leader, ids.roles.leader, "GLOBAL", "GLOBAL", null],
    [ids.userRoles.secretManager, ids.users.secretManager, ids.roles.secretManager, "GLOBAL", "GLOBAL", null],
  ];

  for (const [id, userId, roleId, scopeType, scopeKey, departmentId] of userRoles) {
    await prisma.userRole.upsert({
      where: { id },
      update: { userId, roleId, scopeType, scopeKey, departmentId, revokedAt: null },
      create: { id, userId, roleId, scopeType, scopeKey, departmentId },
    });
  }
}

async function seedAchievements() {
  await prisma.achievement.upsert({
    where: { id: ids.achievements.paper },
    update: {
      title: "Demo Paper on Knowledge Management",
      status: "ARCHIVED",
      secretLevel: "INTERNAL",
      departmentId: ids.departments.ai,
      ownerUserId: ids.users.researcher,
      submittedById: ids.users.researcher,
      archivedAt: dateOnly("2026-06-01"),
    },
    create: {
      id: ids.achievements.paper,
      type: "PAPER",
      title: "Demo Paper on Knowledge Management",
      status: "ARCHIVED",
      secretLevel: "INTERNAL",
      departmentId: ids.departments.ai,
      ownerUserId: ids.users.researcher,
      submittedById: ids.users.researcher,
      createdById: ids.users.researcher,
      updatedById: ids.users.researcher,
      submittedAt: dateOnly("2026-05-20"),
      archivedAt: dateOnly("2026-06-01"),
    },
  });

  await prisma.paperDetail.upsert({
    where: { achievementId: ids.achievements.paper },
    update: {
      doi: "10.0000/demo.paper.001",
      doiNormalized: "10.0000/DEMO.PAPER.001",
      journal: "Demo Journal of Research Systems",
      publishYear: 2026,
      includedType: "DEMO",
      abstract: "Demo abstract for local development seed data.",
    },
    create: {
      achievementId: ids.achievements.paper,
      doi: "10.0000/demo.paper.001",
      doiNormalized: "10.0000/DEMO.PAPER.001",
      journal: "Demo Journal of Research Systems",
      publishYear: 2026,
      includedType: "DEMO",
      abstract: "Demo abstract for local development seed data.",
    },
  });

  await prisma.achievement.upsert({
    where: { id: ids.achievements.patent },
    update: {
      title: "Demo Patent for Data Governance Method",
      status: "PENDING_ARCHIVE",
      secretLevel: "CONFIDENTIAL",
      departmentId: ids.departments.ai,
      ownerUserId: ids.users.researcher,
      submittedById: ids.users.researcher,
    },
    create: {
      id: ids.achievements.patent,
      type: "PATENT",
      title: "Demo Patent for Data Governance Method",
      status: "PENDING_ARCHIVE",
      secretLevel: "CONFIDENTIAL",
      departmentId: ids.departments.ai,
      ownerUserId: ids.users.researcher,
      submittedById: ids.users.researcher,
      createdById: ids.users.researcher,
      updatedById: ids.users.researcher,
      submittedAt: dateOnly("2026-05-25"),
    },
  });

  await prisma.patentDetail.upsert({
    where: { achievementId: ids.achievements.patent },
    update: {
      applicationNo: "CN-DEMO-2026-000001",
      applicationNoNormalized: "CNDEMO2026000001",
      grantNo: "CN-DEMO-GRANT-000001",
      grantNoNormalized: "CNDEMOGRANT000001",
      patentType: "INVENTION",
      filingDate: dateOnly("2026-01-15"),
      grantDate: dateOnly("2026-05-15"),
      nextFeeDate: dateOnly("2026-07-15"),
      feeAmount: "1200.00",
      legalStatus: "GRANTED",
    },
    create: {
      achievementId: ids.achievements.patent,
      applicationNo: "CN-DEMO-2026-000001",
      applicationNoNormalized: "CNDEMO2026000001",
      grantNo: "CN-DEMO-GRANT-000001",
      grantNoNormalized: "CNDEMOGRANT000001",
      patentType: "INVENTION",
      filingDate: dateOnly("2026-01-15"),
      grantDate: dateOnly("2026-05-15"),
      nextFeeDate: dateOnly("2026-07-15"),
      feeAmount: "1200.00",
      legalStatus: "GRANTED",
    },
  });

  await prisma.achievement.upsert({
    where: { id: ids.achievements.software },
    update: {
      title: "Demo Research Asset Registry",
      status: "DRAFT",
      secretLevel: "INTERNAL",
      departmentId: ids.departments.materials,
      ownerUserId: ids.users.researcher,
      submittedById: null,
    },
    create: {
      id: ids.achievements.software,
      type: "SOFTWARE_COPYRIGHT",
      title: "Demo Research Asset Registry",
      status: "DRAFT",
      secretLevel: "INTERNAL",
      departmentId: ids.departments.materials,
      ownerUserId: ids.users.researcher,
      createdById: ids.users.researcher,
      updatedById: ids.users.researcher,
    },
  });

  await prisma.softwareCopyrightDetail.upsert({
    where: { achievementId: ids.achievements.software },
    update: {
      registrationNo: "DEMO-SW-2026-000001",
      registrationNoNormalized: "DEMOSW2026000001",
      softwareVersion: "1.0.0-demo",
      softwareType: "APPLICATION",
      publishDate: dateOnly("2026-04-10"),
      registerDate: dateOnly("2026-05-05"),
      runEnv: "Demo local environment",
    },
    create: {
      achievementId: ids.achievements.software,
      registrationNo: "DEMO-SW-2026-000001",
      registrationNoNormalized: "DEMOSW2026000001",
      softwareVersion: "1.0.0-demo",
      softwareType: "APPLICATION",
      publishDate: dateOnly("2026-04-10"),
      registerDate: dateOnly("2026-05-05"),
      runEnv: "Demo local environment",
    },
  });
}

async function seedContributors() {
  const contributors = [
    [ids.contributors.paperOne, ids.achievements.paper, "Demo Researcher", ids.users.researcher, "AUTHOR", "FIRST_AUTHOR", 1],
    [ids.contributors.paperTwo, ids.achievements.paper, "Demo Collaborator", null, "AUTHOR", "PARTICIPANT", 2],
    [ids.contributors.patentOne, ids.achievements.patent, "Demo Researcher", ids.users.researcher, "INVENTOR", "PRIMARY_INVENTOR", 1],
    [ids.contributors.softwareOne, ids.achievements.software, "Demo Research Institute", null, "COPYRIGHT_OWNER", "OWNER", 1],
  ];

  for (const [id, achievementId, name, userId, contributorType, contributorRole, sortOrder] of contributors) {
    await prisma.achievementContributor.upsert({
      where: { id },
      update: {
        achievementId,
        name,
        userId,
        organization: "Demo Organization",
        contributorType,
        contributorRole,
        sortOrder,
      },
      create: {
        id,
        achievementId,
        name,
        userId,
        organization: "Demo Organization",
        contributorType,
        contributorRole,
        sortOrder,
      },
    });
  }
}

async function seedFeesRemindersAndAttachments() {
  await prisma.feeRecord.upsert({
    where: { id: ids.fees.patentAnnual },
    update: {
      achievementId: ids.achievements.patent,
      departmentId: ids.departments.ai,
      feeType: "PATENT_ANNUAL",
      fundSource: "DEPARTMENT",
      amount: "1200.00",
      dueDate: dateOnly("2026-07-15"),
      payStatus: "PENDING",
      reviewStatus: "PENDING",
      reviewedById: null,
      reviewedAt: null,
      voucherNo: "DEMO-VOUCHER-PATENT-001",
    },
    create: {
      id: ids.fees.patentAnnual,
      achievementId: ids.achievements.patent,
      departmentId: ids.departments.ai,
      feeType: "PATENT_ANNUAL",
      fundSource: "DEPARTMENT",
      amount: "1200.00",
      dueDate: dateOnly("2026-07-15"),
      payStatus: "PENDING",
      voucherNo: "DEMO-VOUCHER-PATENT-001",
      createdById: ids.users.secretary,
      updatedById: ids.users.secretary,
    },
  });

  await prisma.feeRecord.upsert({
    where: { id: ids.fees.softwareRegister },
    update: {
      achievementId: ids.achievements.software,
      departmentId: ids.departments.materials,
      feeType: "SOFTWARE_COPYRIGHT",
      fundSource: "PROJECT",
      amount: "300.00",
      dueDate: dateOnly("2026-06-30"),
      payStatus: "PENDING",
      reviewStatus: "PENDING",
      reviewedById: null,
      reviewedAt: null,
      voucherNo: "DEMO-VOUCHER-SW-001",
    },
    create: {
      id: ids.fees.softwareRegister,
      achievementId: ids.achievements.software,
      departmentId: ids.departments.materials,
      feeType: "SOFTWARE_COPYRIGHT",
      fundSource: "PROJECT",
      amount: "300.00",
      dueDate: dateOnly("2026-06-30"),
      payStatus: "PENDING",
      voucherNo: "DEMO-VOUCHER-SW-001",
      createdById: ids.users.secretary,
      updatedById: ids.users.secretary,
    },
  });

  const reminders = [
    [ids.reminders.patentAnnual30, ids.fees.patentAnnual, dateOnly("2026-06-15"), "DAYS_30", ids.users.secretary],
    [ids.reminders.softwareRegister7, ids.fees.softwareRegister, dateOnly("2026-06-23"), "DAYS_7", ids.users.secretary],
  ];

  for (const [id, targetId, remindDate, remindLevel, receiverId] of reminders) {
    await prisma.reminderTask.upsert({
      where: { id },
      update: {
        targetType: "FEE_RECORD",
        targetId,
        remindDate,
        remindLevel,
        receiverId,
        status: "PENDING",
      },
      create: {
        id,
        targetType: "FEE_RECORD",
        targetId,
        remindDate,
        remindLevel,
        receiverId,
        status: "PENDING",
      },
    });
  }

  const attachments = [
    [ids.attachments.paper, "ACHIEVEMENT", ids.achievements.paper, "demo-paper-abstract.pdf", "demo-seed-paper-001-v1", ids.users.researcher, "INTERNAL"],
    [ids.attachments.patent, "ACHIEVEMENT", ids.achievements.patent, "demo-patent-form.pdf", "demo-seed-patent-001-v1", ids.users.researcher, "SECRET"],
    [ids.attachments.software, "ACHIEVEMENT", ids.achievements.software, "demo-software-readme.pdf", "demo-seed-software-001-v1", ids.users.researcher, "INTERNAL"],
    [ids.attachments.feeVoucher, "FEE_RECORD", ids.fees.patentAnnual, "demo-fee-voucher.pdf", "demo-seed-fee-voucher-001-v1", ids.users.secretary, "INTERNAL"],
  ];

  for (const [id, relationType, relationId, fileName, storageKey, uploaderId, secretLevel] of attachments) {
    await prisma.attachment.upsert({
      where: { id },
      update: {
        relationType,
        relationId,
        fileName,
        storageKey,
        version: 1,
        uploaderId,
        secretLevel,
        checksum: `${storageKey}-checksum`,
        status: "ACTIVE",
      },
      create: {
        id,
        relationType,
        relationId,
        fileName,
        storageKey,
        version: 1,
        uploaderId,
        secretLevel,
        checksum: `${storageKey}-checksum`,
        status: "ACTIVE",
      },
    });
  }
}

async function seedDemoWorkflowsAndConversions() {
  await prisma.workflowInstance.upsert({
    where: { id: ids.workflowInstances.patentArchive },
    update: {
      targetType: "ACHIEVEMENT",
      targetId: ids.achievements.patent,
      status: "ACTIVE",
      currentStep: "ARCHIVE",
      completedAt: null,
      cancelledAt: null,
    },
    create: {
      id: ids.workflowInstances.patentArchive,
      targetType: "ACHIEVEMENT",
      targetId: ids.achievements.patent,
      status: "ACTIVE",
      currentStep: "ARCHIVE",
    },
  });

  await prisma.workflowInstance.upsert({
    where: { id: ids.workflowInstances.patentFeeReview },
    update: {
      targetType: "FEE_RECORD",
      targetId: ids.fees.patentAnnual,
      status: "ACTIVE",
      currentStep: "FEE_REVIEW",
      completedAt: null,
      cancelledAt: null,
    },
    create: {
      id: ids.workflowInstances.patentFeeReview,
      targetType: "FEE_RECORD",
      targetId: ids.fees.patentAnnual,
      status: "ACTIVE",
      currentStep: "FEE_REVIEW",
    },
  });

  await prisma.workflowTask.upsert({
    where: { id: ids.workflowTasks.patentFeeReviewAdmin },
    update: {
      instanceId: ids.workflowInstances.patentFeeReview,
      assigneeId: ids.users.admin,
      stepCode: "FEE_REVIEW",
      status: "PENDING",
      claimedAt: null,
      completedAt: null,
    },
    create: {
      id: ids.workflowTasks.patentFeeReviewAdmin,
      instanceId: ids.workflowInstances.patentFeeReview,
      assigneeId: ids.users.admin,
      stepCode: "FEE_REVIEW",
      status: "PENDING",
    },
  });

  await prisma.workflowAction.upsert({
    where: { id: ids.workflowActions.patentFeeReviewSubmit },
    update: {
      instanceId: ids.workflowInstances.patentFeeReview,
      taskId: null,
      actorId: ids.users.secretary,
      action: "SUBMIT",
      comment: "Local demo seed fee review request.",
      createdAt: dateOnly("2026-06-01"),
    },
    create: {
      id: ids.workflowActions.patentFeeReviewSubmit,
      instanceId: ids.workflowInstances.patentFeeReview,
      taskId: null,
      actorId: ids.users.secretary,
      action: "SUBMIT",
      comment: "Local demo seed fee review request.",
      createdAt: dateOnly("2026-06-01"),
    },
  });

  try {
    await prisma.achievementConversion.upsert({
      where: { id: ids.conversions.paperLicense },
      update: {
        achievementId: ids.achievements.paper,
        departmentId: ids.departments.ai,
        conversionType: "LICENSE",
        counterpartyName: "Demo Local Partner",
        contractAmount: "100000.00",
        revenueAmount: "60000.00",
        status: "SIGNED",
        conversionDate: dateOnly("2026-07-01"),
        benefitDistributionSummary: "Local demo split summary; not a real contract or payment.",
        remarks: "Seeded local conversion ledger evidence.",
        createdById: ids.users.admin,
        updatedById: ids.users.admin,
      },
      create: {
        id: ids.conversions.paperLicense,
        achievementId: ids.achievements.paper,
        departmentId: ids.departments.ai,
        conversionType: "LICENSE",
        counterpartyName: "Demo Local Partner",
        contractAmount: "100000.00",
        revenueAmount: "60000.00",
        status: "SIGNED",
        conversionDate: dateOnly("2026-07-01"),
        benefitDistributionSummary: "Local demo split summary; not a real contract or payment.",
        remarks: "Seeded local conversion ledger evidence.",
        createdById: ids.users.admin,
        updatedById: ids.users.admin,
      },
    });
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
    console.warn("Skipped conversion ledger seed because the local database table is unavailable.");
  }
}

async function seedSecretAuthorizationDemoData() {
  const grants = [
    {
      id: ids.resourceAccessGrants.patentDepartmentActive,
      resourceType: "ACHIEVEMENT",
      resourceId: ids.achievements.patent,
      granteeType: "DEPARTMENT",
      granteeId: ids.departments.ai,
      grantType: "SECRET_READ",
      status: "ACTIVE",
      startsAt: daysFromNow(-7),
      expiresAt: daysFromNow(180),
      createdById: ids.users.admin,
      createdAt: daysFromNow(-7),
      revokedAt: null,
    },
    {
      id: ids.resourceAccessGrants.patentSecretManagerExpiring,
      resourceType: "ACHIEVEMENT",
      resourceId: ids.achievements.patent,
      granteeType: "ROLE",
      granteeId: ids.roles.secretManager,
      grantType: "SECRET_READ",
      status: "ACTIVE",
      startsAt: daysFromNow(-6),
      expiresAt: daysFromNow(14),
      createdById: ids.users.admin,
      createdAt: daysFromNow(-6),
      revokedAt: null,
    },
    {
      id: ids.resourceAccessGrants.patentAttachmentExpired,
      resourceType: "ATTACHMENT",
      resourceId: ids.attachments.patent,
      granteeType: "USER",
      granteeId: ids.users.leader,
      grantType: "ATTACHMENT_DOWNLOAD",
      status: "EXPIRED",
      startsAt: daysFromNow(-60),
      expiresAt: daysFromNow(-20),
      createdById: ids.users.admin,
      createdAt: daysFromNow(-60),
      revokedAt: null,
    },
    {
      id: ids.resourceAccessGrants.patentAttachmentRevoked,
      resourceType: "ATTACHMENT",
      resourceId: ids.attachments.patent,
      granteeType: "USER",
      granteeId: ids.users.auditor,
      grantType: "ATTACHMENT_DOWNLOAD",
      status: "REVOKED",
      startsAt: daysFromNow(-20),
      expiresAt: daysFromNow(60),
      createdById: ids.users.admin,
      createdAt: daysFromNow(-20),
      revokedAt: daysFromNow(-3),
    },
    {
      id: ids.resourceAccessGrants.patentAttachmentFuture,
      resourceType: "ATTACHMENT",
      resourceId: ids.attachments.patent,
      granteeType: "USER",
      granteeId: ids.users.secretManager,
      grantType: "ATTACHMENT_DOWNLOAD",
      status: "ACTIVE",
      startsAt: daysFromNow(14),
      expiresAt: daysFromNow(60),
      createdById: ids.users.admin,
      createdAt: daysFromNow(-1),
      revokedAt: null,
    },
  ];

  for (const grant of grants) {
    await prisma.resourceAccessGrant.upsert({
      where: { id: grant.id },
      update: {
        resourceType: grant.resourceType,
        resourceId: grant.resourceId,
        granteeType: grant.granteeType,
        granteeId: grant.granteeId,
        grantType: grant.grantType,
        status: grant.status,
        startsAt: grant.startsAt,
        expiresAt: grant.expiresAt,
        createdById: grant.createdById,
        createdAt: grant.createdAt,
        revokedAt: grant.revokedAt,
      },
      create: grant,
    });
  }

  const auditLogs = [
    {
      id: ids.auditLogs.patentGrantCreated,
      actorUserId: ids.users.admin,
      actorDepartmentId: ids.departments.admin,
      action: "CONFIG_UPDATE",
      targetType: "ACHIEVEMENT",
      targetId: ids.achievements.patent,
      targetDepartmentId: ids.departments.ai,
      targetSecretLevel: "CONFIDENTIAL",
      oldValue: null,
      newValue: {
        grantType: "SECRET_READ",
        granteeType: "DEPARTMENT",
        reason: "Local synthetic demo grant coverage.",
      },
      traceId: "seed-secret-authorization-achievement-grant-created",
      createdAt: daysFromNow(-7),
    },
    {
      id: ids.auditLogs.patentAttachmentGrantRevoked,
      actorUserId: ids.users.admin,
      actorDepartmentId: ids.departments.admin,
      action: "CONFIG_UPDATE",
      targetType: "ATTACHMENT",
      targetId: ids.attachments.patent,
      targetDepartmentId: ids.departments.ai,
      targetSecretLevel: "SECRET",
      oldValue: {
        grantType: "ATTACHMENT_DOWNLOAD",
        granteeType: "USER",
        reason: "Local synthetic demo grant coverage.",
      },
      newValue: {
        grantType: "ATTACHMENT_DOWNLOAD",
        granteeType: "USER",
        reason: "Local synthetic demo revoke coverage.",
      },
      traceId: "seed-secret-authorization-attachment-grant-revoked",
      createdAt: daysFromNow(-3),
    },
    {
      id: ids.auditLogs.patentAttachmentGrantExpired,
      actorUserId: ids.users.admin,
      actorDepartmentId: ids.departments.admin,
      action: "CONFIG_UPDATE",
      targetType: "ATTACHMENT",
      targetId: ids.attachments.patent,
      targetDepartmentId: ids.departments.ai,
      targetSecretLevel: "SECRET",
      oldValue: {
        grantType: "ATTACHMENT_DOWNLOAD",
        granteeType: "USER",
        reason: "Local synthetic demo grant coverage.",
      },
      newValue: {
        grantType: "ATTACHMENT_DOWNLOAD",
        granteeType: "USER",
        reason: "Local synthetic demo expiry coverage.",
      },
      traceId: "seed-secret-authorization-attachment-grant-expired",
      createdAt: daysFromNow(-20),
    },
  ];

  for (const auditLog of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: auditLog.id },
      update: {
        actorUserId: auditLog.actorUserId,
        actorDepartmentId: auditLog.actorDepartmentId,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        targetDepartmentId: auditLog.targetDepartmentId,
        targetSecretLevel: auditLog.targetSecretLevel,
        oldValue: auditLog.oldValue,
        newValue: auditLog.newValue,
        ipAddress: null,
        userAgent: "local-synthetic-seed",
        traceId: auditLog.traceId,
        createdAt: auditLog.createdAt,
      },
      create: {
        ...auditLog,
        ipAddress: null,
        userAgent: "local-synthetic-seed",
      },
    });
  }
}

async function getSeedSummary() {
  const [
    departments,
    roles,
    permissions,
    rolePermissions,
    users,
    userRoles,
    achievements,
    contributors,
    fees,
    reminders,
    attachments,
    workflowInstances,
    workflowTasks,
    workflowActions,
    conversions,
    resourceAccessGrants,
    secretAuthorizationAuditLogs,
  ] = await Promise.all([
    prisma.department.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.rolePermission.count(),
    prisma.user.count(),
    prisma.userRole.count(),
    prisma.achievement.count(),
    prisma.achievementContributor.count(),
    prisma.feeRecord.count(),
    prisma.reminderTask.count(),
    prisma.attachment.count(),
    prisma.workflowInstance.count(),
    prisma.workflowTask.count(),
    prisma.workflowAction.count(),
    prisma.achievementConversion.count().catch((error) => {
      if (!isMissingTableError(error)) {
        throw error;
      }
      return 0;
    }),
    prisma.resourceAccessGrant.count(),
    prisma.auditLog.count({
      where: { traceId: { startsWith: "seed-secret-authorization" } },
    }),
  ]);

  return {
    departments,
    roles,
    permissions,
    rolePermissions,
    users,
    userRoles,
    achievements,
    contributors,
    fees,
    reminders,
    attachments,
    workflowInstances,
    workflowTasks,
    workflowActions,
    conversions,
    resourceAccessGrants,
    secretAuthorizationAuditLogs,
  };
}

async function main() {
  await seedDepartments();
  await seedRolesAndPermissions();
  await seedUsers();
  await seedAchievements();
  await seedContributors();
  await seedFeesRemindersAndAttachments();
  await seedDemoWorkflowsAndConversions();
  await seedSecretAuthorizationDemoData();

  const summary = await getSeedSummary();
  console.log("Seed completed:", JSON.stringify(summary));
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
