/* Salat First website: prayer times for the live preview.
   A compact port of the astronomical core of adhan-js (MIT, Batoul Apps), the
   library the extension uses, so the page shows the same times as the extension.
   Everything runs in the browser; nothing is sent anywhere. */
(function (root) {
  "use strict";

  var R = Math.PI / 180, D = 180 / Math.PI;
  function norm(n, max) { return n - max * Math.floor(n / max); }
  function unwind(a) { return norm(a, 360); }
  function closest(a) { return a >= -180 && a <= 180 ? a : a - 360 * Math.round(a / 360); }
  function interp(y2, y1, y3, n) { var a = y2 - y1, b = y3 - y2, c = b - a; return y2 + (n / 2) * (a + b + n * c); }
  function interpAngles(y2, y1, y3, n) { var a = unwind(y2 - y1), b = unwind(y3 - y2), c = b - a; return y2 + (n / 2) * (a + b + n * c); }

  // Calculation methods, as in adhan-js (angles in degrees, adjustments in minutes).
  // "ishaInterval" is minutes after sunset (Umm al-Qura).
  var METHODS = {
    mwl:     { fajr: 18,   isha: 17,   adj: { dhuhr: 1 } },
    egypt:   { fajr: 19.5, isha: 17.5, adj: { dhuhr: 1 } },
    karachi: { fajr: 18,   isha: 18,   adj: { dhuhr: 1 } },
    umm:     { fajr: 18.5, ishaInterval: 90, adj: {} },
    dubai:   { fajr: 18.2, isha: 18.2, adj: { sunrise: -3, dhuhr: 3, asr: 3, maghrib: 3 } },
    isna:    { fajr: 15,   isha: 15,   adj: { dhuhr: 1 } },
    sea:     { fajr: 20,   isha: 18,   adj: { dhuhr: 1 } },
    turkey:  { fajr: 18,   isha: 17,   adj: { sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7 } },
    morocco: { fajr: 19,   isha: 17,   adj: { dhuhr: 5, maghrib: 5 } }
  };

  function julianDay(y, m, d) {
    var Y = m > 2 ? y : y - 1, M = m > 2 ? m : m + 12;
    var A = Math.trunc(Y / 100), B = 2 - A + Math.trunc(A / 4);
    return Math.trunc(365.25 * (Y + 4716)) + Math.trunc(30.6001 * (M + 1)) + d + B - 1524.5;
  }

  // Solar coordinates (Meeus, Astronomical Algorithms) for a Julian day.
  function solarCoords(jd) {
    var T = (jd - 2451545.0) / 36525;
    var L0 = unwind(280.4664567 + 36000.76983 * T + 0.0003032 * T * T);
    var Lp = unwind(218.3165 + 481267.8813 * T);
    var Om = unwind(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
    var M = unwind(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    var C = Math.sin(M * R) * (1.914602 - 0.004817 * T - 0.000014 * T * T) +
            Math.sin(2 * M * R) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * R) * 0.000289;
    var lambda = unwind(L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * R)) * R;
    var theta0 = unwind(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000);
    var dPsi = (-17.2 / 3600) * Math.sin(Om * R) - (1.32 / 3600) * Math.sin(2 * L0 * R) -
               (0.23 / 3600) * Math.sin(2 * Lp * R) + (0.21 / 3600) * Math.sin(2 * Om * R);
    var dEps = (9.2 / 3600) * Math.cos(Om * R) + (0.57 / 3600) * Math.cos(2 * L0 * R) +
               (0.1 / 3600) * Math.cos(2 * Lp * R) - (0.09 / 3600) * Math.cos(2 * Om * R);
    var eps0 = 23.439291 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T;
    var epsApp = (eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * R)) * R;
    return {
      decl: Math.asin(Math.sin(epsApp) * Math.sin(lambda)) * D,
      ra: unwind(Math.atan2(Math.cos(epsApp) * Math.sin(lambda), Math.cos(lambda)) * D),
      sidereal: theta0 + (dPsi * 3600 * Math.cos((eps0 + dEps) * R)) / 3600
    };
  }

  function SolarTime(y, m, d, lat, lng) {
    var jd = julianDay(y, m, d);
    var s = solarCoords(jd), sp = solarCoords(jd - 1), sn = solarCoords(jd + 1);
    var Lw = -lng;
    var m0 = norm((s.ra + Lw - s.sidereal) / 360, 1);

    function transit() {
      var th = unwind(s.sidereal + 360.985647 * m0);
      var a = unwind(interpAngles(s.ra, sp.ra, sn.ra, m0));
      var H = closest(th - Lw - a);
      return (m0 + H / -360) * 24;
    }
    function hourAngle(h0, after) {
      var x = (Math.sin(h0 * R) - Math.sin(lat * R) * Math.sin(s.decl * R)) / (Math.cos(lat * R) * Math.cos(s.decl * R));
      if (x < -1 || x > 1) return NaN;
      var H0 = Math.acos(x) * D;
      var mm = after ? m0 + H0 / 360 : m0 - H0 / 360;
      var th = unwind(s.sidereal + 360.985647 * mm);
      var a = unwind(interpAngles(s.ra, sp.ra, sn.ra, mm));
      var dl = interp(s.decl, sp.decl, sn.decl, mm);
      var H = th - Lw - a;
      var h = Math.asin(Math.sin(lat * R) * Math.sin(dl * R) + Math.cos(lat * R) * Math.cos(dl * R) * Math.cos(H * R)) * D;
      var dm = (h - h0) / (360 * Math.cos(dl * R) * Math.cos(lat * R) * Math.sin(H * R));
      return (mm + dm) * 24;
    }
    this.transit = transit();
    this.sunrise = hourAngle(-50 / 60, false);
    this.sunset = hourAngle(-50 / 60, true);
    this.hourAngle = hourAngle;
    this.afternoon = function (shadow) {
      var tangent = Math.abs(lat - s.decl);
      return hourAngle(Math.atan(1 / (shadow + Math.tan(tangent * R))) * D, true);
    };
  }

  // Prayer times for a calendar date at a place, as UTC instants (ms), rounded to the minute.
  // opts: { method, hanafi }
  function compute(y, m, d, lat, lng, opts) {
    var p = METHODS[opts.method] || METHODS.mwl;
    var st = new SolarTime(y, m, d, lat, lng);
    var next = new SolarTime(y, m, d + 1, lat, lng);
    var base = Date.UTC(y, m - 1, d), H = 3600000;
    var at = function (hours) { return base + hours * H; };

    var sunrise = at(st.sunrise), sunset = at(st.sunset);
    var night = at(24 + next.sunrise) - sunset;
    // High latitudes: seventh of the night above 48°, middle of the night below (adhan-js "recommended").
    var portion = Math.abs(lat) > 48 ? 1 / 7 : 1 / 2;

    var fajr = at(st.hourAngle(-p.fajr, false));
    var safeFajr = sunrise - night * portion;
    if (isNaN(fajr) || safeFajr > fajr) fajr = safeFajr;

    var isha;
    if (p.ishaInterval) isha = sunset + p.ishaInterval * 60000;
    else {
      isha = at(st.hourAngle(-p.isha, true));
      var safeIsha = sunset + night * portion;
      if (isNaN(isha) || safeIsha < isha) isha = safeIsha;
    }

    var raw = { fajr: fajr, sunrise: sunrise, dhuhr: at(st.transit), asr: at(st.afternoon(opts.hanafi ? 2 : 1)), maghrib: sunset, isha: isha };
    var out = {};
    for (var k in raw) {
      var t = raw[k] + (p.adj[k] || 0) * 60000;
      out[k] = Math.round(t / 60000) * 60000;
    }
    return out;
  }

  function parts(timeZone, date, withTime) {
    var o = { timeZone: timeZone, year: "numeric", month: "numeric", day: "numeric" };
    if (withTime) { o.hourCycle = "h23"; o.hour = o.minute = o.second = "numeric"; }
    var r = {};
    new Intl.DateTimeFormat("en-US", o).formatToParts(date).forEach(function (x) { r[x.type] = +x.value; });
    return r;
  }

  // Calendar date [y, m, d] in a time zone at an instant.
  function ymdIn(timeZone, date) { var p = parts(timeZone, date); return [p.year, p.month, p.day]; }

  // Offset of a time zone from UTC at an instant, in minutes.
  function tzOffset(timeZone, date) {
    var p = parts(timeZone, date, true);
    var asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
    return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  }

  // Umm al-Qura extends Isha to 120 minutes after Maghrib in Ramadan.
  function isRamadan(date, timeZone) {
    try {
      return parseInt(new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric", timeZone: timeZone }).format(date), 10) === 9;
    } catch (e) { return false; }
  }

  // Today's and tomorrow's times for a place, using the place's own calendar day.
  function forPlace(place, now) {
    now = now || new Date();
    var opts = { method: place.method, hanafi: !!place.hanafi };
    var ymd = ymdIn(place.tz, now);
    var today = compute(ymd[0], ymd[1], ymd[2], place.lat, place.lng, opts);
    var ymd2 = ymdIn(place.tz, new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2] + 1, 12)));
    var tomorrow = compute(ymd2[0], ymd2[1], ymd2[2], place.lat, place.lng, opts);
    if (place.method === "umm") {
      if (isRamadan(now, place.tz)) today.isha += 30 * 60000;
      if (isRamadan(new Date(tomorrow.dhuhr), place.tz)) tomorrow.isha += 30 * 60000;
    }
    return { today: today, tomorrow: tomorrow, ymd: ymd };
  }

  // Qibla bearing from true north, in degrees.
  function qibla(lat, lng) {
    var kLat = 21.4225 * R, kLng = 39.8262 * R, la = lat * R, dL = kLng - lng * R;
    return unwind(Math.atan2(Math.sin(dL), Math.cos(la) * Math.tan(kLat) - Math.sin(la) * Math.cos(dL)) * D);
  }

  // Moon phase from 0 (new) through 0.5 (full) to 1, from the mean synodic month.
  function moonPhase(date) {
    return norm((date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000 / 29.530588853, 1);
  }

  var api = { compute: compute, forPlace: forPlace, qibla: qibla, moonPhase: moonPhase, tzOffset: tzOffset, ymdIn: ymdIn, METHODS: METHODS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SFPrayer = api;
})(this);
