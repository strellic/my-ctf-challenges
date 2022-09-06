const express = require("express");
const vm2 = require("vm2");

const PORT = process.env.PORT || "4000";

const app = express();

app.set("view engine", "hbs");

// i guess you can have some Math functions...
let sandbox = Object.create(null);
["E", "PI", "sin", "cos", "tan", "log", "pow", "sqrt"].forEach(v => sandbox[v] = Math[v]);

// oh, and the flag too i guess...
sandbox.flag = new Proxy({ FLAG: process.env.FLAG || "corctf{test_flag}" }, {
    get: () => "nope" // :')
});

// no modifying the sandbox, please
sandbox = Object.freeze(sandbox);

app.get("/", (req, res) => {
    let output = "";
    let calc = req.query.calc;

    if (calc) {
        calc = `${calc}`;

        if(calc.length > 75) {
            output = "Error: calculation too long";
        }

        let whitelist = /^([\w+\-*/() ]|([0-9]+[.])+[0-9]+)+$/; // this is a calculator sir
        if(!whitelist.test(calc)) {
            output = "Error: bad characters in calculation";
        }

        if(!output) {
            try {
                const vm = new vm2.VM({
                    timeout: 100,
                    eval: false,
                    sandbox,
                });
                output = `${vm.run(calc)}`;
                if (output.includes("corctf")) {
                    output = "Error: no.";
                }
            }
            catch (e) {
                console.log(e);
                output = "Error: error occurred";
            }
        }
    }

    res.render("index", { output, calc });
});

app.listen(PORT, () => console.log(`sbxcalc listening on ${PORT}`));