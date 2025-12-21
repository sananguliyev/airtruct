import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/toast";
import { Helmet, HelmetProvider } from "react-helmet-async";

import Layout from "./components/Layout";

// Placeholder for pages - adjust imports when files are moved
import HomePage from "./pages/HomePage.tsx";
import StreamsPage from "./pages/streams/page.tsx"; // Assuming structure from Next.js App Router
import WorkersPage from "./pages/workers/page.tsx";
import ScannersPage from "./pages/scanners/page.tsx";
import BuffersPage from "./pages/buffers/page.tsx";
import CachesPage from "./pages/caches/page.tsx";
import SecretsPage from "./pages/secrets/page.tsx";
import CacheNewPage from "./pages/caches/new/page.tsx";
import CacheEditPage from "./pages/caches/[id]/edit/page.tsx";
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
    <Routes>
      <Route path="/" element={<AppLayout />}>
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
      </Route>
    </Routes>
  );
}

export default App;
