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
          colorPrimary: "#008b61",
          colorSuccess: "#138a5a",
          colorWarning: "#b87813",
          colorError: "#bd3d3d",
          colorInfo: "#167a82",
          colorText: "#092d3b",
          colorTextSecondary: "#5b747b",
          colorBorder: "#d5e2dc",
          colorBorderSecondary: "#e4eee9",
          colorBgLayout: "#edf4f1",
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
            colorPrimary: "#008b61",
            colorPrimaryHover: "#0a9b6d",
            colorPrimaryActive: "#006f50",
          },
          Card: {
            borderRadiusLG: 8,
            headerFontSize: 15,
            headerHeight: 48,
          },
          Table: {
            borderColor: "#e4eee9",
            cellPaddingBlock: 10,
            cellPaddingInline: 12,
            headerBg: "#f5faf7",
            headerColor: "#5b747b",
            rowHoverBg: "#f1faf4",
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
