import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isApiError, type ApiClient, type ApiError, type AuthUser } from "./api-client";
import { DataState, PermissionHint } from "./components/StateBlocks";
import type {
  AchievementContributor,
  AchievementConversionRecord,
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
  AchievementDetail as AchievementDetailType,
  AttachmentDetailMetadata,
  AttachmentListQuery,
  AttachmentMetadata,
  AttachmentStatusCode,
  AchievementListItem,
  AchievementStatusCode,
  AchievementTypeCode,
  CreateAchievementConversionInput,
  ContributorRoleCode,
  ContributorTypeCode,
  PatentLegalStatusCode,
  PatentTypeCode,
  SecretLevelCode,
  SoftwareTypeCode,
  UpdateAchievementConversionInput,
  UploadAchievementAttachmentInput,
} from "./types";

type AchievementDetailProps = {
  apiClient: ApiClient;
  authUser?: AchievementPermissionContext;
  demoUserId: string | null;
  listItem: AchievementListItem;
  onChanged: () => void;
  onClose: () => void;
  open: boolean;
};

type ReadonlyAchievementDetailProps = {
  achievementId: string;
  apiClient: ApiClient;
  context?: ReadonlyAchievementDetailContext;
  demoUserId: string | null;
  onClose: () => void;
  open: boolean;
};

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type AchievementPermissionContext = Pick<AuthUser, "id" | "permissionCodes"> | null | undefined;

export type AchievementAction = "submit" | "void" | "archive";
export type ReadonlyAchievementDetailContext = "approval" | "search";
type DetailContentMode = "management" | "approval-readonly" | "search-readonly";

