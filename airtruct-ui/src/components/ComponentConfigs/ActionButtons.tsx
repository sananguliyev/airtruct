import React from "react";
import { Button } from "../../ui/button";
import { Loader2 } from "lucide-react";
import { ActionButtonsProps } from "./types";

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isSubmitting,
  onCancel,
  disabled,
}) => {
  return (
    <div className="flex justify-between">
      <Button variant="outline" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={disabled}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Component Config"
        )}
      </Button>
    </div>
  );
};

export default ActionButtons;
