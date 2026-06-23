import axios from 'axios';
import { handleRestart } from '../../handlers/restart';
import { validateServerAddress } from '../../handlers/restart';

jest.mock('axios');
jest.mock('../../logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    level: 'info',
    isDebugEnabled: jest.fn(() => false)
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('handleRestart', () => {
    const baseArgv = {
        server: 'localhost:8080',
        token: 'test-token',
        type: 'com.ibm.opentelemetrycollector',
        debug: false
    };

    beforeEach(() => {
        jest.clearAllMocks();

        process.env.INSTANA_SERVER = 'localhost:8080';
        process.env.INSTANA_API_TOKEN = 'test-token';

        mockedAxios.create.mockReturnValue({
            post: jest.fn()
        } as any);
    });

    test('successfully sends restart request with tags', async () => {
        const postMock = jest.fn().mockResolvedValue({
            data: {
                requestId: '123',
                status: 'accepted',
                message: 'queued'
            }
        });

        mockedAxios.create.mockReturnValue({
            post: postMock
        } as any);

        const argv = {
            ...baseArgv,
            tag: ['entity.type=otel-collector']
        };

        const result = await handleRestart(argv);

        expect(postMock).toHaveBeenCalledTimes(1);

        expect(result).toEqual({
            requestId: '123',
            status: 'accepted',
            message: 'queued'
        });
    });

    test('successfully sends restart request with groups', async () => {
        const postMock = jest.fn().mockResolvedValue({
            data: {
                requestId: '456',
                status: 'accepted'
            }
        });

        mockedAxios.create.mockReturnValue({
            post: postMock
        } as any);

        const argv = {
            ...baseArgv,
            group: ['groupA', 'groupB']
        };

        const result = await handleRestart(argv);

        expect(postMock).toHaveBeenCalledTimes(1);
        expect(result.requestId).toBe('456');
    });

    test('throws error when both tag and group are provided', async () => {
        const argv = {
            ...baseArgv,
            tag: ['a=b'],
            group: ['groupA']
        };

        await expect(handleRestart(argv)).rejects.toThrow(
            'Use either --tag or --group, not both.'
        );
    });

    test('throws error when neither tag nor group is provided', async () => {
        const argv = {
            ...baseArgv
        };

        await expect(handleRestart(argv)).rejects.toThrow(
            'You must provide either --tag or --group.'
        );
    });

    test('throws error when tag format is invalid', async () => {
        const argv = {
            ...baseArgv,
            tag: ['invalidTag']
        };

        await expect(handleRestart(argv)).rejects.toThrow(
            'Invalid tag format'
        );
    });

    test('uses environment variables when server/token missing in argv', async () => {
        const postMock = jest.fn().mockResolvedValue({
            data: {
                requestId: '789',
                status: 'accepted'
            }
        });

        mockedAxios.create.mockReturnValue({
            post: postMock
        } as any);

        const argv = {
            type: baseArgv.type,
            tag: ['a=b']
        };

        const result = await handleRestart(argv);

        expect(result.requestId).toBe('789');
        expect(postMock).toHaveBeenCalled();
    });

    test('throws when server is missing', async () => {
        delete process.env.INSTANA_SERVER;
        
        const argv = {
            token: 'test',
            type: baseArgv.type,
            tag: ['a=b']
        };

        await expect(handleRestart(argv)).rejects.toThrow(
            'Missing server. Specify --server or set INSTANA_SERVER'
        );
    });

    test('throws when token is missing', async () => {
        delete process.env.INSTANA_API_TOKEN;
        
        const argv = {
            server: 'localhost:8080',
            type: baseArgv.type,
            tag: ['a=b']
        };

        await expect(handleRestart(argv)).rejects.toThrow('Missing API token. Specify --token or set INSTANA_API_TOKEN');
    });
});

describe('validateServerAddress', () => {
    it('should accept valid server addresses without protocol', () => {
    	expect(() => validateServerAddress('example.com')).not.toThrow();
    	expect(() => validateServerAddress('api.example.com')).not.toThrow();
    	expect(() => validateServerAddress('192.168.1.1')).not.toThrow();
    	expect(() => validateServerAddress('localhost')).not.toThrow();
    	expect(() => validateServerAddress('example.com:8080')).not.toThrow();
    	expect(() => validateServerAddress('api.example.com:443')).not.toThrow();
    });
   
    it('should reject server addresses with http:// protocol', () => {
    	expect(() => validateServerAddress('http://example.com')).toThrow(
    		'Invalid server address: Do not include protocol (http:// or https://). Please use only the hostname.'
    	);
    });
   
    it('should reject server addresses with https:// protocol', () => {
    	expect(() => validateServerAddress('https://example.com')).toThrow(
    		'Invalid server address: Do not include protocol (http:// or https://). Please use only the hostname.'
    	);
    });
   
    it('should reject server addresses with https:// protocol and port', () => {
    	expect(() => validateServerAddress('https://example.com:8080')).toThrow(
    		'Invalid server address: Do not include protocol (http:// or https://). Please use only the hostname.'
    	);
    });
   
    it('should reject server addresses with other protocols', () => {
    	expect(() => validateServerAddress('ftp://example.com')).toThrow(
    		'Invalid server address: Protocol prefix detected. Please use only the hostname.'
    	);
    });
   
    it('should handle server addresses with whitespace', () => {
    	expect(() => validateServerAddress('  https://example.com  ')).toThrow(
    		'Invalid server address: Do not include protocol (http:// or https://). Please use only the hostname.'
    	);
    });
   
    it('should reject empty server addresses', () => {
    	expect(() => validateServerAddress('')).toThrow(
    		'Server address is required and must be a string'
    	);
    });
   
    it('should reject null or undefined server addresses', () => {
    	expect(() => validateServerAddress(null as any)).toThrow(
    		'Server address is required and must be a string'
    	);
    	expect(() => validateServerAddress(undefined as any)).toThrow(
    		'Server address is required and must be a string'
    	);
    });
   
    it('should reject non-string server addresses', () => {
    	expect(() => validateServerAddress(123 as any)).toThrow(
    		'Server address is required and must be a string'
    	);
    	expect(() => validateServerAddress({} as any)).toThrow(
    		'Server address is required and must be a string'
    	);
    });
   });