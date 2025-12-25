import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/toast";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

import Layout from "./components/Layout";

import LoginPage from "./pages/login/page.tsxe.tsx";
import HomePage from "./pages/HomePage.tsx";
import StreamsPage from "./pages/streams/page.tsx";
import WorkersPage from "./pages/workers/page.tsx";
import ScannersPage from "./pages/scanners/page.tsx";
import BuffersPage from "./pages/buffers/page.tsx";
import CachesPage from "./pages/caches/page.tsx";
import SecretsPage from "./pages/secrets/page.tsx";
import CacheNewPage from "./pages/caches/new/page.tsx";
import CacheEditPage from "./pages/caches/[id]/edit/page.tsx";
import RateLimitsPage from "./pages/rate-limits/page.tsx";
import RateLimitNewPage from "./pages/rate-limits/new/page.tsx";
import RateLimitEditPage from "./pages/rate-limits/[id]/edit/page.tsx";
import StreamEditPage from "./pages/streams/[id]/edit/page.tsx";
import StreamNewPage from "./pages/streams/new/page.tsx";

const AppLayout: React.FC = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <ToastProvider>
          <Helmet>
            <title>Admin Dashboard</title>
            <meta
              name="description"
              content="Admin dashboard for managing streams and components"
            />
          </Helmet>
          <Layout>
            <Outlet />
          </Layout>
        </ToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="streams" element={<StreamsPage />} />
          <Route path="streams/new" element={<StreamNewPage />} />
          <Route path="streams/:id/edit" element={<StreamEditPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="secrets" element={<SecretsPage />} />
          <Route path="scanners" element={<ScannersPage />} />
          <Route path="buffers" element={<BuffersPage />} />
          <Route path="caches" element={<CachesPage />} />
          <Route path="caches/new" element={<CacheNewPage />} />
          <Route path="caches/:id/edit" element={<CacheEditPage />} />
          <Route path="rate-limits" element={<RateLimitsPage />} />
          <Route path="rate-limits/new" element={<RateLimitNewPage />} />
          <Route path="rate-limits/:id/edit" element={<RateLimitEditPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
