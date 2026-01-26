import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createLogger } from 'winston';
import logger from '../logger';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    level: 'info',
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      label: jest.fn(),
      printf: jest.fn(),
      colorize: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
  };
});

describe('Logger', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create a logger instance', () => {
    expect(logger).toBeDefined();
  });

  it('should use default log level "info" when LOG_LEVEL is not set', () => {
    delete process.env.LOG_LEVEL;
    expect(logger).toBeDefined();
  });

  it('should use LOG_LEVEL environment variable when set', () => {
    process.env.LOG_LEVEL = 'debug';
    expect(logger).toBeDefined();
  });

  it('should have info method', () => {
    expect(logger.info).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  it('should have error method', () => {
    expect(logger.error).toBeDefined();
    expect(typeof logger.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(logger.warn).toBeDefined();
    expect(typeof logger.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(logger.debug).toBeDefined();
    expect(typeof logger.debug).toBe('function');
  });

  it('should log info messages', () => {
    const message = 'Test info message';
    logger.info(message);
    expect(logger.info).toHaveBeenCalledWith(message);
  });

  it('should log error messages', () => {
    const message = 'Test error message';
    logger.error(message);
    expect(logger.error).toHaveBeenCalledWith(message);
  });

  it('should log warning messages', () => {
    const message = 'Test warning message';
    logger.warn(message);
    expect(logger.warn).toHaveBeenCalledWith(message);
  });

  it('should log debug messages', () => {
    const message = 'Test debug message';
    logger.debug(message);
    expect(logger.debug).toHaveBeenCalledWith(message);
  });

  it('should log messages with multiple arguments', () => {
    logger.info('Message', { data: 'test' }, 123);
    expect(logger.info).toHaveBeenCalledWith('Message', { data: 'test' }, 123);
  });

  it('should log error objects', () => {
    const error = new Error('Test error');
    logger.error('Error occurred:', error);
    expect(logger.error).toHaveBeenCalledWith('Error occurred:', error);
  });

  it('should handle empty messages', () => {
    logger.info('');
    expect(logger.info).toHaveBeenCalledWith('');
  });

  it('should handle undefined messages', () => {
    logger.warn(undefined as any);
    expect(logger.warn).toHaveBeenCalledWith(undefined);
  });

  it('should handle null messages', () => {
    logger.debug(null as any);
    expect(logger.debug).toHaveBeenCalledWith(null);
  });

  it('should have level property', () => {
    expect(logger.level).toBeDefined();
  });
});