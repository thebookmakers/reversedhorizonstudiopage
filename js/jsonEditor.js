let editor;
let dotNetRef;

window.jsonEditorInterop = {
    init: function (elementId, initialValue, dotNetHelper) {
        editor = ace.edit(elementId);
        window.editor = ace.edit(elementId); // make it global
        const isDark = document.documentElement.classList.contains('dark-theme');
        const theme = isDark ? "ace/theme/monokai" : "ace/theme/github";

        editor.setTheme(theme);
        editor.session.setMode("ace/mode/json");
        editor.setValue(initialValue, -1);
        editor.session.setUseWrapMode(true);
        editor.setOption("wrap", true);
        editor.setShowPrintMargin(false);

        dotNetRef = dotNetHelper;
        dotNetHelper.invokeMethodAsync("OnEditorReady");
        editor.session.selection.on('changeCursor', reportCursorInfo);
        editor.session.selection.on('changeSelection', reportCursorInfo);
    },
    setThemeBasedOnCurrent: function () {
        const isDark = document.documentElement.classList.contains('dark-theme');
        const theme = isDark ? "ace/theme/monokai" : "ace/theme/github";
        if (editor) {
            editor.setTheme(theme);
            editor.resize(true);
            editor.renderer.updateFull(true);
        }
    },
    getValue: function () {
        return editor.getValue();
    },
    setValue: function (json) {
        editor.setValue(json, -1);
    },
    compressJson: function (json) {
        return LZString.compressToEncodedURIComponent(json);
    },
    decompressJson: function (encoded) {
        return LZString.decompressFromEncodedURIComponent(encoded);
    },
    getHashParams: function () {
        const hash = window.location.hash.substring(1);
        return Object.fromEntries(new URLSearchParams(hash));
    },
    getCompressedSize: function (json) {
        const compressed = LZString.compressToEncodedURIComponent(json);
        const byteLength = new TextEncoder().encode(compressed).length;
        return { compressed, size: byteLength };
    },
    copyShareLinkWithHtml: function (text, url) {
        const html = `<a href="${url}" target="_blank">${text}</a>`;
        const plain = `${text} (Source: ${url})`;

        const blobHtml = new Blob([html], { type: "text/html" });
        const blobText = new Blob([plain], { type: "text/plain" });

        const clipboardItem = new ClipboardItem({
            "text/plain": blobText,
            "text/html": blobHtml
        });

        return navigator.clipboard.write([clipboardItem]);
    },
};

function reportCursorInfo() {
    if (!dotNetRef) return;
    const pos = editor.getCursorPosition();
    const range = editor.getSelectionRange();
    const selectedText = editor.session.getTextRange(range);
    dotNetRef.invokeMethodAsync("UpdateEditorStatus", pos.row + 1, pos.column + 1, selectedText.length);
}

function applyEditorTheme() {
    const isDark = document.documentElement.classList.contains('dark-theme');
    const theme = isDark ? "ace/theme/monokai" : "ace/theme/github";
    if (window.editor) {
        window.editor.setTheme(theme);
    }
}

const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.attributeName === "class") {
            applyEditorTheme();
        }
    }
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
});