import * as utils from '../utils';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('../logger');
jest.mock('child_process');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Utils Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sanitizeFileName', () => {
        it('should sanitize file names with special characters', () => {
            expect(utils.sanitizeFileName('My File@Name#123')).toBe('my_file_name_123');
        });

        it('should convert to lowercase', () => {
            expect(utils.sanitizeFileName('UPPERCASE')).toBe('uppercase');
        });

        it('should handle empty strings', () => {
            expect(utils.sanitizeFileName('')).toBe('untitled');
        });

        it('should preserve hyphens and underscores', () => {
            expect(utils.sanitizeFileName('my-file_name')).toBe('my-file_name');
        });

        it('should handle spaces', () => {
            expect(utils.sanitizeFileName('my file name')).toBe('my_file_name');
        });

        it('should handle special characters', () => {
            expect(utils.sanitizeFileName('file!@#$%^&*()name')).toBe('file__________name');
        });

        it('should handle null input', () => {
            expect(utils.sanitizeFileName(null as any)).toBe('untitled');
        });

        it('should handle undefined input', () => {
            expect(utils.sanitizeFileName(undefined as any)).toBe('untitled');
        });
    });

    describe('getValueByKeyFromArray', () => {
        it('should extract value from key=value pair', () => {
            const array = ['name=test', 'type=dashboard', 'id=123'];
            expect(utils.getValueByKeyFromArray(array, 'name')).toBe('test');
            expect(utils.getValueByKeyFromArray(array, 'type')).toBe('dashboard');
            expect(utils.getValueByKeyFromArray(array, 'id')).toBe('123');
        });

        it('should return undefined for non-existent key', () => {
            const array = ['name=test', 'type=dashboard'];
            expect(utils.getValueByKeyFromArray(array, 'missing')).toBeUndefined();
        });

        it('should handle empty array', () => {
            expect(utils.getValueByKeyFromArray([], 'key')).toBeUndefined();
        });

        it('should handle values with equals signs', () => {
            const array = ['url=http://example.com?param=value'];
            expect(utils.getValueByKeyFromArray(array, 'url')).toBe('http://example.com?param=value');
        });
    });

    describe('parseIncludeItem', () => {
        it('should parse space-separated items', () => {
            expect(utils.parseIncludeItem('item1 item2 item3')).toEqual(['item1', 'item2', 'item3']);
        });

        it('should handle quoted strings with spaces', () => {
            expect(utils.parseIncludeItem('item1 "item with spaces" item3')).toEqual([
                'item1',
                'item with spaces',
                'item3',
            ]);
        });

        it('should handle empty string', () => {
            expect(utils.parseIncludeItem('')).toEqual([]);
        });

        it('should handle single item', () => {
            expect(utils.parseIncludeItem('single')).toEqual(['single']);
        });

        it('should handle multiple spaces', () => {
            expect(utils.parseIncludeItem('item1    item2')).toEqual(['item1', 'item2']);
        });

        it('should handle nested quotes', () => {
            expect(utils.parseIncludeItem('"quoted item" normal')).toEqual(['quoted item', 'normal']);
        });
    });

    describe('sanitizeTitles', () => {
        it('should sanitize titles and handle duplicates', () => {
            const objects = [
                { id: '1', title: 'Test Dashboard' },
                { id: '2', title: 'Test Dashboard' },
                { id: '3', title: 'Another Dashboard' },
            ];

            const result = utils.sanitizeTitles(objects, 'dashboard');
            expect(result[0].title).toBe('test_dashboard');
            expect(result[1].title).toBe('test_dashboard_2');
            expect(result[2].title).toBe('another_dashboard');
        });

        it('should use fallback when title is missing', () => {
            const objects = [{ id: '123', name: 'MyName' }];
            const result = utils.sanitizeTitles(objects, 'dashboard');
            expect(result[0]).toHaveProperty('title', 'myname');
        });

        it('should use id-based fallback when both title and name are missing', () => {
            const objects = [{ id: '123' }];
            const result = utils.sanitizeTitles(objects, 'dashboard');
            expect(result[0]).toHaveProperty('title', 'dashboard-123');
        });

        it('should handle empty array', () => {
            const result = utils.sanitizeTitles([], 'dashboard');
            expect(result).toEqual([]);
        });

        it('should handle multiple duplicates', () => {
            const objects = [
                { id: '1', title: 'Same' },
                { id: '2', title: 'Same' },
                { id: '3', title: 'Same' },
                { id: '4', title: 'Same' },
            ];

            const result = utils.sanitizeTitles(objects, 'item');
            expect(result[0].title).toBe('same');
            expect(result[1].title).toBe('same_2');
            expect(result[2].title).toBe('same_3');
            expect(result[3].title).toBe('same_4');
        });
    });

    describe('isPrivatePackage', () => {
        it('should return true for private packages', () => {
            expect(utils.isPrivatePackage({ private: true })).toBe(true);
        });

        it('should return false for public packages', () => {
            expect(utils.isPrivatePackage({ private: false })).toBe(false);
        });

        it('should return false when private field is missing', () => {
            expect(utils.isPrivatePackage({})).toBe(false);
        });

        it('should return false for non-boolean private values', () => {
            expect(utils.isPrivatePackage({ private: 'true' })).toBe(false);
            expect(utils.isPrivatePackage({ private: 1 })).toBe(false);
        });
    });

    describe('pathExists', () => {
        it('should return true when path exists', () => {
            mockedFs.existsSync.mockReturnValue(true);
            expect(utils.pathExists('/test/path')).toBe(true);
        });

        it('should return false when path does not exist', () => {
            mockedFs.existsSync.mockReturnValue(false);
            expect(utils.pathExists('/test/path')).toBe(false);
        });

        it('should return false when fs.existsSync throws error', () => {
            mockedFs.existsSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            expect(utils.pathExists('/test/path')).toBe(false);
        });
    });

    describe('readPackageJson', () => {
        it('should read and parse valid package.json', () => {
            const packageData = { name: 'test-package', version: '1.0.0' };
            mockedFs.readFileSync.mockReturnValue(JSON.stringify(packageData));

            const result = utils.readPackageJson('/test/path');
            expect(result).toEqual(packageData);
        });

        it('should return null for invalid JSON', () => {
            mockedFs.readFileSync.mockReturnValue('invalid json');

            const result = utils.readPackageJson('/test/path');
            expect(result).toBeNull();
        });

        it('should return null when file does not exist', () => {
            mockedFs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });

            const result = utils.readPackageJson('/test/path');
            expect(result).toBeNull();
        });
    });

    describe('readReadmeFile', () => {
        it('should read README.md when it exists', () => {
            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.readFileSync.mockReturnValue('# README content');

            const result = utils.readReadmeFile('/test/path');
            expect(result).toBe('# README content');
        });

        it('should return null when README.md does not exist', () => {
            mockedFs.existsSync.mockReturnValue(false);

            const result = utils.readReadmeFile('/test/path');
            expect(result).toBeNull();
        });

        it('should return null when read fails', () => {
            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            const result = utils.readReadmeFile('/test/path');
            expect(result).toBeNull();
        });
    });

    describe('isUserLoggedIn', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            process.env = { ...originalEnv };
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it('should return true when npmrc contains auth token', async () => {
            process.env.HOME = '/home/user';
            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.readFileSync.mockReturnValue('//registry.npmjs.org/:_authToken=test-token');

            const result = await utils.isUserLoggedIn();
            expect(result).toBe(true);
        });

        it('should return false when npmrc does not contain auth token', async () => {
            process.env.HOME = '/home/user';
            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.readFileSync.mockReturnValue('some other content');

            const result = await utils.isUserLoggedIn();
            expect(result).toBe(false);
        });

        it('should return false when npmrc does not exist', async () => {
            process.env.HOME = '/home/user';
            mockedFs.existsSync.mockReturnValue(false);

            const result = await utils.isUserLoggedIn();
            expect(result).toBe(false);
        });
    });

    describe('parseIncludesFromArgv', () => {
        it('should parse include with explicit type and conditions', () => {
            const argv = ['--include', 'type=dashboard', 'name=test'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('dashboard');
            expect(result[0].conditions).toEqual(['name=test']);
            expect(result[0].explicitlyTyped).toBe(true);
        });

        it('should parse include without type (defaults to all)', () => {
            const argv = ['--include', 'name=test'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('all');
            expect(result[0].conditions).toEqual(['name=test']);
            expect(result[0].explicitlyTyped).toBe(false);
        });

        it('should parse multiple include clauses', () => {
            const argv = ['--include', 'type=dashboard', '--include', 'type=event'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result).toHaveLength(2);
            expect(result[0].type).toBe('dashboard');
            expect(result[1].type).toBe('event');
        });

        it('should handle empty conditions', () => {
            const argv = ['--include', 'type=dashboard'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result[0].conditions).toEqual([]);
        });

        it('should default to all when no includes provided', () => {
            const argv = ['other', 'args'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('all');
            expect(result[0].conditions).toEqual([]);
            expect(result[0].explicitlyTyped).toBe(false);
        });

        it('should parse multiple conditions for single include', () => {
            const argv = ['--include', 'type=dashboard', 'title=test', 'id=123'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('dashboard');
            expect(result[0].conditions).toEqual(['title=test', 'id=123']);
            expect(result[0].explicitlyTyped).toBe(true);
        });

        it('should stop collecting tokens at next flag', () => {
            const argv = ['--include', 'type=dashboard', 'title=test', '--server', 'example.com'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('dashboard');
            expect(result[0].conditions).toEqual(['title=test']);
        });

        it('should handle -F alias', () => {
            const argv = ['-F', 'type=event', 'name=test'];
            const result = utils.parseIncludesFromArgv(argv);

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('event');
            expect(result[0].conditions).toEqual(['name=test']);
        });
    });

    describe('printDirectoryTree', () => {
        it('should print directory tree structure', () => {
            mockedFs.readdirSync
                .mockReturnValueOnce(['file1.txt', 'subdir'] as any)
                .mockReturnValueOnce([]);
            mockedFs.statSync
                .mockReturnValueOnce({ isDirectory: () => false } as any)
                .mockReturnValueOnce({ isDirectory: () => true } as any);

            // Just verify it doesn't throw
            expect(() => utils.printDirectoryTree('/test', 'root')).not.toThrow();
        });
    });

    describe('generateReadme', () => {
        it('should generate README with dashboards section', () => {
            utils.generateReadme('/test/path', '@instana-integration/test', ['dashboards']);

            expect(mockedFs.writeFileSync).toHaveBeenCalled();
            const content = (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).toContain('# @instana-integration/test');
            expect(content).toContain('## Dashboards');
        });

        it('should generate README with events section', () => {
            utils.generateReadme('/test/path', '@instana-integration/test', ['events']);

            const content = (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).toContain('## Events');
        });

        it('should generate README with entities section', () => {
            utils.generateReadme('/test/path', '@instana-integration/test', ['entities']);

            const content = (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).toContain('## Entities');
        });

        it('should generate README with all sections', () => {
            utils.generateReadme('/test/path', '@instana-integration/test', ['dashboards', 'events', 'entities']);

            const content = (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).toContain('## Dashboards');
            expect(content).toContain('## Events');
            expect(content).toContain('## Entities');
            expect(content).toContain('## Metrics');
            expect(content).toContain('## Installation and Usage');
        });
    });
});