// ProxyPin — https://github.com/wanghongenpin/proxypin/wiki/Script
const fs = require('fs')
const path = require('path')

function inlinePage ({ html, js, qrcode }) {
  const injected =
    '<script>\n' + qrcode + '\n</script>\n' +
    '<script type="module">\n' + js + '\n</script>'
  const page = html
    .replace(/<script\s+src="\.\/qrcode\.min\.js"><\/script>\s*/i, '')
    .replace(/<script\s+type="module"\s+src="\.\/index\.js"><\/script>/i, injected)
  if (page.includes('src="./index.js"') || page.includes('src="./qrcode.min.js"')) {
    throw new Error('proxypin: failed to inline fe script tags')
  }
  return page
}

module.exports = function build (ctx) {
  const template = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8')
  const frontend = JSON.stringify(inlinePage(ctx.readFe()))
  const body = template.replaceAll('__FRONTEND__', frontend)
  if (body.includes('__FRONTEND__')) {
    throw new Error('proxypin: __FRONTEND__ not substituted')
  }
  return {
    out: 'proxypin.js',
    content:
      '// GENERATED — mitm/targets/proxypin + fe/*\n' +
      '// rebuild: node scripts/build-mitm.js proxypin\n' +
      body
  }
}
