import { exec } from 'child_process';
import { handleDownload } from '../../handlers/download';
import logger from '../../logger';

// Mock dependencies
jest.mock('child_process');
jest.mock('../../logger');

describe('Download Handler', () => {
    let mockExec: jest.MockedFunction<typeof exec>;
    let mockExit: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockExec = exec as jest.MockedFunction<typeof exec>;
        mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
            throw new Error(`process.exit(${code})`);
        }) as any);
    });

    afterEach(() => {
        mockExit.mockRestore();
    });

    describe('handleDownload', () => {
        it('should successfully download a package', async () => {
            const argv = {
                package: '@instana/test-package',
                location: '/tmp/test-location'
            };

            const mockStdout = 'Package installed successfully';
            const mockStderr = '';

            mockExec.mockImplementation((command, callback: any) => {
                callback(null, { stdout: mockStdout, stderr: mockStderr });
                return {} as any;
            });

            await handleDownload(argv);

            expect(logger.info).toHaveBeenCalledWith('Start to download the integration package: @instana/test-package');
            expect(logger.info).toHaveBeenCalledWith(`Download completed, detailed logs: \n${mockStdout}`);
            expect(logger.info).toHaveBeenCalledWith('The integration package is downloaded at: /tmp/test-location');
            expect(mockExec).toHaveBeenCalledWith(
                'npm install @instana/test-package --prefix /tmp/test-location',
                expect.any(Function)
            );
        });

        it('should log stderr warnings if present', async () => {
            const argv = {
                package: '@instana/test-package',
                location: '/tmp/test-location'
            };

            const mockStdout = 'Package installed';
            const mockStderr = 'npm WARN deprecated package@1.0.0';

            mockExec.mockImplementation((command, callback: any) => {
                callback(null, { stdout: mockStdout, stderr: mockStderr });
                return {} as any;
            });

            await handleDownload(argv);

            expect(logger.error).toHaveBeenCalledWith(`Download warnings/errors: ${mockStderr}`);
        });

        it('should handle download errors and exit with code 1', async () => {
            const argv = {
                package: '@instana/test-package',
                location: '/tmp/test-location'
            };

            const mockError = new Error('Network error');

            mockExec.mockImplementation((command, callback: any) => {
                callback(mockError, { stdout: '', stderr: '' });
                return {} as any;
            });

            await expect(handleDownload(argv)).rejects.toThrow('process.exit(1)');

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to download the integration package @instana/test-package')
            );
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should construct correct npm install command', async () => {
            const argv = {
                package: 'simple-package',
                location: '/custom/path'
            };

            mockExec.mockImplementation((command, callback: any) => {
                callback(null, { stdout: 'success', stderr: '' });
                return {} as any;
            });

            await handleDownload(argv);

            expect(mockExec).toHaveBeenCalledWith(
                'npm install simple-package --prefix /custom/path',
                expect.any(Function)
            );
        });

        it('should handle scoped packages', async () => {
            const argv = {
                package: '@scope/package-name',
                location: '/install/dir'
            };

            mockExec.mockImplementation((command, callback: any) => {
                callback(null, { stdout: 'installed', stderr: '' });
                return {} as any;
            });

            await handleDownload(argv);

            expect(mockExec).toHaveBeenCalledWith(
                'npm install @scope/package-name --prefix /install/dir',
                expect.any(Function)
            );
            expect(logger.info).toHaveBeenCalledWith('Start to download the integration package: @scope/package-name');
        });

        it('should handle empty stdout', async () => {
            const argv = {
                package: 'test-package',
                location: '/tmp'
            };

            mockExec.mockImplementation((command, callback: any) => {
                callback(null, { stdout: '', stderr: '' });
                return {} as any;
            });

            await handleDownload(argv);

            expect(logger.info).toHaveBeenCalledWith('Download completed, detailed logs: \n');
        });

        it('should log all steps in correct order', async () => {
            const argv = {
                package: 'test-pkg',
                location: '/test'
            };

            mockExec.mockImplementation((command, callback: any) => {
                callback(null, { stdout: 'output', stderr: '' });
                return {} as any;
            });

            await handleDownload(argv);

            const logCalls = (logger.info as jest.Mock).mock.calls;
            expect(logCalls[0][0]).toContain('Start to download');
            expect(logCalls[1][0]).toContain('Download completed');
            expect(logCalls[2][0]).toContain('downloaded at');
        });

        it('should handle package names with special characters', async () => {
            const argv = {
                package: '@org/pkg-name_v2',
                location: '/path/to/install'
            };

            mockExec.mockImplementation((command, callback: any) => {
                callback(null, { stdout: 'done', stderr: '' });
                return {} as any;
            });

            await handleDownload(argv);

            expect(mockExec).toHaveBeenCalledWith(
                'npm install @org/pkg-name_v2 --prefix /path/to/install',
                expect.any(Function)
            );
        });

        it('should handle execution errors with detailed messages', async () => {
            const argv = {
                package: 'failing-package',
                location: '/tmp'
            };

            const detailedError = new Error('ENOTFOUND registry.npmjs.org');
            (detailedError as any).code = 'ENOTFOUND';

            mockExec.mockImplementation((command, callback: any) => {
                callback(detailedError, { stdout: '', stderr: '' });
                return {} as any;
            });

            await expect(handleDownload(argv)).rejects.toThrow('process.exit(1)');

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to download the integration package failing-package')
            );
        });
    });
});