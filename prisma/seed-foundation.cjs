/* eslint-disable @typescript-eslint/no-require-imports */
/* global console, module, process, require */
const { PrismaClient } = require("@prisma/client");

const departments = [
  {
    code: "INSTITUTE_ROOT",
    name: "Research Institute",
    status: "ACTIVE",
  },
  {
    code: "RESEARCH_ADMIN_OFFICE",
    name: "Research Administration Office",
    parentCode: "INSTITUTE_ROOT",
    status: "ACTIVE",
  },
];

const roles = [
  {
    code: "SYSTEM_ADMIN",
    name: "System Admin",
    description: "Production system administrator.",
    status: "ACTIVE",
  },
  {
    code: "FINANCE_REVIEWER",
    name: "Finance Reviewer",
    description: "Department-scoped finance fee reviewer.",
    status: "ACTIVE",
  },
  {
    code: "RESEARCHER",
    name: "Researcher",
    description: "Research staff role for own achievement workflows.",
    status: "ACTIVE",
  },
  {
    code: "RESEARCH_SECRETARY",
    name: "Research Secretary",
    description: "Department-scoped research administration role.",
    status: "ACTIVE",
  },
  {
    code: "AUDITOR",
    name: "Auditor",
    description: "Masked audit log reader.",
    status: "ACTIVE",
  },
];

const permissions = [
  ["user_context:read", "user_context", "read", "Read current user context"],
  ["achievement:create", "achievement", "create", "Create achievement"],
  ["achievement:read_own", "achievement", "read_own", "Read own achievements"],
  ["achievement:update_own", "achievement", "update_own", "Update own achievements"],
  ["achievement:submit", "achievement", "submit", "Submit achievement"],
  [
    "achievement:read_department",
    "achievement",
    "read_department",
    "Read department achievements",
  ],
  [
    "achievement:review_department",
    "achievement",
    "review_department",
    "Review department achievements",
  ],
  ["achievement:archive", "achievement", "archive", "Archive achievement"],
  ["attachment:read_metadata", "attachment", "read_metadata", "Read attachment metadata"],
  ["attachment:download", "attachment", "download", "Download authorized attachment"],
  ["fee:read_department", "fee", "read_department", "Read department fee records"],
  ["fee:manage_department", "fee", "manage_department", "Manage department fees"],
  ["fee:review_department", "fee", "review_department", "Review department fee records"],
  ["reminder:read_department", "reminder", "read_department", "Read department reminders"],
  ["audit:read_masked", "audit", "read_masked", "Read masked audit logs"],
  ["dashboard:read_institute", "dashboard", "read_institute", "Read institute dashboard"],
  ["department:read_department", "department", "read_department", "Read department data"],
  ["account:invite", "account", "invite", "Invite accounts"],
  ["account:reset_password", "account", "reset_password", "Reset account passwords"],
  ["resource_grant:create", "resource_grant", "create", "Create resource access grants"],
  ["resource_grant:revoke", "resource_grant", "revoke", "Revoke resource access grants"],
  ["system:config", "system", "config", "Configure system"],
].map(([code, resource, action, name]) => ({
  code,
  resource,
  action,
  name,
  description: "Production foundation permission.",
  status: "ACTIVE",
}));

const rolePermissionMatrix = {
  SYSTEM_ADMIN: permissions.map((permission) => permission.code),
  FINANCE_REVIEWER: [
    "user_context:read",
    "fee:read_department",
    "fee:review_department",
  ],
  RESEARCHER: [
    "user_context:read",
    "achievement:create",
    "achievement:read_own",
    "achievement:update_own",
    "achievement:submit",
    "attachment:read_metadata",
  ],
  RESEARCH_SECRETARY: [
    "user_context:read",
    "achievement:read_department",
    "achievement:review_department",
    "fee:read_department",
    "fee:manage_department",
    "reminder:read_department",
    "department:read_department",
    "attachment:read_metadata",
  ],
  AUDITOR: ["user_context:read", "audit:read_masked"],
};

const seedFoundation = async (prisma) => {
  const departmentByCode = new Map();
  for (const department of departments) {
    const row = await prisma.department.upsert({
      where: { code: department.code },
      update: {
        name: department.name,
        status: department.status,
      },
      create: {
        code: department.code,
        name: department.name,
        status: department.status,
      },
    });
    departmentByCode.set(row.code, row);
  }

  for (const department of departments.filter((item) => item.parentCode)) {
    const parent = departmentByCode.get(department.parentCode);
    if (!parent) {
      throw new Error(`Missing parent department ${department.parentCode}.`);
    }

    const row = await prisma.department.upsert({
      where: { code: department.code },
      update: {
        name: department.name,
        parentId: parent.id,
        status: department.status,
      },
      create: {
        code: department.code,
        name: department.name,
        parentId: parent.id,
        status: department.status,
      },
    });
    departmentByCode.set(row.code, row);
  }

  const roleByCode = new Map();
  for (const role of roles) {
    const row = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        status: role.status,
      },
      create: role,
    });
    roleByCode.set(row.code, row);
  }

  const permissionByCode = new Map();
  for (const permission of permissions) {
    const row = await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        resource: permission.resource,
        action: permission.action,
        name: permission.name,
        description: permission.description,
        status: permission.status,
      },
      create: permission,
    });
    permissionByCode.set(row.code, row);
  }

  const rolePermissions = [];
  for (const [roleCode, permissionCodes] of Object.entries(rolePermissionMatrix)) {
    const role = roleByCode.get(roleCode);
    if (!role) {
      throw new Error(`RolePermission matrix references missing role ${roleCode}.`);
    }

    for (const permissionCode of permissionCodes) {
      const permission = permissionByCode.get(permissionCode);
      if (!permission) {
        throw new Error(`RolePermission matrix references missing permission ${permissionCode}.`);
      }

      rolePermissions.push({
        roleId: role.id,
        permissionId: permission.id,
      });
    }
  }

  if (rolePermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: rolePermissions,
      skipDuplicates: true,
    });
  }

  return getFoundationSummary(prisma);
};

const getFoundationSummary = async (prisma) => {
  const [
    departmentCount,
    roleCount,
    permissionCount,
    rolePermissionCount,
    userCount,
    userSessionCount,
    loginAttemptCount,
    achievementCount,
    feeRecordCount,
    workflowTaskCount,
    attachmentCount,
  ] = await Promise.all([
    prisma.department.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.rolePermission.count(),
    prisma.user.count(),
    prisma.userSession.count(),
    prisma.loginAttempt.count(),
    prisma.achievement.count(),
    prisma.feeRecord.count(),
    prisma.workflowTask.count(),
    prisma.attachment.count(),
  ]);

  return {
    departments: departmentCount,
    roles: roleCount,
    permissions: permissionCount,
    rolePermissions: rolePermissionCount,
    users: userCount,
    userSessions: userSessionCount,
    loginAttempts: loginAttemptCount,
    achievements: achievementCount,
    fees: feeRecordCount,
    workflowTasks: workflowTaskCount,
    attachments: attachmentCount,
    departmentCodes: departments.map((department) => department.code),
    roleCodes: roles.map((role) => role.code),
    permissionCodes: permissions.map((permission) => permission.code),
  };
};

const main = async () => {
  const prisma = new PrismaClient();
  try {
    const summary = await seedFoundation(prisma);
    console.log("Foundation seed completed:", JSON.stringify(summary));
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  main().catch((error) => {
    console.error("Foundation seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = {
  departments,
  getFoundationSummary,
  permissions,
  rolePermissionMatrix,
  roles,
  seedFoundation,
};