type DetailDisplayField = {
  label: string;
  value: React.ReactNode;
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const typeLabels: Record<AchievementTypeCode, string> = {
  PAPER: "论文",
  PATENT: "专利",
  SOFTWARE_COPYRIGHT: "软件著作权",
};

const statusLabels: Record<AchievementStatusCode, string> = {
  DRAFT: "草稿",
  PENDING_DEPARTMENT_REVIEW: "待院系审核",
  DEPARTMENT_REJECTED: "院系驳回",
  PENDING_ARCHIVE: "待归档",
  ARCHIVED: "已归档",
  VOIDED: "已作废",
};

const secretLevelLabels: Record<SecretLevelCode, string> = {
  PUBLIC: "公开",
  INTERNAL: "内部",
  SECRET: "秘密",
  CONFIDENTIAL: "机密",
};

const contributorTypeLabels: Record<ContributorTypeCode, string> = {
  AUTHOR: "作者",
  INVENTOR: "发明人",
  COPYRIGHT_OWNER: "著作权人",
};

const contributorRoleLabels: Record<ContributorRoleCode, string> = {
  FIRST_AUTHOR: "第一作者",
  CORRESPONDING_AUTHOR: "通讯作者",
  PRIMARY_INVENTOR: "第一发明人",
  PARTICIPANT: "参与人",
  OWNER: "权利人",
  OTHER: "其他",
};

const patentTypeLabels: Record<PatentTypeCode, string> = {
  INVENTION: "发明",
  UTILITY_MODEL: "实用新型",
  DESIGN: "外观设计",
  NATIONAL_DEFENSE: "国防专利",
  OTHER: "其他",
};

const patentLegalStatusLabels: Record<PatentLegalStatusCode, string> = {
  PENDING: "申请中",
  GRANTED: "已授权",
  REJECTED: "已驳回",
  EXPIRED: "已届满",
  TERMINATED: "已终止",
  TRANSFERRED: "已转让",
  UNKNOWN: "未知",
};

const softwareTypeLabels: Record<SoftwareTypeCode, string> = {
  APPLICATION: "应用软件",
  SYSTEM: "系统软件",
  TOOL: "工具软件",
  EMBEDDED: "嵌入式软件",
  OTHER: "其他",
};

const attachmentStatusLabels: Record<AttachmentStatusCode, string> = {
  ACTIVE: "有效",
  ARCHIVED: "已归档",
  BLOCKED: "已阻止",
};

const attachmentDefaultTake = 50;
export const attachmentUploadMaxBytes = 10 * 1024 * 1024;

const conversionTypeLabels: Record<AchievementConversionTypeCode, string> = {
  LICENSE: "License",
  TRANSFER: "Transfer",
  COOPERATION: "Cooperation",
  INDUSTRIALIZATION: "Industrialization",
  OTHER: "Other",
};

const conversionStatusLabels: Record<AchievementConversionStatusCode, string> = {
  LEAD_INTENT: "Lead / intent",
  CONTRACTING: "Contracting",
  SIGNED: "Signed",
  PAID: "Paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const allowedAttachmentExtensions = new Set(["pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"]);
const allowedAttachmentMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const fetchAchievementDetailById = (
  client: ApiClient,
  achievementId: string,
): Promise<AchievementDetailType> =>
  client.get<AchievementDetailType>(`/achievements/${achievementId}`);

export const fetchAchievementConversions = (
  client: ApiClient,
  achievementId: string,
): Promise<AchievementConversionRecord[]> =>
  client.get<AchievementConversionRecord[]>(
    `/achievements/${achievementId}/conversions`,
  );

export const createAchievementConversion = (
  client: ApiClient,
  achievementId: string,
  input: CreateAchievementConversionInput,
): Promise<AchievementConversionRecord> =>
  client.post<AchievementConversionRecord>(
    `/achievements/${achievementId}/conversions`,
    input,
  );

export const updateAchievementConversion = (
  client: ApiClient,
  achievementId: string,
  conversionId: string,
  input: UpdateAchievementConversionInput,
): Promise<AchievementConversionRecord> =>
  client.patch<AchievementConversionRecord>(
    `/achievements/${achievementId}/conversions/${conversionId}`,
    input,
  );

export const fetchAchievementAttachmentMetadata = (
  client: ApiClient,
  achievementId: string,
  query: AttachmentListQuery = { take: attachmentDefaultTake },
): Promise<AttachmentMetadata[]> =>
  client.get<AttachmentMetadata[]>(
    `/achievements/${achievementId}/attachments`,
    query,
  );

export const fetchAchievementAttachmentDetailMetadata = (
  client: ApiClient,
  achievementId: string,
  attachmentId: string,
): Promise<AttachmentDetailMetadata> =>
  client.get<AttachmentDetailMetadata>(
    `/achievements/${achievementId}/attachments/${attachmentId}`,
  );

export const uploadAchievementAttachment = (
  client: ApiClient,
  achievementId: string,
  input: UploadAchievementAttachmentInput,
): Promise<AttachmentMetadata> => {
  if (!client.postForm) {
    throw new Error("Attachment upload requires multipart API client support.");
  }

  return client.postForm<AttachmentMetadata>(
    `/achievements/${achievementId}/attachments`,
    buildAchievementAttachmentFormData(input),
  );
};

export const downloadAchievementAttachment = (
  client: ApiClient,
  achievementId: string,
  attachmentId: string,
): Promise<Blob> => {
  if (!client.downloadBlob) {
    throw new Error("Attachment download requires blob API client support.");
  }

  return client.downloadBlob(
    `/achievements/${achievementId}/attachments/${attachmentId}/download`,
  );
};

export function AchievementDetail({
  apiClient,
  authUser,
  demoUserId,
  listItem,
  onChanged,
  onClose,
  open,
}: AchievementDetailProps) {
  const [detailState, setDetailState] =
    useState<Loadable<AchievementDetailType>>(emptyLoadable);
  const [activeAction, setActiveAction] = useState<AchievementAction | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [acting, setActing] = useState(false);

  const loadDetail = useCallback(async () => {
    setDetailState({ loading: true, data: null, error: null });

    try {
      const detail = await fetchAchievementDetailById(apiClient, listItem.id);
      setDetailState({ loading: false, data: detail, error: null });
    } catch (error) {
      setDetailState({
        loading: false,
        data: null,
        error: normalizeError(error),
      });
    }
  }, [apiClient, listItem.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveAction(null);
    setActionError(null);
    setVoidReason("");
    void loadDetail();
  }, [loadDetail, open]);

  const detail = detailState.data;
  const drawerTitle = getDetailDisplayTitle(detail ?? listItem);
  const actions = useMemo(
    () => (detail ? getAvailableAchievementActions(detail.status) : []),
    [detail],
  );
  const confirmConfig = activeAction ? getActionConfirmConfig(activeAction) : null;

  const executeAction = async () => {
    if (!activeAction || !detail) {
      return;
    }

    setActionError(null);
    const payload =
      activeAction === "void" ? buildVoidActionPayload(voidReason) : undefined;

    if (activeAction === "void" && !payload) {
      setActionError({
        kind: "bad-request",
        message: "请填写作废原因",
      });
      return;
    }

    setActing(true);

    try {
      await apiClient.post<unknown>(
        `/achievements/${detail.id}/${activeAction}`,
        payload,
      );
      void message.success(`${confirmConfig?.successMessage ?? "动作"}已完成`);
      setActiveAction(null);
      setVoidReason("");
      await loadDetail();
      onChanged();
    } catch (error) {
      setActionError(normalizeError(error));
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <Drawer
        className="achievement-detail-drawer"
        destroyOnClose
        extra={
          detail ? (
            <Space wrap>
              {actions.map((action) => {
                const config = getActionConfirmConfig(action);
                return (
                  <Button
                    danger={action === "void"}
                    key={action}
                    type={action === "submit" ? "primary" : "default"}
                    onClick={() => {
                      setActionError(null);
                      setVoidReason("");
                      setActiveAction(action);
                    }}
                  >
                    {config.buttonLabel}
                  </Button>
                );
              })}
              <Button onClick={onClose}>关闭</Button>
            </Space>
          ) : (
            <Button onClick={onClose}>关闭</Button>
          )
        }
        open={open}
        title={drawerTitle}
        width="min(820px, 100vw)"
        onClose={onClose}
      >
        <DataState
          loading={detailState.loading}
          error={detailState.error}
          empty={!detailState.loading && !detailState.error && !detail}
          emptyText="未返回成果详情"
          onRetry={() => void loadDetail()}
        >
          {detail ? (
            <DetailContent
              apiClient={apiClient}
              authUser={authUser}
              demoUserId={demoUserId}
              detail={detail}
            />
          ) : null}
        </DataState>
      </Drawer>

      <Modal
        confirmLoading={acting}
        okButtonProps={{ danger: activeAction === "void" }}
        okText={confirmConfig?.okText}
        open={Boolean(activeAction)}
        title={confirmConfig?.title}
        onCancel={() => {
          if (!acting) {
            setActiveAction(null);
            setActionError(null);
            setVoidReason("");
          }
        }}
        onOk={() => void executeAction()}
      >
        <Space direction="vertical" size={12} className="full-width">
          <Typography.Paragraph>{confirmConfig?.description}</Typography.Paragraph>
          {activeAction === "void" ? (
            <Input.TextArea
              maxLength={1000}
              placeholder="请输入作废原因，1-1000 字"
              rows={4}
              showCount
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
            />
          ) : null}
          {actionError ? (
            <Alert
              showIcon
              type="error"
              message={actionError.message}
              description={actionError.detail}
            />
          ) : null}
        </Space>
      </Modal>
    </>
  );
}

export function ReadonlyAchievementDetail({
  achievementId,
  apiClient,
  context = "approval",
  demoUserId,
  onClose,
  open,
}: ReadonlyAchievementDetailProps) {
  const [detailState, setDetailState] =
    useState<Loadable<AchievementDetailType>>(emptyLoadable);

  const loadDetail = useCallback(async () => {
    setDetailState({ loading: true, data: null, error: null });

    try {
      const detail = await fetchAchievementDetailById(apiClient, achievementId);
      setDetailState({ loading: false, data: detail, error: null });
    } catch (error) {
      setDetailState({
        loading: false,
        data: null,
        error: normalizeError(error),
      });
    }
  }, [achievementId, apiClient]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadDetail();
  }, [loadDetail, open]);

  const detail = detailState.data;
  const readonlyError = detailState.error
    ? getReadonlyAchievementErrorState(detailState.error, context)
    : null;
  const detailMode: DetailContentMode =
    context === "search" ? "search-readonly" : "approval-readonly";

  return (
    <Drawer
      className="achievement-detail-drawer"
      destroyOnClose
      extra={<Button onClick={onClose}>关闭</Button>}
      open={open}
      title={getDetailDisplayTitle(detail)}
      width="min(820px, 100vw)"
      onClose={onClose}
    >
      <DataState
        loading={detailState.loading}
        error={readonlyError}
        empty={!detailState.loading && !detailState.error && !detail}
        emptyText="未返回成果详情"
        onRetry={() => void loadDetail()}
      >
        {detail ? (
          <DetailContent
            apiClient={apiClient}
            demoUserId={demoUserId}
            detail={detail}
            mode={detailMode}
          />
        ) : null}
      </DataState>
    </Drawer>
  );
}

export const getReadonlyAchievementActions = (): AchievementAction[] => [];

export const shouldLoadAttachmentMetadata = (
  demoUserId: string | null,
  achievementId: string | null | undefined,
): boolean => Boolean(demoUserId?.trim() && achievementId?.trim());

export const shouldLoadAchievementConversions = (
  demoUserId: string | null,
  achievementId: string | null | undefined,
): boolean => Boolean(demoUserId?.trim() && achievementId?.trim());

export const shouldLoadAttachmentDetailMetadata = (
  demoUserId: string | null,
  achievementId: string | null | undefined,
  attachmentId: string | null | undefined,
): boolean =>
  Boolean(demoUserId?.trim() && achievementId?.trim() && attachmentId?.trim());

export const getAttachmentMetadataReadonlyBoundary = () => ({
  title: "Step 45C-3 附件本地 UI",
  description:
    "本区域接入附件 metadata 列表、multipart 上传和认证下载；不展示 storageKey、checksum、真实路径或文件内容。",
  allowedRequest: "GET /achievements/:achievementId/attachments",
});

export const getAttachmentDetailMetadataReadonlyBoundary = () => ({
  title: "Step 21A 附件 detail metadata 只读",
  description:
    "本详情只读取 GET /achievements/:achievementId/attachments/:attachmentId 返回的安全 metadata 字段；不提供上传、下载、删除、归档、版本变更、对象存储、费用凭证附件或文件内容能力。",
  allowedRequest: "GET /achievements/:achievementId/attachments/:attachmentId",
});

export const mapAttachmentMetadataErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      ...error,
      message: "请选择或切换演示用户",
      detail: error.detail ?? "附件 metadata 需要有效用户上下文后才能读取。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "当前角色无附件 metadata 读取权限",
      detail: error.detail ?? "附件 metadata 权限由后端控制，前端不会绕过授权策略。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "成果附件 metadata 不存在或不可用",
      detail: error.detail ?? "请确认成果仍在当前用户可读取范围内。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "附件 metadata 服务暂不可用",
      detail: error.detail ?? "请稍后重试；前端不会显示假附件数据。",
    };
  }

  if (error.kind === "bad-request" || error.status === 400 || error.status === 422) {
    return {
      ...error,
      message: "附件 metadata 请求参数不正确",
      detail: error.detail ?? "请检查成果 ID、状态筛选和 take 参数。",
    };
  }

  return {
    ...error,
    message: error.message || "附件 metadata 读取失败",
  };
};

