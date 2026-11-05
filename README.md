# Salat First — Prayer Times, Quran & Hadith

A Chrome extension that shows prayer times for your location with adhan notifications, a Quran reader with verse-by-verse recitation, Sahih al-Bukhari and Sahih Muslim, and the weather on every new tab. In English, French and Arabic.

- Website: https://zakaria-bali.github.io/salat-first/ (also `?lang=fr` and `?lang=ar`)
- Privacy policy: https://zakaria-bali.github.io/salat-first/privacy.html
- Support: [open an issue](https://github.com/zakaria-bali/salat-first/issues) · [Ko-fi](https://ko-fi.com/zakariaba) · [PayPal](https://paypal.me/zakariabali)

## The website

A static site with no build step and no dependencies. It loads nothing from other servers: the fonts are self-hosted, and the site sets no cookies.

```
index.html            Landing page (English text lives here)
privacy.html          Privacy policy: one full block per language (English is authoritative)
404.html              Page GitHub Pages shows for missing URLs
sitemap.xml           Language versions for search engines
assets/site.css       All styles; light/dark themes; right-to-left through logical CSS properties
assets/site.js        Language switch, theme, live preview, screenshots, share
assets/i18n.js        French and Arabic strings, plus the live preview's strings in all three languages
assets/prayer.js      Prayer time calculation (a port of the adhan-js core, the library the extension uses)
scripts/check-translations.js   Reports any string missing a French or Arabic version
```

### Languages

The language is picked in this order: `?lang=` in the URL, then the visitor's last choice, then their browser language, then English. Arabic switches the whole page to right to left.

To change or add text:

1. Edit the English text in the HTML. Any element with `data-i18n="key"` is translated (`data-i18n-attr="alt:key"` does the same for attributes).
2. Add or update that key in both `fr` and `ar` in `assets/i18n.js`.
3. Run `node scripts/check-translations.js` to catch anything missing.

The privacy policy is long-form, so `privacy.html` holds a complete English, French and Arabic version side by side (`data-lang-block`). When the policy changes, update all three and the effective date.

### Chrome Web Store link

Every "Add to Chrome" and "Leave a review" link follows `STORE_URL` at the top of `assets/site.js`. It points to a store search for now. Once the listing is live, paste its URL there (e.g. `https://chromewebstore.google.com/detail/salat-first/<id>`) and the review links will point to its reviews page.

### Live preview

The "Live preview" section computes today's prayer times in the browser for 17 preset cities, or for the visitor's position (kept in memory only, never saved). Each city uses the method most common there (Umm al-Qura, Morocco, Egypt, Turkey, ISNA and others). The times are checked against the extension's own output for Rabat. Times are shown in each city's local time using the browser's time zone data.

### Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. The 404 page only works when it is served from `/salat-first/`, as it is on GitHub Pages.

## Open data and libraries
- Quran and hadith texts: [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) and [hadith-api](https://github.com/fawazahmed0/hadith-api) (public domain)
- Prayer calculation: [adhan-js](https://github.com/batoulapps/adhan-js) (MIT)
- Weather: [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- Recitations: [Islamic Network / alquran.cloud](https://alquran.cloud/cdn)
- City search: [OpenStreetMap Nominatim](https://nominatim.org)
- Fonts: Aref Ruqaa, Reem Kufi, Scheherazade New, Cormorant Garamond, Readex Pro (SIL Open Font License)
