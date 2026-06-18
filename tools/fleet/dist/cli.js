"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCLI = configureCLI;
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
/**
 * CLI Configuration Module
 */
const execName = path_1.default.basename(process.argv[1]);
function configureCLI(handlers) {
    return yargs_1.default
        .wrap(160)
        .usage(`Stanctl Fleet CLI\n\nUsage: ${execName} <command> <options>`)
        .command('restart', 'Restart collector', (yargs) => {
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
    }, handlers.handleRestart)
        .demandCommand(1, 'You need at least one command')
        .help()
        .alias('h', 'help')
        .version()
        .alias('v', 'version')
        .strict()
        .parse();
}
