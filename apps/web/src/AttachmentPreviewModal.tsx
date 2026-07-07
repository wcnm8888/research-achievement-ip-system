import { Alert, Empty, Modal, Spin, Typography } from "antd";
import type { ApiError } from "./api-client";
import { getAttachmentPreviewKind } from "./attachment-preview";

type AttachmentPreviewModalProps = {
  error: ApiError | null;
  fileName: string;
  loading: boolean;
  mimeType: string | null;
  onClose: () => void;
  open: boolean;
  previewUrl: string | null;
};

export function AttachmentPreviewModal({
  error,
  fileName,
  loading,
  mimeType,
  onClose,
  open,
  previewUrl,
}: AttachmentPreviewModalProps) {
  const kind = getAttachmentPreviewKind(mimeType);

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
          <Alert
            showIcon
            type="error"
            message={error.message}
            description={error.detail}
          />
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