export const mapAttachmentDetailMetadataErrorToDisplay = (
  error: ApiError,
): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      ...error,
      message: "请选择或切换演示用户",
      detail: error.detail ?? "附件 detail metadata 需要有效用户上下文后才能读取。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "当前角色无附件 detail metadata 读取权限",
      detail:
        error.detail ?? "附件 detail metadata 权限由后端控制，前端不会绕过授权策略。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "附件 detail metadata 不存在或不可用",
      detail: error.detail ?? "请确认附件仍属于当前成果且在当前用户可读取范围内。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "附件 detail metadata 服务暂不可用",
      detail: error.detail ?? "请稍后重试；前端不会显示假附件详情。",
    };
  }

  if (error.kind === "bad-request" || error.status === 400 || error.status === 422) {
    return {
      ...error,
      message: "附件 detail metadata 请求参数不正确",
      detail: error.detail ?? "请检查成果 ID 与附件 ID 是否完整。",
    };
  }

  return {
    ...error,
    message: error.message || "附件 detail metadata 读取失败",
  };
};

export const buildAttachmentMetadataViewModel = (attachment: AttachmentMetadata) => ({
  id: attachment.id,
  relationType: attachment.relationType,
  relationId: attachment.relationId,
  fileName: attachment.fileName || "未命名附件",
  originalName: attachment.originalName || attachment.fileName || "未返回",
  mimeType: attachment.mimeType || "未返回",
  sizeLabel: formatAttachmentSize(attachment.sizeBytes),
  version: attachment.version,
  uploaderId: attachment.uploaderId || "未返回",
  secretLevelLabel: getSecretLevelLabel(attachment.secretLevel),
  statusLabel: getAttachmentStatusLabel(attachment.status),
  createdAt: formatDateTime(attachment.createdAt),
  updatedAt: formatDateTime(attachment.updatedAt),
  archivedAt: formatDateTime(attachment.archivedAt),
});

export const buildAchievementAttachmentFormData = (
  input: UploadAchievementAttachmentInput,
): FormData => {
  const formData = new FormData();
  formData.append("file", input.file);

  const displayName = input.displayName?.trim();
  if (displayName) {
    formData.append("displayName", displayName);
  }

  if (input.secretLevel) {
    formData.append("secretLevel", input.secretLevel);
  }

  return formData;
};

export const validateAttachmentUploadFile = (
  file: Pick<File, "name" | "size" | "type">,
): { ok: true } | { ok: false; message: string } => {
  if (file.size > attachmentUploadMaxBytes) {
    return { ok: false, message: "附件不能超过 10 MB" };
  }

  const extension = getFileExtension(file.name);
  if (!allowedAttachmentExtensions.has(extension)) {
    return { ok: false, message: "不支持的附件扩展名" };
  }

  if (file.type && !allowedAttachmentMimeTypes.has(file.type)) {
    return { ok: false, message: "不支持的附件 MIME 类型" };
  }

  return { ok: true };
};

export const canUploadAchievementAttachment = (
  authUser: AchievementPermissionContext,
  detail: Pick<AchievementDetailType, "ownerUserId">,
): boolean =>
  hasAchievementPermission(authUser, "achievement:update_own") &&
  (!authUser || detail.ownerUserId === authUser.id);

export const formatAttachmentSize = (value: number | null | undefined): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "未返回";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const mapAttachmentUploadErrorToDisplay = (error: ApiError): ApiError => ({
  ...error,
  message: error.message || "附件上传失败",
});

export const mapAttachmentDownloadErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      ...error,
      message: "请选择或切换演示用户",
      detail: error.detail ?? "附件下载需要有效用户上下文。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "当前角色无附件下载权限",
      detail: error.detail ?? "下载权限由后端控制，前端不会绕过授权策略。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "附件不存在或不可下载",
      detail: error.detail ?? "请刷新附件列表后重试。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "附件下载服务暂不可用",
      detail: error.detail ?? "请稍后重试。",
    };
  }

  return {
    ...error,
    message: error.message || "附件下载失败",
  };
};

export const buildAttachmentDetailMetadataViewModel = (
  attachment: AttachmentDetailMetadata,
) => buildAttachmentMetadataViewModel(attachment);

export const getReadonlyAchievementErrorState = (
  error: ApiError,
  context: ReadonlyAchievementDetailContext = "approval",
): ApiError => {
  const labels = getReadonlyAchievementContextLabels(context);

  if (error.status === 401) {
    return {
      kind: error.kind,
      status: error.status,
      message: "请选择或切换演示用户",
      detail: `${labels.sourceName}需要有效用户后才能读取成果详情。`,
    };
  }

  if (error.status === 403) {
    return {
      kind: error.kind,
      status: error.status,
      message: `当前账号无权查看${labels.shortObjectName}`,
      detail: "权限与脱敏由后端控制，前端不会绕过授权策略。",
    };
  }

  if (error.status === 404) {
    return {
      kind: error.kind,
      status: error.status,
      message: `${labels.shortObjectName}不存在或已不可用`,
      detail: labels.notFoundDetail,
    };
  }

  if (error.kind === "network" || error.kind === "server") {
    return {
      kind: error.kind,
      status: error.status,
      message: "成果详情服务暂不可用",
      detail: "请稍后重试；前端不会显示假数据或本地拼装详情。",
    };
  }

  if (error.kind === "bad-request" || error.status === 400 || error.status === 422) {
    return {
      kind: error.kind,
      status: error.status,
      message: `${labels.shortObjectName}请求无效`,
      detail: labels.badRequestDetail,
    };
  }

  return {
    kind: error.kind,
    status: error.status,
    message: `无法读取${labels.shortObjectName}详情`,
    detail: "请稍后重试，或联系管理员查看后端服务状态。",
  };
};

