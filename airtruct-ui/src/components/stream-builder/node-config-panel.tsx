"use client";

import { useState, useEffect } from "react";
import type { Node } from "reactflow";
import type { StreamNodeData } from "./stream-node";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";
import { ComponentConfig } from "../../lib/entities";

interface NodeConfigPanelProps {
  selectedNode: Node<StreamNodeData> | null;
  componentConfigsData: ComponentConfig[];
  onUpdateNode: (nodeId: string, data: StreamNodeData) => void;
  onDeleteNode: (nodeId: string) => void;
}

export function NodeConfigPanel({
  selectedNode,
  componentConfigsData,
  onUpdateNode,
  onDeleteNode,
}: NodeConfigPanelProps) {
  const [nodeData, setNodeData] = useState<StreamNodeData | null>(null);

  // Filter component configs by section
  const componentConfigs = selectedNode
    ? componentConfigsData.filter((c) => c.type === selectedNode.data.type)
    : [];

  useEffect(() => {
    if (selectedNode) {
      setNodeData({ ...selectedNode.data });
    } else {
      setNodeData(null);
    }
  }, [selectedNode]);

  if (!selectedNode || !nodeData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Node Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a node to configure it</p>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (field: keyof StreamNodeData, value: string) => {
    const updatedData = { ...nodeData, [field]: value };
    setNodeData(updatedData);
    onUpdateNode(selectedNode.id, updatedData);
  };

  const handleComponentChange = (componentId: string) => {
    const component = componentConfigsData.find((c) => c.id === componentId);
    if (component) {
      // Update both component display name and componentId
      const updatedData = {
        ...nodeData,
        component: `${component.name} (${component.component})`,
        componentId: component.id,
      };
      setNodeData(updatedData);
      onUpdateNode(selectedNode.id, updatedData);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Configure{" "}
          {nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1)} Node
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-label">Label</Label>
          <Input
            id="node-label"
            value={nodeData.label}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-z0-9_-]*$/.test(value)) {
                handleChange("label", value);
              }
            }}
            placeholder="Node label"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-component">Component</Label>
          <Select
            value={nodeData.componentId || ""}
            onValueChange={handleComponentChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select component" />
            </SelectTrigger>
            <SelectContent>
              {componentConfigs.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.name} ({comp.component})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          Delete Node
        </Button>
      </CardContent>
    </Card>
  );
}
