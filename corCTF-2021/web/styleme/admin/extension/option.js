let styles = [];
chrome.storage.local.get('styles', (result) => {
    styles = result.styles || [];
    listStyles();
});

const listStyles = () => {
    let installed = document.getElementById("installed");

    if (styles.length === 0) {
        installed.innerText = "no stylescripts installed!";
        return;
    }

    for (let style of styles) {
        let div = document.createElement("div");
        div.style.border = "1px solid black";
        div.style.padding = "0.75rem";

        let title = document.createElement("h3");
        title.innerText = style.title;
        div.appendChild(title);

        let pre = document.createElement("pre");
        let code = document.createElement("code");
        code.innerText = style.original;
        pre.appendChild(code);
        div.appendChild(pre);

        let btn = document.createElement("button");
        btn.innerText = "Delete";
        window.style = style;
        btn.onclick = () => {
            let index = styles.indexOf(style);
            styles.splice(index, 1);
            chrome.storage.local.set({
                styles
            }, () => {
                location.reload();
            });
        };
        div.appendChild(btn);

        installed.appendChild(div);
    }
};