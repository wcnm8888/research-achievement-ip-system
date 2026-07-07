export type DemoUserPreset = {
  key: string;
  label: string;
  role: string;
  department: string;
  userId: string;
  note: string;
};

export const demoUserStorageKey = "research-ip.demo-user-id";

export const demoUserPresets: DemoUserPreset[] = [
  {
    key: "researcher",
    label: "科研人员",
    role: "RESEARCHER",
    department: "人工智能研究所",
    userId: "40000000-0000-4000-8000-000000000001",
    note: "拥有成果草稿与个人可见范围，审批待办可能返回无权限。",
  },
  {
    key: "secretary",
    label: "科研秘书",
    role: "RESEARCH_SECRETARY",
    department: "人工智能研究所",
    userId: "40000000-0000-4000-8000-000000000002",
    note: "拥有部门审批、费用读取和部门范围工作台能力。",
  },
  {
    key: "admin",
    label: "系统管理员",
    role: "SYSTEM_ADMIN",
    department: "科研管理办公室",
    userId: "40000000-0000-4000-8000-000000000003",
    note: "用于验证全局角色在当前边界下的提示与权限反馈。",
  },
];

export const findDemoUserPreset = (userId: string | null): DemoUserPreset | undefined =>
  demoUserPresets.find((preset) => preset.userId === userId);

export const readStoredDemoUserId = (): string | null => {
  try {
    return window.localStorage.getItem(demoUserStorageKey);
  } catch {
    return null;
  }
};

export const storeDemoUserId = (userId: string | null): void => {
  try {
    if (userId && userId.trim()) {
      window.localStorage.setItem(demoUserStorageKey, userId.trim());
      return;
    }

    window.localStorage.removeItem(demoUserStorageKey);
  } catch {
    // Local storage is a convenience for dev/test only.
  }
};
