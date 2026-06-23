// Wrapper to expose the logFormat function for testing
import { format } from 'winston';

const { printf } = format;

export const logFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});
