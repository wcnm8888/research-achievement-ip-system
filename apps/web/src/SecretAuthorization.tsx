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

const noValue = "Not returned";

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
          title="Secret authorization"
          description="Read-only secret authorization management is available only to system:config users."
        />
        <DataState
          error={{
            kind: "forbidden",
            status: 403,
            message: "Current account cannot access secret authorization management.",
            detail:
              "Use an administrator with system:config. Without that permission, the frontend does not request /secret-authorization APIs.",
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
          title="Secret authorization"
          description="A valid session context is required before secret authorization APIs are requested."
        />
        <PermissionHint description="No active business context is available. The page will not request secret authorization summaries until a session is present." />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack secret-authorization-page">
      <SectionHeader
        title="Secret authorization"
        description="Local/demo/synthetic read-only management view. This is not production authorization acceptance."
        extra={<Button onClick={refresh}>Refresh</Button>}
      />

      <PermissionHint description="This page shows safe summaries only: counts, redaction flags, bounded grant rows, bounded audit rows, and caveats. It does not expose protected content, storage identifiers, credential material, or write actions." />

      <DataState loading={overview.loading} error={overview.error} onRetry={loadOverview}>
        {overview.data ? (
          <SecretAuthorizationOverviewCards overview={overview.data} />
        ) : (
          <SecretAuthorizationOverviewEmpty />
        )}
      </DataState>

      <Card className="shell-card" title="Restricted resources" extra={<Tag>GET /secret-authorization/resources</Tag>}>
        <DataState
          loading={resources.loading}
          error={resources.error}
          empty={!resources.loading && !resources.error && resourceItems.length === 0}
          emptyText="No restricted resources returned."
          onRetry={loadResources}
        >
          <SecretAuthorizationResourceTable
            resources={resourceItems}
            selectedResourceKey={selectedResourceKey}
            onSelectResource={setSelectedResourceKey}
          />
        </DataState>
      </Card>

      <Card className="shell-card" title="Resource detail">
        {selectedResource ? (
          <DataState
            loading={detail.loading}
            error={detail.error}
            onRetry={() => loadDetail(selectedResource)}
          >
            {detail.data ? (
              <SecretAuthorizationResourceDetailPanel detail={detail.data} />
            ) : (
              <Typography.Text type="secondary">Select a restricted resource to load safe grant and audit summaries.</Typography.Text>
            )}
          </DataState>
        ) : (
          <Typography.Text type="secondary">No restricted resource is selected.</Typography.Text>
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
        <MetricCard title="Restricted resources" value={overview.restrictedResourceCount} />
        <MetricCard title="Active grants" value={overview.activeGrantCount} />
        <MetricCard title="Revoked / expired grants" value={revokedOrExpiredCount} />
        <MetricCard title="Expiring soon" value={overview.expiringSoonCount} />
      </Space>
      <Card className="shell-card" title="Overview breakdown">
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="By resource type">
            {formatCountMap(overview.restrictedResourceCountsByType)}
          </Descriptions.Item>
          <Descriptions.Item label="By secret level">
            {formatCountMap(overview.restrictedResourceCountsBySecretLevel)}
          </Descriptions.Item>
          <Descriptions.Item label="Grant status">
            {formatCountMap(overview.grantCountsByStatus)}
          </Descriptions.Item>
          <Descriptions.Item label="Grant type">
            {formatCountMap(overview.grantCountsByType)}
          </Descriptions.Item>
          <Descriptions.Item label="Grantee type">
            {formatCountMap(overview.grantCountsByGranteeType)}
          </Descriptions.Item>
          <Descriptions.Item label="Generated">{formatDateTime(overview.generatedAt)}</Descriptions.Item>
          <Descriptions.Item label="Caveats">
            {formatList(overview.caveats, "No projection caveats returned.")}
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
        No overview returned. Safe empty state is shown with stable fallback values.
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
      <Alert
        type="info"
        showIcon
        message="Safe detail projection"
        description={`Grant rows are bounded to ${detail.limits?.grantRows ?? 0}; audit rows are bounded to ${detail.limits?.auditRows ?? 0}.`}
      />

      <Card className="shell-card" title="Selected resource">
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Resource type">{safeText(detail.resource.resourceType)}</Descriptions.Item>
          <Descriptions.Item label="Safe label">{safeText(detail.resource.safeResourceLabel)}</Descriptions.Item>
          <Descriptions.Item label="Department">{safeText(detail.resource.departmentId, "No department")}</Descriptions.Item>
          <Descriptions.Item label="Secret level">{safeText(detail.resource.secretLevel)}</Descriptions.Item>
          <Descriptions.Item label="Flags">
            <Space size={4} wrap>
              <Tag color={detail.resource.isRestricted ? "red" : "default"}>
                {detail.resource.isRestricted ? "Restricted" : "Not restricted"}
              </Tag>
              <Tag color={detail.resource.contentRedacted ? "orange" : "default"}>
                {detail.resource.contentRedacted ? "Redacted" : "No redaction flag"}
              </Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Caveats">
            {formatList([...(detail.resource.caveats ?? []), ...(detail.caveats ?? [])], "No projection caveats returned.")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="shell-card" title="Grant summaries">
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
          <Typography.Text type="secondary">No safe grant summaries returned.</Typography.Text>
        )}
      </Card>

      <Card className="shell-card" title="Audit summaries">
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
          <Typography.Text type="secondary">No safe audit summaries returned.</Typography.Text>
        )}
      </Card>
    </Space>
  );
}

