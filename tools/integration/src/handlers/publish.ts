import * as utils from '../utils';

import logger from '../logger';
import path from 'path';

/**
 * Handler for publishing integration packages to npm
 * @param argv Command line arguments containing package path, registry username, and email
 */
export async function handlePublish(argv: any): Promise<void> {
    let { package: packageNameOrPath, registryUsername, registryEmail } = argv;

    logger.info(`Start to publish the integration package: ${packageNameOrPath}`);

    let packageName;
    let packagePath;
    let scope;

    if (utils.pathExists(packageNameOrPath)) {
        packagePath = packageNameOrPath;
        const packageJson = utils.readPackageJson(packagePath);
        if (!packageJson) {
            logger.error('Failed to read the package.json');
            return;
        }
        packageName = packageJson.name;
    } else {
        packageName = packageNameOrPath;
        packagePath = path.join(process.cwd(), packageNameOrPath);
        if (!utils.pathExists(packagePath)) {
            logger.error(`Path does not exist: ${packagePath}`);
            return;
        }
    }

    // Extract scope from package name if it exists
    const scopeMatch = packageName.match(/^@([^/]+)\/.+$/);
    scope = scopeMatch ? scopeMatch[1] : null;

    logger.info('Logging into the integration package registry ...');

    if (!(await utils.isUserLoggedIn())) {
        try {
            // npm login
            const loginArgs = ['login', '--username', registryUsername, '--email', registryEmail];
            if (scope) {
                loginArgs.push(`--scope=@${scope}`);
            }
            await utils.spawnAsync('npm', loginArgs, { stdio: 'inherit' });

            logger.info('Logged into the integration package registry successfully');
        } catch (error) {
            logger.error('Error occurred during login:', error);
            process.exit(1);
        }
    } else {
        logger.info('Already logged into the integration package registry');
    }

    logger.info(`Publishing the integration package from ${packagePath} ...`);
    logger.info(`Package name: ${packageName}`);
    logger.info(`Scope: ${scope || 'none'}`);

    try {
        // npm publish command
        const publishArgs = ['publish'];
        if (scope) {
            publishArgs.push('--access', 'public');
        }
        await utils.spawnAsync('npm', publishArgs, { cwd: packagePath, stdio: 'inherit' });

        logger.info(`Package ${packageName} published successfully`);
    } catch (error) {
        logger.error(`Error publishing the integration package ${packageNameOrPath}:`, error);
        process.exit(1);
    }
}