import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import './index.css';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme"; // ✅ 아까 만든 테마 불러오기

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
      <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
