import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/components/toast"
import { Helmet, HelmetProvider } from 'react-helmet-async'

import Layout from './components/Layout'

// Placeholder for pages - adjust imports when files are moved
import HomePage from './pages/HomePage.tsx';
import StreamsPage from './pages/streams/page.tsx'; // Assuming structure from Next.js App Router
import WorkersPage from './pages/workers/page.tsx';
import ComponentConfigsPage from './pages/component-configs/page.tsx';
import ScannersPage from './pages/scanners/page.tsx';
import BuffersPage from './pages/buffers/page.tsx';
import CachesPage from './pages/caches/page.tsx';
// Import edit pages
import StreamEditPage from './pages/streams/[id]/edit/page.tsx';
import ComponentConfigEditPage from './pages/component-configs/[id]/edit/page.tsx';
// Import new pages
import StreamNewPage from './pages/streams/new/page.tsx';
import ComponentConfigNewPage from './pages/component-configs/new/page.tsx';

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
            <meta name="description" content="Admin dashboard for managing streams and components" />
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="streams" element={<StreamsPage />} />
          <Route path="streams/new" element={<StreamNewPage />} />
          <Route path="streams/:id/edit" element={<StreamEditPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="component-configs" element={<ComponentConfigsPage />} />
          <Route path="component-configs/new" element={<ComponentConfigNewPage />} />
          <Route path="component-configs/:id/edit" element={<ComponentConfigEditPage />} />
          <Route path="scanners" element={<ScannersPage />} />
          <Route path="buffers" element={<BuffersPage />} />
          <Route path="caches" element={<CachesPage />} />
          {/* Add routes for /new pages if they exist and need separate routes */}
          {/* Example: <Route path="streams/new" element={<StreamNewPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App; 