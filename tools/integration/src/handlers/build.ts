import fs from 'fs';
import logger from '../logger';
import path from 'path';
import { pathExists } from '../utils';
import { spawn } from 'child_process';
import { validateCollectorFiles } from '../validators';

/**
 * Handler for building collector Docker images
 * Validates package structure and collector configuration
 */
export async function handleBuild(argv: any): Promise<void> {
    try {
        const packagePath = path.resolve(argv.package);
        
        logger.info(`Building collector for package: ${packagePath}`);

        // Check if package directory exists
        if (!pathExists(packagePath)) {
            logger.error(`Package directory not found: ${packagePath}`);
            process.exit(1);
        }
        logger.info(`Package directory exists: ${packagePath}`);

        // Check if collector directory exists
        const collectorPath = path.join(packagePath, 'collector');
        if (!pathExists(collectorPath)) {
            logger.error(`Collector directory not found: ${collectorPath}`);
            logger.error(`Make sure your package includes a 'collector' folder.`);
            process.exit(1);
        }
        logger.info(`Collector directory exists: ${collectorPath}`);

        // Validate collector files
        const errors: string[] = [];
        const warnings: string[] = [];
        const successMessages: string[] = [];
        
        validateCollectorFiles(collectorPath, errors, warnings, successMessages);
        
        // Log validation results
        if (errors.length > 0) {
            errors.forEach(error => logger.error(error));
            logger.error('Collector validation failed. Please fix the errors above.');
            process.exit(1);
        }
    
    if (warnings.length > 0 && argv.debug) {
        warnings.forEach(warning => logger.warn(warning));
    }
    
    if (argv.debug) {
        successMessages.forEach(msg => logger.info(msg));
    } else {
        logger.info(`Required collector files exist`);
    }

    const configPath = path.join(collectorPath, 'config.json');

    let config: any;
    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
    } catch (error) {
        throw new Error(`Failed to parse config.json: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validate required config fields
    const missingFields: string[] = [];
    
    if (!config.image) {
        throw new Error('Invalid collector config: missing "image" section');
    }
    
    if (!config.image.registry) {
        missingFields.push('image.registry');
    }
    
    if (!config.image.repository) {
        missingFields.push('image.repository');
    }
    
    if (!config.image.tag) {
        missingFields.push('image.tag');
    }

    if (missingFields.length > 0) {
        throw new Error(`Invalid collector config: missing required fields: ${missingFields.join(', ')}`);
    }

    // Construct image tag
    const imageTag = `${config.image.registry}/${config.image.repository}:${config.image.tag}`;
    
    logger.info(`Configuration is valid`);
    logger.info(`Extension ID: ${config.extension_id || 'N/A'}`);
    logger.info(`Extension Name: ${config.extension_name || 'N/A'}`);
    logger.info(`Image Tag: ${imageTag}`);

    //Build Docker Image
    logger.info(`Executing: docker build -t ${imageTag} ${collectorPath}`);

    try {
        await new Promise<void>((resolve, reject) => {
            const dockerBuild = spawn('docker', ['build', '-t', imageTag, collectorPath], {
                stdio: 'inherit'
            });

            dockerBuild.on('close', (code: number | null) => {
                if (code !== 0) {
                    reject(new Error(`Docker build failed with exit code ${code}`));
                } else {
                    resolve();
                }
            });

            dockerBuild.on('error', (error: Error) => {
                reject(new Error(`Failed to execute docker build: ${error.message}`));
            });
        });

        logger.info(`Successfully built Docker image: ${imageTag}`);
        logger.info(`To run the collector locally:`);
        logger.info(`  docker run ${imageTag}`);
        logger.info(`To view the image:`);
        logger.info(`  docker images | grep ${config.image.repository}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Docker build failed: ${errorMessage}`);
    }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(errorMessage);
        process.exit(1);
    }
}
