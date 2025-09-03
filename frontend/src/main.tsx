import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initAuth } from "./store/authSlice";
import App from "./App";

store.dispatch(initAuth() as any);

function Placeholder({ label }: { label: string }) {
  return <div className="p-6 text-sm text-muted-foreground">{label}</div>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<App />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
