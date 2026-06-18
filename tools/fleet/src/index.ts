#!/usr/bin/env node

import { configureCLI } from './cli';
import { handleRestart } from './handlers/restart';
import logger from './logger';

// Wire CLI commands
configureCLI({
    handleRestart
});