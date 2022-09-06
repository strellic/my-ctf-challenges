const express = require("express");

const PORT = process.env.PORT || 4455;
const FLAG = process.env.FLAG || "test_flag";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static("static"));

app.post("/submit", (req, res) => {
    let score = req.body.score;
    if (!score) score = 0;
    if (Number(score) >= 15) {
        res.json({ pass: true, flag: FLAG });
    }
    else {
        res.json({ pass: false });
    }
});

app.listen(PORT, () => console.log(`web/jsonquiz listening on port ${PORT}`));