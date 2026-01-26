import * as utils from '../utils';

import axios from 'axios';
import fs from 'fs';
import https from 'https';
import logger from '../logger';
import path from 'path';

interface IdObject {
    id: string;
    title: string;
    ownerId: string;
    annotations: string[];
}

/**
 * Handle export command - exports dashboards, events, and entities from Instana
 */
export async function handleExport(argv: any) {
    const { server, token, location, include: includeRaw, debug } = argv;

    if (debug) {
        logger.level = 'debug';
    }

	const parsedIncludes = utils.parseIncludesFromArgv(process.argv);

    const exportPath = path.resolve(location);
    if (fs.existsSync(exportPath)) {
        const foldersToCheck = [
            path.join(location, 'dashboards'),
            path.join(location, 'events'),
            path.join(location, 'entities')
        ];

        for (const folderPath of foldersToCheck) {
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                // Filter out hidden files (starting with .) and only check for JSON files
                const jsonFiles = files.filter(file => !file.startsWith('.') && file.endsWith('.json'));
                if (jsonFiles.length > 0) {
                    logger.error(`Cannot export: folder contains existing JSON files.`);
                    logger.info(`The export directory must not contain any JSON files in dashboards/, events/, or entities/ folders.`);
                    logger.info(`Please clean the folder or choose a new one.`);
                    process.exit(1);
                }
            }
        }
    } else {
        fs.mkdirSync(exportPath, { recursive: true });
    }

    const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    });

    const dashboardsPath = path.join(location, "dashboards");
    const eventsPath = path.join(location, "events");
    const entitiesPath = path.join(location, "entities");
    fs.mkdirSync(dashboardsPath, { recursive: true });
    fs.mkdirSync(eventsPath, { recursive: true });
    fs.mkdirSync(entitiesPath, {recursive: true});

    let wasDashboardFound = false;
    let wasEventFound = false;
    let wasEntityFound = false;

    // Dashboard export
    if (parsedIncludes.some(inc => inc.type === "dashboard" || inc.type === "all")) {
        const allDashboards = await getDashboardList(server, token, axiosInstance);
        let totalDashboardProcessed = 0;

        for (const inc of parsedIncludes.filter(inc => inc.type === "dashboard" || inc.type === "all")) {
            const matches = inc.conditions.filter(c => c.startsWith("id="));

            let filtered;
            if (matches.length) {
                filtered = matches.map(idCond => {
                    const id = idCond.split("=")[1]?.replace(/^"|"$/g, '');
                    const found = allDashboards.find(d => d.id === id);
                    return found;
                }).filter(Boolean);
            } else {
                filtered = filterDashboardsBy(allDashboards, inc.conditions);
            }

            if (filtered.length === 0) {
                const logFn = inc.explicitlyTyped ? logger.error : logger.debug;
                logFn(`No dashboard(s) found matching: ${inc.conditions.join(', ')}`);
                continue;
            }
	    	const enriched = filtered.map(item => ({
                ...item,
                name: item.name ?? `dashboard-${item.id}`
            }));
            const sanitized = utils.sanitizeTitles(filtered, "dashboard");
            for (const dash of sanitized) {
                const dashboard = await exportDashboard(server, token, dash.id, axiosInstance);
                if (dashboard) {
                    saveDashboard(dashboardsPath, dash.id, dash.title, dashboard);
                    totalDashboardProcessed++;
                    wasDashboardFound = true;
                } else {
                    const logFn = inc.explicitlyTyped ? logger.error : logger.debug;
                    logFn(`The dashboard with id=${dash.id} not found or failed to export.`);
                }
            }
        }
        logger.info(`Total dashboard(s) processed: ${totalDashboardProcessed}`);
    }

    // Event export
    if (parsedIncludes.some(inc => inc.type === "event" || inc.type === "all")) {
        const allEvents = await getEventList(server, token, axiosInstance);
        let totalEventProcessed = 0;

        for (const inc of parsedIncludes.filter(inc => inc.type === "event" || inc.type === "all")) {
        	const matches = inc.conditions.filter(c => c.startsWith("id="));
            let filtered;
	   		if (matches.length) {
            	filtered = matches.map(idCond => {
                	const id = idCond.split("=")[1]?.replace(/^"|"$/g, '');
                    const found = allEvents.find(e => e.id === id);
                    return found;
                }).filter(Boolean);
            } else {
                filtered = filterEventsBy(allEvents, inc.conditions);
            }

            if (filtered.length === 0) {
                const logFn = inc.explicitlyTyped ? logger.error : logger.debug;
                logFn(`No event(s) found matching: ${inc.conditions.join(', ')}`);
                continue;
            }
	    	const enriched = filtered.map(item => ({
                ...item,
                name: item.name ?? `event-${item.id}`
            }));
            const sanitized = utils.sanitizeTitles(filtered, "event");
            for (const evt of sanitized) {
                const event = await exportEvent(server, token, evt.id, axiosInstance);
                if (event) {
                    saveEvent(eventsPath, evt.id, evt.title, event);
                    totalEventProcessed++;
                    wasEventFound = true;
                } else {
                    const logFn = inc.explicitlyTyped ? logger.error : logger.debug;
                    logFn(`The event with id=${evt.id} not found or failed to export.`);
                }
            }
        }

        logger.info(`Total event(s) processed: ${totalEventProcessed}`);
    }

	// Entity export
	if (parsedIncludes.some(inc => inc.type === "entity" || inc.type === "all")){
		const allEntities = await getEntityList(server, token, axiosInstance);
		let totalEntitiesProcessed = 0;

		for (const inc of parsedIncludes.filter(inc => inc.type === "entity" || inc.type === "all")){
			const matches = inc.conditions.filter(c => c.startsWith("id="));
			let filtered;
			if (matches.length) {
				filtered = matches.map(idCond => {
                	const id = idCond.split("=")[1]?.replace(/^"|"$/g, '');
                    const found = allEntities.find(e => e.id === id);
                    return found;
                }).filter(Boolean);
			} else {
				filtered = filterEntitiesBy(allEntities, inc.conditions);
			}

			if (filtered.length === 0){
				const logFn = inc.explicitlyTyped ? logger.error : logger.debug;
				logFn(`No entities found matching: ${inc.conditions.join(', ')}`)
				continue;
			}

			const enriched = filtered.map(item => ({
				...item,
            	data: {
            		...item.data,
            		label: item.data?.label ?? `entity-${item.id}`
            	}
			}));

            const sanitized = utils.sanitizeTitles(enriched, "entity");

            for (const ent of sanitized) {
				const entity = await exportEntity(server, token, ent.id, axiosInstance);
            	if (entity) {
            		saveEntity(entitiesPath, dashboardsPath, entity);
            		totalEntitiesProcessed++;
            		wasEntityFound = true;
            	} else {
            		const logFn = inc.explicitlyTyped ? logger.error : logger.debug;
            		logFn(`The entity with id=${ent.id} not found or failed to export.`);
            	}
			}
		}
		logger.info(`Total entities processed: ${totalEntitiesProcessed}`);
	}

    // Final info
    if (!wasDashboardFound && !wasEventFound && !wasEntityFound) {
        logger.error("No elements were found or exported.");
    }
}

