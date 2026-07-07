import {
  Alert,
  Button,
  Card,
  Descriptions,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createApiClient,
  isApiError,
  type AccountManagementApiClient,
  type ApiError,
  type AuthUser,
} from "./api-client";
import { hasSystemConfigPermission } from "./AccountManagement";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { sanitizeBusinessTitle } from "./display-text";
import type {
  CountMap,
  SecretAuthorizationAuditSummary,
  SecretAuthorizationGrantSummary,
  SecretAuthorizationOverview,
  SecretAuthorizationResourceDetail,
  SecretAuthorizationResourceList,
  SecretAuthorizationResourceSummary,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type SecretAuthorizationApiClient = Pick<
  AccountManagementApiClient,
  | "getSecretAuthorizationOverview"
  | "listSecretAuthorizationResources"
  | "getSecretAuthorizationResourceGrants"
>;

type SecretAuthorizationProps = {
  demoUserId: string | null;
  authUser: Pick<AuthUser, "permissionCodes"> | null;
  apiClient?: SecretAuthorizationApiClient;
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const noValue = "未返回";

export function SecretAuthorization({
  demoUserId,
  authUser,
  apiClient: injectedClient,
}: SecretAuthorizationProps) {
  const createdClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const apiClient = injectedClient ?? createdClient;
  const canReadSecretAuthorization = hasSystemConfigPermission(authUser);
  const shouldLoad = shouldLoadSecretAuthorization(canReadSecretAuthorization, demoUserId);
  const [overview, setOverview] =
    useState<Loadable<SecretAuthorizationOverview>>(emptyLoadable);
  const [resources, setResources] =
    useState<Loadable<SecretAuthorizationResourceList>>(emptyLoadable);
  const [detail, setDetail] =
    useState<Loadable<SecretAuthorizationResourceDetail>>(emptyLoadable);
  const [selectedResourceKey, setSelectedResourceKey] = useState<string | null>(null);

  const resourceItems = resources.data?.items ?? [];
  const selectedResource = useMemo(
    () => resourceItems.find((resource) => getResourceKey(resource) === selectedResourceKey) ?? null,
    [resourceItems, selectedResourceKey],
  );

  const loadOverview = useCallback(() => {
    if (!shouldLoad) {
      setOverview(emptyLoadable);
      return;
    }

    setOverview({ loading: true, data: null, error: null });
    void fetchSecretAuthorizationOverview(apiClient)
      .then((data) => setOverview({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setOverview({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, shouldLoad]);

  const loadResources = useCallback(() => {
    if (!shouldLoad) {
      setResources(emptyLoadable);
      setSelectedResourceKey(null);
      return;
    }

    setResources({ loading: true, data: null, error: null });
    void fetchSecretAuthorizationResources(apiClient)
      .then((data) => {
        setResources({ loading: false, data, error: null });
        setSelectedResourceKey((current) => {
          if (current) {
            return current;
          }

          const [firstResource] = data.items;
          return firstResource ? getResourceKey(firstResource) : null;
        });
      })
      .catch((error: unknown) =>
        setResources({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, shouldLoad]);

  const loadDetail = useCallback(
    (resource: SecretAuthorizationResourceSummary | null) => {
      if (!shouldLoad || !resource) {
        setDetail(emptyLoadable);
        return;
      }

      setDetail({ loading: true, data: null, error: null });
      void fetchSecretAuthorizationResourceDetail(apiClient, resource)
        .then((data) => setDetail({ loading: false, data, error: null }))
        .catch((error: unknown) =>
          setDetail({ loading: false, data: null, error: normalizeError(error) }),
        );
    },
    [apiClient, shouldLoad],
  );

  const refresh = () => {
    loadOverview();
    loadResources();
    if (selectedResource) {
      loadDetail(selectedResource);
    }
  };

  useEffect(() => {
    loadOverview();
    loadResources();
  }, [loadOverview, loadResources]);

  useEffect(() => {
    loadDetail(selectedResource);
  }, [loadDetail, selectedResource]);

  if (!canReadSecretAuthorization) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="涉密授权管理"
          description="涉密授权摘要仅对具备系统配置权限的账号开放。"
        />
        <DataState
          error={{
            kind: "forbidden",
            status: 403,
            message: "当前账号无权访问涉密授权管理。",
            detail: "请联系系统管理员确认账号权限。",
          }}
        >
          <span />
        </DataState>
      </Space>
    );
  }

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="涉密授权管理"
          description="请先登录或选择当前业务用户，再查看涉密授权摘要。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，页面不会加载涉密授权数据。"
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack secret-authorization-page">
      <SectionHeader
        title="涉密授权管理"
        description="查看涉密资源、授权状态、近期授权记录和审计摘要。"
        extra={<Button onClick={refresh}>刷新</Button>}
      />

      <PermissionHint description="本页展示涉密资源和授权状态摘要，不展示涉密正文。" />

      <DataState loading={overview.loading} error={overview.error} onRetry={loadOverview}>
        {overview.data ? (
          <SecretAuthorizationOverviewCards overview={overview.data} />
        ) : (
          <SecretAuthorizationOverviewEmpty />
        )}
      </DataState>

      <Card className="shell-card" title="涉密资源">
        <DataState
          loading={resources.loading}
          error={resources.error}
          empty={!resources.loading && !resources.error && resourceItems.length === 0}
          emptyText="暂无涉密资源。"
          onRetry={loadResources}
        >
          <SecretAuthorizationResourceTable
            resources={resourceItems}
            selectedResourceKey={selectedResourceKey}
            onSelectResource={setSelectedResourceKey}
          />
        </DataState>
      </Card>

      <Card className="shell-card" title="资源详情">
        {selectedResource ? (
          <DataState
            loading={detail.loading}
            error={detail.error}
            onRetry={() => loadDetail(selectedResource)}
          >
            {detail.data ? (
              <SecretAuthorizationResourceDetailPanel detail={detail.data} />
            ) : (
              <Typography.Text type="secondary">请选择涉密资源查看授权和审计摘要。</Typography.Text>
            )}
          </DataState>
        ) : (
          <Typography.Text type="secondary">尚未选择涉密资源。</Typography.Text>
        )}
      </Card>
    </Space>
  );
}

export const shouldLoadSecretAuthorization = (
  canReadSecretAuthorization: boolean,
  demoUserId: string | null,
): boolean => Boolean(canReadSecretAuthorization && demoUserId?.trim());

export const fetchSecretAuthorizationOverview = (
  client: Pick<SecretAuthorizationApiClient, "getSecretAuthorizationOverview">,
): Promise<SecretAuthorizationOverview> => client.getSecretAuthorizationOverview();

export const fetchSecretAuthorizationResources = async (
  client: Pick<SecretAuthorizationApiClient, "listSecretAuthorizationResources">,
): Promise<SecretAuthorizationResourceList> => {
  const response = await client.listSecretAuthorizationResources();

  return {
    items: Array.isArray(response.items) ? response.items : [],
    total: typeof response.total === "number" ? response.total : 0,
    caveats: Array.isArray(response.caveats) ? response.caveats : [],
  };
};

export const fetchSecretAuthorizationResourceDetail = (
  client: Pick<SecretAuthorizationApiClient, "getSecretAuthorizationResourceGrants">,
  resource: SecretAuthorizationResourceSummary,
): Promise<SecretAuthorizationResourceDetail> =>
  client.getSecretAuthorizationResourceGrants(resource.resourceType, resource.resourceId);

export function SecretAuthorizationOverviewCards({
  overview,
}: {
  overview: SecretAuthorizationOverview;
}) {
  const revokedOrExpiredCount =
    getSafeNumber(overview.revokedGrantCount) + getSafeNumber(overview.expiredGrantCount);

  return (
    <Space direction="vertical" size={12} className="full-width secret-authorization-overview">
      <Space size={12} wrap>
        <MetricCard title="涉密资源" value={overview.restrictedResourceCount} />
        <MetricCard title="有效授权" value={overview.activeGrantCount} />
        <MetricCard title="已撤销/已过期" value={revokedOrExpiredCount} />
        <MetricCard title="即将到期" value={overview.expiringSoonCount} />
      </Space>
      <Card className="shell-card" title="授权概览">
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="按资源类型">
            {formatCountMap(overview.restrictedResourceCountsByType)}
          </Descriptions.Item>
          <Descriptions.Item label="按密级">
            {formatCountMap(overview.restrictedResourceCountsBySecretLevel)}
          </Descriptions.Item>
          <Descriptions.Item label="授权状态">
            {formatCountMap(overview.grantCountsByStatus)}
          </Descriptions.Item>
          <Descriptions.Item label="授权类型">
            {formatCountMap(overview.grantCountsByType)}
          </Descriptions.Item>
          <Descriptions.Item label="授权对象">
            {formatCountMap(overview.grantCountsByGranteeType)}
          </Descriptions.Item>
          <Descriptions.Item label="生成时间">{formatDateTime(overview.generatedAt)}</Descriptions.Item>
          <Descriptions.Item label="提示">
            {formatList(overview.caveats, "暂无额外提示。")}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}

export function SecretAuthorizationOverviewEmpty() {
  return (
    <Card className="shell-card">
      <Typography.Text type="secondary">
        暂无涉密授权概览。
      </Typography.Text>
    </Card>
  );
}

export function SecretAuthorizationResourceTable({
  resources,
  selectedResourceKey,
  onSelectResource,
}: {
  resources: SecretAuthorizationResourceSummary[];
  selectedResourceKey?: string | null;
  onSelectResource?: (resourceKey: string) => void;
}) {
  return (
    <Table<SecretAuthorizationResourceSummary>
      rowKey={getResourceKey}
      size="small"
      columns={resourceColumns}
      dataSource={resources}
      pagination={false}
      rowClassName={(resource) =>
        getResourceKey(resource) === selectedResourceKey ? "selected-row" : ""
      }
      onRow={(resource) => ({
        onClick: () => onSelectResource?.(getResourceKey(resource)),
      })}
      scroll={{ x: 1180 }}
    />
  );
}

export function SecretAuthorizationResourceDetailPanel({
  detail,
}: {
  detail: SecretAuthorizationResourceDetail;
}) {
  const grants = detail.grants ?? [];
  const audits = detail.audits ?? [];

  return (
    <Space direction="vertical" size={16} className="full-width secret-authorization-detail">
      <div className="business-note">
        <Typography.Text strong className="business-note-title">
          授权详情
        </Typography.Text>
        <Typography.Text type="secondary">
          授权摘要最多展示 {detail.limits?.grantRows ?? 0} 行；审计摘要最多展示 {detail.limits?.auditRows ?? 0} 行。
        </Typography.Text>
      </div>

      <Card className="shell-card" title="已选涉密资源">
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="资源类型">{getSecretResourceTypeLabel(detail.resource.resourceType)}</Descriptions.Item>
          <Descriptions.Item label="资源名称">{formatSecretResourceLabel(detail.resource.safeResourceLabel)}</Descriptions.Item>
          <Descriptions.Item label="部门">{safeText(detail.resource.departmentId, "无部门")}</Descriptions.Item>
          <Descriptions.Item label="密级">{getSecretLevelLabel(detail.resource.secretLevel)}</Descriptions.Item>
          <Descriptions.Item label="标记">
            <Space size={4} wrap>
              <Tag color={detail.resource.isRestricted ? "red" : "default"}>
                {detail.resource.isRestricted ? "受限" : "未受限"}
              </Tag>
              <Tag color={detail.resource.contentRedacted ? "orange" : "default"}>
                {detail.resource.contentRedacted ? "已脱敏" : "无脱敏标记"}
              </Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="说明">
            {formatList([...(detail.resource.caveats ?? []), ...(detail.caveats ?? [])], "未返回投影提示。")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="shell-card" title="授权摘要">
        {grants.length > 0 ? (
          <Table<SecretAuthorizationGrantSummary>
            size="small"
            rowKey={(grant) =>
              `${grant.resourceType}-${grant.resourceId}-${grant.granteeType}-${grant.granteeSafeLabel}-${grant.grantType}-${grant.createdAt}`
            }
            columns={grantColumns}
            dataSource={grants}
            pagination={false}
            scroll={{ x: 1120 }}
          />
        ) : (
          <Typography.Text type="secondary">暂无可展示的安全授权摘要。</Typography.Text>
        )}
      </Card>

      <Card className="shell-card" title="审计摘要">
        {audits.length > 0 ? (
          <Table<SecretAuthorizationAuditSummary>
            size="small"
            rowKey={(audit) =>
              `${audit.operation}-${audit.resourceType}-${audit.grantType ?? "none"}-${audit.granteeType ?? "none"}-${audit.createdAt}`
            }
            columns={auditColumns}
            dataSource={audits}
            pagination={false}
            scroll={{ x: 920 }}
          />
        ) : (
          <Typography.Text type="secondary">暂无可展示的安全审计摘要。</Typography.Text>
        )}
      </Card>
    </Space>
  );
}

const resourceColumns: TableProps<SecretAuthorizationResourceSummary>["columns"] = [
  {
    title: "资源",
    key: "resource",
    width: 260,
    render: (_, resource) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{formatSecretResourceLabel(resource.safeResourceLabel)}</Typography.Text>
        <Typography.Text type="secondary">{getSecretResourceTypeLabel(resource.resourceType)}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "部门",
    dataIndex: "departmentId",
    key: "departmentId",
    width: 220,
    render: (departmentId: string | null) => safeText(departmentId, "无部门"),
  },
  {
    title: "密级",
    dataIndex: "secretLevel",
    key: "secretLevel",
    width: 140,
    render: (secretLevel: string) => <Tag>{getSecretLevelLabel(secretLevel)}</Tag>,
  },
  {
    title: "标记",
    key: "flags",
    width: 190,
    render: (_, resource) => (
      <Space size={4} wrap>
        <Tag color={resource.isRestricted ? "red" : "default"}>
          {resource.isRestricted ? "受限" : "开放"}
        </Tag>
        <Tag color={resource.contentRedacted ? "orange" : "default"}>
          {resource.contentRedacted ? "已脱敏" : "摘要"}
        </Tag>
      </Space>
    ),
  },
  {
    title: "有效授权",
    dataIndex: "activeGrantCount",
    key: "activeGrantCount",
    width: 120,
    render: (count: number) => getSafeNumber(count),
  },
  {
    title: "授权类型计数",
    dataIndex: "grantCountsByType",
    key: "grantCountsByType",
    width: 220,
    render: (counts: CountMap) => formatCountMap(counts),
  },
  {
    title: "授权对象计数",
    dataIndex: "grantCountsByGranteeType",
    key: "grantCountsByGranteeType",
    width: 220,
    render: (counts: CountMap) => formatCountMap(counts),
  },
  {
    title: "最近到期",
    dataIndex: "nearestGrantExpiresAt",
    key: "nearestGrantExpiresAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
];

const grantColumns: TableProps<SecretAuthorizationGrantSummary>["columns"] = [
  {
    title: "授权对象",
    key: "grantee",
    width: 240,
    render: (_, grant) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>{safeText(grant.granteeSafeLabel)}</Typography.Text>
        <Typography.Text type="secondary">{getGranteeTypeLabel(grant.granteeType)}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "授权类型",
    dataIndex: "grantType",
    key: "grantType",
    width: 180,
    render: (grantType: string) => getGrantTypeLabel(grantType),
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => <Tag>{getGrantStatusLabel(status)}</Tag>,
  },
  {
    title: "开始时间",
    dataIndex: "startsAt",
    key: "startsAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
  {
    title: "到期时间",
    dataIndex: "expiresAt",
    key: "expiresAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
  {
    title: "撤销时间",
    dataIndex: "revokedAt",
    key: "revokedAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
];

const auditColumns: TableProps<SecretAuthorizationAuditSummary>["columns"] = [
  {
    title: "操作",
    dataIndex: "operation",
    key: "operation",
    width: 220,
    render: (operation: string) => getSecretAuditOperationLabel(operation),
  },
  {
    title: "资源类型",
    dataIndex: "resourceType",
    key: "resourceType",
    width: 160,
    render: (resourceType: string) => getSecretResourceTypeLabel(resourceType),
  },
  {
    title: "密级",
    dataIndex: "targetSecretLevel",
    key: "targetSecretLevel",
    width: 140,
    render: (secretLevel: string | null) => secretLevel ? getSecretLevelLabel(secretLevel) : "未返回密级",
  },
  {
    title: "授权类型",
    dataIndex: "grantType",
    key: "grantType",
    width: 160,
    render: (grantType: string | null) => grantType ? getGrantTypeLabel(grantType) : "未返回授权类型",
  },
  {
    title: "授权对象类型",
    dataIndex: "granteeType",
    key: "granteeType",
    width: 160,
    render: (granteeType: string | null) => granteeType ? getGranteeTypeLabel(granteeType) : "未返回授权对象",
  },
  {
    title: "是否填写原因",
    dataIndex: "reasonProvided",
    key: "reasonProvided",
    width: 120,
    render: (reasonProvided: boolean) => (reasonProvided ? "已填写" : "未填写"),
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 176,
    render: (createdAt: string) => formatDateTime(createdAt),
  },
];

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="shell-card secret-authorization-metric">
      <Space direction="vertical" size={2}>
        <Typography.Text type="secondary">{title}</Typography.Text>
        <Typography.Title level={3}>{getSafeNumber(value)}</Typography.Title>
      </Space>
    </Card>
  );
}

const getResourceKey = (resource: Pick<SecretAuthorizationResourceSummary, "resourceType" | "resourceId">) =>
  `${resource.resourceType}:${resource.resourceId}`;

const safeText = (
  value: string | number | boolean | null | undefined,
  fallback = noValue,
): string => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

const formatSecretResourceLabel = (value: string | null | undefined): string => {
  const text = safeText(value, "涉密资源");

  if (/^Restricted\s+PATENT\s+achievement$/i.test(text)) {
    return "受限专利成果";
  }

  if (/^Restricted\s+ACHIEVEMENT\s+attachment metadata$/i.test(text)) {
    return "受限成果附件";
  }

  if (/^Restricted\s+ACHIEVEMENT\b/i.test(text)) {
    return "受限科研成果";
  }

  return sanitizeBusinessTitle(text, "涉密资源");
};

const getSafeNumber = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const getSecretResourceTypeLabel = (value: string): string => {
  const labels: Record<string, string> = {
    ACHIEVEMENT: "科研成果",
    ATTACHMENT: "附件",
  };

  return labels[value] ?? value;
};

const getSecretLevelLabel = (value: string): string => {
  const labels: Record<string, string> = {
    PUBLIC: "公开",
    INTERNAL: "内部",
    CONFIDENTIAL: "秘密",
    SECRET: "机密",
    TOP_SECRET: "绝密",
  };

  return labels[value] ?? value;
};

const getGrantTypeLabel = (value: string): string => {
  const labels: Record<string, string> = {
    READ: "读取",
    DOWNLOAD: "下载",
    ATTACHMENT_DOWNLOAD: "附件下载",
    MANAGE: "管理",
  };

  return labels[value] ?? value;
};

const getGranteeTypeLabel = (value: string): string => {
  const labels: Record<string, string> = {
    USER: "用户",
    ROLE: "角色",
    DEPARTMENT: "部门",
  };

  return labels[value] ?? value;
};

const getGrantStatusLabel = (value: string): string => {
  const labels: Record<string, string> = {
    ACTIVE: "有效",
    EXPIRED: "已过期",
    REVOKED: "已撤销",
    FUTURE_DATED: "未生效",
    EXPIRING_SOON: "即将到期",
  };

  return labels[value] ?? value;
};

const getSecretAuditOperationLabel = (value: string): string => {
  const labels: Record<string, string> = {
    RESOURCE_GRANT_CREATE: "创建授权",
    RESOURCE_GRANT_REVOKE: "撤销授权",
    RESOURCE_GRANT_EXPIRE: "授权过期",
    RESOURCE_ACCESS_CHECK: "访问校验",
  };

  return labels[value] ?? value;
};

const getSecretCountKeyLabel = (value: string): string => {
  const labeled = [
    getSecretResourceTypeLabel,
    getSecretLevelLabel,
    getGrantTypeLabel,
    getGranteeTypeLabel,
    getGrantStatusLabel,
  ].reduce((current, labeler) => labeler(current), value);

  return labeled;
};

const formatCountMap = (counts: CountMap | null | undefined): string => {
  const entries = Object.entries(counts ?? {}).filter(([, value]) => Number.isFinite(value));

  if (entries.length === 0) {
    return "未返回计数";
  }

  return entries.map(([key, value]) => `${getSecretCountKeyLabel(key)}: ${value}`).join(", ");
};

const formatList = (values: string[] | null | undefined, emptyText: string): string => {
  const safeValues = (values ?? []).filter((value) => value.trim().length > 0);

  return safeValues.length > 0 ? safeValues.map(formatCaveatLabel).join("，") : emptyText;
};

const formatCaveatLabel = (value: string): string => {
  const labels: Record<string, string> = {
    LOCAL_DEMO_SYNTHETIC_ONLY: "当前为本地样例数据",
    READ_ONLY_SAFE_PROJECTION: "仅展示授权摘要",
    LOCAL_DEMO_SYNTHETIC_NOT_PRODUCTION_AUTHORIZATION: "本地样例授权数据",
    GRANT_MUTATION_NOT_IMPLEMENTED: "授权变更入口未开放",
    RESOURCE_CONTENT_REDACTED: "资源内容已脱敏",
    AUDIT_SUMMARY_BOUNDED: "审计摘要已限制条数",
  };

  return labels[value] ?? value;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "未返回时间";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", { hour12: false });
};

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "涉密授权请求失败。",
    detail: "页面未能完成请求，请确认本地服务可用后重试。",
  };
};
