#!/usr/bin/env node
// 发现 mitm/targets/*，调用 target.build(ctx)，写入 mitm/dist/
// 用法: node scripts/build-mitm.js [target...]

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const feDir = path.join(root, 'fe');
const targetsDir = path.join(root, 'mitm', 'targets');
const distDir = path.join(root, 'mitm', 'dist');

function listTargets() {
  if (!fs.existsSync(targetsDir)) return [];

  const names = [];
  for (const entry of fs.readdirSync(targetsDir)) {
    const full = path.join(targetsDir, entry);
    if (fs.statSync(full).isDirectory()) {
      if (fs.existsSync(path.join(full, 'build.js'))) names.push(entry);
      continue;
    }
    if (entry.endsWith('.js')) names.push(entry.slice(0, -3));
  }
  return names;
}

function resolveBuildPath(name) {
  const dirBuild = path.join(targetsDir, name, 'build.js');
  if (fs.existsSync(dirBuild)) return dirBuild;

  const fileBuild = path.join(targetsDir, name + '.js');
  if (fs.existsSync(fileBuild)) return fileBuild;

  throw new Error('unknown target: ' + name);
}

function loadBuild(name) {
  const mod = require(resolveBuildPath(name));
  const build = typeof mod === 'function' ? mod : mod.build;
  if (typeof build !== 'function') {
    throw new Error(name + ': export build(ctx) or module.exports = build');
  }
  return build;
}

function makeCtx(name) {
  return {
    root,
    feDir,
    distDir,
    name,
    readFe() {
      return {
        html: fs.readFileSync(path.join(feDir, 'index.html'), 'utf8'),
        js: fs.readFileSync(path.join(feDir, 'index.js'), 'utf8'),
        qrcode: fs.readFileSync(path.join(feDir, 'qrcode.min.js'), 'utf8'),
      };
    },
  };
}

function normalizeResult(name, result) {
  if (result == null) {
    throw new Error(name + ': build() returned empty');
  }

  if (typeof result === 'string' || Buffer.isBuffer(result)) {
    return { outName: name + '.js', content: result };
  }

  if (typeof result === 'object' && result.content != null) {
    return {
      outName: result.out || name + '.js',
      content: result.content,
    };
  }

  throw new Error(name + ': build() must return string | Buffer | { out?, content }');
}

function writeResult(name, result) {
  const { outName, content } = normalizeResult(name, result);
  fs.mkdirSync(distDir, { recursive: true });

  const outPath = path.join(distDir, outName);
  fs.writeFileSync(outPath, content);

  const bytes = Buffer.isBuffer(content)
    ? content.length
    : Buffer.byteLength(String(content));
  console.log('wrote', path.relative(root, outPath), '(' + bytes + ' bytes)');
}

function main() {
  const wanted = process.argv.slice(2);
  const targets = wanted.length ? wanted : listTargets();

  if (!targets.length) {
    console.error('no targets in mitm/targets/');
    process.exit(1);
  }

  for (const name of targets) {
    const build = loadBuild(name);
    writeResult(name, build(makeCtx(name)));
  }
}

main();
