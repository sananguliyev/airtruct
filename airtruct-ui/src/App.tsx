import "./index.css";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ComponentConfigsPage from "./pages/ComponentConfigs/index";
import NewComponentConfigPage from "./pages/ComponentConfigs/New/index";
import EditComponentConfigPage from "./pages/ComponentConfigs/Edit/index";
import { ToastProvider } from "./components/toast";
import StreamsPage from "./pages/Streams";
import NewStreamPage from "./pages/Streams/New";
import EditStreamPage from "./pages/Streams/Edit";
function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/component-configs" element={<ComponentConfigsPage />} />
        <Route
          path="/component-configs/new"
          element={<NewComponentConfigPage />}
        />
        <Route
          path="/component-configs/:id/edit"
          element={<EditComponentConfigPage />}
        />
        <Route path="/streams" element={<StreamsPage />} />
        <Route path="/streams/new" element={<NewStreamPage />} />
        <Route path="/streams/:id/edit" element={<EditStreamPage />} />
        </Routes>
    </ToastProvider>
  );
}

export default App;
