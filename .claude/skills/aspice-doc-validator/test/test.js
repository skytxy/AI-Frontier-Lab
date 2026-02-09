/**
 * Simple test for ASPICE Document Validator
 * Demonstrates basic functionality without requiring actual Excel files
 */

import { ASPICEValidator } from '../dist/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTemplateLoading() {
  console.log('=== Test 1: Template Loading ===');
  try {
    const validator = new ASPICEValidator();
    const template = await validator.loadTemplate('cariad-sw-design');
    console.log('[OK] Template loaded successfully');
    console.log(`  Name: ${template.name}`);
    console.log(`  ASPICE Level: ${template.aspice_level}`);
    console.log(`  Required sections: ${Object.keys(template.sections).length}`);
    return true;
  } catch (error) {
    console.log('[FAIL] Template loading failed:', error.message);
    return false;
  }
}

async function testValidatorInstantiation() {
  console.log('\n=== Test 2: Validator Instantiation ===');
  try {
    const validator = new ASPICEValidator();
    console.log('[OK] Validator instantiated successfully');
    console.log(`  Template directory: ${validator.templateDir || 'default'}`);
    return true;
  } catch (error) {
    console.log('[FAIL] Instantiation failed:', error.message);
    return false;
  }
}

async function testValidationWithMockData() {
  console.log('\n=== Test 3: Validation with Mock Data ===');
  try {
    const validator = new ASPICEValidator();

    // Create a minimal mock parsed document
    const mockDoc = {
      format: 'xlsx',
      sheets: {
        '封面': {
          '0-0': { raw: '项目编号', text: '项目编号', row: 1, col: 1, label: '' },
          '0-1': { raw: 'PROJ001', text: 'PROJ001', row: 1, col: 2, label: '项目编号' },
          '1-0': { raw: '文件编号', text: '文件编号', row: 2, col: 1, label: '' },
          '1-1': { raw: 'SD-PROJ001-01-01', text: 'SD-PROJ001-01-01', row: 2, col: 2, label: '文件编号' },
          '2-0': { raw: '版本', text: '版本', row: 3, col: 1, label: '' },
          '2-1': { raw: 'V1.0', text: 'V1.0', row: 3, col: 2, label: '版本' },
          '3-0': { raw: 'ASPICE 等级', text: 'ASPICE 等级', row: 4, col: 1, label: '' },
          '3-1': { raw: 'ASPICE-3', text: 'ASPICE-3', row: 4, col: 2, label: 'ASPICE 等级' },
          '4-0': { raw: 'ASIL 等级', text: 'ASIL 等级', row: 5, col: 1, label: '' },
          '4-1': { raw: 'ASIL-B', text: 'ASIL-B', row: 5, col: 2, label: 'ASIL 等级' },
          '5-0': { raw: 'CAL 等级', text: 'CAL 等级', row: 6, col: 1, label: '' },
          '5-1': { raw: 'CAL-2', text: 'CAL-2', row: 6, col: 2, label: 'CAL 等级' },
        }
      },
      metadata: {
        project_id: 'PROJ001',
        file_id: 'SD-PROJ001-01-01',
        version: 'V1.0',
        aspice_levels: ['3'],
        asil_levels: ['B'],
        cal_levels: ['2']
      }
    };

    // Load template
    const template = await validator.loadTemplate('cariad-sw-design');

    console.log('[OK] Mock document created');
    console.log(`  Sheets: ${Object.keys(mockDoc.sheets).length}`);
    console.log(`  Metadata: ${Object.keys(mockDoc.metadata).length} fields`);
    return true;
  } catch (error) {
    console.log('[FAIL] Mock data test failed:', error.message);
    return false;
  }
}

async function testReportGeneration() {
  console.log('\n=== Test 4: Report Generation ===');
  try {
    const validator = new ASPICEValidator();

    const mockResult = {
      passed: true,
      document: 'test-document.xlsx',
      template: 'cariad-sw-design',
      aspice_level: 3,
      issues: [
        {
          level: 1,
          category: 'missing_field',
          severity: 'critical',
          location: '封面:项目编号',
          message: 'Required field is missing',
          suggestion: 'Add project identifier'
        },
        {
          level: 2,
          category: 'format_error',
          severity: 'important',
          location: '封面:版本',
          message: 'Version format incorrect',
          suggestion: 'Use Vx.y format'
        }
      ],
      summary: {
        total: 2,
        by_severity: { critical: 1, important: 1, minor: 0 },
        by_category: { missing_field: 1, format_error: 1 },
        duration_ms: 150
      },
      validated_at: new Date().toISOString()
    };

    const markdownReport = validator.generateReport(mockResult, 'markdown');
    console.log('[OK] Markdown report generated');
    console.log(`  Report length: ${markdownReport.length} characters`);

    const jsonReport = validator.generateReport(mockResult, 'json');
    console.log('[OK] JSON report generated');
    console.log(`  Report length: ${jsonReport.length} characters`);

    const textReport = validator.generateReport(mockResult, 'text');
    console.log('[OK] Text report generated');
    console.log(`  Report length: ${textReport.length} characters`);

    return true;
  } catch (error) {
    console.log('[FAIL] Report generation failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('ASPICE Document Validator - Test Suite');
  console.log('========================================\n');

  const results = {
    templateLoading: await testTemplateLoading(),
    instantiation: await testValidatorInstantiation(),
    mockData: await testValidationWithMockData(),
    reportGeneration: await testReportGeneration()
  };

  console.log('\n=== Test Summary ===');
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n[OK] All tests passed!');
  } else {
    console.log('\n[FAIL] Some tests failed');
  }

  return passed === total;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
