const urllib = require('urllib');

async function fetchHref(url, isImg = false) {
    if (url.startsWith("http://")) { throw new Error("Security error: cannot fetch file from insecure http urls.") }
    if (!url.startsWith("https://")) { url = `https://${url}` }
    const response = await urllib.request(url, { followRedirect: true });
    if (isImg) { return response.data.toString('base64') }
    return response.data.toString('utf-8');
}

module.exports = fetchHref;