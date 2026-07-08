import {
  Alert,
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { isApiError, type ApiClient, type ApiError } from "./api-client";
import type {
  AchievementContributor,
  AchievementDetail,
  AchievementStatusCode,
  AchievementTypeCode,
  ApiIntegrationMockRunInput,
  ApiIntegrationMockRunResponse,
  ContributorRoleCode,
  ContributorTypeCode,
  PaperDetail,
  PatentDetail,
  PatentLegalStatusCode,
  PatentTypeCode,
  SecretLevelCode,
  SoftwareCopyrightDetail,
  SoftwareTypeCode,
} from "./types";

type AchievementFormMode = "create" | "edit";

type AchievementFormProps = {
  apiClient: ApiClient;
  achievementId?: string;
  mode: AchievementFormMode;
  onClose: () => void;
  onSaved: (event: { close: boolean }) => void;
  open: boolean;
};

export type AchievementFormValues = {
  type: AchievementTypeCode;
  title?: string;
  secretLevel?: SecretLevelCode;
  paperDetail?: PaperDetail;
  patentDetail?: PatentDetail;
  softwareCopyrightDetail?: SoftwareCopyrightDetail;
  contributors?: AchievementContributor[];
};

export type CreateAchievementPayload = {
  type: AchievementTypeCode;
  title: string;
  secretLevel?: SecretLevelCode;
  paperDetail?: PaperDetail;
  patentDetail?: PatentDetail;
  softwareCopyrightDetail?: SoftwareCopyrightDetail;
  contributors: AchievementContributor[];
};

export type UpdateAchievementPayload = {
  title?: string;
  secretLevel?: SecretLevelCode;
  paperDetail?: PaperDetail;
  patentDetail?: PatentDetail;
  softwareCopyrightDetail?: SoftwareCopyrightDetail;
};

type DoiPreviewState = {
  loading: boolean;
  result: ApiIntegrationMockRunResponse | null;
  error: string | null;
};

const emptyDoiPreviewState = (): DoiPreviewState => ({
  loading: false,
  result: null,
  error: null,
});

const achievementTypeOptions: Array<{ label: string; value: AchievementTypeCode }> = [
  { label: "论文", value: "PAPER" },
  { label: "专利", value: "PATENT" },
  { label: "软件著作权", value: "SOFTWARE_COPYRIGHT" },
];

const secretLevelOptions: Array<{ label: string; value: SecretLevelCode }> = [
  { label: "公开", value: "PUBLIC" },
  { label: "内部", value: "INTERNAL" },
  { label: "秘密", value: "SECRET" },
  { label: "机密", value: "CONFIDENTIAL" },
];

const contributorTypeOptions: Array<{ label: string; value: ContributorTypeCode }> = [
  { label: "作者", value: "AUTHOR" },
  { label: "发明人", value: "INVENTOR" },
  { label: "著作权人", value: "COPYRIGHT_OWNER" },
];

const contributorRoleOptions: Array<{ label: string; value: ContributorRoleCode }> = [
  { label: "第一作者", value: "FIRST_AUTHOR" },
  { label: "通讯作者", value: "CORRESPONDING_AUTHOR" },
  { label: "第一发明人", value: "PRIMARY_INVENTOR" },
  { label: "参与人", value: "PARTICIPANT" },
  { label: "权利人", value: "OWNER" },
  { label: "其他", value: "OTHER" },
];

const patentTypeOptions: Array<{ label: string; value: PatentTypeCode }> = [
  { label: "发明", value: "INVENTION" },
  { label: "实用新型", value: "UTILITY_MODEL" },
  { label: "外观设计", value: "DESIGN" },
  { label: "国防专利", value: "NATIONAL_DEFENSE" },
  { label: "其他", value: "OTHER" },
];

const patentLegalStatusOptions: Array<{ label: string; value: PatentLegalStatusCode }> = [
  { label: "申请中", value: "PENDING" },
  { label: "已授权", value: "GRANTED" },
  { label: "已驳回", value: "REJECTED" },
  { label: "已届满", value: "EXPIRED" },
  { label: "已终止", value: "TERMINATED" },
  { label: "已转让", value: "TRANSFERRED" },
  { label: "未知", value: "UNKNOWN" },
];

const softwareTypeOptions: Array<{ label: string; value: SoftwareTypeCode }> = [
  { label: "应用软件", value: "APPLICATION" },
  { label: "系统软件", value: "SYSTEM" },
  { label: "工具软件", value: "TOOL" },
  { label: "嵌入式软件", value: "EMBEDDED" },
  { label: "其他", value: "OTHER" },
];

const defaultCreateValues: AchievementFormValues = {
  type: "PAPER",
  secretLevel: "INTERNAL",
  contributors: [
    {
      name: "",
      contributorType: "AUTHOR",
      sortOrder: 1,
    },
  ],
};

export function AchievementForm({
  apiClient,
  achievementId,
  mode,
  onClose,
  onSaved,
  open,
}: AchievementFormProps) {
  const [form] = Form.useForm<AchievementFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [loadedDetail, setLoadedDetail] = useState<AchievementDetail | null>(null);
  const [doiPreview, setDoiPreview] = useState<DoiPreviewState>(emptyDoiPreviewState);
  const selectedType = Form.useWatch("type", form) ?? "PAPER";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoadError(null);
    setSaveError(null);
    setLoadedDetail(null);
    setDoiPreview(emptyDoiPreviewState());

    if (mode === "create") {
      form.setFieldsValue(defaultCreateValues);
      return;
    }

    if (!achievementId) {
      setLoadError({
        kind: "unknown",
        message: "缺少成果 ID",
      });
      return;
    }

    setLoading(true);
    void apiClient
      .get<AchievementDetail>(`/achievements/${achievementId}`)
      .then((detail) => {
        setLoadedDetail(detail);
        form.setFieldsValue(toAchievementFormInitialValues(detail));
      })
      .catch((error: unknown) => setLoadError(normalizeError(error)))
      .finally(() => setLoading(false));
  }, [achievementId, apiClient, form, mode, open]);

  const title = useMemo(
    () => (isEdit ? "编辑草稿" : "登记成果"),
    [isEdit],
  );

  const handleTypeChange = (value: AchievementTypeCode) => {
    form.setFieldsValue({
      type: value,
      paperDetail: undefined,
      patentDetail: undefined,
      softwareCopyrightDetail: undefined,
    });
    setDoiPreview(emptyDoiPreviewState());
  };

  const handleRunDoiPreview = async () => {
    let payload: ApiIntegrationMockRunInput;

    try {
      payload = buildDoiPreviewPayload(form.getFieldValue(["paperDetail", "doi"]));
    } catch (error) {
      setDoiPreview({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : "请先输入 DOI 后再生成自动补全预演。",
      });
      return;
    }

    setDoiPreview({ loading: true, result: null, error: null });

    try {
      const result = await apiClient.post<ApiIntegrationMockRunResponse>(
        "/settings/api-integrations/mock-demo/run",
        payload,
      );
      setDoiPreview({ loading: false, result, error: null });
    } catch (error) {
      const apiError = normalizeError(error);
      setDoiPreview({
        loading: false,
        result: null,
        error: apiError.message || "DOI 自动补全预演暂不可用，可继续手工录入。",
      });
    }
  };

  const handleSubmit = async () => {
    setSaveError(null);
    let values: AchievementFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);

    try {
      if (mode === "create") {
        await apiClient.post<AchievementDetail>(
          "/achievements",
          buildCreateAchievementPayload(values),
        );
        void message.success("草稿已创建");
        onSaved({ close: true });
        return;
      }

      if (!achievementId) {
        throw {
          kind: "unknown",
          message: "缺少成果 ID",
        } satisfies ApiError;
      }

      await apiClient.patch<AchievementDetail>(
        `/achievements/${achievementId}`,
        buildUpdateAchievementPayload(values, values.type),
      );
      void message.success("草稿已保存");
      onSaved({ close: false });
    } catch (error) {
      setSaveError(normalizeError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      className="achievement-form-drawer"
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button
            disabled={Boolean(loadError)}
            loading={saving}
            type="primary"
            onClick={() => void handleSubmit()}
          >
            {isEdit ? "保存草稿" : "创建草稿"}
          </Button>
        </Space>
      }
      open={open}
      title={title}
      width={760}
      onClose={onClose}
    >
      <Space direction="vertical" size={16} className="full-width">
        <Alert
          showIcon
          type="info"
          message="填写说明"
          description={
            isEdit
              ? "当前仅支持修改草稿基础信息；贡献人信息在编辑时只读展示。"
              : "创建草稿时，所属部门由系统根据当前用户上下文确定。"
          }
        />
        {loadError ? <Alert showIcon type="error" message={loadError.message} description={loadError.detail} /> : null}
        {saveError ? <Alert showIcon type="error" message={saveError.message} description={saveError.detail} /> : null}

        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          disabled={loading}
        >
          <Divider orientation="left">基础信息</Divider>
          <Form.Item
            label="成果类型"
            name="type"
            rules={[{ required: true, message: "请选择成果类型" }]}
          >
            <Select
              disabled={isEdit}
              options={achievementTypeOptions}
              onChange={handleTypeChange}
            />
          </Form.Item>
          <Form.Item
            label="成果标题"
            name="title"
            rules={[
              { required: true, message: "请输入成果标题" },
              { max: 500, message: "成果标题不能超过 500 个字符" },
            ]}
          >
            <Input placeholder="请输入成果标题" />
          </Form.Item>
          <Form.Item label="密级" name="secretLevel">
            <Select options={secretLevelOptions} />
          </Form.Item>

          {loadedDetail ? (
            <Typography.Text type="secondary">
              所属部门：{loadedDetail.departmentId}；负责人：{loadedDetail.ownerUserId}
            </Typography.Text>
          ) : null}

          <Divider orientation="left">类型字段</Divider>
          {selectedType === "PAPER" ? (
            <PaperFields
              doiPreview={doiPreview}
              onRunDoiPreview={() => void handleRunDoiPreview()}
            />
          ) : null}
          {selectedType === "PATENT" ? <PatentFields /> : null}
          {selectedType === "SOFTWARE_COPYRIGHT" ? <SoftwareCopyrightFields /> : null}

          <Divider orientation="left">贡献人</Divider>
          <ContributorFields readonly={isEdit} />
        </Form>
      </Space>
    </Drawer>
  );
}

