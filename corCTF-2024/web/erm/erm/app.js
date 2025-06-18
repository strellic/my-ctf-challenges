const express = require("express");
const hbs = require("hbs");

const app = express();

const db = require("./db.js");

const PORT = process.env.PORT || 5000;

app.set("view engine", "hbs");

// catches async errors and forwards them to error handler
// https://stackoverflow.com/a/51391081
const wrap = fn => (req, res, next) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(next);
};

app.get("/api/members", wrap(async (req, res) => {
    res.json({ members: (await db.Member.findAll({ include: db.Category, where: { kicked: false } })).map(m => m.toJSON()) });
}));

app.get("/api/writeup/:slug", wrap(async (req, res) => {
    const writeup = await db.Writeup.findOne({ where: { slug: req.params.slug }, include: db.Member });
    if (!writeup) return res.status(404).json({ error: "writeup not found" });
    res.json({ writeup: writeup.toJSON() });
}));

app.get("/api/writeups", wrap(async (req, res) => {
    res.json({ writeups: (await db.Writeup.findAll(req.query)).map(w => w.toJSON()).sort((a,b) => b.date - a.date) });
}));

app.get("/writeup/:slug", wrap(async (req, res) => {
    res.render("writeup");
}));

app.get("/writeups", wrap(async (req, res) => res.render("writeups")));

app.get("/members", wrap(async (req, res) => res.render("members")));

app.get("/", (req, res) => res.render("index"));

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send('An error occurred');
});

app.listen(PORT, () => console.log(`web/erm listening on port ${PORT}`));