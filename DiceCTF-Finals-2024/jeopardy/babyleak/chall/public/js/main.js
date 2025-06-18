const params = new URLSearchParams(location.search);
if (params.has("msg")) {
    document.querySelector("#msg").innerText = params.get("msg");
}