function PaperFields({
  doiPreview,
  onRunDoiPreview,
}: {
  doiPreview: DoiPreviewState;
  onRunDoiPreview: () => void;
}) {
  return (
    <>
      <Form.Item label="DOI" name={["paperDetail", "doi"]} rules={[{ max: 255 }]}>
        <Input />
      </Form.Item>
      <Form.Item label="自动补全">
        <Space direction="vertical" size={8} className="full-width">
          <Space wrap>
            <Button loading={doiPreview.loading} onClick={onRunDoiPreview}>
              自动补全预演
            </Button>
            <Typography.Text type="secondary">
              仅生成可人工确认的登记摘要，不会覆盖已填写内容。
            </Typography.Text>
          </Space>
          {doiPreview.error ? (
            <Alert
              showIcon
              type="warning"
              message={doiPreview.error}
              description="可继续手工录入题名、期刊、年份和摘要。"
            />
          ) : null}
          {doiPreview.result ? <DoiPreviewResult result={doiPreview.result} /> : null}
        </Space>
      </Form.Item>
      <Form.Item label="期刊" name={["paperDetail", "journal"]} rules={[{ max: 255 }]}>
        <Input />
      </Form.Item>
      <Form.Item label="ISSN/CN" name={["paperDetail", "issnCn"]} rules={[{ max: 64 }]}>
        <Input />
      </Form.Item>
      <Form.Item label="发表年份" name={["paperDetail", "publishYear"]}>
        <InputNumber className="full-width" min={1900} max={2100} precision={0} />
      </Form.Item>
      <Form.Item label="收录类型" name={["paperDetail", "includedType"]} rules={[{ max: 80 }]}>
        <Input />
      </Form.Item>
      <Form.Item label="影响因子" name={["paperDetail", "impactFactor"]}>
        <InputNumber className="full-width" min={0} precision={3} />
      </Form.Item>
      <Form.Item label="分区" name={["paperDetail", "partition"]} rules={[{ max: 80 }]}>
        <Input />
      </Form.Item>
      <Form.Item label="摘要" name={["paperDetail", "abstract"]} rules={[{ max: 5000 }]}>
        <Input.TextArea rows={4} />
      </Form.Item>
    </>
  );
}

