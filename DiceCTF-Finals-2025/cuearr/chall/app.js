const express = require("express");
const crypto = require("crypto");

const bot = require("./bot");

const PORT = process.env.PORT || 3000;
const POW_DIFFICULTY = Number(process.env.POW_DIFFICULTY) || 23;

const tokens = new Map(); // token -> time
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(require("express-session")({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: "lax"
    }
}));
app.use(express.static("public"));
app.set("view engine", "hbs");

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "script-src 'self'; style-src 'unsafe-inline';");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    next();
});

app.post("/api/create", (req, res) => {
    const { content } = req.body;

    if (!content || typeof content !== "string") {
        return res.send("missing content");
    }

    if (content.length > 500) {
        return res.send("content too long");
    }

    req.session.qr = content;
    res.redirect("/qr");
});
app.get("/api/qr", (req, res) => res.json({ qr: req.session.qr || "" }));

const verifyPOW = (prefix, difficulty, answer) => {
    if(!answer.startsWith(prefix)) return false;
    const hex = crypto.createHash("sha256").update(answer).digest();
    const zeros = '0'.repeat(difficulty);
    let bin = '';
    for (const c of hex)
        bin += c.toString(2).padStart(8, '0');
    return bin.startsWith(zeros);
};
app.post("/api/report", async (req, res) => {
    const { url, pow } = req.body;

    if (!url || typeof url !== 'string') {
        return res.end('missing url');
    }

    if (!req.session.pow || !pow || typeof pow !== "string") {
        return res.end('missing pow');
    }

    try {
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return res.end('invalid url protocol');
        }
    } catch (e) {
        return res.end('invalid url');
    }

    if (!verifyPOW(req.session.pow, POW_DIFFICULTY, pow)) {
        return res.end('invalid pow');
    }
    req.session.pow = crypto.randomBytes(4).toString("hex");

    res.writeHead(200, {
        'Content-Type': "text/event-stream",
        'Cache-Control': "no-cache",
        'Connection': "keep-alive"
    });

    const log = (msg) => res.write(msg + "\n");

    const token = crypto.randomBytes(16).toString("hex");
    tokens.set(token, Date.now());

    log("starting visit...")
    try {
        await bot.visit(url, token, log);
    } catch (err) {
        console.log(err);
        res.write("error :(");
    } finally {
        res.end('done!');
    }
});

app.get("/token", (req, res) => {
    const token = req.query.token;
    if (!token || typeof token !== "string") {
        return res.send("missing token");
    }

    if (!tokens.has(token)) {
        return res.send("invalid token");
    }

    tokens.delete(token);
    res.send(process.env.FLAG || "dice{test_flag}");
});

// clear tokens older than 2 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, time] of tokens.entries()) {
        if (now - time > 2 * 60 * 1000) {
            tokens.delete(token);
        }
    }
}, 1000);

app.get("/report", (req, res) => {
    req.session.pow = crypto.randomBytes(4).toString("hex");
    res.render("report", { pow: req.session.pow, powDifficulty: POW_DIFFICULTY });
});
app.get("/qr", (req, res) => res.render("qr"));
app.get("/", (req, res) => res.render("index"));

app.listen(PORT, () => console.log(`web/cuearr listening on http://localhost:${PORT}`));