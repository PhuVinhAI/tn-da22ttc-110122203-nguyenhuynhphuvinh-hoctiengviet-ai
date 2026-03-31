#!/usr/bin/env bun

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Generate AI-OPTIMIZED Markdown API documentation from Swagger JSON
 * 
 * Features:
 * - Complete request/response schemas with examples
 * - Enum values inline
 * - Nested object expansion
 * - Error response details
 * - Type information for arrays and objects
 * - Split by module for better AI context management
 */
async function generateAPIDocs() {
  console.log('📚 Generating AI-Optimized API Documentation...\n');

  try {
    // Fetch Swagger JSON
    const response = await fetch('http://localhost:3000/api/docs-json');
    if (!response.ok) {
      throw new Error(`Failed to fetch Swagger JSON: ${response.status}`);
    }

    const swagger = await response.json();

    // Create directories
    const docsDir = join(process.cwd(), 'docs');
    const kiroApiDocsDir = join(process.cwd(), '..', '.kiro', 'api-docs');
    mkdirSync(docsDir, { recursive: true });
    mkdirSync(kiroApiDocsDir, { recursive: true });

    // Generate main API documentation (legacy, for reference)
    const markdown = generateMarkdown(swagger);
    const filePath = join(docsDir, 'API.md');
    writeFileSync(filePath, markdown);

    // Generate split documentation by module
    generateSplitDocs(swagger, kiroApiDocsDir);

    // Generate steering index
    generateSteeringIndex(swagger, join(process.cwd(), '..', '.kiro', 'steering'));

    console.log('✅ API Documentation generated successfully!\n');
    console.log(`📄 Main file: ${filePath}`);
    console.log(`📁 Split docs: ${kiroApiDocsDir}\n`);
    console.log('🤖 Optimized for AI consumption with:');
    console.log('   - Complete request/response schemas');
    console.log('   - Inline enum values');
    console.log('   - Nested object expansion');
    console.log('   - Error response details');
    console.log('   - Split by module for better context management\n');
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
  md += `> ${info.description || 'API Documentation'}\n\n`;
  md += `**Version:** ${info.version}  \n`;
  md += `**Base URL:** \`http://localhost:3000/api/v1\`\n\n`;
  
  // AI-friendly metadata
  md += `## 🤖 AI Integration Notes\n\n`;
  md += `This documentation is optimized for AI/LLM consumption:\n`;
  md += `- All request bodies include complete JSON examples\n`;
  md += `- All response bodies show expected structure\n`;
  md += `- Enum values are listed inline with types\n`;
  md += `- Nested objects are fully expanded\n`;
  md += `- Error responses include status codes and descriptions\n\n`;
  md += `---\n\n`;

  // Table of Contents
  md += `## 📑 Table of Contents\n\n`;
  const tags = extractTags(paths);
  tags.forEach(tag => {
    md += `- [${tag}](#${tag.toLowerCase().replace(/\s+/g, '-')})\n`;
  });
  md += `- [Schemas](#-schemas)\n`;
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
    md += `Complete schema definitions for all DTOs used in the API.\n\n`;
    
    for (const [name, schema] of Object.entries(components.schemas)) {
      md += generateSchemaDoc(name, schema as any, components);
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
      const type = param.schema?.type || 'string';
      const enumValues = param.schema?.enum ? ` (${param.schema.enum.join(', ')})` : '';
      md += `| \`${param.name}\` | ${param.in} | ${type}${enumValues} | ${param.required ? '✅' : '❌'} | ${param.description || '-'} |\n`;
    });
    md += `\n`;
  }

  // Request Body
  if (endpoint.requestBody) {
    md += `**Request Body:**\n\n`;
    const content = endpoint.requestBody.content?.['application/json'] || 
                    endpoint.requestBody.content?.['multipart/form-data'];
    
    if (content?.schema) {
      const schemaRef = content.schema.$ref;
      if (schemaRef) {
        const schemaName = schemaRef.split('/').pop();
        md += `Type: [\`${schemaName}\`](#${schemaName.toLowerCase()})\n\n`;
        
        // Show schema inline with full details
        const schema = components?.schemas?.[schemaName];
        if (schema) {
          md += '```json\n';
          md += JSON.stringify(generateExampleDeep(schema, components), null, 2);
          md += '\n```\n\n';
        }
      } else if (content.schema) {
        // Inline schema without $ref
        md += '```json\n';
        md += JSON.stringify(generateExampleDeep(content.schema, components), null, 2);
        md += '\n```\n\n';
      }
    } else {
      md += `_No request body schema available_\n\n`;
    }
  }

  // Responses
  if (endpoint.responses) {
    md += `**Responses:**\n\n`;
    
    // Sort responses by status code
    const sortedResponses = Object.entries(endpoint.responses).sort(([a], [b]) => {
      return parseInt(a) - parseInt(b);
    });
    
    for (const [code, response] of sortedResponses) {
      const resp = response as any;
      const statusEmoji = getStatusEmoji(code);
      md += `${statusEmoji} **${code}** - ${resp.description || 'Success'}\n\n`;
      
      // Show response body structure if available
      const respContent = resp.content?.['application/json'];
      if (respContent?.schema) {
        const respSchemaRef = respContent.schema.$ref;
        if (respSchemaRef) {
          const respSchemaName = respSchemaRef.split('/').pop();
          md += `Response Type: [\`${respSchemaName}\`](#${respSchemaName.toLowerCase()})\n\n`;
          
          // Show inline example
          const respSchema = components?.schemas?.[respSchemaName];
          if (respSchema) {
            md += '```json\n';
            md += JSON.stringify(generateExampleDeep(respSchema, components), null, 2);
            md += '\n```\n\n';
          }
        } else if (respContent.schema.type === 'object' || respContent.schema.properties) {
          md += '```json\n';
          md += JSON.stringify(generateExampleDeep(respContent.schema, components), null, 2);
          md += '\n```\n\n';
        } else if (respContent.schema.type === 'array') {
          md += '```json\n';
          md += JSON.stringify(generateExampleDeep(respContent.schema, components), null, 2);
          md += '\n```\n\n';
        }
      }
    }
  }

  return md;
}

