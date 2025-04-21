export interface ComponentConfig {
    id: string;
    name: string;
    section: string;
    component: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface ActionButtonsProps {
    isSubmitting: boolean;
    onCancel: () => void;
    disabled: boolean;
  }
  
  export interface ConfigFormCardProps {
    isLoading: boolean;
    configSchema: any;
    configValues: any;
    handleConfigChange: (key: string, value: any) => void;
  }
  
  export interface BasicInfoCardProps {
    formData: any;
    componentSection: string;
    selectedComponent: string;
    handleBasicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSectionChange: (value: string) => void;
    handleComponentChange: (value: string) => void;
  }
