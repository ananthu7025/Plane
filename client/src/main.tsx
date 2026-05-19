import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { setStore } from "@/api/client";
import "./index.css";
import App from "./App";

// Validate required environment variables
function validateEnvironment() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiBaseUrl) {
    const errorMsg =
      "Missing required environment variable: VITE_API_BASE_URL. Please check your .env file.";
    console.error(errorMsg);
    // Show error to user
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `<div style="padding: 20px; color: red; font-family: system-ui;">
        <h1>Configuration Error</h1>
        <p>${errorMsg}</p>
      </div>`;
    }
    throw new Error(errorMsg);
  }
}

validateEnvironment();

// Initialize axios client with Redux store (required for token refresh mechanism)
setStore(store);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate
        loading={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              backgroundColor: "#f5f5f5",
              fontFamily: "system-ui",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid #ddd",
                  borderTop: "4px solid #3b82f6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 20px",
                }}
              />
              <p>Loading...</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        }
        persistor={persistor}
      >
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
);
