#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');
const { program } = require('commander');

// Create a new proxy server
const proxy = httpProxy.createProxyServer({});

// Proxies object to store the proxy name and target URL
let proxies = {};

// Path to the file where proxies are stored
const proxyFilePath = './proxies.json';

// This function loads the proxies from the file
function loadProxies() {
    try {
        // Read the file and parse the JSON data
        const data = fs.readFileSync(proxyFilePath);
        // Store the proxies in the object
        proxies = JSON.parse(data);
    } catch (err) {
        // If the file does not exist or there is an error, log the error message
        console.error('Error loading proxies:', err.message);
    }
}

// This function saves the proxies to the file
function saveProxies() {
    try {
        // Write the proxies object to the file
        fs.writeFileSync(proxyFilePath, JSON.stringify(proxies, null, 2));
    } catch (err) {
        // If there is an error, log the error message
        console.error('Error saving proxies:', err.message);
    }
}

// Define the commands for the CLI
// Add a new proxy
program
    .command('add <name> <url>')
    .description('Add a new proxy')
    .action((name, url) => {
        // Add the proxy to the object and save it
        proxies[name] = url;
        // Save the proxies to the file
        saveProxies();
        // Log a message to the console
        console.log(`Proxy '${name}' added for '${url}'`);
    });

// Run an existing proxy
program
    .command('run <name>')
    .description('Run a proxy')
    .action((name) => {
        // Get the target URL for the proxy
        const target = proxies[name];

        // If the proxy does not exist, log an error message
        if (!target) {
            console.error(`Proxy with name '${name}' not found`);
            return;
        }

        // Create a new server for the proxy
        const server = http.createServer((req, res) => {

            // Had to disable SSL verification to make it work for a certain case
            // Log a PR to fix to make this dynamic based on command line argument
            proxy.web(req, res, { target, secure: false }); // Disable SSL verification

            // Log the request and response
            proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log(`${req.method} ${req.url} -> ${target}`);
            });

            // Log the request and response
            proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`${req.method} ${req.url} <- ${target} (${proxyRes.statusCode})`);
            });
        });

        // Listen on port 4000
        // Log a PR to make port dynamic based on command line argument
        server.listen(4000, () => {
            console.log(`Proxy server running for '${name}' at http://localhost:4000`);
        });
    });

// Load proxies when the program starts
loadProxies();

// Parse the command line arguments
program.parse(process.argv);