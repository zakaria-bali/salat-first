#!/usr/bin/env node
/* Checks that every data-i18n / data-i18n-attr key used in the HTML pages has a
   French and Arabic string in assets/i18n.js, and that the live-preview strings
   exist in all three languages. Run from the site folder: node scripts/check-translations.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const window = {};
new Function("window", fs.readFileSync(path.join(root, "assets/i18n.js"), "utf8"))(window);
const D = window.SF_I18N;
let problems = 0;
const report = (msg) => { console.log("  " + msg); problems++; };

for (const page of ["index.html", "privacy.html", "404.html"]) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const keys = new Set();
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) keys.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(";").forEach((p) => keys.add(p.split(":")[1].trim()));
  for (const lang of ["fr", "ar"]) for (const k of keys) if (!(k in D[lang])) report(`${page}: missing ${lang} "${k}"`);
  for (const m of html.matchAll(/data-js="([^"]+)"/g)) for (const lang of ["en", "fr", "ar"]) if (!(m[1] in D.js[lang])) report(`${page}: missing js.${lang}.${m[1]}`);
  if (/data-lang-block/.test(html)) for (const lang of ["en", "fr", "ar"]) if (!html.includes(`data-lang-block="${lang}"`)) report(`${page}: no ${lang} block`);
}
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, p + k + ".") : [p + k]));
const en = new Set(flat(D.js.en));
for (const lang of ["fr", "ar"]) {
  const have = new Set(flat(D.js[lang]));
  for (const k of en) if (!have.has(k)) report(`missing js.${lang}.${k}`);
}
for (const k of Object.keys(D.fr)) if (!(k in D.ar)) report(`"${k}" is in fr but not ar`);
for (const k of Object.keys(D.ar)) if (!(k in D.fr)) report(`"${k}" is in ar but not fr`);

console.log(problems ? `\n${problems} problem(s) found.` : "All translations present in English, French and Arabic.");
process.exit(problems ? 1 : 0);
