#!/usr/bin/env bun

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Generate Markdown API documentation from Swagger JSON
 * Format: AI-friendly, easy to read
 */
async function generateAPIDocs() {
  console.log('📚 Generating API Documentation (Markdown)...\n');

  try {
    // Fetch Swagger JSON
    const response = await fetch('http://localhost:3000/api/docs-json');
    if (!response.ok) {
      throw new Error(`Failed to fetch Swagger JSON: ${response.status}`);
    }

    const swagger = await response.json();

    // Create docs directory
    const docsDir = join(process.cwd(), 'docs');
    mkdirSync(docsDir, { recursive: true });

    // Generate main API documentation
    const markdown = generateMarkdown(swagger);
    const filePath = join(docsDir, 'API.md');
    writeFileSync(filePath, markdown);

    console.log('✅ API Documentation generated successfully!\n');
    console.log(`📄 File: ${filePath}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Generate Markdown content from Swagger spec
 */
function generateMarkdown(swagger: any): string {
  const { info, paths, components } = swagger;
  
  let md = `# ${info.title}\n\n`;
  md += `${info.description || ''}\n\n`;
  md += `**Version:** ${info.version}\n\n`;
  md += `**Base URL:** \`http://localhost:3000/api/v1\`\n\n`;
  md += `---\n\n`;

  // Table of Contents
  md += `## 📑 Table of Contents\n\n`;
  const tags = extractTags(paths);
  tags.forEach(tag => {
    md += `- [${tag}](#${tag.toLowerCase().replace(/\s+/g, '-')})\n`;
  });
  md += `\n---\n\n`;

  // Group endpoints by tag
  const endpointsByTag = groupEndpointsByTag(paths);

  // Generate documentation for each tag
  for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
    md += `## ${tag}\n\n`;
    
    for (const endpoint of endpoints as any[]) {
      md += generateEndpointDoc(endpoint, components);
      md += `\n---\n\n`;
    }
  }

  // Schemas
  if (components?.schemas) {
    md += `## 📦 Schemas\n\n`;
    for (const [name, schema] of Object.entries(components.schemas)) {
      md += generateSchemaDoc(name, schema as any);
      md += `\n`;
    }
  }

  return md;
}

/**
 * Extract unique tags from paths
 */
function extractTags(paths: any): string[] {
  const tags = new Set<string>();
  for (const path of Object.values(paths)) {
    for (const method of Object.values(path as any)) {
      if ((method as any).tags) {
        (method as any).tags.forEach((tag: string) => tags.add(tag));
      }
    }
  }
  return Array.from(tags);
}

/**
 * Group endpoints by tag
 */
function groupEndpointsByTag(paths: any): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      const tag = (details as any).tags?.[0] || 'Other';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push({
        path,
        method: method.toUpperCase(),
        ...(details as object),
      });
    }
  }

  return grouped;
}

/**
 * Generate documentation for a single endpoint
 */
function generateEndpointDoc(endpoint: any, components: any): string {
  let md = `### ${endpoint.method} ${endpoint.path}\n\n`;
  
  // Summary
  if (endpoint.summary) {
    md += `**${endpoint.summary}**\n\n`;
  }

  // Description
  if (endpoint.description) {
    md += `${endpoint.description}\n\n`;
  }

  // Security
  if (endpoint.security && endpoint.security.length > 0) {
    md += `🔒 **Authentication Required:** Bearer Token\n\n`;
  }

  // Parameters
  if (endpoint.parameters && endpoint.parameters.length > 0) {
    md += `**Parameters:**\n\n`;
    md += `| Name | In | Type | Required | Description |\n`;
    md += `|------|-------|------|----------|-------------|\n`;
    endpoint.parameters.forEach((param: any) => {
      md += `| \`${param.name}\` | ${param.in} | ${param.schema?.type || 'string'} | ${param.required ? '✅' : '❌'} | ${param.description || '-'} |\n`;
    });
    md += `\n`;
  }

  // Request Body
  if (endpoint.requestBody) {
    md += `**Request Body:**\n\n`;
    const content = endpoint.requestBody.content?.['application/json'];
    if (content?.schema) {
      const schemaRef = content.schema.$ref;
      if (schemaRef) {
        const schemaName = schemaRef.split('/').pop();
        md += `Schema: [\`${schemaName}\`](#${schemaName.toLowerCase()})\n\n`;
        
        // Show schema inline
        const schema = components?.schemas?.[schemaName];
        if (schema) {
          md += '```json\n';
          md += JSON.stringify(generateExample(schema), null, 2);
          md += '\n```\n\n';
        }
      }
    }
  }

  // Responses
  if (endpoint.responses) {
    md += `**Responses:**\n\n`;
    for (const [code, response] of Object.entries(endpoint.responses)) {
      md += `- **${code}**: ${(response as any).description || 'Success'}\n`;
    }
    md += `\n`;
  }

  return md;
}

/**
 * Generate documentation for a schema
 */
function generateSchemaDoc(name: string, schema: any): string {
  let md = `### ${name}\n\n`;
  
  if (schema.description) {
    md += `${schema.description}\n\n`;
  }

  if (schema.properties) {
    md += `**Properties:**\n\n`;
    md += `| Property | Type | Required | Description |\n`;
    md += `|----------|------|----------|-------------|\n`;
    
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as any;
      const required = schema.required?.includes(propName) ? '✅' : '❌';
      const type = prop.type || 'object';
      const description = prop.description || prop.example || '-';
      md += `| \`${propName}\` | ${type} | ${required} | ${description} |\n`;
    }
    md += `\n`;
  }

  // Example
  md += `**Example:**\n\n`;
  md += '```json\n';
  md += JSON.stringify(generateExample(schema), null, 2);
  md += '\n```\n\n';

  return md;
}

/**
 * Generate example from schema
 */
function generateExample(schema: any): any {
  if (schema.example) return schema.example;
  
  if (schema.type === 'object' && schema.properties) {
    const example: any = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      example[key] = (prop as any).example || getDefaultValue((prop as any).type);
    }
    return example;
  }

  return getDefaultValue(schema.type);
}

/**
 * Get default value for type
 */
function getDefaultValue(type: string): any {
  switch (type) {
    case 'string': return 'string';
    case 'number': return 0;
    case 'integer': return 0;
    case 'boolean': return false;
    case 'array': return [];
    case 'object': return {};
    default: return null;
  }
}

// Run
generateAPIDocs();