function DoiPreviewResult({ result }: { result: ApiIntegrationMockRunResponse }) {
  const safeResult = result.safeResult;
  const title = getSafeString(safeResult, "title");
  const journal = getSafeString(safeResult, "journal");
  const publishYear = getSafeString(safeResult, "publishYear");
  const citationSummary = getSafeString(safeResult, "citationSummary");
  const authors = formatSafeValue(safeResult.authors);
  const fieldMapping = getSafeString(safeResult, "fieldMapping");
  const statusText = result.runStatus === "SUCCESS" ? "已生成预演摘要" : "已进入降级处理";

  return (
    <Alert
      showIcon
      type={result.runStatus === "SUCCESS" ? "success" : "info"}
      message={statusText}
      description={
        <Space direction="vertical" size={4}>
          <Typography.Text>题名：{title || "待人工确认"}</Typography.Text>
          <Typography.Text>作者：{authors || "待人工确认"}</Typography.Text>
          <Typography.Text>期刊/会议：{journal || "待人工确认"}</Typography.Text>
          <Typography.Text>发表年份：{publishYear || "待人工确认"}</Typography.Text>
          <Typography.Text>
            引用摘要：{citationSummary || result.summary || "可手工补充引用信息"}
          </Typography.Text>
          <Typography.Text>
            字段建议：{fieldMapping || "题名、作者、期刊/会议、发表年份"}
          </Typography.Text>
        </Space>
      }
    />
  );
}

