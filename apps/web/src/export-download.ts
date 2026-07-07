import type { ApiClient, ApiQuery } from "./api-client";

export const downloadCsvExport = async (
  client: Pick<ApiClient, "downloadBlob">,
  path: string,
  query: ApiQuery | undefined,
  fileName: string,
): Promise<void> => {
  await downloadFileExport(client, path, query, fileName, "CSV");
};

export const downloadXlsxExport = async (
  client: Pick<ApiClient, "downloadBlob">,
  path: string,
  query: ApiQuery | undefined,
  fileName: string,
): Promise<void> => {
  await downloadFileExport(client, path, query, fileName, "Excel");
};

export const downloadPdfExport = async (
  client: Pick<ApiClient, "downloadBlob">,
  path: string,
  query: ApiQuery | undefined,
  fileName: string,
): Promise<void> => {
  await downloadFileExport(client, path, query, fileName, "PDF");
};

const downloadFileExport = async (
  client: Pick<ApiClient, "downloadBlob">,
  path: string,
  query: ApiQuery | undefined,
  fileName: string,
  label: string,
): Promise<void> => {
  if (!client.downloadBlob) {
    throw new Error(`${label} export requires blob API client support.`);
  }

  const blob = await client.downloadBlob(path, query);
  saveBlob(blob, fileName);
};

export const saveBlob = (blob: Blob, fileName: string): void => {
  if (
    typeof document === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
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
