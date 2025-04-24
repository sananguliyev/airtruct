// src/components/ComponentConfigs/ConfigFormCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Loader2 } from "lucide-react";
import { NestedFormField } from "../../components/nested-form-field";

interface ConfigFormCardProps {
  isLoading: boolean;
  configSchema: any;
  configValues: any;
  handleConfigChange: (key: string, value: any) => void;
}

const ConfigFormCard: React.FC<ConfigFormCardProps> = ({
  isLoading,
  configSchema,
  configValues,
  handleConfigChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : configSchema ? (
          <div className="space-y-6">
            {Object.entries(configSchema).map(([key, field]) => (
              <NestedFormField
                key={key}
                fieldKey={key}
                field={field}
                value={configValues[key]}
                onChange={handleConfigChange}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-4">Loading configuration...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfigFormCard;