function DetailContent({
  apiClient,
  authUser,
  demoUserId,
  detail,
  mode = "management",
}: {
  apiClient: ApiClient;
  authUser?: AchievementPermissionContext;
  demoUserId: string | null;
  detail: AchievementDetailType;
  mode?: DetailContentMode;
}) {
  const readonlyLabels = getDetailContentReadonlyLabels(mode);
  const isReadonly = mode !== "management";

  return (
    <Space direction="vertical" size={18} className="full-width">
      <PermissionHint
        description={
          isReadonly
            ? readonlyLabels.permissionDescription
            : "详情读取和动作执行最终以后端权限与状态机为准。前端只展示后端返回的数据，不补造 workflow、附件或费用信息。"
        }
      />

      {detail.isRedacted ? (
        <Alert
          showIcon
          type="warning"
          message="后端脱敏"
          description="当前列表项被后端标记为脱敏；详情内容只展示本次详情接口实际返回的字段。"
        />
      ) : null}

      {isReadonly ? (
        <Alert
          showIcon
          type="info"
          message={readonlyLabels.noticeMessage}
          description={readonlyLabels.noticeDescription}
        />
      ) : (
        getStatusBoundaryNotice(detail.status)
      )}

      <Divider orientation="left">基础信息</Divider>
      <Descriptions bordered column={2} size="small">
        {getBaseFields(detail).map((field) => (
          <Descriptions.Item key={field.label} label={field.label}>
            {field.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Divider orientation="left">类型详情</Divider>
      <Descriptions bordered column={2} size="small">
        {getTypeDetailFields(detail).map((field) => (
          <Descriptions.Item key={field.label} label={field.label}>
            {field.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Divider orientation="left">贡献人</Divider>
      <Contributors contributors={detail.contributors} />

      <AchievementConversionSection
        achievementId={detail.id}
        apiClient={apiClient}
        authUser={authUser}
        demoUserId={demoUserId}
        detail={detail}
        readonly={isReadonly}
      />

      <AttachmentMetadataSection
        achievementId={detail.id}
        apiClient={apiClient}
        authUser={authUser}
        demoUserId={demoUserId}
        detail={detail}
        readonly={isReadonly}
      />

      <Alert
        showIcon
        type="info"
        message={readonlyLabels.boundaryMessage}
        description={
          isReadonly
            ? readonlyLabels.boundaryDescription
            : "workflow 审批处理、费用 CRUD、搜索中心、统计看板和审计日志均不在 Step 12D 范围内。附件上传下载为当前本地 UI 接入范围。"
        }
      />
    </Space>
  );
}

const getReadonlyAchievementContextLabels = (context: ReadonlyAchievementDetailContext) =>
  context === "search"
    ? {
        sourceName: "检索中心",
        shortObjectName: "成果",
        notFoundDetail: "请确认检索结果返回的成果 ID 仍指向可读取的科研成果。",
        badRequestDetail: "请检查检索结果中的成果 ID 是否完整。",
      }
    : {
        sourceName: "审批上下文",
        shortObjectName: "关联成果",
        notFoundDetail: "请确认审批任务返回的 targetId 仍指向可读取的科研成果。",
        badRequestDetail: "请检查审批任务中的成果 ID 是否完整。",
      };

const getDetailContentReadonlyLabels = (mode: DetailContentMode) => {
  if (mode === "search-readonly") {
    return {
      permissionDescription:
        "检索中心只读查看成果详情；权限、脱敏和返回字段均以后端详情接口为准。",
      noticeMessage: "检索中心只读",
      noticeDescription:
        "本视图不提供成果提交、作废或归档动作；检索结果只负责打开当前用户可读取的成果详情。",
      boundaryMessage: "Step 16C 边界",
      boundaryDescription:
        "本视图只补齐检索中心成果结果的只读详情联动，不实现费用详情联动、搜索日志、外部搜索引擎、附件、统计看板或审计日志。",
    };
  }

  if (mode === "approval-readonly") {
    return {
      permissionDescription:
        "审批上下文只读查看关联成果；权限、脱敏和返回字段均以后端详情接口为准。",
      noticeMessage: "审批上下文只读",
      noticeDescription:
        "本视图不提供成果提交、作废或归档动作；审批处理仍在审批待办详情中完成。",
      boundaryMessage: "Step 14B 边界",
      boundaryDescription:
        "本视图只补齐审批任务联动成果详情的只读基础，不实现审批历史、审计日志、附件、费用、搜索或看板。",
    };
  }

  return {
    permissionDescription: "",
    noticeMessage: "",
    noticeDescription: "",
    boundaryMessage: "后续模块边界",
    boundaryDescription: "",
  };
};

type ConversionFormState = {
  conversionType: AchievementConversionTypeCode;
  counterpartyName: string;
  contractAmount: string;
  revenueAmount: string;
  status: AchievementConversionStatusCode;
  conversionDate: string;
  benefitDistributionSummary: string;
  remarks: string;
};

const emptyConversionForm = (): ConversionFormState => ({
  conversionType: "LICENSE",
  counterpartyName: "",
  contractAmount: "",
  revenueAmount: "",
  status: "LEAD_INTENT",
  conversionDate: "",
  benefitDistributionSummary: "",
  remarks: "",
});

function AchievementConversionSection({
  achievementId,
  apiClient,
  authUser,
  demoUserId,
  detail,
  readonly,
}: {
  achievementId: string;
  apiClient: ApiClient;
  authUser?: AchievementPermissionContext;
  demoUserId: string | null;
  detail: AchievementDetailType;
  readonly: boolean;
}) {
  const [conversions, setConversions] =
    useState<Loadable<AchievementConversionRecord[]>>(emptyLoadable);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConversionFormState>(emptyConversionForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const canLoad = shouldLoadAchievementConversions(demoUserId, achievementId);
  const canManage =
    canLoad &&
    !readonly &&
    detail.status === "ARCHIVED" &&
    hasAchievementPermission(authUser, "achievement:read_department");

  const loadConversions = useCallback(async () => {
    if (!canLoad) {
      setConversions(emptyLoadable);
      return;
    }

    setConversions({ loading: true, data: null, error: null });

    try {
      const data = await fetchAchievementConversions(apiClient, achievementId);
      setConversions({ loading: false, data, error: null });
    } catch (error) {
      setConversions({
        loading: false,
        data: null,
        error: mapConversionErrorToDisplay(normalizeError(error)),
      });
    }
  }, [achievementId, apiClient, canLoad]);

  useEffect(() => {
    void loadConversions();
  }, [loadConversions]);

  useEffect(() => {
    setEditingId(null);
    setForm(emptyConversionForm());
    setSaveError(null);
  }, [achievementId]);

  const items = conversions.data ?? [];

  const submitConversion = async () => {
    const input = buildConversionInput(form);
    if (!input) {
      setSaveError({
        kind: "bad-request",
        message: "Counterparty, type, status, and valid non-negative amounts are required.",
      });
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (editingId) {
        await updateAchievementConversion(apiClient, achievementId, editingId, input);
        void message.success("Conversion record updated");
      } else {
        await createAchievementConversion(apiClient, achievementId, input);
        void message.success("Conversion record created");
      }

      setEditingId(null);
      setForm(emptyConversionForm());
      await loadConversions();
    } catch (error) {
      setSaveError(mapConversionErrorToDisplay(normalizeError(error)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Divider orientation="left">Achievement conversion ledger</Divider>
      <Space direction="vertical" size={12} className="full-width">
        <Alert
          showIcon
          type="info"
          message="Internal structured ledger only"
          description="This MVP records conversion status, counterparty, amounts, and benefit-distribution summary inside this system. It is not a contract signing, finance, legal, payment, invoice, or external platform integration."
        />

        <DataState
          loading={conversions.loading}
          error={conversions.error}
          empty={!conversions.loading && !conversions.error && items.length === 0}
          emptyText="No conversion records"
          onRetry={() => void loadConversions()}
        >
          <div className="conversion-ledger-list">
            {items.map((item) => (
              <div className="conversion-ledger-card" key={item.id}>
                <Space direction="vertical" size={8} className="full-width">
                  <Space size={8} wrap>
                    <Tag color={getConversionStatusTagColor(item.status)}>
                      {conversionStatusLabels[item.status] ?? item.status}
                    </Tag>
                    <Tag>{conversionTypeLabels[item.conversionType] ?? item.conversionType}</Tag>
                    <Typography.Text strong>{item.counterpartyName}</Typography.Text>
                  </Space>
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Related achievement">
                      {item.achievementId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Date">
                      {formatDate(item.conversionDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Contract total">
                      {formatMoney(item.contractAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Revenue total">
                      {formatMoney(item.revenueAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Benefit summary" span={2}>
                      {formatValue(item.benefitDistributionSummary)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Remarks" span={2}>
                      {formatValue(item.remarks)}
                    </Descriptions.Item>
                  </Descriptions>
                  {canManage ? (
                    <Button size="small" onClick={() => {
                      setEditingId(item.id);
                      setForm(toConversionForm(item));
                      setSaveError(null);
                    }}>
                      Edit record
                    </Button>
                  ) : null}
                </Space>
              </div>
            ))}
          </div>
        </DataState>

        {canManage ? (
          <div className="conversion-ledger-form">
            <Space direction="vertical" size={10} className="full-width">
              <Space size={8} wrap>
                <Typography.Text strong>
                  {editingId ? "Edit conversion record" : "Create conversion record"}
                </Typography.Text>
                {editingId ? (
                  <Button size="small" onClick={() => {
                    setEditingId(null);
                    setForm(emptyConversionForm());
                    setSaveError(null);
                  }}>
                    New record
                  </Button>
                ) : null}
              </Space>
              <Space size={8} wrap>
                <Select
                  className="conversion-ledger-select"
                  options={Object.entries(conversionTypeLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={form.conversionType}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      conversionType: value as AchievementConversionTypeCode,
                    }))
                  }
                />
                <Select
                  className="conversion-ledger-select"
                  options={Object.entries(conversionStatusLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={form.status}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      status: value as AchievementConversionStatusCode,
                    }))
                  }
                />
                <Input
                  className="conversion-ledger-wide-input"
                  placeholder="Counterparty name"
                  value={form.counterpartyName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      counterpartyName: event.target.value,
                    }))
                  }
                />
              </Space>
              <Space size={8} wrap>
                <Input
                  className="conversion-ledger-input"
                  placeholder="Contract amount"
                  value={form.contractAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contractAmount: event.target.value,
                    }))
                  }
                />
                <Input
                  className="conversion-ledger-input"
                  placeholder="Revenue amount"
                  value={form.revenueAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      revenueAmount: event.target.value,
                    }))
                  }
                />
                <Input
                  className="conversion-ledger-input"
                  placeholder="YYYY-MM-DD"
                  value={form.conversionDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      conversionDate: event.target.value,
                    }))
                  }
                />
              </Space>
              <Input.TextArea
                maxLength={1000}
                placeholder="Benefit distribution summary"
                rows={2}
                showCount
                value={form.benefitDistributionSummary}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    benefitDistributionSummary: event.target.value,
                  }))
                }
              />
              <Input.TextArea
                maxLength={1000}
                placeholder="Remarks"
                rows={2}
                showCount
                value={form.remarks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
              />
              {saveError ? (
                <Alert
                  showIcon
                  type="error"
                  message={saveError.message}
                  description={saveError.detail}
                />
              ) : null}
              <Button type="primary" loading={saving} onClick={() => void submitConversion()}>
                {editingId ? "Update conversion" : "Create conversion"}
              </Button>
            </Space>
          </div>
        ) : (
          <Alert
            showIcon
            type="info"
            message="Conversion ledger is read-only for this context"
            description="Creating or updating conversion records requires a demo user with department achievement read permission and an archived achievement."
          />
        )}
      </Space>
    </>
  );
}

const buildConversionInput = (
  form: ConversionFormState,
): CreateAchievementConversionInput | null => {
  const counterpartyName = form.counterpartyName.trim();
  const contractAmount = parseOptionalAmount(form.contractAmount);
  const revenueAmount = parseOptionalAmount(form.revenueAmount);

  if (!counterpartyName || contractAmount === undefined || revenueAmount === undefined) {
    return null;
  }

  return {
    conversionType: form.conversionType,
    counterpartyName,
    contractAmount,
    revenueAmount,
    status: form.status,
    conversionDate: form.conversionDate.trim() || null,
    benefitDistributionSummary: form.benefitDistributionSummary.trim() || null,
    remarks: form.remarks.trim() || null,
  };
};

const parseOptionalAmount = (value: string): number | null | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const toConversionForm = (
  conversion: AchievementConversionRecord,
): ConversionFormState => ({
  conversionType: conversion.conversionType,
  counterpartyName: conversion.counterpartyName,
  contractAmount: conversion.contractAmount ?? "",
  revenueAmount: conversion.revenueAmount ?? "",
  status: conversion.status,
  conversionDate: conversion.conversionDate?.slice(0, 10) ?? "",
  benefitDistributionSummary: conversion.benefitDistributionSummary ?? "",
  remarks: conversion.remarks ?? "",
});

const mapConversionErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "forbidden" || error.status === 403) {
    return {
      ...error,
      message: "Current role cannot access the conversion ledger",
      detail: error.detail ?? "The backend enforces department-scoped achievement permissions.",
    };
  }

  if (error.status === 409) {
    return {
      ...error,
      message: "Conversion record is not allowed for this achievement state",
      detail: error.detail ?? "The MVP only allows creation from archived achievements.",
    };
  }

  return error;
};

