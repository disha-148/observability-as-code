import { exec } from 'child_process';
import logger from '../logger';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Handler for downloading integration packages from npm
 * @param argv Command line arguments containing package name and location
 */
export async function handleDownload(argv: any): Promise<void> {
    const { package: packageName, location } = argv;

    logger.info(`Start to download the integration package: ${packageName}`);

    const downloadCommand = `npm install ${packageName} --prefix ${location}`;
    try {
        const { stdout, stderr } = await execAsync(downloadCommand);
        logger.info(`Download completed, detailed logs: \n${stdout}`);
        logger.info(`The integration package is downloaded at: ${location}`);
        if (stderr) {
            logger.error(`Download warnings/errors: ${stderr}`);
        }
    } catch (error) {
        logger.error(`Failed to download the integration package ${packageName}: ${error}`);
        process.exit(1);
    }
}