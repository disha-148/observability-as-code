#!/usr/bin/env node

import { configureCLI } from './cli';

// Handler functions for each command
async function handleList(argv: any): Promise<void> {
    console.log('Listing fleets...');
    if (argv.debug) {
        console.log('Debug mode enabled');
    }
}

async function handleCreate(argv: any): Promise<void> {
    console.log(`Creating fleet: ${argv.name}`);
    if (argv.debug) {
        console.log('Debug mode enabled');
    }
}

// Configure and start the CLI
configureCLI({
    handleList,
    handleCreate
});
