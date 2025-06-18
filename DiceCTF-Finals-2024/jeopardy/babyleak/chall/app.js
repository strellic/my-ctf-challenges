const express = require("express");
const crypto = require("crypto");

const PORT = process.env.PORT || 1337;

const app = express();
const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

const session = require("express-session");
const MemoryStore = require("memorystore")(session)

app.use(
    session({
        cookie: { maxAge: 3600000, sameSite: "lax", httpOnly: true },
        store: new MemoryStore({
            checkPeriod: 3600000, // prune expired entries every 1h
        }),
        resave: false,
        saveUninitialized: false,
        secret: crypto.randomBytes(32).toString("hex"),
    })
);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "hbs");

const users = new Map();
const notes = new Map();

app.use((req, res, next) => {
    if (req.session.user) {
        req.user = users.get(req.session.user);
    }
    res.setHeader("X-Frame-Options", "DENY");
    next();
});

const requiresLogin = (req, res, next) => req.user ? next() : res.redirect("/?msg=You must log in first");

app.post("/api/register", (req, res) => {
    const { user, pass } = req.body;
    
    if (typeof user !== "string" || typeof pass !== "string") {
        return res.redirect("/register?msg=Missing username or password");
    }

    if (user.length < 5 || pass.length < 7) {
        return res.redirect("/register?msg=Username or password too short");
    }

    if (pass.includes(user)) {
        return res.redirect("/register?msg=Password cannot contain username");
    }

    if (users.has(user)) {
        return res.redirect("/register?msg=A user already exists with that username");
    }

    users.set(user, {
        user,
        pass: sha256(pass),
        notes: []
    });

    req.session.user = user;
    return res.redirect("/home");
});

app.post("/api/login", (req, res) => {
    const { user, pass } = req.body;
    
    if (typeof user !== "string" || typeof pass !== "string") {
        return res.redirect("/login?msg=Missing username or password");
    }

    if (!users.has(user)) {
        return res.redirect("/login?msg=No user exists with that username");
    }

    const u = users.get(user);
    if (u.pass !== sha256(pass)) {
        return res.redirect("/login?msg=Invalid password")
    }

    req.session.user = user;
    return res.redirect("/home");
});

app.post("/api/create", requiresLogin, (req, res) => {
    const { title, note } = req.body;

    if (typeof title !== "string" || typeof note !== "string") {
        return res.redirect("/home?msg=Missing title or note");
    }

    const id = crypto.randomUUID();
    notes.set(id, { id, author: req.user.user, title, note });
    req.user.notes.push({ id, title });

    return res.redirect("/home");
});

app.get("/api/search", requiresLogin, (req, res) => {
    const { query } = req.query;
    
    if (typeof query !== "string") {
        return res.redirect("/home?msg=Missing search query");
    }

    const userNotes = req.user.notes.map(n => notes.get(n.id));
    const results = userNotes.filter(n => n.title.includes(query) || n.note.includes(query)).map(n => ({ id: n.id, title: n.title }));

    req.session.results = results;
    req.session.query = query;

    if (results.length === 0) {
        req.session.results = null;
        req.session.query = null;
        return res.redirect(`/home?msg=Sorry ${req.user.user}, no notes were found for that query`);
    }

    return res.redirect(`/search?msg=Hi ${req.user.user}, ${results.length} notes were found with that query:`);
});
app.get("/note/:id", requiresLogin, (req, res) => {
    const { id } = req.params;
    const note = notes.get(id);

    if (!note) {
        return res.redirect("/home?msg=No note exists with that id!");
    }

    if (note.author !== req.user.user) {
        return res.redirect("/home?msg=You do not own that note!");
    }

    return res.render("note", { note });
});
app.get("/search", requiresLogin, (req, res) => {
    const { results, query } = req.session;
    if (!results || !query) {
        return res.redirect(`/home?msg=Sorry ${req.user.user}, no notes were found for that query`);
    }

    req.session.results = null;
    req.session.query = null;

    if (results && results.length === 1) {
        return res.redirect(`/note/${results[0].id}?msg=Only one result was found for that search query`);
    }

    return res.render("search", { results, query });
});
app.get("/home", requiresLogin, (req, res) => res.render("home", { user: req.user }));

app.get("/register", (req, res) => res.render("register"));
app.get("/login", (req, res) => res.render("login"));
app.get("/", (req, res) => res.render("index"));

app.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`));