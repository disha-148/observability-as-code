#!/usr/bin/env node

import * as utils from './utils';
import * as validators from './validators';

import { Separator, checkbox, input, password } from '@inquirer/prompts';
import axios, { AxiosError } from 'axios';
import { exec, spawn } from 'child_process';

import Handlebars from 'handlebars';
import { configureCLI } from './cli';
import fs from 'fs';
import { globSync } from 'glob';
import { handleDownload } from './handlers/download';
import { handleExport } from './handlers/export';
import { handleImport } from './handlers/import';
import { handleInit } from './handlers/init';
import { handleLint } from './handlers/lint';
import { handlePublish } from './handlers/publish';
import https from 'https';
import logger from './logger'; // Import the logger
import path from 'path';
import { promisify } from 'util';
import semver from 'semver';

const execAsync = promisify(exec);

interface IdObject {
    id: string;
    title: string;
    ownerId: string;
    annotations: string[];
}

// Register a helper to preserve placeholders if no value is provided
Handlebars.registerHelper('default', function (value: string, defaultValue: string) {
    return typeof value !== 'undefined' ? value : defaultValue;
});

// Configure and start the CLI
configureCLI({
    handleDownload,
    handleImport,
    handleExport,
    handleInit,
    handlePublish,
    handleLint
});
