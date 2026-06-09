import fs from 'fs';
import logger from '../logger';
import path from 'path';
import { pathExists } from '../utils';
import { execSync, spawn } from 'child_process';
import { validateCollectorFiles } from '../validators';

/* Detect available container runtime (docker or podman)  */
function detectContainerRuntime(): string {
    const runtimes = ['docker', 'podman'];
    
    for (const runtime of runtimes) {
        try {
            // Check if command exists and daemon is accessible
            execSync(`${runtime} version`, { stdio: 'pipe', timeout: 5000 });
            logger.info(`Detected container runtime: ${runtime}`);
            return runtime;
        } catch (error) {
            // Runtime not available or daemon not running, try next
            continue;
        }
    }
    
    throw new Error(
        'No container runtime detected. Please install Docker or Podman and ensure the daemon is running.\n' +
        'Docker: https://docs.docker.com/get-docker/\n' +
        'Podman: https://podman.io/getting-started/installation'
    );
}

/**
 * Handler for building collector Docker images
 * Validates package structure and collector configuration
 */
export async function handleBuild(argv: any): Promise<void> {
    const packagePath = path.resolve(argv.package);
    
    logger.info(`Building collector for package: ${packagePath}`);
    
    // Detect and verify container runtime
    const containerRuntime = detectContainerRuntime();

    // Check if package directory exists
    if (!pathExists(packagePath)) {
        throw new Error(`Package directory not found: ${packagePath}`);
    }
    logger.info(`Package directory exists: ${packagePath}`);

    // Check if collector directory exists
    const collectorPath = path.join(packagePath, 'collector');
    if (!pathExists(collectorPath)) {
        throw new Error(
            `Collector directory not found: ${collectorPath}. Make sure your package includes a 'collector' folder.`
        );
    }
    logger.info(`Collector directory exists: ${collectorPath}`);

    // Validate collector files
    const errors: string[] = [];
    const warnings: string[] = [];
    const successMessages: string[] = [];

    validateCollectorFiles(collectorPath, errors, warnings, successMessages);
    
    // Show detailed validation results in debug mode
    if (argv.debug) {
        logger.info('=== Validation Results ===');
        if (successMessages.length > 0) {
            logger.info(`✓ Success (${successMessages.length}):`);
            successMessages.forEach(msg => logger.info(`  ${msg}`));
        }
        if (warnings.length > 0) {
            logger.warn(`⚠ Warnings (${warnings.length}):`);
            warnings.forEach(warning => logger.warn(`  ${warning}`));
        }
        if (errors.length > 0) {
            logger.error(`✗ Errors (${errors.length}):`);
            errors.forEach(error => logger.error(`  ${error}`));
        }
        logger.info('==========================');
    }
    
    if (errors.length > 0) {
        errors.forEach(error => logger.error(error));
        throw new Error('Collector validation failed.');
    }
    
    if (!argv.debug) {
        logger.info('Required collector files exist');
    }

    // Read config.json to get image information for Docker build
    const configPath = path.join(collectorPath, 'config.json');
    let config: any;
    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
    } catch (error) {
        throw new Error(
            `Failed to read config.json: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }

    // Construct image tag (validation already done by validateCollectorFiles)
    const imageTag = `${config.image.registry}/${config.image.repository}:${config.image.tag}`;

    // Validate the constructed image tag against Docker naming conventions
    const imageTagPattern = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9._-]*[a-z0-9])?)*\/[a-z0-9]+([._-][a-z0-9]+)*(\/[a-z0-9]+([._-][a-z0-9]+)*)*:[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
    
    if (!imageTagPattern.test(imageTag)) {
        throw new Error(
            `Invalid Docker image tag format: "${imageTag}". ` +
            `Image tag must follow Docker naming conventions: ` +
            `lowercase alphanumeric with allowed separators (-, ., _), no consecutive special characters.`
        );
    }

    logger.info('Configuration is valid');
    logger.info(`Extension ID: ${config.extension_id || 'N/A'}`);
    logger.info(`Extension Name: ${config.extension_name || 'N/A'}`);
    logger.info(`Image Tag: ${imageTag}`);

    // Build Docker Image
    if (argv.debug) {
        logger.info('=== Docker Build Debug Information ===');
        logger.info(`Build Context: ${collectorPath}`);
        logger.info(`Image Tag: ${imageTag}`);
        logger.info(`Registry: ${config.image.registry}`);
        logger.info(`Repository: ${config.image.repository}`);
        logger.info(`Tag: ${config.image.tag}`);
        logger.info(`Dockerfile: ${path.join(collectorPath, 'Dockerfile')}`);
        logger.info(`Build Command: docker build -t ${imageTag} ${collectorPath}`);
        logger.info('======================================');
    }
    
    // Prepare Docker build arguments
    const dockerArgs = ['build', '-t', imageTag];
    
    // Add platform
    const platform = argv.platform || config.build_options?.platform;
    if (platform) {
        dockerArgs.push('--platform', platform);
        if (argv.debug) {
            logger.info(`Using platform: ${platform} (from ${argv.platform ? 'CLI' : 'config'})`);
        }
    }
    
    // Add build arguments
    const buildArgs = argv['build-arg'] || [];
    if (buildArgs.length > 0) {
        buildArgs.forEach((arg: string) => {
            dockerArgs.push('--build-arg', arg);
            if (argv.debug) {
                logger.info(`Using build arg: ${arg} (from CLI)`);
            }
        });
    } else if (config.build_options?.build_args && typeof config.build_options.build_args === 'object') {
        Object.entries(config.build_options.build_args).forEach(([key, value]) => {
            dockerArgs.push('--build-arg', `${key}=${value}`);
            if (argv.debug) {
                logger.info(`Using build arg: ${key}=${value} (from config)`);
            }
        });
    }
    
    // Add no-cache flag
    const noCache = argv.noCache || config.build_options?.no_cache;
    if (noCache === true) {
        dockerArgs.push('--no-cache');
        if (argv.debug) {
            logger.info(`Using --no-cache flag (from ${argv.noCache ? 'CLI' : 'config'})`);
        }
    }
    
    // Add network setting
    const network = argv.network || config.build_options?.network;
    if (network) {
        dockerArgs.push('--network', network);
        if (argv.debug) {
            logger.info(`Using network: ${network} (from ${argv.network ? 'CLI' : 'config'})`);
        }
    }
    
    // Add build context path
    dockerArgs.push(collectorPath);
    
    const buildCommand = `${containerRuntime} ${dockerArgs.join(' ')}`;
    logger.info(`Executing: ${buildCommand}`);

    try {
        await new Promise<void>((resolve, reject) => {
            const dockerBuild = spawn(containerRuntime, dockerArgs, { stdio: 'inherit' });

            dockerBuild.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Docker build failed with exit code ${code}`));
                } else {
                    resolve();
                }
            });

            dockerBuild.on('error', (error) => {
                reject(new Error(`Failed to execute docker build: ${error.message}`));
            });
        });
    } catch (error) {
        throw new Error(
            `Docker build failed: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }

    logger.info(`Successfully built Docker image: ${imageTag}`);
    logger.info('To run the collector locally:');
    logger.info(`  docker run ${imageTag}`);
    logger.info('To view the image:');
    logger.info(`  docker images | grep ${config.image.repository}`);
}
