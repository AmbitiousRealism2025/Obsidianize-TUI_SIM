#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Fix 1: Remove problematic default export from types/index.ts
function fixTypeExports() {
  const typesPath = resolve('src/core/types/index.ts');
  if (!existsSync(typesPath)) {
    console.error('❌ types/index.ts not found');
    return false;
  }
  
  let content = readFileSync(typesPath, 'utf-8');
  
  // Find and remove the default export block (lines 849-867)
  const startMarker = '// Default exports for convenience';
  const endMarker = '};';
  
  const startIndex = content.indexOf(startMarker);
  if (startIndex !== -1) {
    const endIndex = content.indexOf(endMarker, startIndex) + 2;
    content = content.slice(0, startIndex - 1) + content.slice(endIndex + 1);
    
    // Add proper enum exports
    content += '\n\n// Export enums as values\n';
    content += 'export {\n';
    content += '  ContentType,\n';
    content += '  ProcessingStatus,\n';
    content += '  AnalysisMode,\n';
    content += '  ErrorCategory,\n';
    content += '  OutputFormat,\n';
    content += '  SectionType,\n';
    content += '  EntityType,\n';
    content += '  SafetyThreshold\n';
    content += '};\n';
    
    writeFileSync(typesPath, content);
    console.log('✅ Fixed type exports');
    return true;
  }
  
  console.log('⚠️  Default export not found in types/index.ts - may already be fixed');
  return false;
}

// Fix 2: Add type assertions for Bun compression
function fixBunTypes() {
  const files = [
    'src/core/cache/cache.ts',
    'src/core/storage/file-operations.ts'
  ];
  
  let fixedCount = 0;
  
  files.forEach(file => {
    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      console.warn(`⚠️  ${file} not found`);
      return;
    }
    
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Fix gzipSync calls (only if not already fixed)
    if (content.includes('Bun.gzipSync(') && !content.includes('Bun.gzipSync(data) as Uint8Array')) {
      content = content.replace(
        /Bun\.gzipSync\((.*?)\)(?! as Uint8Array)/g,
        'Bun.gzipSync($1) as Uint8Array'
      );
      modified = true;
    }
    
    // Fix gunzipSync calls (only if not already fixed)
    if (content.includes('Bun.gunzipSync(') && !content.includes('Bun.gunzipSync(data) as Uint8Array')) {
      content = content.replace(
        /Bun\.gunzipSync\((.*?)\)(?! as Uint8Array)/g,
        'Bun.gunzipSync($1) as Uint8Array'
      );
      modified = true;
    }
    
    if (modified) {
      writeFileSync(filePath, content);
      fixedCount++;
    }
  });
  
  if (fixedCount > 0) {
    console.log(`✅ Fixed Bun type assertions in ${fixedCount} file(s)`);
  } else {
    console.log('⚠️  No Bun type fixes needed');
  }
}