// Helper functions for entity export
async function getEntityList(server: string, token: string, axiosInstance: any): Promise<any[]> {
	try {
		const url = `https://${server}/api/custom-entitytypes`;
		logger.info(`Getting entity list from ${url} ...`);

		const response = await axiosInstance.get(url, {
        	headers: {
            	'Content-Type': 'application/json',
                'Authorization': `apiToken ${token}`
            }
		});
        logger.info(`Successfully got entity list: ${response.status}`);
        if (logger.isDebugEnabled()) {
        	logger.debug(`Response data: \n${JSON.stringify(response.data)}`);
        }
        return response.data;
	} catch (error) {
		handleAxiosError(error, `entity list`);
        return [];
	}
}

function filterEntitiesBy(idObjects: any[], include: string[]): any[] {
    return idObjects.filter(obj => {
        return include.every(condition => {
            const [key, rawValue] = condition.split('=');
            const value = rawValue?.replace(/^"|"$/g, '');
            if (key === 'name' || key === 'title') {
                return new RegExp(value, 'i').test(obj.name ?? obj.data?.label ?? '');
            } else if (key === 'label') {
                return new RegExp(value, 'i').test(obj.data?.label ?? '');
            }
            return false;
        });
    });
}

async function exportEntity(server: string, token: string, entityId: string, axiosInstance: any): Promise<any> {
	try {
		const url = `https://${server}/api/custom-entitytypes/${entityId}`;
		logger.info(`Getting entity (id=${entityId}) from ${url} ...`);

		const response = await axiosInstance.get(url, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `apiToken ${token}`
			}
		});

		logger.info(`Successfully got entity (id=${entityId}): ${response.status}`);
		if (logger.isDebugEnabled()) {
			logger.debug(`Response data: \n${JSON.stringify(response.data)}`);
		}

		return response.data;
	} catch (error) {
		handleAxiosError(error, `entity (id=${entityId})`);
		return null;
	}
}

