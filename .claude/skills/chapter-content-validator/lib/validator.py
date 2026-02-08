#!/usr/bin/env python3
"""
Chapter Content Validator

Validates that a chapter's content scenarios are complete and properly structured.
"""

import os
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any


class ValidationResult:
    """Container for validation results."""

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []

    def add_error(self, message: str) -> None:
        self.errors.append(f"[ERROR] {message}")

    def add_warning(self, message: str) -> None:
        self.warnings.append(f"[WARN] {message}")

    def add_pass(self, message: str) -> None:
        self.passed.append(f"[PASS] {message}")

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def print_report(self) -> None:
        """Print validation report to stdout."""
        for item in self.passed:
            print(item)
        for item in self.warnings:
            print(item)
        for item in self.errors:
            print(item, file=sys.stderr)


class ChapterValidator:
    """Validates chapter content structure and completeness."""

    REQUIRED_SCENARIO_FILES = ["README.md", "implementation/", "tests/"]
    REQUIRED_FRONTMATTER_FIELDS = ["title", "type", "complexity", "status"]

    def __init__(self, repo_root: Path, chapter_id: str):
        self.repo_root = repo_root
        self.chapter_id = chapter_id
        self.chapter_path = repo_root / "topics" / chapter_id
        self.config_path = self.chapter_path / ".chapter" / "config.yaml"
        self.scenarios_path = self.chapter_path / "scenarios"
        self.result = ValidationResult()

    def validate(self) -> ValidationResult:
        """Run all validations."""
        if not self.chapter_path.exists():
            self.result.add_error(f"Chapter path not found: {self.chapter_path}")
            return self.result

        self._validate_config()
        self._validate_scenarios()

        return self.result

    def _validate_config(self) -> None:
        """Validate chapter configuration file."""
        if not self.config_path.exists():
            self.result.add_error(f"Config not found: {self.config_path}")
            return

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f) or {}

            # Required fields
            for field in ["id", "title", "scenarios"]:
                if field not in config:
                    self.result.add_error(f"Missing config field: {field}")
                else:
                    self.result.add_pass(f"Config field present: {field}")

        except yaml.YAMLError as e:
            self.result.add_error(f"Invalid YAML in config: {e}")

    def _validate_scenarios(self) -> None:
        """Validate all scenarios defined in config."""
        if not self.config_path.exists():
            return

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f) or {}

            scenarios = config.get("scenarios", {})

            for scenario_type, names in scenarios.items():
                if isinstance(names, dict):
                    for complexity, name in names.items():
                        if name:
                            self._validate_scenario(name, scenario_type, complexity)

        except (yaml.YAMLError, IOError):
            pass  # Already reported in _validate_config

    def _validate_scenario(self, name: str, scenario_type: str, complexity: str) -> None:
        """Validate a single scenario directory."""
        scenario_path = self.scenarios_path / name

        if not scenario_path.exists():
            self.result.add_error(f"Scenario not found: {name} ({scenario_type}/{complexity})")
            return

        self.result.add_pass(f"Scenario exists: {name}")

        # Check required files/directories
        for required in self.REQUIRED_SCENARIO_FILES:
            path = scenario_path / required
            if path.exists():
                self.result.add_pass(f"  {name}: {required} exists")
            else:
                self.result.add_error(f"  {name}: Missing {required}")

        # Validate README.md frontmatter
        readme_path = scenario_path / "README.md"
        if readme_path.exists():
            self._validate_frontmatter(readme_path, name)

    def _validate_frontmatter(self, readme_path: Path, scenario_name: str) -> None:
        """Validate README.md frontmatter."""
        try:
            with open(readme_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Check for YAML frontmatter
            if not content.startswith("---"):
                self.result.add_error(f"  {scenario_name}: No frontmatter found")
                return

            # Extract frontmatter
            end_idx = content.find("---", 3)
            if end_idx == -1:
                self.result.add_error(f"  {scenario_name}: Unclosed frontmatter")
                return

            frontmatter_text = content[3:end_idx]
            try:
                frontmatter = yaml.safe_load(frontmatter_text) or {}
            except yaml.YAMLError:
                self.result.add_error(f"  {scenario_name}: Invalid frontmatter YAML")
                return

            # Check required fields
            for field in self.REQUIRED_FRONTMATTER_FIELDS:
                if field in frontmatter:
                    self.result.add_pass(f"  {scenario_name}: frontmatter.{field} = {frontmatter[field]}")
                else:
                    self.result.add_error(f"  {scenario_name}: Missing frontmatter field: {field}")

        except IOError as e:
            self.result.add_error(f"  {scenario_name}: Cannot read README.md: {e}")


def main() -> int:
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Validate chapter content")
    parser.add_argument("--chapter", required=True, help="Chapter ID (e.g., agent/mcp-deep-dive)")
    parser.add_argument("--repo-root", default=None, help="Repository root path")

    args = parser.parse_args()

    repo_root = Path(args.repo_root) if args.repo_root else Path.cwd()
    validator = ChapterValidator(repo_root, args.chapter)
    result = validator.validate()

    result.print_report()

    return 0 if result.is_valid else 1


if __name__ == "__main__":
    sys.exit(main())