const resourceColumns: TableProps<SecretAuthorizationResourceSummary>["columns"] = [
  {
    title: "Resource",
    key: "resource",
    width: 260,
    render: (_, resource) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{safeText(resource.safeResourceLabel)}</Typography.Text>
        <Typography.Text type="secondary">{safeText(resource.resourceType)}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "Department",
    dataIndex: "departmentId",
    key: "departmentId",
    width: 220,
    render: (departmentId: string | null) => safeText(departmentId, "No department"),
  },
  {
    title: "Secret level",
    dataIndex: "secretLevel",
    key: "secretLevel",
    width: 140,
    render: (secretLevel: string) => <Tag>{safeText(secretLevel)}</Tag>,
  },
  {
    title: "Flags",
    key: "flags",
    width: 190,
    render: (_, resource) => (
      <Space size={4} wrap>
        <Tag color={resource.isRestricted ? "red" : "default"}>
          {resource.isRestricted ? "Restricted" : "Open"}
        </Tag>
        <Tag color={resource.contentRedacted ? "orange" : "default"}>
          {resource.contentRedacted ? "Redacted" : "Safe summary"}
        </Tag>
      </Space>
    ),
  },
  {
    title: "Active grants",
    dataIndex: "activeGrantCount",
    key: "activeGrantCount",
    width: 120,
    render: (count: number) => getSafeNumber(count),
  },
  {
    title: "Grant type counts",
    dataIndex: "grantCountsByType",
    key: "grantCountsByType",
    width: 220,
    render: (counts: CountMap) => formatCountMap(counts),
  },
  {
    title: "Grantee counts",
    dataIndex: "grantCountsByGranteeType",
    key: "grantCountsByGranteeType",
    width: 220,
    render: (counts: CountMap) => formatCountMap(counts),
  },
  {
    title: "Nearest expiry",
    dataIndex: "nearestGrantExpiresAt",
    key: "nearestGrantExpiresAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
];

const grantColumns: TableProps<SecretAuthorizationGrantSummary>["columns"] = [
  {
    title: "Grantee",
    key: "grantee",
    width: 240,
    render: (_, grant) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>{safeText(grant.granteeSafeLabel)}</Typography.Text>
        <Typography.Text type="secondary">{safeText(grant.granteeType)}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "Grant type",
    dataIndex: "grantType",
    key: "grantType",
    width: 180,
    render: (grantType: string) => safeText(grantType),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => <Tag>{safeText(status)}</Tag>,
  },
  {
    title: "Starts",
    dataIndex: "startsAt",
    key: "startsAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
  {
    title: "Expires",
    dataIndex: "expiresAt",
    key: "expiresAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
  {
    title: "Revoked",
    dataIndex: "revokedAt",
    key: "revokedAt",
    width: 176,
    render: (value: string | null) => formatDateTime(value),
  },
  {
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
];

const auditColumns: TableProps<SecretAuthorizationAuditSummary>["columns"] = [
  {
    title: "Operation",
    dataIndex: "operation",
    key: "operation",
    width: 220,
    render: (operation: string) => safeText(operation),
  },
  {
    title: "Resource type",
    dataIndex: "resourceType",
    key: "resourceType",
    width: 160,
    render: (resourceType: string) => safeText(resourceType),
  },
  {
    title: "Secret level",
    dataIndex: "targetSecretLevel",
    key: "targetSecretLevel",
    width: 140,
    render: (secretLevel: string | null) => safeText(secretLevel, "No level"),
  },
  {
    title: "Grant type",
    dataIndex: "grantType",
    key: "grantType",
    width: 160,
    render: (grantType: string | null) => safeText(grantType, "No grant type"),
  },
  {
    title: "Grantee type",
    dataIndex: "granteeType",
    key: "granteeType",
    width: 160,
    render: (granteeType: string | null) => safeText(granteeType, "No grantee"),
  },
  {
    title: "Reason",
    dataIndex: "reasonProvided",
    key: "reasonProvided",
    width: 120,
    render: (reasonProvided: boolean) => (reasonProvided ? "Provided" : "Not provided"),
  },
  {
    title: "Created",
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

const getSafeNumber = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const formatCountMap = (counts: CountMap | null | undefined): string => {
  const entries = Object.entries(counts ?? {}).filter(([, value]) => Number.isFinite(value));

  if (entries.length === 0) {
    return "No counts returned";
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
};

const formatList = (values: string[] | null | undefined, emptyText: string): string => {
  const safeValues = (values ?? []).filter((value) => value.trim().length > 0);

  return safeValues.length > 0 ? safeValues.join(", ") : emptyText;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "No timestamp returned";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", { hour12: false });
};

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "Secret authorization request failed.",
    detail: error instanceof Error ? error.message : undefined,
  };
};
