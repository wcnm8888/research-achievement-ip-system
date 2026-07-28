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
import {
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  InboxOutlined,
  PaperClipOutlined,
  TeamOutlined,
  SwapOutlined,
  BarChartOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AttachmentPreviewModal } from "./AttachmentPreviewModal";
import { isApiError, type ApiClient, type ApiError, type AuthUser } from "./api-client";
import {
  createAttachmentPreviewObjectUrl,
  downloadAttachmentPreviewBlob,
  isPreviewableAttachment,
  revokeAttachmentPreviewObjectUrl,
} from "./attachment-preview";
import { DataState, PermissionHint } from "./components/StateBlocks";
import { sanitizeBusinessTitle } from "./display-text";
import type {
  AchievementContributor,
  AchievementConversionBenefitCategoryCode,
  AchievementConversionBenefitDistributionItem,
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRecord,
  AchievementConversionRevenueStatusCode,
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

type AttachmentPreviewState = {
  attachmentId: string | null;
  error: ApiError | null;
  fileName: string;
  loading: boolean;
  mimeType: string | null;
  open: boolean;
  previewUrl: string | null;
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

const emptyAttachmentPreviewState = (): AttachmentPreviewState => ({
  attachmentId: null,
  error: null,
  fileName: "",
  loading: false,
  mimeType: null,
  open: false,
  previewUrl: null,
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
  LICENSE: "许可使用",
  TRANSFER: "权利转让",
  COOPERATION: "合作转化",
  INDUSTRIALIZATION: "产业化",
  OTHER: "其他",
};

const conversionStatusLabels: Record<AchievementConversionStatusCode, string> = {
  LEAD_INTENT: "意向跟进",
  CONTRACTING: "合同洽谈",
  SIGNED: "已签约",
  PAID: "已到账",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const conversionContractStatusLabels: Record<AchievementConversionContractStatusCode, string> = {
  DRAFT: "草拟中",
  SIGNED: "已签署",
  ACTIVE: "履行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const conversionRevenueStatusLabels: Record<AchievementConversionRevenueStatusCode, string> = {
  UNPAID: "未到账",
  PARTIAL: "部分到账",
  PAID: "已到账",
  OVERDUE: "逾期未到账",
  WAIVED: "已免收",
};

const conversionEvaluationEffectLabels: Record<AchievementConversionEvaluationEffectCode, string> = {
  NOT_EVALUATED: "未评估",
  POSITIVE: "效果良好",
  NEUTRAL: "效果一般",
  NEGATIVE: "效果不佳",
  MIXED: "结果混合",
};

const conversionBenefitCategoryLabels: Record<AchievementConversionBenefitCategoryCode, string> = {
  UNIT: "单位",
  TEAM: "团队",
  PERSON: "个人",
  PLATFORM: "平台",
  OTHER: "其他",
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

export const previewAchievementAttachment = (
  client: ApiClient,
  achievementId: string,
  attachmentId: string,
): Promise<Blob> =>
  downloadAttachmentPreviewBlob(
    client,
    `/achievements/${achievementId}/attachments/${attachmentId}/preview`,
  );

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
        destroyOnHidden
        extra={
          detail ? (
            <Space wrap>
              {actions.map((action) => {
                const config = getActionConfirmConfig(action);
                return (
                  <Button
                    danger={action === "void"}
                    icon={getAchievementActionIcon(action)}
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
              <Button icon={<CloseOutlined />} onClick={onClose}>
                关闭
              </Button>
            </Space>
          ) : (
            <Button icon={<CloseOutlined />} onClick={onClose}>
              关闭
            </Button>
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
      destroyOnHidden
      extra={
        <Button icon={<CloseOutlined />} onClick={onClose}>
          关闭
        </Button>
      }
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
  title: "附件管理",
  description:
    "本区域展示附件基础信息，可在权限允许时上传和下载；不展示内部存储标识、校验值、真实路径或文件内容。",
  allowedRequest: "附件列表",
});

export const getAttachmentDetailMetadataReadonlyBoundary = () => ({
  title: "附件详情",
  description:
    "本详情展示附件基础信息；不提供删除、归档、版本变更、对象存储路径或文件内容。",
  allowedRequest: "基础信息",
});

export const mapAttachmentMetadataErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      ...error,
      message: "请选择或切换业务用户",
      detail: error.detail ?? "附件安全摘要需要有效用户上下文后才能读取。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "当前角色无附件安全摘要读取权限",
      detail: error.detail ?? "当前账号没有查看该附件信息的权限。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "成果附件安全摘要不存在或不可用",
      detail: error.detail ?? "请确认成果仍在当前用户可读取范围内。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "附件安全摘要服务暂不可用",
      detail: error.detail ?? "请稍后重试。",
    };
  }

  if (error.kind === "bad-request" || error.status === 400 || error.status === 422) {
    return {
      ...error,
      message: "附件安全摘要请求参数不正确",
      detail: error.detail ?? "请检查成果 ID、状态筛选和 take 参数。",
    };
  }

  return {
    ...error,
    message: error.message || "附件安全摘要读取失败",
  };
};

export const mapAttachmentDetailMetadataErrorToDisplay = (
  error: ApiError,
): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      ...error,
      message: "请选择或切换业务用户",
      detail: error.detail ?? "附件详情摘要需要有效用户上下文后才能读取。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "当前角色无附件详情摘要读取权限",
      detail:
        error.detail ?? "当前账号没有查看该附件详情的权限。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "附件详情摘要不存在或不可用",
      detail: error.detail ?? "请确认附件仍属于当前成果且在当前用户可读取范围内。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "附件详情摘要服务暂不可用",
      detail: error.detail ?? "请稍后重试。",
    };
  }

  if (error.kind === "bad-request" || error.status === 400 || error.status === 422) {
    return {
      ...error,
      message: "附件详情摘要请求参数不正确",
      detail: error.detail ?? "请检查成果 ID 与附件 ID 是否完整。",
    };
  }

  return {
    ...error,
    message: error.message || "附件详情摘要读取失败",
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
      message: "请选择或切换业务用户",
      detail: error.detail ?? "附件下载需要有效用户上下文。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "当前角色无附件下载权限",
      detail: error.detail ?? "当前账号没有下载该附件的权限。",
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

export const mapAttachmentPreviewErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      kind: error.kind,
      status: error.status,
      message: "请选择或切换业务用户",
      detail: "附件预览需要有效用户上下文。请重新选择业务用户后再试。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      kind: error.kind,
      status: error.status,
      message: "当前角色无附件预览权限",
      detail: "当前账号没有预览该附件的权限。可申请授权，或联系管理员确认附件访问范围。",
    };
  }

  if (error.status === 404) {
    return {
      kind: error.kind,
      status: error.status,
      message: "附件不存在或不可预览",
      detail: "请刷新附件列表后重试。如仍不可用，请联系管理员核对附件状态。",
    };
  }

  if (error.status === 415 || error.status === 422) {
    return {
      kind: error.kind,
      status: error.status,
      message: "附件格式暂不支持在线预览",
      detail: "当前仅支持 PDF、PNG、JPG 在线预览，可下载后使用本地软件查看。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      kind: error.kind,
      status: error.status,
      message: "附件预览服务暂不可用",
      detail: "请稍后重试，或尝试下载已授权附件。",
    };
  }

  return {
    kind: error.kind,
    status: error.status,
    message: "附件预览失败",
    detail: "当前无法在线打开该附件，请稍后重试，或尝试下载已授权附件。",
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
      message: "请选择或切换业务用户",
      detail: `${labels.sourceName}需要有效用户后才能读取成果详情。`,
    };
  }

  if (error.status === 403) {
    return {
      kind: error.kind,
      status: error.status,
      message: `当前账号无权查看${labels.shortObjectName}`,
      detail: "当前账号没有查看该成果详情的权限。",
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
      detail: "请稍后重试。",
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
    detail: "请稍后重试，或联系管理员查看服务状态。",
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
    <Space direction="vertical" size={18} className="full-width achievement-detail-content achievement-detail-v3">
      <PermissionHint
        description={
          isReadonly
            ? readonlyLabels.permissionDescription
            : "可用操作会随账号职责和成果状态自动调整。"
        }
      />

      <div className="achievement-detail-summary" role="status" aria-label="成果档案摘要">
        <div className="achievement-detail-summary-item">
          <Typography.Text type="secondary">成果类型</Typography.Text>
          <Typography.Text strong>{typeLabels[detail.type] ?? detail.type}</Typography.Text>
        </div>
        <div className="achievement-detail-summary-item">
          <Typography.Text type="secondary">当前状态</Typography.Text>
          <Tag color={detail.status === "ARCHIVED" ? "success" : "processing"}>
            {statusLabels[detail.status] ?? detail.status}
          </Tag>
        </div>
        <div className="achievement-detail-summary-item achievement-detail-summary-technical">
          <Typography.Text type="secondary">档案编号</Typography.Text>
          <Typography.Text className="technical-field">{detail.id}</Typography.Text>
        </div>
      </div>

      {detail.isRedacted ? (
        <Alert
          showIcon
          type="warning"
          message="内容已脱敏"
          description="当前成果存在访问限制，页面仅展示可查看字段。"
        />
      ) : null}

      {isReadonly ? (
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            {readonlyLabels.noticeMessage}
          </Typography.Text>
          <Typography.Text type="secondary">{readonlyLabels.noticeDescription}</Typography.Text>
        </div>
      ) : (
        getStatusBoundaryNotice(detail.status)
      )}

      <Divider orientation="left">
        <span className="achievement-section-label">
          <FileTextOutlined /> 基础信息
        </span>
      </Divider>
      <Descriptions className="achievement-detail-descriptions" bordered column={{ xs: 1, sm: 2 }} size="small">
        {getBaseFields(detail).map((field) => (
          <Descriptions.Item key={field.label} label={field.label}>
            {field.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Divider orientation="left">
        <span className="achievement-section-label">
          <FileTextOutlined /> 类型详情
        </span>
      </Divider>
      <Descriptions className="achievement-detail-descriptions" bordered column={{ xs: 1, sm: 2 }} size="small">
        {getTypeDetailFields(detail).map((field) => (
          <Descriptions.Item key={field.label} label={field.label}>
            {field.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <CitationImpactSection detail={detail} />

      <Divider orientation="left">
        <span className="achievement-section-label">
          <TeamOutlined /> 贡献人
        </span>
      </Divider>
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

      <div className="business-note">
        <Typography.Text strong className="business-note-title">
          {readonlyLabels.boundaryMessage}
        </Typography.Text>
        <Typography.Text type="secondary">
          {isReadonly
            ? readonlyLabels.boundaryDescription
            : "审批、费用、检索、统计和日志请进入对应功能处理。"}
        </Typography.Text>
      </div>
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
      permissionDescription: "当前为检索结果详情视图。",
      noticeMessage: "只读详情",
      noticeDescription:
        "本视图用于查看成果信息，不提供提交、作废或归档操作。",
      boundaryMessage: "详情查看",
      boundaryDescription:
        "费用、日志和统计请进入对应功能。",
    };
  }

  if (mode === "approval-readonly") {
    return {
      permissionDescription: "当前为审批关联成果视图。",
      noticeMessage: "关联成果详情",
      noticeDescription:
        "本视图用于查看关联成果信息，审批处理仍在审批待办详情中完成。",
      boundaryMessage: "关联成果",
      boundaryDescription:
        "本视图用于查看审批任务关联成果；审批处理仍在待办详情中完成。",
    };
  }

  return {
    permissionDescription: "",
    noticeMessage: "",
    noticeDescription: "",
    boundaryMessage: "相关功能",
    boundaryDescription: "",
  };
};

export type ConversionFormState = {
  conversionType: AchievementConversionTypeCode;
  counterpartyName: string;
  contractAmount: string;
  revenueAmount: string;
  status: AchievementConversionStatusCode;
  conversionDate: string;
  contractStatus: AchievementConversionContractStatusCode;
  revenueStatus: AchievementConversionRevenueStatusCode;
  revenueDueDate: string;
  revenueReceivedDate: string;
  benefitDistributionJson: ConversionBenefitAllocationFormState[];
  evaluationEffect: AchievementConversionEvaluationEffectCode;
  evaluationSummary: string;
  evaluationDate: string;
  benefitDistributionSummary: string;
  remarks: string;
};

export type ConversionBenefitAllocationFormState = {
  category: AchievementConversionBenefitCategoryCode;
  label: string;
  amount: string;
  ratio: string;
};

const conversionBenefitAllocationMaxRows = 5;

const emptyConversionForm = (): ConversionFormState => ({
  conversionType: "LICENSE",
  counterpartyName: "",
  contractAmount: "",
  revenueAmount: "",
  status: "LEAD_INTENT",
  conversionDate: "",
  contractStatus: "DRAFT",
  revenueStatus: "UNPAID",
  revenueDueDate: "",
  revenueReceivedDate: "",
  benefitDistributionJson: [],
  evaluationEffect: "NOT_EVALUATED",
  evaluationSummary: "",
  evaluationDate: "",
  benefitDistributionSummary: "",
  remarks: "",
});

const emptyBenefitAllocationRow = (): ConversionBenefitAllocationFormState => ({
  category: "TEAM",
  label: "",
  amount: "",
  ratio: "",
});

export const conversionTrackingScopeCopy = {
  local:
    "本地评审版覆盖转化台账、合同状态、收益摘要、里程碑节点和跟进记录的查看与维护。",
  phaseTwo:
    "二期生产待接入真实合同签署、财务到账核验、法务流转和外部转化平台同步。",
};

export const getConversionTrackingLoadingCopy = () => ({
  title: "正在读取转化跟踪",
  description: "正在加载合同状态、收益分配、里程碑节点和跟进记录摘要。",
});

export const getConversionTrackingEmptyCopy = () => ({
  title: "暂无转化记录",
  description:
    "本成果尚未登记转化合同、收益分配、里程碑或跟进记录；二期接入真实合同、财务和外部转化平台后再形成跨系统闭环。",
});

export const getConversionRecordReviewSummary = (
  item: AchievementConversionRecord,
) => {
  const conversionStatus = conversionStatusLabels[item.status] ?? "状态待确认";
  const contractStatus =
    conversionContractStatusLabels[item.contractStatus] ?? "合同状态待确认";
  const revenueStatus =
    conversionRevenueStatusLabels[item.revenueStatus] ?? "收益状态待确认";
  const evaluationEffect =
    conversionEvaluationEffectLabels[item.evaluationEffect] ?? "后评估待确认";

  return {
    contract: `${contractStatus}；本地记录合同状态和金额摘要，正式合同签署与法务流转属于二期接入范围。`,
    revenue: `${revenueStatus}；本地记录应收、到账日期和金额摘要，不触发财务系统核验。`,
    milestone: `当前节点：${conversionStatus}；转化日期：${formatDate(item.conversionDate)}。履约里程碑细化和外部节点同步属于二期接入范围。`,
    followUp: item.remarks?.trim()
      ? item.remarks.trim()
      : `暂无跟进记录；当前后评估状态为${evaluationEffect}。`,
  };
};

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
  const loadingCopy = getConversionTrackingLoadingCopy();
  const emptyCopy = getConversionTrackingEmptyCopy();

  const submitConversion = async () => {
    const input = buildConversionInput(form);
    if (!input) {
      setSaveError(mapConversionErrorToDisplay({
        kind: "bad-request",
        message: "转化记录信息不完整",
      }));
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (editingId) {
        await updateAchievementConversion(apiClient, achievementId, editingId, input);
        void message.success("转化记录已更新");
      } else {
        await createAchievementConversion(apiClient, achievementId, input);
        void message.success("转化记录已创建");
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
      <Divider orientation="left">
        <span className="achievement-section-label">
          <SwapOutlined /> 成果转化台账
        </span>
      </Divider>
      <Space direction="vertical" size={12} className="full-width">
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            转化记录
          </Typography.Text>
          <Typography.Text type="secondary">
            {conversionTrackingScopeCopy.local}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary">
            {conversionTrackingScopeCopy.phaseTwo}
          </Typography.Text>
        </div>

        {conversions.loading ? (
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              {loadingCopy.title}
            </Typography.Text>
            <Typography.Text type="secondary">
              {loadingCopy.description}
            </Typography.Text>
          </div>
        ) : conversions.error ? (
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              {conversions.error.message}
            </Typography.Text>
            <Typography.Text type="secondary">
              {conversions.error.detail ?? "本地转化跟踪暂未返回可用结果，请稍后重试。"}
            </Typography.Text>
            <Button size="small" onClick={() => void loadConversions()}>
              重试
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="business-note">
            <Empty description={emptyCopy.title} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <Typography.Text type="secondary">
              {emptyCopy.description}
            </Typography.Text>
          </div>
        ) : (
          <div className="conversion-ledger-list">
            {items.map((item) => {
              const reviewSummary = getConversionRecordReviewSummary(item);

              return (
                <div className="conversion-ledger-card" key={item.id}>
                  <Space direction="vertical" size={8} className="full-width">
                    <Space size={8} wrap>
                      <Tag color={getConversionStatusTagColor(item.status)}>
                        {conversionStatusLabels[item.status] ?? "状态待确认"}
                      </Tag>
                      <Tag color={getConversionContractStatusTagColor(item.contractStatus)}>
                        合同：{conversionContractStatusLabels[item.contractStatus] ?? "待确认"}
                      </Tag>
                      <Tag color={getConversionRevenueStatusTagColor(item.revenueStatus)}>
                        收益：{conversionRevenueStatusLabels[item.revenueStatus] ?? "待确认"}
                      </Tag>
                      <Tag color={getConversionEvaluationEffectTagColor(item.evaluationEffect)}>
                        后评估：{conversionEvaluationEffectLabels[item.evaluationEffect] ?? "待确认"}
                      </Tag>
                      <Tag>{conversionTypeLabels[item.conversionType] ?? "其他"}</Tag>
                      <Typography.Text strong>{item.counterpartyName}</Typography.Text>
                    </Space>
                    <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="关联成果">
                      {sanitizeBusinessTitle(detail.title, "当前成果")}
                    </Descriptions.Item>
                    <Descriptions.Item label="转化日期">
                      {formatDate(item.conversionDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label="合同状态">
                      {conversionContractStatusLabels[item.contractStatus] ?? "待确认"}
                    </Descriptions.Item>
                    <Descriptions.Item label="收益状态">
                      {conversionRevenueStatusLabels[item.revenueStatus] ?? "待确认"}
                    </Descriptions.Item>
                    <Descriptions.Item label="收益应收日期">
                      {formatDate(item.revenueDueDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label="收益到账日期">
                      {formatDate(item.revenueReceivedDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label="合同金额">
                      {formatMoney(item.contractAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="收益金额">
                      {formatMoney(item.revenueAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="合同闭环说明" span={2}>
                      {reviewSummary.contract}
                    </Descriptions.Item>
                    <Descriptions.Item label="收益闭环说明" span={2}>
                      {reviewSummary.revenue}
                    </Descriptions.Item>
                    <Descriptions.Item label="里程碑节点" span={2}>
                      {reviewSummary.milestone}
                    </Descriptions.Item>
                    <Descriptions.Item label="跟进记录" span={2}>
                      {reviewSummary.followUp}
                    </Descriptions.Item>
                    <Descriptions.Item label="后评估效果">
                      {conversionEvaluationEffectLabels[item.evaluationEffect] ?? "待确认"}
                    </Descriptions.Item>
                    <Descriptions.Item label="后评估日期">
                      {formatDate(item.evaluationDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label="后评估摘要" span={2}>
                      {formatValue(item.evaluationSummary)}
                    </Descriptions.Item>
                    <Descriptions.Item label="收益分配明细" span={2}>
                      {formatBenefitDistributionJson(item.benefitDistributionJson)}
                    </Descriptions.Item>
                    <Descriptions.Item label="收益分配摘要" span={2}>
                      {formatValue(item.benefitDistributionSummary)}
                    </Descriptions.Item>
                    </Descriptions>
                    {canManage ? (
                      <Button size="small" onClick={() => {
                        setEditingId(item.id);
                        setForm(toConversionForm(item));
                        setSaveError(null);
                      }}>
                        编辑记录
                      </Button>
                    ) : null}
                  </Space>
                </div>
              );
            })}
          </div>
        )}

        {canManage ? (
          <div className="conversion-ledger-form">
            <Space direction="vertical" size={10} className="full-width">
              <Space size={8} wrap>
                <Typography.Text strong>
                  {editingId ? "编辑转化记录" : "新增转化记录"}
                </Typography.Text>
                {editingId ? (
                  <Button size="small" onClick={() => {
                    setEditingId(null);
                    setForm(emptyConversionForm());
                    setSaveError(null);
                  }}>
                    新建记录
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
                  placeholder="合作方名称"
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
                <Select
                  className="conversion-ledger-select"
                  options={Object.entries(conversionContractStatusLabels).map(([value, label]) => ({
                    value,
                    label: `合同：${label}`,
                  }))}
                  value={form.contractStatus}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      contractStatus: value as AchievementConversionContractStatusCode,
                    }))
                  }
                />
                <Select
                  className="conversion-ledger-select"
                  options={Object.entries(conversionRevenueStatusLabels).map(([value, label]) => ({
                    value,
                    label: `收益：${label}`,
                  }))}
                  value={form.revenueStatus}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      revenueStatus: value as AchievementConversionRevenueStatusCode,
                    }))
                  }
                />
                <Select
                  className="conversion-ledger-select"
                  options={Object.entries(conversionEvaluationEffectLabels).map(([value, label]) => ({
                    value,
                    label: `后评估：${label}`,
                  }))}
                  value={form.evaluationEffect}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      evaluationEffect: value as AchievementConversionEvaluationEffectCode,
                    }))
                  }
                />
              </Space>
              <Space size={8} wrap>
                <Input
                  className="conversion-ledger-input"
                  placeholder="合同金额（元）"
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
                  placeholder="收益金额（元）"
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
                  placeholder="转化日期 YYYY-MM-DD"
                  value={form.conversionDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      conversionDate: event.target.value,
                    }))
                  }
                />
              </Space>
              <Space size={8} wrap>
                <Input
                  className="conversion-ledger-input"
                  placeholder="预计到账日期 YYYY-MM-DD"
                  value={form.revenueDueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      revenueDueDate: event.target.value,
                    }))
                  }
                />
                <Input
                  className="conversion-ledger-input"
                  placeholder="实际到账日期 YYYY-MM-DD"
                  value={form.revenueReceivedDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      revenueReceivedDate: event.target.value,
                    }))
                  }
                />
                <Input
                  className="conversion-ledger-input"
                  placeholder="后评估日期 YYYY-MM-DD"
                  value={form.evaluationDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      evaluationDate: event.target.value,
                    }))
                  }
                />
              </Space>
              <Space direction="vertical" size={8} className="full-width">
                <Space size={8} wrap>
                  <Typography.Text strong>收益分配明细</Typography.Text>
                  <Button
                    size="small"
                    disabled={form.benefitDistributionJson.length >= conversionBenefitAllocationMaxRows}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        benefitDistributionJson: [
                          ...current.benefitDistributionJson,
                          emptyBenefitAllocationRow(),
                        ],
                      }))
                    }
                  >
                    添加分配项
                  </Button>
                </Space>
                {form.benefitDistributionJson.length === 0 ? (
                  <Typography.Text type="secondary">
                    暂无本地分配行。仅填写类别、名称、金额和比例。
                  </Typography.Text>
                ) : (
                  form.benefitDistributionJson.map((row, index) => (
                    <Space size={8} wrap key={`allocation-${index}`}>
                      <Select
                        className="conversion-ledger-select"
                        options={Object.entries(conversionBenefitCategoryLabels).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                        value={row.category}
                        onChange={(value) =>
                          setForm((current) => updateBenefitAllocationRow(current, index, {
                            category: value as AchievementConversionBenefitCategoryCode,
                          }))
                        }
                      />
                      <Input
                        className="conversion-ledger-input"
                        placeholder="分配对象名称"
                        value={row.label}
                        onChange={(event) =>
                          setForm((current) =>
                            updateBenefitAllocationRow(current, index, { label: event.target.value }),
                          )
                        }
                      />
                      <Input
                        className="conversion-ledger-input"
                        placeholder="分配金额"
                        value={row.amount}
                        onChange={(event) =>
                          setForm((current) =>
                            updateBenefitAllocationRow(current, index, { amount: event.target.value }),
                          )
                        }
                      />
                      <Input
                        className="conversion-ledger-input"
                        placeholder="比例 0-1"
                        value={row.ratio}
                        onChange={(event) =>
                          setForm((current) =>
                            updateBenefitAllocationRow(current, index, { ratio: event.target.value }),
                          )
                        }
                      />
                      <Button
                        size="small"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            benefitDistributionJson: current.benefitDistributionJson.filter(
                              (_, rowIndex) => rowIndex !== index,
                            ),
                          }))
                        }
                      >
                        移除
                      </Button>
                    </Space>
                  ))
                )}
              </Space>
              <Input.TextArea
                maxLength={1000}
                placeholder="后评估摘要"
                rows={2}
                showCount
                value={form.evaluationSummary}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    evaluationSummary: event.target.value,
                  }))
                }
              />
              <Input.TextArea
                maxLength={1000}
                placeholder="收益分配摘要"
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
                placeholder="跟进记录 / 备注"
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
                {editingId ? "更新转化记录" : "创建转化记录"}
              </Button>
            </Space>
          </div>
        ) : (
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              转化记录只读
            </Typography.Text>
            <Typography.Text type="secondary">
              当前成果状态或账号职责暂不支持新增、编辑转化记录。
            </Typography.Text>
          </div>
        )}
      </Space>
    </>
  );
}

