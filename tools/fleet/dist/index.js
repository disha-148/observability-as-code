#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./cli");
// Handler functions for each command
function handleList(argv) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Listing fleets...');
        if (argv.debug) {
            console.log('Debug mode enabled');
        }
    });
}
function handleCreate(argv) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Creating fleet: ${argv.name}`);
        if (argv.debug) {
            console.log('Debug mode enabled');
        }
    });
}
// Configure and start the CLI
(0, cli_1.configureCLI)({
    handleList,
    handleCreate
});
// Made with Bob
