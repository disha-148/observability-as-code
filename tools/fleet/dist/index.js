#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./cli");
const restart_1 = require("./handlers/restart");
// Wire CLI commands
(0, cli_1.configureCLI)({
    handleRestart: restart_1.handleRestart
});
