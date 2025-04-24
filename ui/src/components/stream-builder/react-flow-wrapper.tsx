import type { ReactNode } from "react";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";

export function ReactFlowWrapper({ children }: { children: ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