const getConversionStatusTagColor = (status: AchievementConversionStatusCode): string => {
  if (status === "COMPLETED" || status === "PAID") {
    return "green";
  }

  if (status === "CANCELLED") {
    return "default";
  }

  if (status === "SIGNED") {
    return "blue";
  }

  return "gold";
};

const formatMoney = (value: string | null | undefined): string =>
  value ? new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(Number(value)) : "Not returned";

function AttachmentMetadataSection({
  achievementId,
  apiClient,
  authUser,
  demoUserId,
  detail,
  readonly,
}: {
  achievementId: string;
  apiClient: ApiClient;
  authUser?: AchievementPermissionContext;
  demoUserId: string | null;
  detail: AchievementDetailType;
  readonly: boolean;
}) {
  const [attachments, setAttachments] =
    useState<Loadable<AttachmentMetadata[]>>(emptyLoadable);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [secretLevel, setSecretLevel] = useState<SecretLevelCode | undefined>(detail.secretLevel);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<ApiError | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<ApiError | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const canLoadAttachments = shouldLoadAttachmentMetadata(demoUserId, achievementId);
  const canUpload = canLoadAttachments && !readonly && canUploadAchievementAttachment(authUser, detail);

  const loadAttachments = useCallback(async () => {
    if (!canLoadAttachments) {
      setAttachments(emptyLoadable);
      return;
    }

    setAttachments({ loading: true, data: null, error: null });

    try {
      const data = await fetchAchievementAttachmentMetadata(apiClient, achievementId);
      setAttachments({ loading: false, data, error: null });
    } catch (error) {
      setAttachments({
        loading: false,
        data: null,
        error: mapAttachmentMetadataErrorToDisplay(normalizeError(error)),
      });
    }
  }, [achievementId, apiClient, canLoadAttachments]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  useEffect(() => {
    setSelectedAttachmentId(null);
    setSelectedFile(null);
    setDisplayName("");
    setSecretLevel(detail.secretLevel);
    setUploadError(null);
    setUploadSuccess(null);
    setDownloadError(null);
  }, [achievementId]);

  const items = attachments.data ?? [];

  const onUpload = async () => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedFile) {
      setUploadError({
        kind: "bad-request",
        message: "请选择要上传的附件文件",
      });
      return;
    }

    const validation = validateAttachmentUploadFile(selectedFile);
    if (!validation.ok) {
      setUploadError({
        kind: "bad-request",
        message: validation.message,
      });
      return;
    }

    setUploading(true);

    try {
      const uploaded = await uploadAchievementAttachment(apiClient, achievementId, {
        file: selectedFile,
        displayName,
        secretLevel,
      });
      setSelectedFile(null);
      setDisplayName("");
      setSecretLevel(detail.secretLevel);
      setUploadSuccess(`附件 ${uploaded.fileName || selectedFile.name} 上传成功`);
      await loadAttachments();
    } catch (error) {
      setUploadError(mapAttachmentUploadErrorToDisplay(normalizeError(error)));
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (attachment: AttachmentMetadata) => {
    setDownloadError(null);
    setDownloadingAttachmentId(attachment.id);

    try {
      const blob = await downloadAchievementAttachment(apiClient, achievementId, attachment.id);
      saveAttachmentBlob(blob, getAttachmentDownloadFileName(attachment));
      void message.success("附件下载已开始");
    } catch (error) {
      setDownloadError(mapAttachmentDownloadErrorToDisplay(normalizeError(error)));
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  return (
    <>
      <Divider orientation="left">附件</Divider>
      <Space direction="vertical" size={12} className="full-width">
        {canUpload ? (
          <AttachmentUploadPanel
            displayName={displayName}
            file={selectedFile}
            secretLevel={secretLevel}
            uploading={uploading}
            uploadError={uploadError}
            uploadSuccess={uploadSuccess}
            onDisplayNameChange={setDisplayName}
            onFileChange={setSelectedFile}
            onSecretLevelChange={setSecretLevel}
            onUpload={() => void onUpload()}
          />
        ) : (
          <Alert
            showIcon
            type="info"
            message={readonly ? "只读附件视图" : "附件上传入口未开放"}
            description={
              readonly
                ? "当前成果详情来自只读上下文，只展示后端允许读取的附件 metadata 与下载结果。"
                : "当前用户缺少 achievement:update_own，或不是该成果负责人；前端不会显示上传入口。"
            }
          />
        )}
        {!canLoadAttachments ? (
          <Alert
            showIcon
            type="warning"
            message="等待演示用户"
            description="未选择 X-Demo-User-Id 时不读取附件 metadata，也不会发起任何附件业务请求。"
          />
        ) : (
          <DataState
            loading={attachments.loading}
            error={attachments.error}
            empty={!attachments.loading && !attachments.error && items.length === 0}
            emptyText="未返回附件 metadata"
            onRetry={() => void loadAttachments()}
          >
            <AttachmentMetadataList
              attachments={items}
              downloadingAttachmentId={downloadingAttachmentId}
              selectedAttachmentId={selectedAttachmentId}
              onDownload={(attachment) => void onDownload(attachment)}
              onSelectAttachment={setSelectedAttachmentId}
            />
          </DataState>
        )}
        {downloadError ? (
          <Alert
            showIcon
            type="error"
            message={downloadError.message}
            description={downloadError.detail}
          />
        ) : null}
        {selectedAttachmentId ? (
          <AttachmentDetailMetadataPanel
            achievementId={achievementId}
            apiClient={apiClient}
            attachmentId={selectedAttachmentId}
            demoUserId={demoUserId}
            onClose={() => setSelectedAttachmentId(null)}
          />
        ) : null}
      </Space>
    </>
  );
}

function AttachmentUploadPanel({
  displayName,
  file,
  onDisplayNameChange,
  onFileChange,
  onSecretLevelChange,
  onUpload,
  secretLevel,
  uploadError,
  uploading,
  uploadSuccess,
}: {
  displayName: string;
  file: File | null;
  onDisplayNameChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSecretLevelChange: (value: SecretLevelCode | undefined) => void;
  onUpload: () => void;
  secretLevel?: SecretLevelCode;
  uploadError: ApiError | null;
  uploading: boolean;
  uploadSuccess: string | null;
}) {
  const fileValidation = file ? validateAttachmentUploadFile(file) : null;

  return (
    <div className="attachment-upload-panel">
      <Space direction="vertical" size={10} className="full-width">
        <Space size={10} wrap className="attachment-upload-controls">
          <input
            key={file ? `${file.name}:${file.size}:${file.lastModified}` : "empty"}
            aria-label="选择附件文件"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
          <Input
            className="attachment-display-name-input"
            placeholder="显示文件名，可留空"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
          />
          <Select
            allowClear
            className="attachment-secret-select"
            placeholder="附件密级"
            value={secretLevel}
            options={[
              { label: "公开", value: "PUBLIC" },
              { label: "内部", value: "INTERNAL" },
              { label: "秘密", value: "SECRET" },
              { label: "机密", value: "CONFIDENTIAL" },
            ]}
            onChange={(value) => onSecretLevelChange(value)}
          />
          <Button
            type="primary"
            loading={uploading}
            disabled={!file || fileValidation?.ok === false}
            onClick={onUpload}
          >
            上传附件
          </Button>
        </Space>
        <Typography.Text type="secondary">
          支持 PDF、PNG、JPG、DOC、DOCX、XLS、XLSX；单个文件不超过 10 MB。前端预检仅用于体验，后端校验仍是准入标准。
        </Typography.Text>
        {file ? (
          <Typography.Text type={fileValidation?.ok ? "secondary" : "danger"}>
            已选择：{file.name}（{formatAttachmentSize(file.size)}）
            {fileValidation?.ok ? "" : `；${fileValidation?.message}`}
          </Typography.Text>
        ) : null}
        {uploadSuccess ? <Alert showIcon type="success" message={uploadSuccess} /> : null}
        {uploadError ? (
          <Alert
            showIcon
            type="error"
            message={uploadError.message}
            description={uploadError.detail}
          />
        ) : null}
      </Space>
    </div>
  );
}

function AttachmentMetadataList({
  attachments,
  downloadingAttachmentId,
  onDownload,
  onSelectAttachment,
  selectedAttachmentId,
}: {
  attachments: AttachmentMetadata[];
  downloadingAttachmentId: string | null;
  onDownload: (attachment: AttachmentMetadata) => void;
  onSelectAttachment: (attachmentId: string) => void;
  selectedAttachmentId: string | null;
}) {
  return (
    <div className="attachment-metadata-list">
      {attachments.map((attachment) => {
        const model = buildAttachmentMetadataViewModel(attachment);

        return (
          <div className="attachment-metadata-card" key={attachment.id}>
            <div className="attachment-metadata-main">
              <Space size={8} wrap>
                <Typography.Text strong>{model.fileName}</Typography.Text>
                <Tag>v{model.version}</Tag>
                <Tag color={getAttachmentStatusTagColor(attachment.status)}>
                  {model.statusLabel}
                </Tag>
                <Tag color={attachment.secretLevel === "PUBLIC" ? "default" : "orange"}>
                  {model.secretLevelLabel}
                </Tag>
              </Space>
              <Typography.Text type="secondary" className="attachment-metadata-id">
                附件 ID：{model.id}
              </Typography.Text>
              <Space size={8} wrap>
                <Button
                  size="small"
                  type={selectedAttachmentId === attachment.id ? "primary" : "default"}
                  onClick={() => onSelectAttachment(attachment.id)}
                >
                  查看 metadata 详情
                </Button>
                <Button
                  size="small"
                  loading={downloadingAttachmentId === attachment.id}
                  onClick={() => onDownload(attachment)}
                >
                  下载
                </Button>
              </Space>
            </div>
            <div className="attachment-metadata-grid">
              <MetadataLine label="原始名" value={model.originalName} />
              <MetadataLine label="类型" value={model.mimeType} />
              <MetadataLine label="大小" value={model.sizeLabel} />
              <MetadataLine label="上传者" value={model.uploaderId} />
              <MetadataLine label="关联对象" value={model.relationId} />
              <MetadataLine label="创建时间" value={model.createdAt} />
              <MetadataLine label="更新时间" value={model.updatedAt} />
              <MetadataLine label="归档时间" value={model.archivedAt} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AttachmentDetailMetadataPanel({
  achievementId,
  apiClient,
  attachmentId,
  demoUserId,
  onClose,
}: {
  achievementId: string;
  apiClient: ApiClient;
  attachmentId: string;
  demoUserId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] =
    useState<Loadable<AttachmentDetailMetadata>>(emptyLoadable);
  const canLoadDetail = shouldLoadAttachmentDetailMetadata(
    demoUserId,
    achievementId,
    attachmentId,
  );

  const loadDetail = useCallback(async () => {
    if (!canLoadDetail) {
      setDetail(emptyLoadable);
      return;
    }

    setDetail({ loading: true, data: null, error: null });

    try {
      const data = await fetchAchievementAttachmentDetailMetadata(
        apiClient,
        achievementId,
        attachmentId,
      );
      setDetail({ loading: false, data, error: null });
    } catch (error) {
      setDetail({
        loading: false,
        data: null,
        error: mapAttachmentDetailMetadataErrorToDisplay(normalizeError(error)),
      });
    }
  }, [achievementId, apiClient, attachmentId, canLoadDetail]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const boundary = getAttachmentDetailMetadataReadonlyBoundary();
  const model = detail.data ? buildAttachmentDetailMetadataViewModel(detail.data) : null;

  return (
    <div className="attachment-detail-metadata-panel">
      <Space direction="vertical" size={12} className="full-width">
        <div className="attachment-detail-metadata-heading">
          <Space direction="vertical" size={2}>
            <Typography.Text strong>{boundary.title}</Typography.Text>
            <Typography.Text type="secondary">{boundary.allowedRequest}</Typography.Text>
          </Space>
          <Button size="small" onClick={onClose}>
            关闭详情
          </Button>
        </div>
        <Alert showIcon type="info" message="只读详情边界" description={boundary.description} />
        {!canLoadDetail ? (
          <Alert
            showIcon
            type="warning"
            message="等待演示用户"
            description="未选择 X-Demo-User-Id 或附件 ID 缺失时不读取附件 detail metadata。"
          />
        ) : (
          <DataState
            loading={detail.loading}
            error={detail.error}
            empty={!detail.loading && !detail.error && !detail.data}
            emptyText="未返回附件 detail metadata"
            onRetry={() => void loadDetail()}
          >
            {model ? <AttachmentDetailMetadataContent model={model} /> : null}
          </DataState>
        )}
      </Space>
    </div>
  );
}

function AttachmentDetailMetadataContent({
  model,
}: {
  model: ReturnType<typeof buildAttachmentDetailMetadataViewModel>;
}) {
  return (
    <div className="attachment-detail-metadata-grid">
      <MetadataLine label="附件 ID" value={model.id} />
      <MetadataLine label="文件名" value={model.fileName} />
      <MetadataLine label="关联类型" value={model.relationType} />
      <MetadataLine label="关联对象" value={model.relationId} />
      <MetadataLine label="版本" value={`v${model.version}`} />
      <MetadataLine label="上传者" value={model.uploaderId} />
      <MetadataLine label="密级" value={model.secretLevelLabel} />
      <MetadataLine label="状态" value={model.statusLabel} />
      <MetadataLine label="创建时间" value={model.createdAt} />
      <MetadataLine label="更新时间" value={model.updatedAt} />
      <MetadataLine label="归档时间" value={model.archivedAt} />
    </div>
  );
}

function MetadataLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="attachment-metadata-line">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text>{formatValue(value)}</Typography.Text>
    </div>
  );
}

function Contributors({ contributors }: { contributors: AchievementContributor[] }) {
  const sorted = [...contributors].sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
  );

  if (sorted.length === 0) {
    return <Empty description="未返回贡献人" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <List
      dataSource={sorted}
      renderItem={(contributor) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space wrap>
                <Typography.Text strong>{contributor.name || "未命名贡献人"}</Typography.Text>
                <Tag>{labelFromMap(contributorTypeLabels, contributor.contributorType)}</Tag>
                {contributor.contributorRole ? (
                  <Tag color="blue">
                    {labelFromMap(contributorRoleLabels, contributor.contributorRole)}
                  </Tag>
                ) : null}
              </Space>
            }
            description={
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary">
                  排序：{formatValue(contributor.sortOrder)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  单位：{formatValue(contributor.organization)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  用户 ID：{formatValue(contributor.userId)}
                </Typography.Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}

export const getAvailableAchievementActions = (
  status: AchievementStatusCode,
): AchievementAction[] => {
  if (status === "DRAFT") {
    return ["submit", "void"];
  }

  if (status === "PENDING_ARCHIVE") {
    return ["archive"];
  }

  return [];
};

export const getActionConfirmConfig = (action: AchievementAction) => {
  const configs: Record<
    AchievementAction,
    {
      buttonLabel: string;
      description: string;
      okText: string;
      successMessage: string;
      title: string;
    }
  > = {
    submit: {
      buttonLabel: "提交审批",
      description: "提交后将进入院系审核流程；最终是否成功以后端权限、状态和审批人配置为准。",
      okText: "提交",
      successMessage: "提交审批",
      title: "确认提交审批",
    },
    void: {
      buttonLabel: "作废",
      description: "作废仅支持当前后端契约允许的草稿状态，请填写作废原因。",
      okText: "作废",
      successMessage: "作废",
      title: "确认作废成果",
    },
    archive: {
      buttonLabel: "归档",
      description: "归档仅支持待归档状态；最终是否成功以后端权限和 workflow 状态为准。",
      okText: "归档",
      successMessage: "归档",
      title: "确认归档成果",
    },
  };

  return configs[action];
};

export const buildVoidActionPayload = (reason: string):
  | {
      reason: string;
    }
  | undefined => {
  const trimmed = reason.trim();
  return trimmed ? { reason: trimmed } : undefined;
};

export const getDetailDisplayTitle = (
  item: Pick<AchievementListItem, "title" | "isRedacted"> | null | undefined,
): string => {
  if (item?.title) {
    return item.title;
  }

  if (item?.isRedacted) {
    return "已脱敏成果";
  }

  return "成果详情";
};

export const getTypeDetailFields = (
  detail: Pick<
    AchievementDetailType,
    "paperDetail" | "patentDetail" | "softwareCopyrightDetail" | "type"
  >,
): DetailDisplayField[] => {
  if (detail.type === "PAPER") {
    const paper = detail.paperDetail;
    return [
      { label: "DOI", value: formatValue(paper?.doi) },
      { label: "期刊", value: formatValue(paper?.journal) },
      { label: "ISSN/CN", value: formatValue(paper?.issnCn) },
      { label: "发表年份", value: formatValue(paper?.publishYear) },
      { label: "收录类型", value: formatValue(paper?.includedType) },
      { label: "影响因子", value: formatValue(paper?.impactFactor) },
      { label: "分区", value: formatValue(paper?.partition) },
      { label: "摘要", value: formatValue(paper?.abstract) },
    ];
  }

  if (detail.type === "PATENT") {
    const patent = detail.patentDetail;
    return [
      { label: "申请号", value: formatValue(patent?.applicationNo) },
      { label: "授权号", value: formatValue(patent?.grantNo) },
      {
        label: "专利类型",
        value: patent?.patentType
          ? labelFromMap(patentTypeLabels, patent.patentType)
          : "未返回",
      },
      { label: "申请日", value: formatDate(patent?.filingDate) },
      { label: "授权日", value: formatDate(patent?.grantDate) },
      { label: "下一缴费日", value: formatDate(patent?.nextFeeDate) },
      { label: "费用金额", value: formatValue(patent?.feeAmount) },
      {
        label: "法律状态",
        value: patent?.legalStatus
          ? labelFromMap(patentLegalStatusLabels, patent.legalStatus)
          : "未返回",
      },
    ];
  }

  const software = detail.softwareCopyrightDetail;
  return [
    { label: "登记号", value: formatValue(software?.registrationNo) },
    { label: "软件版本", value: formatValue(software?.softwareVersion) },
    {
      label: "软件类型",
      value: software?.softwareType
        ? labelFromMap(softwareTypeLabels, software.softwareType)
        : "未返回",
    },
    { label: "发布日期", value: formatDate(software?.publishDate) },
    { label: "登记日期", value: formatDate(software?.registerDate) },
    { label: "运行环境", value: formatValue(software?.runEnv) },
  ];
};

const getBaseFields = (detail: AchievementDetailType): DetailDisplayField[] => [
  { label: "成果 ID", value: formatValue(detail.id) },
  { label: "标题", value: getDetailDisplayTitle(detail) },
  { label: "类型", value: labelFromMap(typeLabels, detail.type) },
  { label: "状态", value: <Tag>{labelFromMap(statusLabels, detail.status)}</Tag> },
  {
    label: "密级",
    value: (
      <Tag color={detail.isRestricted ? "orange" : "default"}>
        {labelFromMap(secretLevelLabels, detail.secretLevel)}
      </Tag>
    ),
  },
  { label: "所属部门", value: formatValue(detail.departmentId) },
  { label: "负责人", value: formatValue(detail.ownerUserId) },
  { label: "创建人", value: formatValue(detail.createdById) },
  { label: "更新人", value: formatValue(detail.updatedById) },
  { label: "提交人", value: formatValue(detail.submittedById) },
  { label: "归档人", value: formatValue(detail.archivedById) },
  { label: "作废人", value: formatValue(detail.voidedById) },
  { label: "创建时间", value: formatDateTime(detail.createdAt) },
  { label: "更新时间", value: formatDateTime(detail.updatedAt) },
  { label: "提交时间", value: formatDateTime(detail.submittedAt) },
  { label: "归档时间", value: formatDateTime(detail.archivedAt) },
  { label: "作废时间", value: formatDateTime(detail.voidedAt) },
  { label: "版本", value: formatValue(detail.version) },
];

const getStatusBoundaryNotice = (status: AchievementStatusCode): React.ReactNode => {
  if (status === "DEPARTMENT_REJECTED") {
    return (
      <Alert
        showIcon
        type="info"
        message="当前状态只读"
        description="当前后端契约不支持院系驳回状态的编辑、提交、作废或归档动作。"
      />
    );
  }

  if (status === "PENDING_DEPARTMENT_REVIEW") {
    return (
      <Alert
        showIcon
        type="info"
        message="等待院系审核"
        description="Step 12D 不实现审批通过或驳回；审批动作留到后续 Step 单独确认。"
      />
    );
  }

  if (status === "ARCHIVED" || status === "VOIDED") {
    return (
      <Alert showIcon type="info" message="只读状态" description="该成果当前只读。" />
    );
  }

  return null;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "未返回";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(date);
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "未返回";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatValue = (value: React.ReactNode): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return "未返回";
  }

  return value;
};

const getSecretLevelLabel = (value: string): string =>
  secretLevelLabels[value as SecretLevelCode] ?? value;

const getAttachmentStatusLabel = (value: string): string =>
  attachmentStatusLabels[value as AttachmentStatusCode] ?? value;

const hasAchievementPermission = (
  authUser: AchievementPermissionContext,
  permissionCode: string,
): boolean => !authUser || authUser.permissionCodes.includes(permissionCode);

const getAttachmentStatusTagColor = (value: string): string => {
  if (value === "ACTIVE") {
    return "green";
  }

  if (value === "BLOCKED") {
    return "red";
  }

  if (value === "ARCHIVED") {
    return "default";
  }

  return "blue";
};

const labelFromMap = <T extends string>(labels: Record<T, string>, value: T): string =>
  labels[value] ?? value;

const getFileExtension = (fileName: string): string => {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
};

export const getAttachmentDownloadFileName = (attachment: AttachmentMetadata): string =>
  toSafeDownloadFileName(attachment.originalName || attachment.fileName || "attachment");

const toSafeDownloadFileName = (fileName: string): string => {
  const baseName = fileName.split(/[\\/]/).filter(Boolean).at(-1) ?? "attachment";
  const safe = baseName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return safe || "attachment";
};

export const saveAttachmentBlob = (blob: Blob, fileName: string): void => {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "请求失败",
    detail: error instanceof Error ? error.message : undefined,
  };
};