function PatentFields() {
  return (
    <>
      <Form.Item label="申请号" name={["patentDetail", "applicationNo"]} rules={[{ max: 120 }]}>
        <Input />
      </Form.Item>
      <Form.Item label="授权号" name={["patentDetail", "grantNo"]} rules={[{ max: 120 }]}>
        <Input />
      </Form.Item>
      <Form.Item label="专利类型" name={["patentDetail", "patentType"]}>
        <Select allowClear options={patentTypeOptions} />
      </Form.Item>
      <Form.Item label="申请日" name={["patentDetail", "filingDate"]}>
        <Input type="date" />
      </Form.Item>
      <Form.Item label="授权日" name={["patentDetail", "grantDate"]}>
        <Input type="date" />
      </Form.Item>
      <Form.Item label="下次缴费日" name={["patentDetail", "nextFeeDate"]}>
        <Input type="date" />
      </Form.Item>
      <Form.Item label="费用金额" name={["patentDetail", "feeAmount"]}>
        <InputNumber className="full-width" min={0} precision={2} />
      </Form.Item>
      <Form.Item label="法律状态" name={["patentDetail", "legalStatus"]}>
        <Select allowClear options={patentLegalStatusOptions} />
      </Form.Item>
    </>
  );
}

function SoftwareCopyrightFields() {
  return (
    <>
      <Form.Item
        label="登记号"
        name={["softwareCopyrightDetail", "registrationNo"]}
        rules={[{ max: 120 }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="软件版本"
        name={["softwareCopyrightDetail", "softwareVersion"]}
        rules={[{ max: 80 }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="软件类型" name={["softwareCopyrightDetail", "softwareType"]}>
        <Select allowClear options={softwareTypeOptions} />
      </Form.Item>
      <Form.Item label="发布日期" name={["softwareCopyrightDetail", "publishDate"]}>
        <Input type="date" />
      </Form.Item>
      <Form.Item label="登记日期" name={["softwareCopyrightDetail", "registerDate"]}>
        <Input type="date" />
      </Form.Item>
      <Form.Item label="运行环境" name={["softwareCopyrightDetail", "runEnv"]} rules={[{ max: 255 }]}>
        <Input />
      </Form.Item>
    </>
  );
}

function ContributorFields({ readonly }: { readonly: boolean }) {
  return (
    <Form.List name="contributors">
      {(fields, { add, remove }) => (
        <Space direction="vertical" size={12} className="full-width">
          {readonly ? (
            <Alert
              showIcon
              type="warning"
              message="贡献人只读"
              description="编辑草稿时贡献人信息只读展示，本次保存不会变更贡献人。"
            />
          ) : null}
          {fields.map((field) => (
            <div className="contributor-row" key={field.key}>
              <Form.Item
                label="姓名"
                name={[field.name, "name"]}
                rules={[
                  { required: true, message: "请输入贡献人姓名" },
                  { max: 120, message: "姓名不能超过 120 个字符" },
                ]}
              >
                <Input disabled={readonly} />
              </Form.Item>
              <Form.Item
                label="用户 ID"
                name={[field.name, "userId"]}
                rules={[{ len: 36, message: "用户 ID 应为 UUID" }]}
              >
                <Input disabled={readonly} />
              </Form.Item>
              <Form.Item label="单位" name={[field.name, "organization"]} rules={[{ max: 255 }]}>
                <Input disabled={readonly} />
              </Form.Item>
              <Form.Item
                label="贡献人类型"
                name={[field.name, "contributorType"]}
                rules={[{ required: true, message: "请选择贡献人类型" }]}
              >
                <Select disabled={readonly} options={contributorTypeOptions} />
              </Form.Item>
              <Form.Item label="贡献角色" name={[field.name, "contributorRole"]}>
                <Select allowClear disabled={readonly} options={contributorRoleOptions} />
              </Form.Item>
              <Form.Item
                label="排序"
                name={[field.name, "sortOrder"]}
                rules={[{ required: true, message: "请输入排序" }]}
              >
                <InputNumber className="full-width" disabled={readonly} min={1} precision={0} />
              </Form.Item>
              {!readonly ? (
                <Button danger onClick={() => remove(field.name)}>
                  移除
                </Button>
              ) : null}
            </div>
          ))}
          {!readonly ? (
            <Button
              onClick={() =>
                add({
                  name: "",
                  contributorType: "AUTHOR",
                  sortOrder: fields.length + 1,
                })
              }
            >
              添加贡献人
            </Button>
          ) : null}
        </Space>
      )}
    </Form.List>
  );
}

export const isEditableAchievementStatus = (status: AchievementStatusCode): boolean =>
  status === "DRAFT";

export const buildCreateAchievementPayload = (
  values: AchievementFormValues,
): CreateAchievementPayload => {
  const type = values.type;
  const payload: CreateAchievementPayload = {
    type,
    title: requiredTrim(values.title),
    secretLevel: values.secretLevel ?? "INTERNAL",
    contributors: normalizeContributors(values.contributors),
  };

  if (type === "PAPER") {
    payload.paperDetail = normalizePaperDetail(values.paperDetail);
  }

  if (type === "PATENT") {
    payload.patentDetail = normalizePatentDetail(values.patentDetail);
  }

  if (type === "SOFTWARE_COPYRIGHT") {
    payload.softwareCopyrightDetail = normalizeSoftwareCopyrightDetail(
      values.softwareCopyrightDetail,
    );
  }

  return payload;
};

export const buildDoiPreviewPayload = (doi: unknown): ApiIntegrationMockRunInput => {
  const subject = optionalTrim(doi);

  if (!subject) {
    throw new Error("请先输入 DOI 后再生成自动补全预演。");
  }

  return {
    provider: "DOI",
    scenario: "DOI_LOOKUP",
    resultMode: "SUCCESS",
    subject,
  };
};

export const buildUpdateAchievementPayload = (
  values: AchievementFormValues,
  type: AchievementTypeCode,
): UpdateAchievementPayload => {
  const payload: UpdateAchievementPayload = {
    title: optionalTrim(values.title),
    secretLevel: values.secretLevel,
  };

  if (type === "PAPER") {
    payload.paperDetail = normalizePaperDetail(values.paperDetail);
  }

  if (type === "PATENT") {
    payload.patentDetail = normalizePatentDetail(values.patentDetail);
  }

  if (type === "SOFTWARE_COPYRIGHT") {
    payload.softwareCopyrightDetail = normalizeSoftwareCopyrightDetail(
      values.softwareCopyrightDetail,
    );
  }

  return removeUndefinedFields(payload);
};

export const toAchievementFormInitialValues = (
  detail: AchievementDetail,
): AchievementFormValues => ({
  type: detail.type,
  title: detail.title ?? "",
  secretLevel: detail.secretLevel ?? "INTERNAL",
  paperDetail: normalizePaperDetail(detail.paperDetail ?? undefined),
  patentDetail: normalizePatentDetail(detail.patentDetail ?? undefined),
  softwareCopyrightDetail: normalizeSoftwareCopyrightDetail(
    detail.softwareCopyrightDetail ?? undefined,
  ),
  contributors: [...(detail.contributors ?? [])]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((contributor) => ({
      name: contributor.name,
      userId: optionalTrim(contributor.userId),
      organization: optionalTrim(contributor.organization),
      contributorType: contributor.contributorType,
      contributorRole: contributor.contributorRole ?? undefined,
      sortOrder: contributor.sortOrder,
    })),
});

const normalizePaperDetail = (detail: PaperDetail | undefined): PaperDetail =>
  removeUndefinedFields({
    doi: optionalTrim(detail?.doi),
    journal: optionalTrim(detail?.journal),
    issnCn: optionalTrim(detail?.issnCn),
    publishYear: optionalNumber(detail?.publishYear),
    includedType: optionalTrim(detail?.includedType),
    impactFactor: optionalNumber(detail?.impactFactor),
    partition: optionalTrim(detail?.partition),
    abstract: optionalTrim(detail?.abstract),
  });

const normalizePatentDetail = (detail: PatentDetail | undefined): PatentDetail =>
  removeUndefinedFields({
    applicationNo: optionalTrim(detail?.applicationNo),
    grantNo: optionalTrim(detail?.grantNo),
    patentType: detail?.patentType ?? undefined,
    filingDate: optionalDate(detail?.filingDate),
    grantDate: optionalDate(detail?.grantDate),
    nextFeeDate: optionalDate(detail?.nextFeeDate),
    feeAmount: optionalNumber(detail?.feeAmount),
    legalStatus: detail?.legalStatus ?? undefined,
  });

const normalizeSoftwareCopyrightDetail = (
  detail: SoftwareCopyrightDetail | undefined,
): SoftwareCopyrightDetail =>
  removeUndefinedFields({
    registrationNo: optionalTrim(detail?.registrationNo),
    softwareVersion: optionalTrim(detail?.softwareVersion),
    softwareType: detail?.softwareType ?? undefined,
    publishDate: optionalDate(detail?.publishDate),
    registerDate: optionalDate(detail?.registerDate),
    runEnv: optionalTrim(detail?.runEnv),
  });

const normalizeContributors = (
  contributors: AchievementContributor[] | undefined,
): AchievementContributor[] =>
  (contributors ?? []).map((contributor, index) =>
    removeUndefinedFields({
      name: requiredTrim(contributor.name),
      userId: optionalTrim(contributor.userId),
      organization: optionalTrim(contributor.organization),
      contributorType: contributor.contributorType,
      contributorRole: contributor.contributorRole ?? undefined,
      sortOrder: optionalNumber(contributor.sortOrder) ?? index + 1,
    }),
  );

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

const requiredTrim = (value: unknown): string =>
  typeof value === "string" ? value.trim() : String(value ?? "").trim();

const optionalTrim = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return value === null || value === undefined ? undefined : String(value);
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const getSafeString = (value: Record<string, unknown>, key: string): string =>
  formatSafeValue(value[key]);

const formatSafeValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("、");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const optionalDate = (value: unknown): string | undefined => {
  const trimmed = optionalTrim(value);
  return trimmed ? trimmed.slice(0, 10) : undefined;
};

const optionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const trimmed = optionalTrim(value);
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const removeUndefinedFields = <Value extends Record<string, unknown>>(value: Value): Value => {
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return Object.fromEntries(entries) as Value;
};
