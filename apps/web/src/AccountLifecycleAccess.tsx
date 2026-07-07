import { Alert, Button, Form, Input, Space, Typography } from "antd";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  createAuthClient,
  isApiError,
  type ApiError,
  type AuthClient,
} from "./api-client";
import type {
  InviteAcceptInput,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
} from "./types";

export type PublicLifecycleMode = "login" | "forgot-password" | "reset-password" | "invite-accept";

type RequestStatus = "idle" | "submitting" | "success";

export type PublicLifecycleIntent = {
  mode: PublicLifecycleMode;
  token?: string;
};

export const lifecycleTokenFieldName = "accountLifecycleToken";

export const parsePublicLifecycleIntent = (url: string): PublicLifecycleIntent => {
  const parsed = new URL(url, window.location.origin);
  const flow = parsed.searchParams.get("flow") ?? parsed.hash.replace(/^#\/?/, "");
  const token = parsed.searchParams.get("token") ?? undefined;

  if (flow === "forgot-password") {
    return { mode: "forgot-password" };
  }

  if (flow === "reset-password") {
    return { mode: "reset-password", token };
  }

  if (flow === "invite-accept") {
    return { mode: "invite-accept", token };
  }

  return { mode: "login" };
};

export const getSafeLifecycleErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) {
    return "请求失败，请稍后重试。";
  }

  if (error.status === 401 || error.status === 409) {
    return "该链接无效或已过期，请从登录页或管理员处重新获取链接。";
  }

  if (error.kind === "forbidden") {
    return "当前账号状态不支持该操作。";
  }

  if (error.kind === "network" || error.kind === "server") {
    return "服务暂不可用，请稍后重试。";
  }

  return error.message;
};

export const requestPasswordResetFromForm = (
  client: Pick<AuthClient, "requestPasswordReset">,
  values: PasswordResetRequestInput,
) => client.requestPasswordReset({ email: values.email.trim() });

export const confirmPasswordResetFromForm = (
  client: Pick<AuthClient, "confirmPasswordReset">,
  values: PasswordResetConfirmInput,
) =>
  client.confirmPasswordReset({
    token: values.token.trim(),
    newPassword: values.newPassword,
  });

export const acceptInviteFromForm = (
  client: Pick<AuthClient, "acceptInvite">,
  values: InviteAcceptInput,
) =>
  client.acceptInvite({
    token: values.token.trim(),
    password: values.password,
  });

export const resolveLifecycleTokenValue = (
  formToken: string | undefined,
  initialToken: string | undefined,
): string => formToken?.trim() || initialToken?.trim() || "";

export function AccountLifecycleAccess({
  intent,
  onBackToLogin,
  authClient,
}: {
  intent: PublicLifecycleIntent;
  onBackToLogin: () => void;
  authClient?: AuthClient;
}) {
  const client = useMemo(() => authClient ?? createAuthClient(), [authClient]);

  if (intent.mode === "forgot-password") {
    return <ForgotPasswordPanel authClient={client} onBackToLogin={onBackToLogin} />;
  }

  if (intent.mode === "reset-password") {
    return (
      <ResetPasswordPanel
        authClient={client}
        initialToken={intent.token}
        onBackToLogin={onBackToLogin}
      />
    );
  }

  if (intent.mode === "invite-accept") {
    return (
      <InviteAcceptPanel
        authClient={client}
        initialToken={intent.token}
        onBackToLogin={onBackToLogin}
      />
    );
  }

  return null;
}

function ForgotPasswordPanel({
  authClient,
  onBackToLogin,
}: {
  authClient: Pick<AuthClient, "requestPasswordReset">;
  onBackToLogin: () => void;
}) {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (values: PasswordResetRequestInput) => {
    setStatus("submitting");
    setError(null);

    try {
      await requestPasswordResetFromForm(authClient, values);
      setStatus("success");
    } catch (submitError) {
      setError(normalizeLifecycleError(submitError));
      setStatus("idle");
    }
  };

  return (
    <LifecyclePanel
      title="重置登录权限"
      description="请输入工作邮箱；如账号符合重置条件，系统会通过配置的交付渠道发送下一步指引。"
      onBackToLogin={onBackToLogin}
    >
      {status === "success" ? (
        <Alert
          type="success"
          showIcon
          message="请求已受理"
          description="如账号符合条件，重置指引会被交付；设置新密码后请返回登录。"
        />
      ) : null}
      {error ? <Alert type="error" showIcon message={getSafeLifecycleErrorMessage(error)} /> : null}
      <Form<PasswordResetRequestInput> layout="vertical" requiredMark={false} onFinish={submit}>
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱。" },
            { type: "email", message: "请输入有效邮箱。" },
          ]}
        >
          <Input autoComplete="email" disabled={status === "submitting"} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={status === "submitting"}>
          发送重置请求
        </Button>
      </Form>
    </LifecyclePanel>
  );
}

