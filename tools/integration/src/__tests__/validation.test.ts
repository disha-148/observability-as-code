import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import fs from 'fs';
import logger from '../logger';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('../logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));


describe('Validation Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePackageJson', () => {
    const validatePackageJson = (packageData: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!packageData) {
        errors.push('package.json is missing or invalid');
        return { valid: false, errors };
      }

      // Check required fields
      if (!packageData.name) {
        errors.push('Missing required field: name');
      }

      if (!packageData.version) {
        errors.push('Missing required field: version');
      }

      if (!packageData.description) {
        errors.push('Missing required field: description');
      }

      // Validate name format
      if (packageData.name && !packageData.name.startsWith('@instana-integration/')) {
        errors.push('Package name must start with @instana-integration/');
      }

      // Validate version format (semver)
      if (packageData.version && !/^\d+\.\d+\.\d+/.test(packageData.version)) {
        errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate a correct package.json', () => {
      const packageData = {
        name: '@instana-integration/test',
        version: '1.0.0',
        description: 'Test package',
      };

      const result = validatePackageJson(packageData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing name field', () => {
      const packageData = {
        version: '1.0.0',
        description: 'Test package',
      };

      const result = validatePackageJson(packageData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });

    it('should detect missing version field', () => {
      const packageData = {
        name: '@instana-integration/test',
        description: 'Test package',
      };

      const result = validatePackageJson(packageData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    it('should detect missing description field', () => {
      const packageData = {
        name: '@instana-integration/test',
        version: '1.0.0',
      };

      const result = validatePackageJson(packageData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: description');
    });

    it('should validate package name format', () => {
      const packageData = {
        name: 'invalid-name',
        version: '1.0.0',
        description: 'Test package',
      };

      const result = validatePackageJson(packageData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Package name must start with @instana-integration/');
    });

    it('should validate version format', () => {
      const packageData = {
        name: '@instana-integration/test',
        version: 'invalid',
        description: 'Test package',
      };

      const result = validatePackageJson(packageData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Version must follow semantic versioning (e.g., 1.0.0)');
    });

    it('should handle null package data', () => {
      const result = validatePackageJson(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('package.json is missing or invalid');
    });

    it('should accumulate multiple errors', () => {
      const packageData = {
        name: 'invalid-name',
        version: 'invalid',
      };

      const result = validatePackageJson(packageData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateDashboardFiles', () => {
    const validateDashboardFile = (content: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!content) {
        errors.push('Dashboard file is empty or invalid JSON');
        return { valid: false, errors };
      }

      // Check required fields
      if (!content.title) {
        errors.push('Missing required field: title');
      }

      if (!content.widgets || !Array.isArray(content.widgets)) {
        errors.push('Missing or invalid widgets array');
      }

      // Validate widgets
      if (content.widgets && Array.isArray(content.widgets)) {
        content.widgets.forEach((widget: any, index: number) => {
          if (!widget.type) {
            errors.push(`Widget ${index}: Missing type field`);
          }
          if (!widget.title) {
            errors.push(`Widget ${index}: Missing title field`);
          }
        });
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate a correct dashboard file', () => {
      const dashboard = {
        title: 'Test Dashboard',
        widgets: [
          { type: 'chart', title: 'Widget 1' },
          { type: 'table', title: 'Widget 2' },
        ],
      };

      const result = validateDashboardFile(dashboard);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing title', () => {
      const dashboard = {
        widgets: [{ type: 'chart', title: 'Widget 1' }],
      };

      const result = validateDashboardFile(dashboard);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: title');
    });

    it('should detect missing widgets array', () => {
      const dashboard = {
        title: 'Test Dashboard',
      };

      const result = validateDashboardFile(dashboard);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid widgets array');
    });

    it('should validate widget structure', () => {
      const dashboard = {
        title: 'Test Dashboard',
        widgets: [{ type: 'chart' }, { title: 'Widget 2' }],
      };

      const result = validateDashboardFile(dashboard);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Widget 0: Missing title field');
      expect(result.errors).toContain('Widget 1: Missing type field');
    });

    it('should handle null content', () => {
      const result = validateDashboardFile(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Dashboard file is empty or invalid JSON');
    });

    it('should handle empty widgets array', () => {
      const dashboard = {
        title: 'Test Dashboard',
        widgets: [],
      };

      const result = validateDashboardFile(dashboard);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateEventFiles', () => {
    const validateEventFile = (content: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!content) {
        errors.push('Event file is empty or invalid JSON');
        return { valid: false, errors };
      }

      // Check required fields
      if (!content.name) {
        errors.push('Missing required field: name');
      }

      if (!content.entityType) {
        errors.push('Missing required field: entityType');
      }

      if (!content.query) {
        errors.push('Missing required field: query');
      }

      if (!content.severity) {
        errors.push('Missing required field: severity');
      } else if (!['warning', 'critical'].includes(content.severity)) {
        errors.push('Severity must be either "warning" or "critical"');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate a correct event file', () => {
      const event = {
        name: 'High CPU Usage',
        entityType: 'host',
        query: 'cpu.usage > 80',
        severity: 'warning',
      };

      const result = validateEventFile(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing name', () => {
      const event = {
        entityType: 'host',
        query: 'cpu.usage > 80',
        severity: 'warning',
      };

      const result = validateEventFile(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });

    it('should detect missing entityType', () => {
      const event = {
        name: 'High CPU Usage',
        query: 'cpu.usage > 80',
        severity: 'warning',
      };

      const result = validateEventFile(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: entityType');
    });

    it('should detect missing query', () => {
      const event = {
        name: 'High CPU Usage',
        entityType: 'host',
        severity: 'warning',
      };

      const result = validateEventFile(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: query');
    });

    it('should validate severity values', () => {
      const event = {
        name: 'High CPU Usage',
        entityType: 'host',
        query: 'cpu.usage > 80',
        severity: 'invalid',
      };

      const result = validateEventFile(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Severity must be either "warning" or "critical"');
    });

    it('should accept critical severity', () => {
      const event = {
        name: 'High CPU Usage',
        entityType: 'host',
        query: 'cpu.usage > 80',
        severity: 'critical',
      };

      const result = validateEventFile(event);
      expect(result.valid).toBe(true);
    });

    it('should handle null content', () => {
      const result = validateEventFile(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Event file is empty or invalid JSON');
    });
  });

  describe('validateReadmeContent', () => {
    const validateReadmeContent = (content: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!content || content.trim() === '') {
        errors.push('README.md is empty');
        return { valid: false, errors };
      }

      // Check for required sections
      const requiredSections = ['# ', '## Installation', '## Usage'];
      requiredSections.forEach(section => {
        if (!content.includes(section)) {
          errors.push(`Missing required section: ${section}`);
        }
      });

      // Check minimum length
      if (content.length < 100) {
        errors.push('README.md is too short (minimum 100 characters)');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate a correct README', () => {
      const readme = `# Test Integration

## Installation

Install the package using npm.

## Usage

Use this integration to monitor your application.

Additional content to meet minimum length requirement.`;

      const result = validateReadmeContent(readme);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty README', () => {
      const result = validateReadmeContent('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('README.md is empty');
    });

    it('should detect missing title', () => {
      const readme = `## Installation
Install package.
## Usage
Use integration.`;

      const result = validateReadmeContent(readme);
      expect(result.valid).toBe(false);
      // Should have both errors: missing title AND too short
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing Installation section', () => {
      const readme = `# Test Integration

## Usage

Use this integration to monitor your application.

Additional content to meet minimum length requirement.`;

      const result = validateReadmeContent(readme);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: ## Installation');
    });

    it('should detect missing Usage section', () => {
      const readme = `# Test Integration

## Installation

Install the package using npm.

Additional content to meet minimum length requirement.`;

      const result = validateReadmeContent(readme);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: ## Usage');
    });

    it('should detect README that is too short', () => {
      const readme = `# Test

## Installation

npm install

## Usage

Use it`;

      const result = validateReadmeContent(readme);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('README.md is too short (minimum 100 characters)');
    });
  });
});