function saveEntity(entityDir: string, dashboardDir: string, entity: any) {
	try {
		const entityId = entity.id;
		const entityName = utils.sanitizeFileName(entity.data?.label ?? `entity-${entityId}`);
		const entityFilePath = path.join(entityDir, `${entityName}.json`);

		logger.info(`Saving entity (id=${entityId}) to ${entityFilePath} ...`);

		const dashboards = entity.data?.dashboards || [];
		const updatedDashboards: any[] = [];

		dashboards.forEach((dashboard: any, index: number) => {
			const dashboardContent = dashboard;
			const dashboardFileName = `${entityName}_dashboard_${index + 1}.json`;
			const dashboardFilePath = path.join(dashboardDir, dashboardFileName);

			logger.info(`Saving dashboard for entity (id=${entityId}) to ${dashboardFilePath} ...`);
			try {
				fs.writeFileSync(dashboardFilePath, JSON.stringify(dashboardContent, null, 2));
				logger.info(`Dashboard for entity (id=${entityId}) saved successfully to ${dashboardFilePath}`);
				updatedDashboards.push({ reference: dashboardFileName });
			} catch (err) {
				logger.error(`Error saving dashboard for entity (id=${entityId}) to ${dashboardFilePath}:`, err);
			}
		});

		entity.data.dashboards = updatedDashboards;

		fs.writeFileSync(entityFilePath, JSON.stringify(entity, null, 2));
		logger.info(`The entity (id=${entityId}) saved successfully to ${entityFilePath}`);
	} catch (error) {
		logger.error(`Error saving entity (id=${entity?.id ?? 'unknown'}):`, error);
	}
}


// Helper functions for dashboard export
async function exportDashboard(server: string, token: string, dashboardId: string, axiosInstance: any): Promise<any> {
    try {
        const url = `https://${server}/api/custom-dashboard/${dashboardId}`;
        logger.info(`Getting dashboard (id=${dashboardId}) from ${url} ...`);

        const response = await axiosInstance.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `apiToken ${token}`
            }
        });

        logger.info(`Successfully got dashboard (id=${dashboardId}): ${response.status}`);
        if (logger.isDebugEnabled()) {
            logger.debug(`Response data: \n${JSON.stringify(response.data)}`);
        }

        return response.data;
    } catch (error) {
        handleAxiosError(error, `dashboard (id=${dashboardId})`);
        return null;
    }
}

async function getDashboardList(server: string, token: string, axiosInstance: any): Promise<any[]> {
    try {
        const url = `https://${server}/api/custom-dashboard`;
        logger.info(`Getting dashboard list from ${url} ...`);

        const response = await axiosInstance.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `apiToken ${token}`
            }
        });
        logger.info(`Successfully got dashboard list: ${response.status}`);
        if (logger.isDebugEnabled()) {
            logger.debug(`Response data: \n${JSON.stringify(response.data)}`);
        }
        return response.data;
    } catch (error) {
        handleAxiosError(error, `dashboard list`);
        return [];
    }
}