function ResetPasswordPanel({
  authClient,
  initialToken,
  onBackToLogin,
}: {
  authClient: Pick<AuthClient, "confirmPasswordReset">;
  initialToken?: string;
  onBackToLogin: () => void;
}) {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [form] = Form.useForm<PasswordResetConfirmInput>();

  const submit = async (values: PasswordResetConfirmInput) => {
    setStatus("submitting");
    setError(null);

    try {
      await confirmPasswordResetFromForm(authClient, {
        ...values,
        token: resolveLifecycleTokenValue(values.token, initialToken),
      });
      form.resetFields();
      setStatus("success");
    } catch (submitError) {
      setError(normalizeLifecycleError(submitError));
      setStatus("idle");
    }
  };

  return (
    <LifecyclePanel
      title="设置新密码"
      description="重置凭据只能使用一次，完成后请使用新密码重新登录。"
      onBackToLogin={onBackToLogin}
    >
      {status === "success" ? (
        <Alert
          type="success"
          showIcon
          message="密码已更新"
          description="当前会话状态已刷新，请返回登录并使用新密码。"
        />
      ) : null}
      {error ? <Alert type="error" showIcon message={getSafeLifecycleErrorMessage(error)} /> : null}
      <Form<PasswordResetConfirmInput>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
      >
        <TokenFormItem hasInitialToken={Boolean(initialToken)} />
        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[{ required: true, min: 12, message: "请至少输入 12 个字符。" }]}
        >
          <Input.Password autoComplete="new-password" disabled={status === "submitting"} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={status === "submitting"}>
          更新密码
        </Button>
      </Form>
    </LifecyclePanel>
  );
}

function InviteAcceptPanel({
  authClient,
  initialToken,
  onBackToLogin,
}: {
  authClient: Pick<AuthClient, "acceptInvite">;
  initialToken?: string;
  onBackToLogin: () => void;
}) {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [form] = Form.useForm<InviteAcceptInput>();

  const submit = async (values: InviteAcceptInput) => {
    setStatus("submitting");
    setError(null);

    try {
      await acceptInviteFromForm(authClient, {
        ...values,
        token: resolveLifecycleTokenValue(values.token, initialToken),
      });
      form.resetFields();
      setStatus("success");
    } catch (submitError) {
      setError(normalizeLifecycleError(submitError));
      setStatus("idle");
    }
  };

  return (
    <LifecyclePanel
      title="接受邀请"
      description="请创建登录密码以激活待开通账号，完成后返回主登录面板。"
      onBackToLogin={onBackToLogin}
    >
      {status === "success" ? (
        <Alert
          type="success"
          showIcon
          message="邀请已接受"
          description="账号已完成激活，请返回登录并使用刚设置的密码。"
        />
      ) : null}
      {error ? <Alert type="error" showIcon message={getSafeLifecycleErrorMessage(error)} /> : null}
      <Form<InviteAcceptInput>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
      >
        <TokenFormItem hasInitialToken={Boolean(initialToken)} />
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, min: 12, message: "请至少输入 12 个字符。" }]}
        >
          <Input.Password autoComplete="new-password" disabled={status === "submitting"} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={status === "submitting"}>
          激活账号
        </Button>
      </Form>
    </LifecyclePanel>
  );
}

function TokenFormItem({ hasInitialToken }: { hasInitialToken: boolean }) {
  return (
    <Form.Item
      label="凭据"
      name="token"
      rules={[
        {
          validator: (_, value: string | undefined) => {
            const token = value?.trim() ?? "";
            if (!token && hasInitialToken) {
              return Promise.resolve();
            }
            if (token.length >= 20) {
              return Promise.resolve();
            }
            return Promise.reject(new Error("请输入交付链接中的凭据。"));
          },
        },
      ]}
    >
      <Input.Password
        autoComplete="one-time-code"
        name={lifecycleTokenFieldName}
        visibilityToggle={false}
      />
    </Form.Item>
  );
}

function LifecyclePanel({
  title,
  description,
  children,
  onBackToLogin,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onBackToLogin: () => void;
}) {
  return (
    <div className="auth-login-panel">
      <Space direction="vertical" size={16} className="full-width">
        <div>
          <Typography.Title level={3}>{title}</Typography.Title>
          <Typography.Text type="secondary">{description}</Typography.Text>
        </div>
        {children}
        <Button type="link" onClick={onBackToLogin}>
          返回登录
        </Button>
      </Space>
    </div>
  );
}

const normalizeLifecycleError = (error: unknown): ApiError =>
  isApiError(error)
    ? error
    : {
        kind: "unknown",
        message: "请求失败。",
        detail: error instanceof Error ? error.message : undefined,
      };
