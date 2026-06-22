import path from 'path';
import yargs from 'yargs';

/**
 * CLI Configuration Module
 * Contains all yargs command definitions and configurations
 */

const execName = path.basename(process.argv[1]);

// Example texts for each command
const examplesForRestart = `
Examples:

Restart the agent instances:
  ${execName} restart --server example.com --token validToken --type agentType --tag key1=value1 --tag key2=value2
  ${execName} restart --type agentType --tag key1=value1 --tag key2=value2 (specify the server and token as environment variables using INSTANA_SERVER and INSTANA_API_TOKEN)
  ${execName} restart --type agentType --group groupValue
  ${execName} restart --type agentType --group groupValue --debug
`;

export function configureCLI(handlers: {
    handleRestart: (argv: any) => Promise<void>;
}) {
    return yargs
        .wrap(160)
        .usage(`The Instana CLI for agent fleet management\n\nUsage: ${execName} <command> <options>`)
        .command(
            'restart',
            'Restart the agent instances',
            (yargs) => {
                return yargs
                    .option('server', {
						alias: 'S',
                        describe: 'Address of an environment',
                        type: 'string',
                        demandOption: false
                    })
                    .option('token', {
						alias: 't',
                        describe: 'API token to export the integration elements',
                        type: 'string',
                        demandOption: false
                    })
                    .option('type', {
						alias: 'y',
                        describe: 'Agent type, allowed values (com.ibm.opentelemetrycollector, com.ibm.instana.agent, com.ibm.instana.customcollector)',
                        type: 'string',
                        demandOption: true
                    })
                    .option('tag', {
						alias: 'T',
                        describe: 'Tags in the format key=value',
                        type: 'array',
                        demandOption: false
                    })
                    .option('group', {
						alias: 'g',
                        describe: 'Groups list',
                        type: 'array',
                        demandOption: false
                    })
                    .option('debug', {
						alias: 'd',
                        describe: 'Enable debug mode',
                        type: 'boolean',
                        default: false
                    })
					.epilog(examplesForRestart);
            },
            handlers.handleRestart
        )
        .demandCommand(1, 'You need at least one command before moving on')
        .help()
        .alias('help', 'h')
        .version()
        .alias('version', 'v')
        .strict()
        .parse();
}