function saveDashboard(dir: string, id: string, title: string, dashboard: any) {
    try {
        const filename = `${title}.json`;
        const filepath = path.join(dir, filename);
        logger.info(`Saving dashboard (id=${id}) to ${filepath} ...`);
        fs.writeFileSync(filepath, JSON.stringify(dashboard, null, 2));
        logger.info(`The dashboard (id=${id}) saved successfully`);
    } catch (error) {
        logger.error(`Error saving dashboard (id=${id}):`, error);
    }
}

function filterDashboardsBy(idObjects: IdObject[], include: string[]): IdObject[] {
    return idObjects.filter(obj => {
        return include.every(condition => {
            const [key, rawValue] = condition.split('=');
            const value = rawValue?.replace(/^"|"$/g, '');
            if (key === 'title') {
                return new RegExp(value, 'i').test(obj.title);
            } else if (key === 'ownerid') {
                return new RegExp(value, 'i').test(obj.ownerId ?? '');
            } else if (key === 'annotation') {
                return (obj.annotations ?? []).includes(value);
            }
            return false;
        });
    });
}

// Helper functions for event export
async function exportEvent(server: string, token: string, eventId: string, axiosInstance: any): Promise<any> {
    try {
        const url = `https://${server}/api/events/settings/event-specifications/custom/${eventId}`;
        logger.info(`Getting event (id=${eventId}) from ${url} ...`);

        const response = await axiosInstance.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `apiToken ${token}`
            }
        });

        logger.info(`Successfully got event (id=${eventId}): ${response.status}`);
        if (logger.isDebugEnabled()) {
            logger.debug(`Response data: \n${JSON.stringify(response.data)}`);
        }

        return response.data;
    } catch (error) {
        handleAxiosError(error, `event (id=${eventId})`);
        return null;
    }
}

async function getEventList(server: string, token: string, axiosInstance: any): Promise<any[]> {
    try {
        const url = `https://${server}/api/events/settings/event-specifications/custom`;
        logger.info(`Getting event list from ${url} ...`);

        const response = await axiosInstance.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `apiToken ${token}`
            }
        });

        logger.info(`Successfully got event list: ${response.status}`);
        if (logger.isDebugEnabled()) {
            logger.debug(`Response data: \n${JSON.stringify(response.data)}`);
        }

        return response.data;
    } catch (error) {
        handleAxiosError(error, `event list`);
        return [];
    }
}

function saveEvent(dir: string, id: string, name: string, event: any) {
    try {
        const filename = `${name}.json`;
        const filepath = path.join(dir, filename);
        logger.info(`Saving event (id=${id}) to ${filepath} ...`);
        fs.writeFileSync(filepath, JSON.stringify(event, null, 2));
        logger.info(`The event (id=${id}) saved successfully`);
    } catch (error) {
        logger.error(`Error saving event (id=${id}):`, error);
    }
}

function filterEventsBy(idObjects: any[], include: string[]): any[] {
    return idObjects.filter(obj => {
        return include.every(condition => {
            const [key, rawValue] = condition.split('=');
            const value = rawValue?.replace(/^"|"$/g, '');

            if (key === 'name' || key === 'title') {
                return new RegExp(value, 'i').test(obj.name ?? '');
            } else if (key === 'id') {
                return obj.id === value;
            }
            return false;
        });
    });
}

// Helper for axios error handling
function handleAxiosError(error: any, context: string) {
    if (axios.isAxiosError(error)) {
        logger.error(`Failed to get ${context}: ${error.message}`);
        if (error.response) {
			if (logger.isDebugEnabled()) {
            	logger.debug(`Response data: ${JSON.stringify(error.response.data)}`);
            	logger.debug(`Response status: ${error.response.status}`);
            	logger.debug(`Response headers: ${JSON.stringify(error.response.headers)}`);
            } else {
				logger.error(`Response status: ${error.response.status}`);
			}
        }
    } else {
        logger.error(`Failed to get ${context}: ${String(error)}`);
    }
}