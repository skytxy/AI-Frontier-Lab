/**
 * Simple working test for Excel parsing with correct import
 *
 * Run from: .claude/skills/aspice-doc-validator/
 * Command: node ../.docwise/sandbox/009-aspice-doc-skill/simple-test.mjs
 */

import XLSX from 'xlsx';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

const DOC_PATH = "/Users/skytxy/Downloads/Safari/CARIAD-Cnn_Switch-软件详细说明书-V0.1.xlsx";
const TEMPLATE_PATH = "/Users/skytxy/code/ai/agent-learning/AI-Frontier-Lab/.claude/skills/aspice-doc-validator/lib/templates/cariad-sw-design.yaml";

console.log("=== ASPICE Doc Validator - Simple Test ===\n");

// 1. Load template
console.log("1. Loading template...");
const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const template = yaml.load(templateContent);
console.log("   Template name:", template.name);
console.log("   ASPICE level:", template.aspice_level);

// 2. Parse document
console.log("\n2. Parsing document...");
const workbook = XLSX.readFile(DOC_PATH);
console.log("   Sheets:", workbook.SheetNames.join(", "));

// 3. Check cover sheet
console.log("\n3. Checking cover sheet...");
const cover = workbook.Sheets['封面'];
const coverData = XLSX.utils.sheet_to_json(cover, { header: 1 });

// Find project ID
let projectId = null;
let version = null;
for (const row of coverData) {
  for (const cell of row) {
    if (typeof cell === 'string') {
      if (cell.includes('25SWICCARI')) projectId = '25SWICCARI';
      if (cell.includes('V0.1')) version = 'V0.1';
    }
  }
}

console.log("   Project ID:", projectId || "NOT FOUND");
console.log("   Version:", version || "NOT FOUND");

// 4. Check required sections
console.log("\n4. Checking required sections...");
const requiredSections = ['1.概要', '2.制约条件', '3.组件设计', '4.组件函数设计'];
for (const section of requiredSections) {
  const exists = workbook.SheetNames.includes(section);
  console.log(`   ${section}: ${exists ? 'OK' : 'MISSING'}`);
}

// 5. Check change log
console.log("\n5. Checking change log...");
const changeLog = workbook.Sheets['变更履历'];
if (changeLog) {
  const clData = XLSX.utils.sheet_to_json(changeLog, { header: 1 });
  console.log("   Rows:", clData.length);
  // Find version entries
  let versionCount = 0;
  for (const row of clData) {
    for (const cell of row) {
      if (typeof cell === 'string' && cell.match(/^V\d+\.\d+$/)) {
        versionCount++;
      }
    }
  }
  console.log("   Version entries:", versionCount);
}

console.log("\n=== Test Complete ===");
