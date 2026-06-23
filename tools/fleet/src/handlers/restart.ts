import axios from 'axios';
import https from 'https';
import logger from '../logger';

/* Validates that the server address does not include protocol (http:// or https://) */
export function validateServerAddress(server: string): void {
    if (!server || typeof server !== 'string') {
        throw new Error('Server address is required and must be a string');
    }

    const trimmedServer = server.trim();

    if (trimmedServer.startsWith('http://') || trimmedServer.startsWith('https://')) {
        throw new Error(
            'Invalid server address: Do not include protocol (http:// or https://). Please use only the hostname.'
        );
    }

    if (trimmedServer.includes('://')) {
        throw new Error(
            'Invalid server address: Protocol prefix detected. Please use only the hostname.'
        );
    }
}

interface AgentControlActionRequest {
    action: 'agent.restart';
    type: 'com.ibm.opentelemetrycollector' | 'com.ibm.instana.agent' | 'com.ibm.instana.customcollector';
    tags?: Record<string, string>;
    groups?: string[];
    args?: Record<string, any>;
}

export async function handleRestart(argv: any) {
    const server = argv.server ?? process.env.INSTANA_SERVER;
    if (!server) {
        throw new Error('Missing server. Specify --server or set INSTANA_SERVER');
    }

    const token = argv.token ?? process.env.INSTANA_API_TOKEN;
    if (!token) {
        throw new Error('Missing API token. Specify --token or set INSTANA_API_TOKEN');
    }

    const { type, args, debug } = argv;

    if (debug) {
        logger.level = 'debug';
    }

    // Validate server
    validateServerAddress(server);

    // ---- Basic validation ----
    if (!type) {
        throw new Error('Missing required parameter: --type');
    }

    const tagsInput = [].concat(argv.tag ?? []).filter(Boolean);
    const groupsInput = [].concat(argv.group ?? []).filter(Boolean);

    const hasTags = tagsInput.length > 0;
    const hasGroup = groupsInput.length > 0;

    if (hasTags && hasGroup) {
        throw new Error('Use either --tag or --group, not both.');
    }

    if (!hasTags && !hasGroup) {
        throw new Error('You must provide either --tag or --group.');
    }

    let tags: Record<string, string> | undefined;

    if (hasTags) {
        tags = {};

        for (const tag of tagsInput) {
            const [key, ...rest] = String(tag).split('=');
            const value = rest.join('=');
            if (!key || !value) {
                throw new Error(`Invalid tag format: ${tag}. Expected key=value`);
            }
            tags[key.trim()] = value.trim();
        }
    }
    
    let groups: string[] | undefined;
    if (hasGroup) {
        groups = groupsInput.map(String);
    }
    
    const request: AgentControlActionRequest = {
        action: 'agent.restart',
        type,
        ...(tags && { tags }),
        ...(groups && { groups }),
        ...(args && { args })
    };

    const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    });

    const url = `http://${server}/api/unified-agent-requests`;

    try {
        logger.info(`Sending agent.restart request...`);

        const response = await axiosInstance.post(url, request, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `apiToken ${token}`
            }
        });

        const data = response.data;

        logger.info(`Request accepted`);
        logger.info(`Request ID: ${data.requestId}`);
        logger.info(`Status: ${data.status}`);

        if (data.message) {
            logger.info(`Message: ${data.message}`);
        }

        if (logger.isDebugEnabled()) {
            logger.debug(JSON.stringify(data, null, 2));
        }

        return data;

    } catch (error: any) {
        handleAxiosError(error, 'agent.restart request');
        throw error;
    }
}

function handleAxiosError(error: any, context: string) {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            logger.error(`Failed ${context}: ${JSON.stringify(error.response.data)}`);
        } else {
            logger.error(`Failed ${context}: ${error.message}`);
        }
    } else {
        logger.error(`Failed ${context}: ${String(error)}`);
    }
}