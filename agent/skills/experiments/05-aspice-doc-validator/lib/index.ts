/**
 * CLI entry point for ASPICE Document Validator
 */

import { ASPICEValidator } from './validator.js';
import type { TemplateConfig } from './types.js';

// Sample CARIAD template configuration
const CARIAD_TEMPLATE: TemplateConfig = {
  name: 'CARIAD 软件详细设计说明书',
  aspice_level: 3,
  sections: {
    cover: {
      label: '封面',
      required: true,
      fields: {
        project_id: { label: '项目编号', required: true },
        file_id: { label: '文件编号', required: true },
        version: { label: '版本', required: true, pattern: '^V[0-9]+\\.[0-9]+$' },
        aspice_levels: { label: 'ASPICE 等级', required: true },
        asil_levels: { label: 'ASIL 等级', required: true },
        cal_levels: { label: 'CAL 等级', required: true },
        preparer: { label: '编制者', required: true },
        approver: { label: '批准者', required: false }
      }
    },
    change_log: {
      label: '变更履历',
      required: true,
      min_rows: 1
    },
    section_1: {
      label: '1.概要',
      required: true,
      min_content_length: 200
    },
    section_2: {
      label: '2.制约条件',
      required: true
    },
    section_3: {
      label: '3.组件设计',
      required: true
    },
    section_4: {
      label: '4.组件函数设计',
      required: true
    },
    section_5: {
      label: '5.其他',
      required: false
    }
  }
};

export async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node dist/index.js <document.xlsx>');
    process.exit(1);
  }

  const docPath = args[0];
  const validator = new ASPICEValidator();

  console.log(`Validating: ${docPath}`);
  console.log(`Template: ${CARIAD_TEMPLATE.name}\n`);

  const result = await validator.validate(docPath, CARIAD_TEMPLATE, 1);
  const report = validator.generateReport(result, docPath);

  console.log(report);

  process.exit(result.passed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ASPICEValidator, CARIAD_TEMPLATE };
