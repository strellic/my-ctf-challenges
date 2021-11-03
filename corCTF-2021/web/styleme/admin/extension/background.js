chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.method === "installCSS" && request.css) {
        let injection = { 
            target: {
                tabId: sender.tab.id
            },
            css: request.css
        };
        if(sender.frameId !== 0) {
            injection.target.frameIds = [sender.frameId];
        }
        chrome.scripting.insertCSS(injection);
    }
});

chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
});