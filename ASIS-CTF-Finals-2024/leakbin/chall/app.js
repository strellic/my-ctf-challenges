const express = require("express");
const crypto = require("crypto");

const bot = require("./bot");

const POW_DIFFICULTY = Number(process.env.POW_DIFFICULTY) || 22;
const PORT = process.env.PORT || 3000;

const app = express();

app.set("view engine", "hbs");
app.use(express.urlencoded({ extended: false }));

const users = new Map();
const pastes = new Map();

app.use(require("cookie-session")({
    name: "session",
    keys: [crypto.randomBytes(32).toString("hex")],
    maxAge: 24 * 60 * 60 * 1000,
}));

const requiresLogin = (req, res, next) => {
    if (!req.user) {
        req.session.error = "You must be logged in to view that page";
        return res.redirect("/login");
    }
    next();
};

const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

app.use((req, res, next) => {
    // surely this is enough to protect my website!!!
    res.setHeader("Content-Security-Policy", "default-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'none';");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Document-Policy", "force-load-at-top");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Cache-Control", "no-store");

    res.locals.POW_DIFFICULTY = POW_DIFFICULTY;
    if (req.session.error) {
        res.locals.error = req.session.error;
        req.session.error = null;
    }

    if (req.session.user && users.has(req.session.user)) {
        res.locals.user = users.get(req.session.user);
        req.user = res.locals.user;
    }

    next();
});

app.use(express.static("public"));

app.post("/api/login", (req, res) => {
    const { user, pass } = req.body;
    if (!user || !pass || typeof user !== "string" || typeof pass !== "string") {
        req.session.error = "Missing username or password";
        return res.redirect("/login");
    }

    if (!users.has(user) || users.get(user).pass !== sha256(pass)) {
        req.session.error = "Invalid username or password";
        return res.redirect("/login");
    }

    req.session.user = user;
    res.redirect("/home");
});

app.post("/api/register", (req, res) => {
    const { user, pass } = req.body;
    if (!user || !pass || typeof user !== "string" || typeof pass !== "string") {
        req.session.error = "Missing username or password";
        return res.redirect("/register");
    }

    if (user.length < 5 || pass.length < 8) {
        req.session.error = "Username must be at least 5 characters and password must be at least 8 characters";
        return res.redirect("/register");
    }

    if (pass.includes(user)) {
        req.session.error = "Password cannot contain username";
        return res.redirect("/register");
    }

    if (users.has(user)) {
        req.session.error = "Username already taken";
        return res.redirect("/register");
    }

    req.session.user = user;
    users.set(user, {
        user,
        pass: sha256(pass),
        pastes: []
    });
    res.redirect("/home");
});

app.post("/api/create", requiresLogin, (req, res) => {
    const { title, content } = req.body;
    if (!title || !content || typeof title !== "string" || typeof content !== "string") {
        req.session.error = "Missing title or content";
        return res.redirect("/home");
    }

    const id = crypto.randomBytes(16).toString("hex");
    req.user.pastes.push({ id, title });
    pastes.set(id, { id, title, content });

    res.redirect("/view/" + id);
});

app.get("/view/:id", (req, res) => {
    const paste = pastes.get(req.params.id);
    if (!paste) {
        req.session.error = "Paste not found";
        return res.redirect("/home");
    }

    res.render("view", { paste });
});

app.post("/api/search", requiresLogin, (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
        req.session.error = "Missing search query";
        return res.redirect("/home");
    }

    const results = req.user.pastes.map(p => pastes.get(p.id)).filter(p => p.title.includes(query) || p.content.includes(query));
    req.session.results = results.map(p => ({ id: p.id, title: p.title }));

    res.redirect("/search");
});

app.get("/search", requiresLogin, (req, res) => res.render("search", { results: req.session.results }));
app.get("/home", requiresLogin, (req, res) => res.render("home"));
app.get("/register", (req, res) => res.render("register"));
app.get("/login", (req, res) => res.render("login"));
app.get("/", (req, res) => res.render("index"));

const verifyPOW = (prefix, difficulty, answer) => {
    if(!answer.startsWith(prefix)) return false;
    const hex = crypto.createHash("sha256").update(answer).digest();
    const zeros = '0'.repeat(difficulty);
    let bin = '';
    for (const c of hex)
        bin += c.toString(2).padStart(8, '0');
    return bin.startsWith(zeros);
};

app.get("/report", (req, res) => {
    req.session.pow = crypto.randomBytes(4).toString("hex");
    res.render("report", { pow: req.session.pow });
});

app.post("/api/report", async (req, res) => {
    const { url, pow } = req.body;
    if (typeof url !== "string") {
        return res.render("report", { url: null, error: "missing URL" });
    }

    if (!req.session.pow || typeof pow !== "string") {
        return res.render("report", { url, error: "missing proof of work" });
    }

    let u;
    try {
        u = new URL(url);
    } catch {
        return res.render("report", { url, error: "invalid URL" });
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
        return res.render("report", { url, error: "URL must be either http: or https:" });
    }

    if (!verifyPOW(req.session.pow, POW_DIFFICULTY, pow)) {
        return res.render("report", { url, error: "invalid proof of work" });
    }

    req.session.pow = crypto.randomBytes(4).toString("hex");
    try {
        res.render("report", { url, message: await bot.visit(url), pow: req.session.pow });
    }
    catch (err) {
        res.render("report", { url, error: err.message, pow: req.session.pow });
    }
});

app.listen(PORT, () => console.log(`web/leakbin listening on http://localhost:${PORT}`));