/**
 * Get emoji for status code
 */
function getStatusEmoji(code: string): string {
  const num = parseInt(code);
  if (num >= 200 && num < 300) return '✅';
  if (num >= 300 && num < 400) return '↪️';
  if (num >= 400 && num < 500) return '⚠️';
  if (num >= 500) return '❌';
  return '📝';
}

/**
 * Generate documentation for a schema
 */
function generateSchemaDoc(name: string, schema: any, components: any): string {
  let md = `### ${name}\n\n`;
  
  if (schema.description) {
    md += `> ${schema.description}\n\n`;
  }

  if (schema.properties) {
    md += `**Properties:**\n\n`;
    md += `| Property | Type | Required | Description |\n`;
    md += `|----------|------|----------|-------------|\n`;
    
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as any;
      const required = schema.required?.includes(propName) ? '✅' : '❌';
      
      // Get detailed type information
      let typeStr = getTypeString(prop, components);
      
      const description = prop.description || '-';
      md += `| \`${propName}\` | ${typeStr} | ${required} | ${description} |\n`;
    }
    md += `\n`;
  }

  // Example with deep resolution
  md += `**Example:**\n\n`;
  md += '```json\n';
  md += JSON.stringify(generateExampleDeep(schema, components), null, 2);
  md += '\n```\n\n';

  return md;
}

/**
 * Get detailed type string for a property
 */
function getTypeString(prop: any, components: any): string {
  // Handle $ref
  if (prop.$ref) {
    const refName = prop.$ref.split('/').pop();
    return `[${refName}](#${refName.toLowerCase()})`;
  }
  
  // Handle arrays
  if (prop.type === 'array' && prop.items) {
    if (prop.items.$ref) {
      const itemType = prop.items.$ref.split('/').pop();
      return `array<[${itemType}](#${itemType.toLowerCase()})>`;
    }
    const itemType = prop.items.type || 'object';
    if (prop.items.enum) {
      return `array<${itemType}> (${prop.items.enum.join(', ')})`;
    }
    return `array<${itemType}>`;
  }
  
  // Handle enums
  if (prop.enum && prop.enum.length > 0) {
    const baseType = prop.type || 'string';
    return `${baseType} (${prop.enum.join(', ')})`;
  }
  
  // Handle objects
  if (prop.type === 'object' || prop.properties) {
    return 'object';
  }
  
  // Default type
  return prop.type || 'any';
}

/**
 * Generate example from schema with deep resolution of $ref and nested objects
 */
function generateExampleDeep(schema: any, components: any, depth: number = 0, visited: Set<string> = new Set()): any {
  // Prevent infinite recursion
  if (depth > 5) return '...';

  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    
    // Prevent circular references
    if (visited.has(refName)) {
      return `<${refName}>`;
    }
    
    const refSchema = components?.schemas?.[refName];
    if (refSchema) {
      const newVisited = new Set(visited);
      newVisited.add(refName);
      return generateExampleDeep(refSchema, components, depth + 1, newVisited);
    }
    return `<${refName}>`;
  }

  // Use explicit example if provided
  if (schema.example !== undefined) return schema.example;

  // Handle arrays
  if (schema.type === 'array') {
    if (schema.items) {
      const itemExample = generateExampleDeep(schema.items, components, depth + 1, visited);
      return [itemExample];
    }
    return [];
  }

  // Handle objects
  if (schema.type === 'object' || schema.properties) {
    const example: any = {};
    
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const propSchema = prop as any;
        
        // Handle nested $ref
        if (propSchema.$ref) {
          example[key] = generateExampleDeep(propSchema, components, depth + 1, visited);
        }
        // Handle nested objects
        else if (propSchema.type === 'object' && propSchema.properties) {
          example[key] = generateExampleDeep(propSchema, components, depth + 1, visited);
        }
        // Handle arrays
        else if (propSchema.type === 'array') {
          example[key] = generateExampleDeep(propSchema, components, depth + 1, visited);
        }
        // Handle enums
        else if (propSchema.enum && propSchema.enum.length > 0) {
          example[key] = propSchema.enum[0];
        }
        // Use example or default
        else {
          example[key] = propSchema.example !== undefined 
            ? propSchema.example 
            : getDefaultValue(propSchema.type);
        }
      }
    }
    
    return example;
  }

  // Handle enums
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  // Default values
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

