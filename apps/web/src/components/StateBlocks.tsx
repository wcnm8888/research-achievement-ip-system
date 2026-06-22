import { Alert, Button, Empty, Result, Skeleton, Space, Typography } from "antd";
import type { ApiError } from "../api-client";

type SectionHeaderProps = {
  title: string;
  description?: string;
  extra?: React.ReactNode;
};

export function SectionHeader({ title, description, extra }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <Typography.Title level={3}>{title}</Typography.Title>
        {description ? (
          <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
        ) : null}
      </div>
      {extra ? <div className="section-header-extra">{extra}</div> : null}
    </div>
  );
}

type DataStateProps = {
  loading?: boolean;
  error?: ApiError | null;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
  onRetry?: () => void;
};

export function DataState({
  loading,
  error,
  empty,
  emptyText = "暂无数据",
  children,
  onRetry,
}: DataStateProps) {
  if (loading) {
    return (
      <div className="state-box">
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (empty) {
    return (
      <div className="state-box">
        <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return <>{children}</>;
}

type ErrorStateProps = {
  error: ApiError;
  onRetry?: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const isPermissionError = error.kind === "forbidden" || error.kind === "unauthorized";

  return (
    <Result
      className="state-result"
      status={isPermissionError ? "403" : "warning"}
      title={error.message}
      subTitle={error.detail}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            重试
          </Button>
        ) : null
      }
    />
  );
}

type PermissionHintProps = {
  title?: string;
  description: string;
};

export function PermissionHint({ title = "权限与边界提示", description }: PermissionHintProps) {
  return (
    <Alert
      className="permission-hint"
      type="warning"
      showIcon
      message={title}
      description={description}
    />
  );
}

type BoundaryNoticeProps = {
  title: string;
  description: string;
  step?: string;
};

export function BoundaryNotice({ title, description, step = "后续 Step" }: BoundaryNoticeProps) {
  return (
    <div className="boundary-notice">
      <Space direction="vertical" size={8}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary">{description}</Typography.Text>
        <Typography.Text className="boundary-step">{step} 计划确认后再实现</Typography.Text>
      </Space>
    </div>
  );
}
