import path from 'path';
import yargs from 'yargs';

/**
 * CLI Configuration Module
 * Contains all yargs command definitions and configurations
 */

// Dynamically determine the executable name
const execName = path.basename(process.argv[1]);

// Example texts for each command
const examplesForList = `
Examples:

List all fleets:
  ${execName} list
`;

const examplesForCreate = `
Examples:

Create a new fleet:
  ${execName} create --name my-fleet
`;

/**
 * Configure and return the yargs CLI instance
 * @param handlers Object containing all command handler functions
 */
export function configureCLI(handlers: {
    handleList: (argv: any) => Promise<void>;
    handleCreate: (argv: any) => Promise<void>;
}) {
    return yargs
        .wrap(160) // Set the desired width here
        .usage(`The Instana CLI for fleet management\n\nUsage: ${execName} <command> <options>`)
        .command('list', 'List all fleets', (yargs) => {
            return yargs
                .option('debug', {
                    alias: 'd',
                    describe: 'Enable debug mode',
                    type: 'boolean',
                    default: false
                })
                .epilog(examplesForList);
        }, handlers.handleList)
        .command('create', 'Create a new fleet', (yargs) => {
            return yargs
                .option('name', {
                    alias: 'n',
                    describe: 'The fleet name',
                    type: 'string',
                    demandOption: true
                })
                .option('debug', {
                    alias: 'd',
                    describe: 'Enable debug mode',
                    type: 'boolean',
                    default: false
                })
                .epilog(examplesForCreate);
        }, handlers.handleCreate)
        .demandCommand(1, 'You need at least one command before moving on')
        .help()
        .alias('help', 'h')
        .version()
        .alias('version', 'v')
        .strict()
        .parse();
}

// Made with Bob
