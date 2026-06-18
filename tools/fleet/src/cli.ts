import path from 'path';
import yargs from 'yargs';

/**
 * CLI Configuration Module
 */

const execName = path.basename(process.argv[1]);

export function configureCLI(handlers: {
    handleRestart: (argv: any) => Promise<void>;
}) {
    return yargs
        .wrap(160)
        .usage(`Stanctl Fleet CLI\n\nUsage: ${execName} <command> <options>`)
        .command(
            'restart',
            'Restart collector',
            (yargs) => {
                return yargs
                    .option('server', {
                        describe: 'Server hostname (no http/https)',
                        type: 'string',
                        demandOption: false
                    })
                    .option('token', {
                        describe: 'API token',
                        type: 'string',
                        demandOption: false
                    })
                    .option('type', {
                        describe: 'Agent type (idot | instanaagent | extension)',
                        type: 'string',
                        demandOption: true
                    })
                    .option('tag', {
                        describe: 'Tags key-value map',
                        type: 'array',
                        demandOption: false
                    })
                    .option('group', {
                        describe: 'Groups list',
                        type: 'array',
                        demandOption: false
                    })
                    .option('debug', {
                        describe: 'Enable debug logging',
                        type: 'boolean',
                        default: false
                    });
            },
            handlers.handleRestart
        )
        .demandCommand(1, 'You need at least one command')
        .help()
        .alias('h', 'help')
        .version()
        .alias('v', 'version')
        .strict()
        .parse();
}