import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./layout/ProtectedRoute";
import Layout from "./layout/Layout";
import { appRoutes, legacyRedirects } from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {appRoutes
          .filter((r) => r.public)
          .map((r) => (
            <Route key={r.path} path={r.path} element={<r.element />} />
          ))}

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {legacyRedirects.map((r) => (
          <Route
            key={r.from}
            path={r.from}
            element={<Navigate to={r.to} replace />}
          />
        ))}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {appRoutes
            .filter((r) => !r.public)
            .map((r) => (
              <Route
                key={r.path}
                path={r.path}
                element={
                  r.roles ? (
                    <ProtectedRoute allowedRoles={r.roles}>
                      <r.element />
                    </ProtectedRoute>
                  ) : (
                    <r.element />
                  )
                }
              />
            ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