/**
 * Generate split documentation by module
 */
function generateSplitDocs(swagger: any, outputDir: string) {
  const { paths, components } = swagger;
  const endpointsByTag = groupEndpointsByTag(paths);

  console.log('📂 Generating split documentation by module...');

  for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
    let md = `# ${tag} API\n\n`;
    md += `> API endpoints for ${tag} module\n\n`;
    md += `**Base URL:** \`http://localhost:3000/api/v1\`\n\n`;
    md += `---\n\n`;

    // Generate endpoints for this tag
    for (const endpoint of endpoints as any[]) {
      md += generateEndpointDoc(endpoint, components);
      md += `\n---\n\n`;
    }

    // Add relevant schemas for this tag
    const relevantSchemas = findRelevantSchemas(endpoints as any[], components);
    if (relevantSchemas.length > 0) {
      md += `## 📦 Related Schemas\n\n`;
      for (const schemaName of relevantSchemas) {
        const schema = components?.schemas?.[schemaName];
        if (schema) {
          md += generateSchemaDoc(schemaName, schema, components);
          md += `\n`;
        }
      }
    }

    // Write to file
    const fileName = tag.toLowerCase().replace(/\s+/g, '-') + '.md';
    const filePath = join(outputDir, fileName);
    writeFileSync(filePath, md);
    console.log(`   ✓ ${fileName}`);
  }
}

/**
 * Find relevant schemas for a set of endpoints
 */
function findRelevantSchemas(endpoints: any[], components: any): string[] {
  const schemas = new Set<string>();

  for (const endpoint of endpoints) {
    // Check request body
    const requestContent = endpoint.requestBody?.content?.['application/json'];
    if (requestContent?.schema?.$ref) {
      const schemaName = requestContent.schema.$ref.split('/').pop();
      schemas.add(schemaName);
    }

    // Check responses
    if (endpoint.responses) {
      for (const response of Object.values(endpoint.responses)) {
        const resp = response as any;
        const respContent = resp.content?.['application/json'];
        if (respContent?.schema?.$ref) {
          const schemaName = respContent.schema.$ref.split('/').pop();
          schemas.add(schemaName);
        }
      }
    }
  }

  return Array.from(schemas);
}

/**
 * Generate steering index file
 */
function generateSteeringIndex(swagger: any, steeringDir: string) {
  const { paths } = swagger;
  const tags = extractTags(paths);

  console.log('📋 Generating steering index...');

  let md = `---
description: API Reference Index - BẮT BUỘC đọc docs module tương ứng trước khi code để tránh ảo giác về API
---

# LinVNix API Reference Index

> **CRITICAL - Hướng dẫn cho AI:**
> 
> 1. **File này là INDEX/MAP** - Liệt kê tất cả API modules có sẵn
> 2. **BẮT BUỘC đọc docs trước khi code** - Đọc file tương ứng trong \`.kiro/api-docs/{module}.md\` trước khi chỉnh sửa bất kỳ endpoint nào
> 3. **Tránh ảo giác về API** - KHÔNG đoán request/response schema, luôn verify với docs
> 
> **Khi thêm/sửa endpoint:**
> 1. Thêm Swagger decorators đầy đủ (\`@ApiOperation\`, \`@ApiResponse\`, \`@ApiBody\`, etc.)
> 2. Chạy \`npm run docs:generate\` trong \`backend/\` để cập nhật docs
> 3. Verify docs đã được generate đúng trước khi commit

## 📚 Available API Modules

Dưới đây là danh sách các module API có sẵn. Mỗi module được tách thành file riêng để tối ưu context window.

`;

  for (const tag of tags) {
    const fileName = tag.toLowerCase().replace(/\s+/g, '-');
    md += `### ${tag}\n`;
    md += `📄 File: \`.kiro/api-docs/${fileName}.md\`\n\n`;
    
    // List endpoints in this tag
    const endpointsByTag = groupEndpointsByTag(paths);
    const endpoints = endpointsByTag[tag] || [];
    
    md += `**Endpoints:**\n`;
    for (const endpoint of endpoints as any[]) {
      md += `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.summary || 'No description'}\n`;
    }
    md += `\n`;
  }

  md += `---

## 🤖 AI Workflow

Khi làm việc với API:

1. **Đọc file module tương ứng** trước khi code
2. **Kiểm tra request/response schema** để hiểu đúng cấu trúc
3. **Xem ví dụ JSON** để tránh sai format
4. **Không đoán** - luôn verify với docs

## 📝 Notes

- Docs được tự động generate từ Swagger
- Chạy \`npm run docs:generate\` để cập nhật
- Mỗi module có schemas liên quan đi kèm
`;

  const filePath = join(steeringDir, 'API_REFERENCE.md');
  writeFileSync(filePath, md);
  console.log(`   ✓ API_REFERENCE.md (steering index)`);
}
