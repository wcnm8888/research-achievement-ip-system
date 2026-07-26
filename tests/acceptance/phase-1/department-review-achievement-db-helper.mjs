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

  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      scopeType: "DEPARTMENT",
      scopeKey: departmentId,
      departmentId,
    },
  });

  return { id: user.id, roleCode };
};

const prepare = async (suffix) => {
  const departmentId = makeId();
  const outsiderDepartmentId = makeId();
  const researcherId = makeId();
  const reviewerId = makeId();
  const sameDepartmentReviewerId = makeId();
  const outsiderReviewerId = makeId();
  const normalizedSuffix = suffix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-18);

  await prisma.department.createMany({
    data: [
      {
        id: departmentId,
        code: `VS-REVIEW-${normalizedSuffix}`,
        name: `Vertical Slice Review ${suffix}`,
        parentId: ids.institute,
        status: "ACTIVE",
      },
      {
        id: outsiderDepartmentId,
        code: `VS-REVIEW-OUT-${normalizedSuffix}`,
        name: `Vertical Slice Review Outsider ${suffix}`,
        parentId: ids.institute,
        status: "ACTIVE",
      },
    ],
  });

  const researcher = await createUser({
    id: researcherId,
    email: `vs-review-researcher-${suffix}@example.invalid`,
    name: `VS Review Researcher ${suffix}`,
    departmentId,
    roleCode: "RESEARCHER",
  });
  const reviewer = await createUser({
    id: reviewerId,
    email: `vs-reviewer-${suffix}@example.invalid`,
    name: `VS Department Reviewer ${suffix}`,
    departmentId,
    roleCode: "RESEARCH_SECRETARY",
  });
  const sameDepartmentReviewer = await createUser({
    id: sameDepartmentReviewerId,
    email: `vs-review-peer-${suffix}@example.invalid`,
    name: `VS Peer Reviewer ${suffix}`,
    departmentId,
    roleCode: "RESEARCH_SECRETARY",
  });
  const outsiderReviewer = await createUser({
    id: outsiderReviewerId,
    email: `vs-review-outsider-${suffix}@example.invalid`,
    name: `VS Outsider Reviewer ${suffix}`,
    departmentId: outsiderDepartmentId,
    roleCode: "RESEARCH_SECRETARY",
  });

  return {
    suffix,
    departmentId,
    researcher,
    reviewer,
    sameDepartmentReviewer,
    outsiderReviewer,
  };
};

const evidence = async ({ achievementIds, taskIds, since }) => {
  const createdAfter = new Date(since);
  const [achievements, workflows, actions, audits] = await Promise.all([
    prisma.achievement.findMany({
      where: { id: { in: achievementIds } },
      select: {
        id: true,
        status: true,
        departmentId: true,
        submittedAt: true,
        updatedAt: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.workflowInstance.findMany({
      where: {
        targetType: "ACHIEVEMENT",
        targetId: { in: achievementIds },
        createdAt: { gte: createdAfter },
      },
      select: {
        id: true,
        targetId: true,
        status: true,
        currentStep: true,
        tasks: {
          select: {
            id: true,
            assigneeId: true,
            stepCode: true,
            status: true,
            completedAt: true,
          },
        },
        actions: {
          select: { id: true, taskId: true, actorId: true, action: true, comment: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workflowAction.findMany({
      where: {
        taskId: { in: taskIds },
        action: { in: ["APPROVE", "REJECT"] },
        createdAt: { gte: createdAfter },
      },
      select: { id: true, taskId: true, actorId: true, action: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: {
        targetType: "WORKFLOW_TASK",
        targetId: { in: taskIds },
        action: { in: ["APPROVE", "REJECT"] },
        createdAt: { gte: createdAfter },
      },
      select: { id: true, targetId: true, actorUserId: true, action: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    achievements,
    workflows,
    workflowActions: actions.map(({ id, taskId, actorId, action }) => ({ id, taskId, actorId, action })),
    auditLogs: audits,
    counts: {
      achievements: achievements.length,
      workflowInstances: workflows.length,
      reviewTasks: workflows.reduce(
        (sum, workflow) => sum + workflow.tasks.filter((task) => task.stepCode === "DEPARTMENT_REVIEW").length,
        0,
      ),
      reviewActions: actions.length,
      reviewAudits: audits.length,
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
  let body;

  if (input.action === "prepare") {
    body = await prepare(input.suffix);
  } else if (input.action === "evidence") {
    body = await evidence(input);
  } else {
    throw new Error(`Unsupported helper action: ${input.action}`);
  }

  process.stdout.write(JSON.stringify({ status: 0, body }));
};

main()
  .catch((error) => {
    process.stdout.write(
      JSON.stringify({ status: 1, error: error instanceof Error ? error.message : "Unknown error." }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
