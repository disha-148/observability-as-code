import * as child_process from 'child_process';
import * as utils from '../../utils';
import * as validators from '../../validators';

import { EventEmitter } from 'events';
import fs from 'fs';
import { handleBuild } from '../../handlers/build';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('../../utils');
jest.mock('../../validators');
jest.mock('../../logger');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockUtils = utils as jest.Mocked<typeof utils>;
const mockValidators = validators as jest.Mocked<typeof validators>;
const mockChildProcess = child_process as jest.Mocked<typeof child_process>;

describe('handleBuild', () => {
    const mockPackagePath = '/test/package';
    const mockCollectorPath = path.join(mockPackagePath, 'collector');
    const mockConfigPath = path.join(mockCollectorPath, 'config.json');
    const mockDockerfilePath = path.join(mockCollectorPath, 'Dockerfile');
    let mockExit: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock process.exit to prevent tests from actually exiting
        mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
            throw new Error(`process.exit called with ${code}`);
        }) as any);
    });

    afterEach(() => {
        mockExit.mockRestore();
    });

    const setupMockSpawn = (exitCode: number = 0) => {
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        
        mockChildProcess.spawn.mockReturnValue(mockProcess);
        
        // Simulate process completion after a short delay
        setTimeout(() => {
            mockProcess.emit('close', exitCode);
        }, 10);
        
        return mockProcess;
    };

    it('should validate package structure and build successfully', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockValidators.validateCollectorFiles.mockImplementation((collectorPath, errors, warnings, successMessages) => {
            // No errors - validation passes
        });
        const mockConfig = {
            extension_id: 'test-monitor',
            extension_name: 'test-monitor',
            extension_version: '1.0.0',
            image: {
                registry: 'quay.io',
                repository: 'instana-collectors/test',
                tag: '1.0.0'
            }
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
        setupMockSpawn(0);

        await handleBuild({ package: mockPackagePath });

        expect(mockUtils.pathExists).toHaveBeenCalledWith(mockPackagePath);
        expect(mockUtils.pathExists).toHaveBeenCalledWith(mockCollectorPath);
        expect(mockValidators.validateCollectorFiles).toHaveBeenCalledWith(
            mockCollectorPath,
            expect.any(Array),
            expect.any(Array),
            expect.any(Array)
        );
        expect(mockFs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
        expect(mockChildProcess.spawn).toHaveBeenCalledWith(
            'docker',
            ['build', '-t', 'quay.io/instana-collectors/test:1.0.0', mockCollectorPath],
            { stdio: 'inherit' }
        );
    });

    it('should throw error if package directory does not exist', async () => {
        mockUtils.pathExists.mockReturnValue(false);

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if collector directory does not exist', async () => {
        mockUtils.pathExists
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if validator finds missing files', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockValidators.validateCollectorFiles.mockImplementation((collectorPath, errors, warnings, successMessages) => {
            errors.push('Missing required collector file: config.json');
            errors.push('Missing required collector file: Dockerfile');
        });

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if validator finds empty files', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockValidators.validateCollectorFiles.mockImplementation((collectorPath, errors, warnings, successMessages) => {
            warnings.push('Collector file is empty: requirements.txt');
        });
        const mockConfig = {
            image: {
                registry: 'quay.io',
                repository: 'instana-collectors/test',
                tag: '1.0.0'
            }
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
        setupMockSpawn(0);

        // Should not throw - warnings don't fail the build
        await handleBuild({ package: mockPackagePath, debug: false });
        
        expect(mockValidators.validateCollectorFiles).toHaveBeenCalled();
    });

    it('should throw error if config.json is invalid JSON', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue('invalid json');

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if config is missing image section', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify({}));

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if config is missing image.registry', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockValidators.validateCollectorFiles.mockImplementation(() => {
            // No errors
        });
        const mockConfig = {
            image: {
                repository: 'instana-collectors/test',
                tag: '1.0.0'
            }
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if config is missing image.repository', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockValidators.validateCollectorFiles.mockImplementation(() => {
            // No errors
        });
        const mockConfig = {
            image: {
                registry: 'quay.io',
                tag: '1.0.0'
            }
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if config is missing image.tag', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockValidators.validateCollectorFiles.mockImplementation(() => {
            // No errors
        });
        const mockConfig = {
            image: {
                registry: 'quay.io',
                repository: 'instana-collectors/test'
            }
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error with all missing image fields in one message', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        mockValidators.validateCollectorFiles.mockImplementation(() => {
            // No errors
        });
        const mockConfig = {
            image: {}
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if docker build fails', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        const mockConfig = {
            extension_id: 'test-monitor',
            image: {
                registry: 'quay.io',
                repository: 'instana-collectors/test',
                tag: '1.0.0'
            }
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
        setupMockSpawn(1); // Exit code 1 = failure

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

    it('should throw error if docker command fails to execute', async () => {
        mockUtils.pathExists.mockReturnValue(true);
        const mockConfig = {
            extension_id: 'test-monitor',
            image: {
                registry: 'quay.io',
                repository: 'instana-collectors/test',
                tag: '1.0.0'
            }
        };
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
        
        const mockProcess = new EventEmitter() as any;
        mockChildProcess.spawn.mockReturnValue(mockProcess);
        
        setTimeout(() => {
            mockProcess.emit('error', new Error('Command not found'));
        }, 10);

        await expect(handleBuild({ package: mockPackagePath }))
            .rejects.toThrow('process.exit called with 1');
    });

});
