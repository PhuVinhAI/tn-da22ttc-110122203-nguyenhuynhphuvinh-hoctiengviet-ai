export interface PromptTemplateVariable {
  name: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface PromptTemplate {
  name: string;
  description?: string;
  template: string;
  variables: PromptTemplateVariable[];
}

export interface PromptTemplateCollection {
  version: string;
  templates: Record<string, PromptTemplate>;
}
