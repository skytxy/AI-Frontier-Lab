---
title: "ASPICE 文档验证：基于模板的合规性检查"
experiment: 5
parent: skills
tags: [aspice, documentation, validation, compliance, automotive]
difficulty: intermediate
prerequisites: []
---

# Exp-05: ASPICE 文档验证器 (ASPICE Doc Validator)

## 前置知识

**开始前你需要了解**：

- **ASPICE (Automotive SPICE)**: 汽车软件过程改进和能力测定标准，用于评估汽车软件开发流程的成熟度。ASPICE 分为 1-5 级，级别越高表示流程越成熟。
- **ISO 26262**: 汽车功能安全标准，定义了 ASIL (Automotive Safety Integrity Level) A-D 四个等级。
- **ISO/SAE 21434**: 汽车网络安全标准，定义了 CAL (Cybersecurity Assurance Level) 1-4 四个等级。
- **Excel 解析**: ASPICE 文档通常以 Excel 格式提供，需要使用 openpyxl 或类似库解析。

> **零基础？** 推荐先阅读：
> - [ASPICE 官方指南](https://www.automotivespice.com/)
> - [ISO 26262 简介](https://www.iso.org/standard/70928.html)
> - [Excel 解析基础](/agent/skills/concepts/excel-parsing)

## 学习目标

完成本实验后，你将理解：

- [ ] **ASPICE 文档结构**: 了解标准 ASPICE 文档的章节组织和内容要求
- [ ] **模板驱动的验证**: 如何基于模板定义验证规则，而非硬编码
- [ ] **合规性检查**: 验证文档是否包含所有必需的章节和字段
- [ ] **交叉引用验证**: 检查文档内部引用的一致性
- [ ] **实战应用**: 使用 CARIAD 模板验证实际项目文档

## 为什么需要这个实验？

### 实际问题

在汽车软件开发中，文档质量直接影响 ASPICE 评估结果。常见问题包括：

1. **章节缺失**: 忘记填写必需的章节（如 "变更履历"、"制约条件"）
2. **字段空白**: 必填字段留空（如 "版本"、"日期"、"作者"）
3. **引用不一致**: 文档内部引用指向不存在的章节
4. **格式不规范**: 未按照模板要求填写（如 ASPICE 等级选择）
5. **版本混乱**: 变更履历与实际内容不匹配

### 传统解决方案的痛点

- **人工审查**: 耗时长、易遗漏、主观性强
- **硬编码检查**: 每次模板更新都需要修改代码
- **缺乏上下文**: 无法理解业务逻辑，只能做浅层检查

### AI 辅助验证

使用 AI Agent 进行 ASPICE 文档验证：

1. **理解语义**: AI 能理解章节内容的实际含义，而非仅检查格式
2. **模板驱动**: 将模板结构转换为配置，模板更新只需修改配置
3. **智能推理**: 发现隐含问题（如引用断链、逻辑矛盾）
4. **可解释性**: 生成详细的验证报告，指出具体问题位置

## 实验内容

### ASPICE 模板结构分析

以 CARIAD 的《软件详细设计说明书》模板为例：

#### 封面 (Cover)
```
- 项目编号
- 文件编号
- 版本 (V0.1, V0.2, ...)
- ASPICE 合规声明: ASPICE-1/2/3/4/5
- ASIL 等级: ASIL-A/B/C/D
- CAL 等级: CAL-1/2/3/4
- 编制者、审核者、评审者、批准者
- 发出方/接收方信息
- 保密要求和格式要求
- 当前状态 (草稿/基线/公布)
```

#### 主要章节
```
1. 概要 (1.1 目的, 1.2 范围, 1.3 参考文献, 1.4 术语缩写)
2. 制约条件 (2.1 组件设计约束, 2.2 技术约束)
3. 组件设计 (3.1 组件静态设计, 3.2 组件动态设计)
4. 组件函数设计 (4.1 函数列表, 4.2 函数详细设计)
5. 其他 (5.1 附录, 5.2 术语表)
```

#### 变更履历
```
- 版本
- 日期
- 作者
- 审核
- 批准
- 变更描述
```

### 验证规则设计

#### Level 1: 必需字段检查
- 封面所有关键字段非空
- 每个主要章节存在且非空
- 变更履历至少有一条记录

#### Level 2: 格式验证
- 版本号格式 (Vx.y)
- 日期格式 (YYYY-MM-DD)
- ASPICE/ASIL/CAL 等级选择有效

#### Level 3: 一致性检查
- 封面版本与变更履历最新版本一致
- 文档内引用的章节存在
- ASPICE 等级声明与实际内容匹配

#### Level 4: 内容质量
- 章节内容详实（非简单重复标题）
- 设计描述具备可追溯性
- 安全要求与 ASIL 等级对应

### 实现步骤

#### Step 1: 创建验证项目结构

```bash
cd agent/skills/experiments/05-aspice-doc-validator
npm install
```

项目结构：
```
05-aspice-doc-validator/
├── package.json
├── tsconfig.json
├── README.md
├── lib/
│   ├── types.ts          # 类型定义
│   ├── template-loader.ts # 模板解析
│   ├── validator.ts       # 验证逻辑
│   └── reporter.ts        # 报告生成
├── templates/
│   └── cariad-sw-design.yaml  # CARIAD 模板配置
└── examples/
    └── sample-validation.md   # 验证示例
```

#### Step 2: 定义模板配置

将 Excel 模板结构转换为 YAML 配置：

```yaml
# templates/cariad-sw-design.yaml
name: "CARIAD 软件详细设计说明书"
version: "1.0"
aspice_level: 3
sections:
  cover:
    required: true
    fields:
      project_id:
        label: "项目编号"
        required: true
        pattern: "^[A-Z0-9]+$"
      file_id:
        label: "文件编号"
        required: true
      version:
        label: "版本"
        required: true
        pattern: "^V[0-9]+\\.[0-9]+$"
      aspice_levels:
        label: "ASPICE 等级"
        required: true
        options: ["ASPICE-1", "ASPICE-2", "ASPICE-3", "ASPICE-4", "ASPICE-5"]
        min_selection: 1
      asil_levels:
        label: "ASIL 等级"
        required: true
        options: ["ASIL-A", "ASIL-B", "ASIL-C", "ASIL-D"]
        min_selection: 1
      cal_levels:
        label: "CAL 等级"
        required: true
        options: ["CAL-1", "CAL-2", "CAL-3", "CAL-4"]
        min_selection: 1

  change_log:
    required: true
    min_rows: 1
    fields:
      - version
      - date
      - author
      - reviewer
      - approver
      - description

  section_1:
    label: "概要"
    required: true
    subsections:
      - purpose       # 目的
      - scope         # 范围
      - references    # 参考文献
      - abbreviations # 术语缩写

  section_2:
    label: "制约条件"
    required: true
    subsections:
      - design_constraints
      - technical_constraints

  section_3:
    label: "组件设计"
    required: true
    subsections:
      - static_design
      - dynamic_design

  section_4:
    label: "组件函数设计"
    required: true
    subsections:
      - function_list
      - function_detail_design

  section_5:
    label: "其他"
    required: false
    subsections:
      - appendix
      - glossary
```

#### Step 3: 实现验证器

核心验证逻辑：

```typescript
// lib/validator.ts
import openpyxl from 'openpyxl';
import { TemplateConfig, ValidationResult, Issue } from './types.js';

export class ASPICEValidator {
  private template: TemplateConfig;

  constructor(template: TemplateConfig) {
    this.template = template;
  }

  async validate(docPath: string): Promise<ValidationResult> {
    const issues: Issue[] = [];
    const workbook = await openpyxl.loadWorkbook(docPath);

    // Level 1: 必需字段检查
    issues.push(...this.checkRequiredFields(workbook));

    // Level 2: 格式验证
    issues.push(...this.checkFormats(workbook));

    // Level 3: 一致性检查
    issues.push(...this.checkConsistency(workbook));

    // Level 4: 内容质量
    issues.push(...this.checkContentQuality(workbook));

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      summary: this.generateSummary(issues)
    };
  }

  private checkRequiredFields(workbook: any): Issue[] {
    const issues: Issue[] = [];
    const cover = workbook['封面'];

    for (const [fieldId, fieldConfig] of Object.entries(this.template.sections.cover.fields)) {
      const value = this.extractCellValue(cover, fieldConfig.label);
      if (fieldConfig.required && !value) {
        issues.push({
          severity: 'critical',
          category: 'missing_required_field',
          location: '封面',
          message: `缺少必填字段: ${fieldConfig.label}`,
          field: fieldId
        });
      }
    }

    return issues;
  }

  private checkFormats(workbook: any): Issue[] {
    const issues: Issue[] = [];
    const cover = workbook['封面'];

    // 检查版本号格式
    const version = this.extractCellValue(cover, '版本');
    const versionPattern = /^V[0-9]+\.[0-9]+$/;
    if (version && !versionPattern.test(version)) {
      issues.push({
        severity: 'important',
        category: 'format_error',
        location: '封面',
        message: `版本号格式错误: ${version} (应为 Vx.y)`,
        field: 'version'
      });
    }

    return issues;
  }

  private checkConsistency(workbook: any): Issue[] {
    const issues: Issue[] = [];
    const cover = workbook['封面'];
    const changeLog = workbook['变更履历'];

    // 检查版本一致性
    const coverVersion = this.extractCellValue(cover, '版本');
    const latestChangeVersion = this.getLatestChangeVersion(changeLog);

    if (coverVersion !== latestChangeVersion) {
      issues.push({
        severity: 'critical',
        category: 'version_mismatch',
        location: '封面/变更履历',
        message: `封面版本 (${coverVersion}) 与变更履历最新版本 (${latestChangeVersion}) 不一致`
      });
    }

    return issues;
  }

  private checkContentQuality(workbook: any): Issue[] {
    const issues: Issue[] = [];

    // 检查章节内容是否过于简短
    for (const [sectionId, sectionConfig] of Object.entries(this.template.sections)) {
      if (sectionId.startsWith('section_') && sectionConfig.required) {
        const sheet = workbook[sectionConfig.label];
        const contentLength = this.measureContentLength(sheet);

        if (contentLength < 100) {
          issues.push({
            severity: 'important',
            category: 'insufficient_content',
            location: sectionConfig.label,
            message: `章节内容过少 (${contentLength} 字符)，可能需要补充`
          });
        }
      }
    }

    return issues;
  }
}
```

#### Step 4: 生成验证报告

```typescript
// lib/reporter.ts
export function generateReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('# ASPICE 文档验证报告\n');
  lines.push(`**状态**: ${result.passed ? '通过' : '失败'}\n`);
  lines.push(`**问题总数**: ${result.issues.length}\n`);

  // 按严重程度分组
  const critical = result.issues.filter(i => i.severity === 'critical');
  const important = result.issues.filter(i => i.severity === 'important');
  const minor = result.issues.filter(i => i.severity === 'minor');

  if (critical.length > 0) {
    lines.push('## 严重问题 (必须修复)\n');
    for (const issue of critical) {
      lines.push(`- [${issue.location}] ${issue.message}`);
    }
    lines.push('');
  }

  if (important.length > 0) {
    lines.push('## 重要问题 (建议修复)\n');
    for (const issue of important) {
      lines.push(`- [${issue.location}] ${issue.message}`);
    }
    lines.push('');
  }

  if (minor.length > 0) {
    lines.push('## 次要问题\n');
    for (const issue of minor) {
      lines.push(`- [${issue.location}] ${issue.message}`);
    }
  }

  return lines.join('\n');
}
```

## 验证

### 成功标志

- [ ] 能够解析 Excel 格式的 ASPICE 模板
- [ ] 能够检测缺少的必填字段
- [ ] 能够验证版本号格式和一致性
- [ ] 能够生成结构化的验证报告
- [ ] 能够通过配置适配不同的 ASPICE 模板

### 测试命令

```bash
# 1. 构建项目
npm run build

# 2. 运行验证示例
npm run validate -- examples/sample.xlsx

# 3. 生成报告
npm run report -- examples/sample.xlsx
```

### 示例输出

```
ASPICE 文档验证报告
====================

状态: 失败
问题总数: 5

严重问题 (必须修复)
------------------
- [封面] 缺少必填字段: 批准者
- [封面/变更履历] 封面版本 (V0.1) 与变更履历最新版本 (V0.2) 不一致

重要问题 (建议修复)
------------------
- [封面] 版本号格式错误: V1 (应为 Vx.y)
- [制约条件] 章节内容过少 (50 字符)，可能需要补充
- [组件函数设计] 缺少函数详细设计表

次要问题
--------
- [概要] 术语缩写表为空
```

## 关键发现

### 1. 模板驱动 vs 硬编码

传统做法是将验证规则硬编码在代码中，每次模板更新都需要修改代码。更好的做法是：

- **模板即配置**: 将模板结构抽象为 YAML/JSON 配置
- **规则可组合**: 将验证规则分解为可复用的原子规则
- **版本化管理**: 模板配置与代码分离，各自独立演进

### 2. 分层验证策略

ASPICE 文档验证应该分层进行：

| 层级 | 检查内容 | 工具 | 失败处理 |
|-----|---------|-----|---------|
| L1 | 必需字段存在性 | 静态分析 | 阻止提交 |
| L2 | 格式规范 | 正则匹配 | 警告 |
| L3 | 一致性检查 | 语义分析 | 阻止发布 |
| L4 | 内容质量 | AI 辅助 | 建议 |

### 3. Excel 解析的坑

- **合并单元格**: openpyxl 读取合并单元格时，只有第一个单元格有值
- **日期格式**: Excel 日期存储为数字，需要特殊处理
- **中文支持**: 确保使用 UTF-8 编码读取

### 4. ASPICE 等级的影响

不同 ASPICE 等级对文档的要求不同：

- **ASPICE-1**: 基础文档完整性
- **ASPICE-2**: 流程标准化
- **ASPICE-3**: 流程符合规范
- **ASPICE-4**: 流程可量化管理
- **ASPICE-5**: 持续优化

验证器应根据声明的 ASPICE 等级调整检查严格度。

## 常见问题

### Q1: 如何处理不同的 ASPICE 文档类型？

**Answer**: 使用模板配置系统。每种文档类型（软件需求、架构设计、详细设计等）对应一个 YAML 配置文件。验证器加载对应配置即可。

### Q2: 如何验证文档内容的真实性？

**Answer**: 这是 Level 4 内容质量检查的范畴。可以：
- 检查内容与标题的相关性
- 检测重复/复制粘贴内容
- 使用 AI 评估内容的技术深度

### Q3: Excel 模板更新后怎么办？

**Answer**: 只需更新对应的 YAML 配置文件，无需修改验证器代码。如果 Excel 结构变化较大，可以使用辅助工具自动生成配置。

### Q4: 如何集成到 CI/CD 流程？

**Answer**: 将验证器作为 pre-commit hook 或 CI pipeline 步骤：

```yaml
# .github/workflows/aspice-check.yml
name: ASPICE Doc Check
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate ASPICE docs
        run: |
          npm run validate:docs
```

## 延伸阅读

- [ASPICE v4.0 官方文档](https://www.automotivespice.com/fileadmin/downloads/Process_Reference_Guide/ProcessAssessmentModel4_0.pdf)
- [ISO 26262 道路车辆功能安全标准](https://www.iso.org/standard/70928.html)
- [openpyxl 文档](https://openpyxl.readthedocs.io/)
- [实验 03: 自定义 Agent Skill 开发](/agent/skills/experiments/03-custom-skill/) - 技能开发最佳实践

## 下一步

完成本实验后，你已经掌握了 ASPICE 文档验证的核心技术。接下来：

1. **扩展验证规则**: 添加更多业务特定的验证规则
2. **支持更多格式**: 支持 Word、PDF 等 ASPICE 文档格式
3. **AI 增强**: 使用 LLM 进行语义级内容验证
4. **批量验证**: 实现项目级文档批量验证和报告汇总
