import "antd/dist/reset.css";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#2f6f8f",
          colorSuccess: "#2f6b4f",
          colorWarning: "#a16207",
          colorError: "#b42318",
          colorInfo: "#2f6f8f",
          colorText: "#17202c",
          colorTextSecondary: "#5f6b7a",
          colorBorder: "#d9e0e8",
          colorBorderSecondary: "#e7edf3",
          colorBgLayout: "#f4f6f8",
          colorBgContainer: "#ffffff",
          borderRadius: 8,
          controlHeight: 34,
          fontFamily: `"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif`,
          fontSize: 14,
          wireframe: false,
        },
        components: {
          Button: {
            borderRadius: 6,
            controlHeight: 34,
            fontWeight: 600,
            primaryShadow: "none",
          },
          Card: {
            borderRadiusLG: 8,
            headerFontSize: 15,
            headerHeight: 48,
          },
          Table: {
            borderColor: "#e7edf3",
            cellPaddingBlock: 10,
            cellPaddingInline: 12,
            headerBg: "#f7fafc",
            headerColor: "#5f6b7a",
            rowHoverBg: "#f3f8fb",
          },
          Tag: {
            borderRadiusSM: 999,
            defaultBg: "#f8fafc",
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
