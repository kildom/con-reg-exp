

let initialText = undefined;
let lastText = undefined;
let textDiv = undefined;
let clipboardWorkspace = undefined;
/** @type HTMLElement */
let diffTarget = undefined;

function openInNewTab(href) {
    Object.assign(document.createElement('a'), {
        target: '_blank',
        rel: 'noopener noreferrer',
        href: href,
    }).click();
}

async function copyText(text) {
    let ok = false;
    try {
        let input = document.getElementById('clipboardWorkspace');
        input.value = text;
        input.select();
        document.execCommand('copy');
        ok = true;
    } catch (e) { }
    try {
        await navigator.clipboard.writeText(text);
        ok = true;
    } catch (e) {
        try {
            await navigator.permissions.query({ name: 'clipboard-write' });
            await navigator.clipboard.writeText(text);
            ok = true;
        } catch (e) { }
    }
    if (ok) {
    } else {
        alert('Some error! Copy text from console.');
        console.log(text);
    }
}

const addScript = async src => new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    document.body.append(el);
});

function getDiff() {
    let file = new URL(window.location.href).pathname;
    return Diff.createPatch(file, initialText, textDiv.innerText, undefined, undefined, {
        context: 10,//Number.MAX_SAFE_INTEGER,
        ignoreWhitespace: true,
        stripTrailingCr: true
    });
}

async function showPatch() {
    const diff2htmlUi = new Diff2HtmlUI(diffTarget, getDiff(), {
        outputFormat: 'line-by-line',
        drawFileList: false,
        matching: 'words',
        colorScheme: new URL(window.location.href).pathname.endsWith('.html') ? 'light' : 'dark',
    });
    diff2htmlUi.draw();
}

function checkUpdates() {
    if (lastText != textDiv.innerText) {
        lastText = textDiv.innerText;
        showPatch();
    }
}

function copyDiff() {
    copyText('```diff\n' + getDiff().trimEnd() + '\n```');
}

async function editPage() {
    if (!textDiv) {
        let div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.zIndex = '10001';
        div.innerHTML = `
        <div style="background-color: white; padding: 5px;">
            <a href="javascript://" onclick="copyDiff()">Copy to clipboard</a> |
            <a href="https://github.com/kildom/con-reg-exp/discussions/categories/documentation" target="_blank">Where to send</a>
        </div>
        `;
        document.body.appendChild(div);
        clipboardWorkspace = document.createElement('input');
        clipboardWorkspace.setAttribute('type', 'text');
        clipboardWorkspace.style.position = 'absolute';
        clipboardWorkspace.style.top = '-9999px';
        clipboardWorkspace.style.left = '-9999px';
        document.body.appendChild(clipboardWorkspace);
        textDiv = document.querySelector('#text-content');
        textDiv.setAttribute('contenteditable', 'true');
        initialText = textDiv.innerText;
        lastText = initialText;
        let css = document.createElement('link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', 'https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css');
        document.body.appendChild(css);
        await addScript('https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html-ui.min.js');
        await addScript('https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.2.0/diff.js');
        diffTarget = document.createElement('div');
        textDiv.parentElement.appendChild(diffTarget);
        setInterval(checkUpdates, 200);
    }
}
