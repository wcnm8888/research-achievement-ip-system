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
    return "Request failed. Please try again later.";
  }

  if (error.status === 401 || error.status === 409) {
    return "This link is invalid or expired. Request a new link from the sign-in page or an administrator.";
  }

  if (error.kind === "forbidden") {
    return "This operation is not available for the current account state.";
  }

  if (error.kind === "network" || error.kind === "server") {
    return "Service is temporarily unavailable. Please try again later.";
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
      title="Reset access"
      description="Enter your work email. If the account can receive a reset, the next step will be delivered through the configured channel."
      onBackToLogin={onBackToLogin}
    >
      {status === "success" ? (
        <Alert
          type="success"
          showIcon
          message="Request accepted"
          description="If the account is eligible, reset instructions will be delivered. Return to sign in after setting a new password."
        />
      ) : null}
      {error ? <Alert type="error" showIcon message={getSafeLifecycleErrorMessage(error)} /> : null}
      <Form<PasswordResetRequestInput> layout="vertical" requiredMark={false} onFinish={submit}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Enter your email." },
            { type: "email", message: "Enter a valid email." },
          ]}
        >
          <Input autoComplete="email" disabled={status === "submitting"} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={status === "submitting"}>
          Send reset request
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
      title="Set a new password"
      description="Use the reset token once, then sign in again with the new password."
      onBackToLogin={onBackToLogin}
    >
      {status === "success" ? (
        <Alert
          type="success"
          showIcon
          message="Password updated"
          description="Your active sessions were refreshed. Return to sign in with the new password."
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
          label="New password"
          name="newPassword"
          rules={[{ required: true, min: 12, message: "Use at least 12 characters." }]}
        >
          <Input.Password autoComplete="new-password" disabled={status === "submitting"} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={status === "submitting"}>
          Update password
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
      title="Accept invitation"
      description="Create your password to activate the pending account, then sign in from the main panel. In this demo, invitation delivery is local/simulated and not a production email or SMS acceptance."
      onBackToLogin={onBackToLogin}
    >
      {status === "success" ? (
        <Alert
          type="success"
          showIcon
          message="Invitation accepted"
          description="Your account is active for the local demo flow. Return to sign in with the password you set."
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
          label="Password"
          name="password"
          rules={[{ required: true, min: 12, message: "Use at least 12 characters." }]}
        >
          <Input.Password autoComplete="new-password" disabled={status === "submitting"} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={status === "submitting"}>
          Activate account
        </Button>
      </Form>
    </LifecyclePanel>
  );
}

function TokenFormItem({ hasInitialToken }: { hasInitialToken: boolean }) {
  return (
    <Form.Item
      label="Token"
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
            return Promise.reject(new Error("Enter the token from the delivered link."));
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
          Back to sign in
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
        message: "Request failed.",
        detail: error instanceof Error ? error.message : undefined,
      };
