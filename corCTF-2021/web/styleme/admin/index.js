const express = require("express");
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

require("dotenv").config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 80;

const admin = require("./admin.js");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/xss/add", (req, res) => {
    if(!req.headers.authorization || req.headers.authorization !== process.env.XSSBOT_SECRET) {
        return res.end("unauthorized");
    }

    let { url } = req.body;
    if(!url) {
        return res.end("missing url");
    }
    admin.addToQueue(url);
    return res.end("done");
});

// proxy requests to http://localhost to the challenge page, 
// helps so players don't have to think about infra
app.use('/', createProxyMiddleware({ target: 'http://chall', changeOrigin: true }));

app.listen(PORT, () => {
    console.log(`xss bot listening on port ${PORT}`);
});