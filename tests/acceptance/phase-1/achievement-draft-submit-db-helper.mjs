import crypto from "node:crypto";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ids = {
  institute: "10000000-0000-4000-8000-000000000001",
};

const makeId = () => crypto.randomUUID();

const createUser = async ({ id, email, name, departmentId, roleCode }) => {
  const user = await prisma.user.create({
    data: {
      id,
      email,
      name,
      departmentId,
      status: "ACTIVE",
    },
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: (await prisma.role.findUniqueOrThrow({ where: { code: roleCode } })).id,
      scopeType: "DEPARTMENT",
      scopeKey: departmentId,
      departmentId,
    },
  });

  return { id: user.id, roleCode };
};

const prepare = async (suffix) => {
  const departmentId = makeId();
  const researcherId = makeId();
  const reviewerId = makeId();
  const outsiderDepartmentId = makeId();
  const outsiderId = makeId();
  const normalizedSuffix = suffix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-18);

  await prisma.department.create({
    data: {
      id: departmentId,
      code: `VS-ACH-${normalizedSuffix}`,
      name: `Vertical Slice Achievement ${suffix}`,
      parentId: ids.institute,
      status: "ACTIVE",
    },
  });
  await prisma.department.create({
    data: {
      id: outsiderDepartmentId,
      code: `VS-OUT-${normalizedSuffix}`,
      name: `Vertical Slice Outsider ${suffix}`,
      parentId: ids.institute,
      status: "ACTIVE",
    },
  });

  const researcher = await createUser({
    id: researcherId,
    email: `vs-researcher-${suffix}@example.invalid`,
    name: `VS Researcher ${suffix}`,
    departmentId,
    roleCode: "RESEARCHER",
  });
  const reviewer = await createUser({
    id: reviewerId,
    email: `vs-reviewer-${suffix}@example.invalid`,
    name: `VS Reviewer ${suffix}`,
    departmentId,
    roleCode: "RESEARCH_SECRETARY",
  });
  const outsider = await createUser({
    id: outsiderId,
    email: `vs-outsider-${suffix}@example.invalid`,
    name: `VS Outsider ${suffix}`,
    departmentId: outsiderDepartmentId,
    roleCode: "RESEARCHER",
  });

  return {
    suffix,
    departmentId,
    researcher,
    reviewer,
    outsider,
    titlePrefix: `VS Achievement Draft ${suffix}`,
  };
};

const evidence = async ({ achievementId, since }) => {
  const createdAfter = new Date(since);
  const [achievement, workflows, audits] = await Promise.all([
    prisma.achievement.findUnique({
      where: { id: achievementId },
      select: {
        id: true,
        title: true,
        status: true,
        departmentId: true,
        ownerUserId: true,
        submittedById: true,
        submittedAt: true,
      },
    }),
    prisma.workflowInstance.findMany({
      where: {
        targetType: "ACHIEVEMENT",
        targetId: achievementId,
        createdAt: { gte: createdAfter },
      },
      select: {
        id: true,
        status: true,
        currentStep: true,
        tasks: { select: { id: true, assigneeId: true, stepCode: true, status: true } },
        actions: { select: { id: true, actorId: true, action: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        targetType: "ACHIEVEMENT",
        targetId: achievementId,
        action: "SUBMIT",
        createdAt: { gte: createdAfter },
      },
      select: { id: true, action: true, actorUserId: true, targetId: true },
    }),
  ]);

  return {
    achievement,
    workflows,
    auditLogs: audits,
    counts: {
      workflowInstances: workflows.length,
      workflowTasks: workflows.reduce((sum, workflow) => sum + workflow.tasks.length, 0),
      workflowSubmitActions: workflows.reduce(
        (sum, workflow) => sum + workflow.actions.filter((action) => action.action === "SUBMIT").length,
        0,
      ),
      submitAudits: audits.length,
    },
  };
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
};

const main = async () => {
  const input = JSON.parse((await readStdin()) || "{}");
  let result;

  if (input.action === "prepare") {
    result = await prepare(input.suffix);
  } else if (input.action === "evidence") {
    result = await evidence(input);
  } else {
    throw new Error(`Unsupported helper action: ${input.action}`);
  }

  process.stdout.write(JSON.stringify({ status: 0, body: result }));
};

main()
  .catch((error) => {
    process.stdout.write(
      JSON.stringify({ status: 1, error: error instanceof Error ? error.message : "Unknown helper error." }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
