declare global {
  interface Window {
    chatbotConfig?: {
      workspaceId?: string;
      // otros campos de configuración
    };
  }
}

export {};