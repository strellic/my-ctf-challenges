const express = require("express");
const crypto = require("crypto");
const fs = require("fs");

const FLAG = process.env.FLAG || "dice{test_flag}";
const PORT = process.env.PORT || 3000;

const bot = require("./bot");

const app = express();

const indexHtml = fs.readFileSync("./views/index.html", "utf8");
const reportHtml = fs.readFileSync("./views/report.html", "utf8");

const secret = crypto.randomBytes(8).toString("hex");
console.log(`secret: ${secret}`);

app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

let lastVisit = -1;
app.post("/report", (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
        return res.redirect(`/report?message=${encodeURIComponent("Missing URL")}`);
    }

    try {
        const u = new URL(url);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
            throw new Error("Invalid protocol");
        }
    }
    catch (err) {
        return res.redirect(`/report?message=${encodeURIComponent(err.message)}&url=${encodeURIComponent(url)}`);
    }

    const deltaTime = +new Date() - lastVisit;
    if (deltaTime < 95_000) {
        return res.redirect(`/report?message=${encodeURIComponent(
            `Please slow down (wait ${(95_000 - deltaTime)/1000} more seconds)
        `)}&url=${encodeURIComponent(url)}`);
    }
    lastVisit = +new Date();
  
    bot.visit(secret, url);
    res.redirect(`/report?message=${encodeURIComponent("The admin will check your URL soon")}&url=${encodeURIComponent(url)}`);
});

app.get("/flag", (req, res) => res.send(req.query.secret === secret ? FLAG : "No flag for you!"));
app.get("/xss", (req, res) => res.send(req.query.xss ?? "Hello, world!"));
app.get("/report", (req, res) => res.send(reportHtml));
app.get("/", (req, res) => res.send(indexHtml));

app.listen(PORT, () => console.log(`web/nobin listening on port ${PORT}`));