function CitationImpactSection({ detail }: { detail: AchievementDetailType }) {
  const impact = buildAchievementCitationImpact(detail);

  return (
    <>
      <Divider orientation="left">
        <span className="achievement-section-label">
          <BarChartOutlined /> 学术影响
        </span>
      </Divider>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="引用次数">{impact.citationCount}</Descriptions.Item>
        <Descriptions.Item label="统计来源">{impact.sourceLabel}</Descriptions.Item>
        <Descriptions.Item label="影响摘要" span={2}>
          {impact.summary}
        </Descriptions.Item>
      </Descriptions>
      <Typography.Text type="secondary">
        DOI/Crossref/Scopus/OpenAlex 为外部文献库预留接口，当前不进行真实外部同步。
      </Typography.Text>
    </>
  );
}

export const buildConversionInput = (
  form: ConversionFormState,
): CreateAchievementConversionInput | null => {
  const counterpartyName = form.counterpartyName.trim();
  const contractAmount = parseOptionalAmount(form.contractAmount);
  const revenueAmount = parseOptionalAmount(form.revenueAmount);
  const benefitDistributionJson = normalizeBenefitDistributionInput(
    form.benefitDistributionJson,
  );

  if (
    !counterpartyName ||
    contractAmount === undefined ||
    revenueAmount === undefined ||
    benefitDistributionJson === undefined
  ) {
    return null;
  }

  return {
    conversionType: form.conversionType,
    counterpartyName,
    contractAmount,
    revenueAmount,
    status: form.status,
    conversionDate: form.conversionDate.trim() || null,
    contractStatus: form.contractStatus,
    revenueStatus: form.revenueStatus,
    revenueDueDate: form.revenueDueDate.trim() || null,
    revenueReceivedDate: form.revenueReceivedDate.trim() || null,
    benefitDistributionJson,
    evaluationEffect: form.evaluationEffect,
    evaluationSummary: form.evaluationSummary.trim() || null,
    evaluationDate: form.evaluationDate.trim() || null,
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

const parseOptionalRatio = (value: string): number | null | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : undefined;
};

const normalizeBenefitDistributionInput = (
  rows: ConversionBenefitAllocationFormState[],
): AchievementConversionBenefitDistributionItem[] | null | undefined => {
  const normalized: AchievementConversionBenefitDistributionItem[] = [];

  for (const row of rows.slice(0, conversionBenefitAllocationMaxRows)) {
    const label = row.label.trim();
    const amount = parseOptionalAmount(row.amount);
    const ratio = parseOptionalRatio(row.ratio);
    const isEmptyRow = !label && amount === null && ratio === null;

    if (isEmptyRow) {
      continue;
    }

    if (!label || amount === undefined || ratio === undefined) {
      return undefined;
    }

    normalized.push({
      category: row.category,
      label,
      amount,
      ratio,
    });
  }

  return normalized.length > 0 ? normalized : null;
};

const updateBenefitAllocationRow = (
  form: ConversionFormState,
  index: number,
  patch: Partial<ConversionBenefitAllocationFormState>,
): ConversionFormState => ({
  ...form,
  benefitDistributionJson: form.benefitDistributionJson.map((row, rowIndex) =>
    rowIndex === index ? { ...row, ...patch } : row,
  ),
});

export const toConversionForm = (
  conversion: AchievementConversionRecord,
): ConversionFormState => ({
  conversionType: conversion.conversionType,
  counterpartyName: conversion.counterpartyName,
  contractAmount: conversion.contractAmount ?? "",
  revenueAmount: conversion.revenueAmount ?? "",
  status: conversion.status,
  conversionDate: conversion.conversionDate?.slice(0, 10) ?? "",
  contractStatus: conversion.contractStatus ?? "DRAFT",
  revenueStatus: conversion.revenueStatus ?? "UNPAID",
  revenueDueDate: conversion.revenueDueDate?.slice(0, 10) ?? "",
  revenueReceivedDate: conversion.revenueReceivedDate?.slice(0, 10) ?? "",
  benefitDistributionJson: (conversion.benefitDistributionJson ?? [])
    .slice(0, conversionBenefitAllocationMaxRows)
    .map((item) => ({
      category: item.category,
      label: item.label,
      amount: item.amount == null ? "" : String(item.amount),
      ratio: item.ratio == null ? "" : String(item.ratio),
    })),
  evaluationEffect: conversion.evaluationEffect ?? "NOT_EVALUATED",
  evaluationSummary: conversion.evaluationSummary ?? "",
  evaluationDate: conversion.evaluationDate?.slice(0, 10) ?? "",
  benefitDistributionSummary: conversion.benefitDistributionSummary ?? "",
  remarks: conversion.remarks ?? "",
});

export const mapConversionErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "unauthorized" || error.status === 401) {
    return {
      ...error,
      message: "请先选择可用的业务用户",
      detail: "转化跟踪需要有效用户上下文后才能读取或维护。",
    };
  }

  if (error.kind === "forbidden" || error.status === 403) {
    return {
      ...error,
      message: "当前账号无权查看转化记录",
      detail: "该成果的转化记录按部门职责范围开放。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "转化记录不存在或不可用",
      detail: "请返回成果详情刷新后重试。",
    };
  }

  if (error.status === 409) {
    return {
      ...error,
      message: "当前成果状态暂不能维护转化记录",
      detail: "本地评审版仅允许在已归档成果范围内登记转化台账。",
    };
  }

  if (error.kind === "bad-request" || error.status === 400) {
    return {
      ...error,
      message: "转化记录信息不完整",
      detail: "请检查合作方、金额、日期和收益分配比例后重试。",
    };
  }

  return {
    ...error,
    message: "转化跟踪暂不可用",
    detail: "本地转化跟踪暂未返回可用结果，请稍后重试或联系管理员核对服务状态。",
  };
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

