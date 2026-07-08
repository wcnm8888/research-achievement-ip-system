import { Alert, Button, Empty, Modal, Space, Spin, Typography } from "antd";
import type { ApiError } from "./api-client";
import { getAttachmentPreviewKind } from "./attachment-preview";

type AttachmentPreviewModalProps = {
  error: ApiError | null;
  fallbackActionLabel?: string;
  fallbackHint?: string;
  fileName: string;
  loading: boolean;
  mimeType: string | null;
  onClose: () => void;
  onFallbackDownload?: () => void;
  open: boolean;
  previewUrl: string | null;
};

export function AttachmentPreviewModal({
  error,
  fallbackActionLabel = "下载附件",
  fallbackHint = "如需查看完整内容，可尝试授权下载，或联系管理员确认权限和格式支持。",
  fileName,
  loading,
  mimeType,
  onClose,
  onFallbackDownload,
  open,
  previewUrl,
}: AttachmentPreviewModalProps) {
  const kind = getAttachmentPreviewKind(mimeType);
  const errorAlertType =
    error?.status === 401 || error?.status === 403 || error?.status === 415 || error?.status === 422
      ? "warning"
      : "error";

  return (
    <Modal
      className="attachment-preview-modal"
      destroyOnClose
      footer={null}
      open={open}
      title={`附件预览${fileName ? `：${fileName}` : ""}`}
      width={920}
      onCancel={onClose}
    >
      <div className="attachment-preview-body">
        {loading ? (
          <div className="attachment-preview-loading">
            <Spin />
            <Typography.Text type="secondary">正在加载预览</Typography.Text>
          </div>
        ) : null}
        {!loading && error ? (
          <Space direction="vertical" size={8} className="full-width">
            <Alert
              showIcon
              type={errorAlertType}
              message={error.message}
              description={error.detail}
              action={
                onFallbackDownload ? (
                  <Button size="small" onClick={onFallbackDownload}>
                    {fallbackActionLabel}
                  </Button>
                ) : undefined
              }
            />
            <Typography.Text type="secondary">{fallbackHint}</Typography.Text>
          </Space>
        ) : null}
        {!loading && !error && !previewUrl ? (
          <Empty description="暂无可预览内容" />
        ) : null}
        {!loading && !error && previewUrl && kind === "pdf" ? (
          <iframe
            className="attachment-preview-frame"
            src={previewUrl}
            title="附件 PDF 预览"
          />
        ) : null}
        {!loading && !error && previewUrl && kind === "image" ? (
          <img
            alt={fileName || "附件预览"}
            className="attachment-preview-image"
            src={previewUrl}
          />
        ) : null}
        {!loading && !error && previewUrl && kind === "unsupported" ? (
          <Alert
            showIcon
            type="warning"
            message="该附件格式暂不支持在线预览"
            description="当前仅支持 PDF、PNG、JPG。"
          />
        ) : null}
      </div>
    </Modal>
  );
}