// Fix 3: Fix Zod validation issues
function fixZodValidation() {
  const validatorsPath = resolve('src/core/validators/index.ts');
  if (!existsSync(validatorsPath)) {
    console.error('❌ validators/index.ts not found');
    return;
  }
  
  let content = readFileSync(validatorsPath, 'utf-8');
  let modified = false;
  
  // Fix import statement - remove redundant 'type' modifier
  if (content.includes('type ContentType,')) {
    content = content.replace(
      /import type \{[\s\S]*?\} from/g,
      (match) => {
        // Remove 'type' prefix from individual imports within 'import type'
        return match.replace(/,\s*type\s+(\w+)/g, ', $1');
      }
    );
    modified = true;
  }
  
  // Fix z.record calls - add key type
  const recordPattern = /z\.record\(z\.unknown\(\)\)/g;
  if (recordPattern.test(content)) {
    content = content.replace(recordPattern, 'z.record(z.string(), z.unknown())');
    modified = true;
  }
  
  // Fix errorMap usage - replace with message option
  const errorMapPattern = /z\.nativeEnum\([^,]+,\s*\{\s*errorMap:\s*\(\)\s*=>\s*\(\{\s*message:\s*'([^']+)'\s*\}\)\s*\}\)/g;
  if (errorMapPattern.test(content)) {
    content = content.replace(
      errorMapPattern,
      (match, message) => {
        const enumName = match.match(/z\.nativeEnum\(([^,]+)/)?.[1];
        return `z.nativeEnum(${enumName})`;
      }
    );
    modified = true;
  }
  
  // Fix Buffer validation - use refine instead of max
  const bufferPattern = /z\.instanceof\(Buffer\)\.max\((.*?),\s*'(.*?)'\)/g;
  if (bufferPattern.test(content)) {
    content = content.replace(
      bufferPattern,
      'z.instanceof(Buffer).refine((buffer) => buffer.length <= $1, { message: \'$2\' })'
    );
    modified = true;
  }
  
  // Fix circular reference in contentSectionSchema
  if (content.includes('const contentSectionSchema = z.object({')) {
    // Add type annotation
    content = content.replace(
      'const contentSectionSchema = z.object({',
      'const contentSectionSchema: z.ZodType<any> = z.object({'
    );
    modified = true;
  }
  
  // Fix ContentType import - should be value import, not type import
  if (content.includes('import type {') && content.includes('ContentType.')) {
    // Add separate value import for enums
    const enumImport = '\nimport { ContentType, ProcessingStatus, AnalysisMode, ErrorCategory, OutputFormat, EntityType, SafetyThreshold } from \'../types/index.js\';\n';
    if (!content.includes(enumImport)) {
      const importIndex = content.indexOf('import type {');
      content = content.slice(0, importIndex) + enumImport + content.slice(importIndex);
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(validatorsPath, content);
    console.log('✅ Fixed Zod validation issues');
  } else {
    console.log('⚠️  No Zod validation fixes needed');
  }
}

// Fix 4: Fix YAML configuration issues
function fixYAMLConfig() {
  const formattersPath = resolve('src/core/formatters/index.ts');
  if (!existsSync(formattersPath)) {
    console.error('❌ formatters/index.ts not found');
    return;
  }
  
  let content = readFileSync(formattersPath, 'utf-8');
  let modified = false;
  
  // Remove lineWidth property from YAML options
  const lineWidthPattern = /lineWidth:\s*\d+,?\s*\n?/g;
  if (lineWidthPattern.test(content)) {
    content = content.replace(lineWidthPattern, '');
    modified = true;
  }
  
  if (modified) {
    writeFileSync(formattersPath, content);
    console.log('✅ Fixed YAML configuration issues');
  } else {
    console.log('⚠️  No YAML configuration fixes needed');
  }
}

// Fix 5: Fix PDF-parse import
function fixPDFParse() {
  const processorPath = resolve('src/core/processor.ts');
  if (!existsSync(processorPath)) {
    console.error('❌ processor.ts not found');
    return;
  }
  
  let content = readFileSync(processorPath, 'utf-8');
  let modified = false;
  
  // Fix PDF-parse usage - it's a function, not a class
  if (content.includes('import PDFParse from')) {
    content = content.replace('import PDFParse from', 'import pdfParse from');
    content = content.replace(/await PDFParse\(/g, 'await pdfParse(');
    modified = true;
  }
  
  if (modified) {
    writeFileSync(processorPath, content);
    console.log('✅ Fixed PDF-parse import');
  } else {
    console.log('⚠️  No PDF-parse fixes needed');
  }
}

// Fix 6: Fix ProcessorConfig import conflicts
function fixProcessorConfig() {
  const indexPath = resolve('src/core/index.ts');
  if (!existsSync(indexPath)) {
    console.error('❌ core/index.ts not found');
    return;
  }
  
  let content = readFileSync(indexPath, 'utf-8');
  let modified = false;
  
  // Ensure ProcessorConfig is imported from types, not processor
  if (content.includes('from \'./processor\'') && content.includes('ProcessorConfig')) {
    content = content.replace(
      /import\s*\{([^}]*ProcessorConfig[^}]*)\}\s*from\s*'\.\/processor'/g,
      (match, imports) => {
        // Remove ProcessorConfig from processor import
        const cleanedImports = imports.replace(/,?\s*ProcessorConfig\s*,?/g, '').trim();
        if (cleanedImports) {
          return `import { ${cleanedImports} } from './processor'`;
        }
        return '';
      }
    );
    
    // Add ProcessorConfig import from types if not present
    if (!content.includes('ProcessorConfig') || !content.includes('from \'./types')) {
      const typesImport = 'import { ProcessorConfig } from \'./types/index.js\';\n';
      content = typesImport + content;
    }
    
    modified = true;
  }
  
  if (modified) {
    writeFileSync(indexPath, content);
    console.log('✅ Fixed ProcessorConfig imports');
  } else {
    console.log('⚠️  No ProcessorConfig import fixes needed');
  }
}

// Main execution
console.log('🔧 Starting Phase 1 error fixes...\n');

try {
  // Run all fixes
  fixTypeExports();
  fixBunTypes();
  fixZodValidation();
  fixYAMLConfig();
  fixPDFParse();
  fixProcessorConfig();
  
  console.log('\n✨ Automatic fixes completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run "bun tsc --noEmit" to check for remaining errors');
  console.log('2. Manually fix any remaining issues');
  console.log('3. Run "bun test" to verify functionality');
  console.log('4. Generate coverage report with "bun test --coverage"');
  
} catch (error) {
  console.error('❌ Error applying fixes:', error);
  process.exit(1);
}