const getConversionContractStatusTagColor = (
  status: AchievementConversionContractStatusCode,
): string => {
  if (status === "COMPLETED" || status === "ACTIVE") {
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

const getConversionRevenueStatusTagColor = (
  status: AchievementConversionRevenueStatusCode,
): string => {
  if (status === "PAID" || status === "WAIVED") {
    return "green";
  }

  if (status === "OVERDUE") {
    return "red";
  }

  if (status === "PARTIAL") {
    return "gold";
  }

  return "default";
};

const getConversionEvaluationEffectTagColor = (
  effect: AchievementConversionEvaluationEffectCode,
): string => {
  if (effect === "POSITIVE") {
    return "green";
  }

  if (effect === "NEGATIVE") {
    return "red";
  }

  if (effect === "MIXED") {
    return "gold";
  }

  return "default";
};

export const formatBenefitDistributionJson = (
  items: AchievementConversionBenefitDistributionItem[] | null | undefined,
): string => {
  if (!items?.length) {
    return "暂未登记收益分配明细";
  }

  return items
    .slice(0, conversionBenefitAllocationMaxRows)
    .map((item) => {
      const amount = item.amount == null ? null : formatMoney(String(item.amount));
      const ratio = item.ratio == null ? null : `${Math.round(item.ratio * 100)}%`;
      return [
        conversionBenefitCategoryLabels[item.category] ?? item.category,
        item.label,
        amount,
        ratio,
      ]
        .filter(Boolean)
        .join(" / ");
    })
    .join("; ");
};

const formatMoney = (value: string | null | undefined): string =>
  value ? new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(Number(value)) : "未返回";

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
  const [previewingAttachmentId, setPreviewingAttachmentId] = useState<string | null>(null);
  const [previewState, setPreviewState] =
    useState<AttachmentPreviewState>(emptyAttachmentPreviewState);
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
    setPreviewingAttachmentId(null);
    setPreviewState((current) => {
      revokeAttachmentPreviewObjectUrl(current.previewUrl);
      return emptyAttachmentPreviewState();
    });
  }, [achievementId]);

  useEffect(
    () => () => {
      revokeAttachmentPreviewObjectUrl(previewState.previewUrl);
    },
    [previewState.previewUrl],
  );

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

  const closePreview = () => {
    setPreviewState((current) => {
      revokeAttachmentPreviewObjectUrl(current.previewUrl);
      return emptyAttachmentPreviewState();
    });
  };

  const onPreview = async (attachment: AttachmentMetadata) => {
    const fileName = getAttachmentDownloadFileName(attachment);
    if (!isPreviewableAttachment(attachment.mimeType)) {
      setPreviewState((current) => {
        revokeAttachmentPreviewObjectUrl(current.previewUrl);
        return {
          attachmentId: attachment.id,
          error: mapAttachmentPreviewErrorToDisplay({
            kind: "bad-request",
            status: 415,
            message: "Unsupported attachment preview media type.",
          }),
          fileName,
          loading: false,
          mimeType: attachment.mimeType ?? null,
          open: true,
          previewUrl: null,
        };
      });
      return;
    }

    setPreviewingAttachmentId(attachment.id);
    setPreviewState((current) => {
      revokeAttachmentPreviewObjectUrl(current.previewUrl);
      return {
        attachmentId: attachment.id,
        error: null,
        fileName,
        loading: true,
        mimeType: attachment.mimeType ?? null,
        open: true,
        previewUrl: null,
      };
    });

    try {
      const blob = await previewAchievementAttachment(apiClient, achievementId, attachment.id);
      const previewUrl = createAttachmentPreviewObjectUrl(blob);
      setPreviewState((current) => ({
        ...current,
        attachmentId: attachment.id,
        error: null,
        loading: false,
        mimeType: blob.type || attachment.mimeType || null,
        previewUrl,
      }));
    } catch (error) {
      setPreviewState((current) => ({
        ...current,
        attachmentId: attachment.id,
        error: mapAttachmentPreviewErrorToDisplay(normalizeError(error)),
        loading: false,
        previewUrl: null,
      }));
    } finally {
      setPreviewingAttachmentId(null);
    }
  };

  return (
    <>
      <Divider orientation="left">
        <span className="achievement-section-label">
          <PaperClipOutlined /> 附件
        </span>
      </Divider>
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
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              {readonly ? "附件信息" : "附件维护"}
            </Typography.Text>
            <Typography.Text type="secondary">
              {readonly
                ? "当前视图展示可查看的附件信息。"
                : "当前账号暂不可维护该成果附件。"}
            </Typography.Text>
          </div>
        )}
        {!canLoadAttachments ? (
          <Alert
            showIcon
            type="warning"
            message="等待业务用户"
            description="未选择业务用户时不读取附件摘要，也不会发起任何附件业务请求。"
          />
        ) : (
          <DataState
            loading={attachments.loading}
            error={attachments.error}
            empty={!attachments.loading && !attachments.error && items.length === 0}
            emptyText="暂无附件摘要"
            onRetry={() => void loadAttachments()}
          >
            <AttachmentMetadataList
              attachments={items}
              downloadingAttachmentId={downloadingAttachmentId}
              previewingAttachmentId={previewingAttachmentId}
              selectedAttachmentId={selectedAttachmentId}
              onDownload={(attachment) => void onDownload(attachment)}
              onPreview={(attachment) => void onPreview(attachment)}
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
      <AttachmentPreviewModal
        error={previewState.error}
        fallbackActionLabel="下载附件"
        fallbackHint="如在线预览不可用，可尝试下载已授权附件；仍无法访问时请联系管理员确认权限和格式支持。"
        fileName={previewState.fileName}
        loading={previewState.loading}
        mimeType={previewState.mimeType}
        open={previewState.open}
        previewUrl={previewState.previewUrl}
        onFallbackDownload={() => {
          const attachment = items.find((item) => item.id === previewState.attachmentId);
          if (attachment) {
            void onDownload(attachment);
          }
        }}
        onClose={closePreview}
      />
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
          支持 PDF、PNG、JPG、DOC、DOCX、XLS、XLSX；单个文件不超过 10 MB。上传前会先检查文件格式和大小。
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
  onPreview,
  onSelectAttachment,
  previewingAttachmentId,
  selectedAttachmentId,
}: {
  attachments: AttachmentMetadata[];
  downloadingAttachmentId: string | null;
  onDownload: (attachment: AttachmentMetadata) => void;
  onPreview: (attachment: AttachmentMetadata) => void;
  onSelectAttachment: (attachmentId: string) => void;
  previewingAttachmentId: string | null;
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
                <Tag>版本 {model.version}</Tag>
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
                  查看详情摘要
                </Button>
                <Button
                  size="small"
                  loading={downloadingAttachmentId === attachment.id}
                  onClick={() => onDownload(attachment)}
                >
                  下载
                </Button>
                <Button
                  size="small"
                  loading={previewingAttachmentId === attachment.id}
                  onClick={() => onPreview(attachment)}
                >
                  {isPreviewableAttachment(attachment.mimeType) ? "预览" : "预览说明"}
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
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            附件详情
          </Typography.Text>
          <Typography.Text type="secondary">{boundary.description}</Typography.Text>
        </div>
        {!canLoadDetail ? (
          <Alert
            showIcon
            type="warning"
            message="等待业务用户"
            description="未选择业务用户或附件 ID 缺失时不读取附件详情摘要。"
          />
        ) : (
          <DataState
            loading={detail.loading}
            error={detail.error}
            empty={!detail.loading && !detail.error && !detail.data}
            emptyText="未返回附件详情摘要"
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

const getAchievementActionIcon = (action: AchievementAction) => {
  if (action === "submit") {
    return <CheckOutlined />;
  }

  if (action === "archive") {
    return <InboxOutlined />;
  }

  return <StopOutlined />;
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
      description: "提交后将进入院系审核流程；是否成功取决于当前状态和审批配置。",
      okText: "提交",
      successMessage: "提交审批",
      title: "确认提交审批",
    },
    void: {
      buttonLabel: "作废",
      description: "作废仅支持草稿状态，请填写作废原因。",
      okText: "作废",
      successMessage: "作废",
      title: "确认作废成果",
    },
    archive: {
      buttonLabel: "归档",
      description: "归档仅支持待归档状态；是否成功取决于当前权限和流程状态。",
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
    return sanitizeBusinessTitle(item.title, "成果记录");
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

export type AchievementCitationImpactViewModel = {
  citationCount: number;
  sourceLabel: string;
  summary: string;
};

export const buildAchievementCitationImpact = (
  detail: Pick<AchievementDetailType, "paperDetail" | "status" | "type">,
  currentYear = new Date().getUTCFullYear(),
): AchievementCitationImpactViewModel => {
  if (detail.type !== "PAPER" || !detail.paperDetail) {
    return {
      citationCount: 0,
      sourceLabel: "本地统计",
      summary: "当前成果类型不纳入论文引文统计，可在后续接入外部文献库后扩展。",
    };
  }

  const citationCount = estimateAchievementCitationCount(detail, currentYear);
  const paper = detail.paperDetail;
  const parts = [
    paper.includedType ? `收录：${paper.includedType}` : null,
    paper.impactFactor ? `影响因子：${paper.impactFactor}` : null,
    paper.publishYear ? `发表年份：${paper.publishYear}` : null,
  ].filter(Boolean);

  return {
    citationCount,
    sourceLabel: "本地派生统计",
    summary:
      parts.length > 0
        ? `${parts.join("；")}。当前引用次数用于本地评审演示。`
        : "当前论文缺少收录、影响因子或发表年份字段，引用次数按本地最低口径展示。",
  };
};

export const estimateAchievementCitationCount = (
  detail: Pick<AchievementDetailType, "paperDetail" | "status" | "type">,
  currentYear = new Date().getUTCFullYear(),
): number => {
  if (detail.type !== "PAPER" || !detail.paperDetail) {
    return 0;
  }

  const paper = detail.paperDetail;
  const includedTypeScore = scoreIncludedType(paper.includedType);
  const impactScore = scoreImpactFactor(paper.impactFactor);
  const ageScore = scorePublishAge(paper.publishYear, currentYear);
  const doiScore = paper.doi?.trim() ? 6 : 0;
  const statusMultiplier = detail.status === "ARCHIVED" ? 1 : 0.65;

  return Math.max(
    0,
    Math.round((includedTypeScore + impactScore + ageScore + doiScore) * statusMultiplier),
  );
};

const scoreIncludedType = (includedType: string | null | undefined): number => {
  const value = includedType?.toUpperCase() ?? "";

  if (value.includes("CSSCI")) {
    return 14;
  }

  if (value.includes("SSCI")) {
    return 20;
  }

  if (value.includes("SCI")) {
    return 22;
  }

  if (value.includes("EI")) {
    return 16;
  }

  if (value.includes("CSCD")) {
    return 10;
  }

  return value ? 6 : 2;
};

const scoreImpactFactor = (
  impactFactor: number | string | null | undefined,
): number => {
  const numeric =
    typeof impactFactor === "number"
      ? impactFactor
      : Number.parseFloat(impactFactor?.toString() ?? "");

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.min(30, Math.round(numeric * 4));
};

const scorePublishAge = (
  publishYear: number | null | undefined,
  currentYear: number,
): number => {
  if (!publishYear || publishYear > currentYear) {
    return 0;
  }

  return Math.min(16, Math.max(0, currentYear - publishYear) * 2);
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
      <div className="business-note">
        <Typography.Text strong className="business-note-title">
          当前状态只读
        </Typography.Text>
        <Typography.Text type="secondary">
          院系驳回状态当前不支持编辑、提交、作废或归档。
        </Typography.Text>
      </div>
    );
  }

  if (status === "PENDING_DEPARTMENT_REVIEW") {
    return (
      <div className="business-note">
        <Typography.Text strong className="business-note-title">
          等待院系审核
        </Typography.Text>
        <Typography.Text type="secondary">审批通过或驳回请在审批管理中处理。</Typography.Text>
      </div>
    );
  }

  if (status === "ARCHIVED" || status === "VOIDED") {
    return (
      <div className="business-note">
        <Typography.Text strong className="business-note-title">
          当前状态只读
        </Typography.Text>
        <Typography.Text type="secondary">该成果当前只读。</Typography.Text>
      </div>
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
