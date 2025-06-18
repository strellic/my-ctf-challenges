const Comlink = require("comlink");
if (!window.dicepass) {
    window.dicepass = Comlink.wrap(Comlink.windowEndpoint(document.querySelector(".dicepass-frame").contentWindow));
}