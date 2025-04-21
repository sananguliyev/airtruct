// src/components/ComponentConfigs/BasicInfoCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { componentLists } from "../../lib/component-schemas";

interface BasicInfoCardProps {
  formData: any;
  componentSection: string;
  selectedComponent: string;
  handleBasicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSectionChange: (value: string) => void;
  handleComponentChange: (value: string) => void;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({
  formData,
  componentSection,
  selectedComponent,
  handleBasicChange,
  handleSectionChange,
  handleComponentChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleBasicChange}
            placeholder="Component config name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Select
            value={componentSection}
            onValueChange={handleSectionChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select component section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="input">Input</SelectItem>
              <SelectItem value="pipeline">Pipeline</SelectItem>
              <SelectItem value="output">Output</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {componentSection && (
          <div className="space-y-2">
            <Label htmlFor="component">Component</Label>
            <Select
              value={selectedComponent}
              onValueChange={handleComponentChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select component" />
              </SelectTrigger>
              <SelectContent>
                {componentLists[componentSection].map((comp) => (
                  <SelectItem key={comp} value={comp}>
                    {comp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Created: {new Date(formData.created_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoCard;
