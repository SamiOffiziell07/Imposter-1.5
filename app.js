/* IMPOSTER – Arayüz ve oyun akışı (tamamen çevrimdışı) */
(function () {
  "use strict";

  var V = window.IMPOSTER_VERI;
  var L = window.ImposterLogic;
  var PAIRS = L.buildPairMap(V);
  var EXPL = L.buildExplainMap(window.IMPOSTER_ACIKLAMALAR);
  var rnd = L.createRng();
  var KEY = "imposter_tr_ayarlar_v1";

  /* ---------- Durum ---------- */
  var S = loadSettings();
  var G = { screen: "menu", round: null, idx: 0, stage: "pass", prevWord: null, impHistory: [], endAt: 0, tick: null, timerDone: false };
  var $app = document.getElementById("app");
  var $toast = document.getElementById("toast");
  var $modal = document.getElementById("modal");

  function loadSettings() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
    return L.sanitize(raw, V);
  }
  function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* özel mod vb. */ }
  }
  var mqLight = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  function applyBody() {
    document.body.classList.toggle("no-anim", !S.anim);
    document.documentElement.setAttribute("data-theme", S.theme);
    var light = S.theme === "light" || (S.theme === "auto" && mqLight && mqLight.matches);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", light ? "#f2f2f7" : "#07080d");
  }
  if (mqLight && mqLight.addEventListener) mqLight.addEventListener("change", function () { if (S.theme === "auto") applyBody(); });

  /* ---------- Yardımcılar ---------- */
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function initial(name) { return esc(String(name).trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"); }
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { $toast.classList.remove("show"); }, 2800);
  }

  var ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19V5.5"/><path d="M9 8h6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.3c2.2.6 3.5 2.6 3.5 5.7"/></svg>',
    mask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5c3 1.4 6 2 9 2s6-.6 9-2V12c0 4.4-4 8.5-9 8.5S3 16.400 3 12z"/><circle cx="8.5" cy="12" r="1.3"/><circle cx="15.5" cy="12" r="1.3"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3"/><path d="M8 21v-7h8v7"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.500A3.500 3.500 0 0 0 8 10M16 6h3.500A3.500 3.500 0 0 1 16 10"/><path d="M12 13v4M8.500 21h7M10 17h4"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.600 7.100L4 20.500l1.400-4.600A8 8 0 1 1 21 12z"/></svg>',
    ballot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.500l3 3 5-6"/></svg>',
    nophone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M3 3l18 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.500" width="14" height="10" rx="3"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.400-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.500v2M12 19.500v2M2.500 12h2M19.500 12h2M5.200 5.200l1.400 1.400M17.400 17.400l1.400 1.400M5.200 18.800l1.400-1.400M17.400 6.600l1.400-1.400"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>'
  };

  function logoImg(cls) {
    cls = cls || "";
    return '<img class="logo-img logo-w ' + cls + '" src="assets/samix-logo.png" width="1248" height="1521" alt="SAMIX Logo" draggable="false">' +
      '<img class="logo-img logo-d ' + cls + '" src="assets/samix-logo-dark.png" width="1248" height="1521" alt="" aria-hidden="true" draggable="false">';
  }
  /* ---------- Ses (Web Audio, dosyasız) ---------- */
  var ac = null;
  function audio() {
    if (!S.sound) return null;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
    } catch (e) { ac = null; }
    return ac;
  }
  function tone(f, t0, dur, type, vol) {
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.value = f;
    var s = a.currentTime + t0;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, s + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.connect(g); g.connect(a.destination);
    o.start(s); o.stop(s + dur + 0.05);
  }
  var SND = {
    click: function () { tone(520, 0, 0.07, "triangle", 0.07); },
    reveal: function () { tone(392, 0, 0.12, "sine", 0.12); tone(587, 0.09, 0.18, "sine", 0.12); },
    hide: function () { tone(440, 0, 0.1, "triangle", 0.08); tone(330, 0.08, 0.12, "triangle", 0.08); },
    start: function () { tone(392, 0, 0.14, "sine"); tone(523, 0.12, 0.14, "sine"); tone(659, 0.24, 0.26, "sine"); },
    alarm: function () { for (var i = 0; i < 3; i++) tone(880, i * 0.28, 0.18, "square", 0.08); },
    result: function () { tone(523, 0, 0.15, "sine"); tone(659, 0.12, 0.15, "sine"); tone(784, 0.24, 0.15, "sine"); tone(1047, 0.36, 0.34, "sine"); }
  };
  function sfx(n) { if (S.sound && SND[n]) SND[n](); }

  /* ---------- Gezinme ---------- */
  function mount(html, opts) {
    opts = opts || {};
    var prev = $app.querySelector(".scroll");
    var top = prev && opts.keepScroll ? prev.scrollTop : 0;
    $app.innerHTML = '<section class="screen' + (opts.still ? " still" : "") + '">' + html + "</section>";
    var sc = $app.querySelector(".scroll");
    if (sc && top) sc.scrollTop = top;
  }
  function go(screen, opts) {
    stopTimer();
    G.screen = screen;
    render(opts);
  }
  function render(opts) {
    closeModal();
    var fn = VIEW[G.screen];
    if (fn) fn(opts || {});
  }

  var VIEW = {};

  /* ----- Ana menü ----- */
  VIEW.menu = function () {
    mount(
      '<div class="center">' +
        '<div class="logo">' + logoImg() + '<div class="wordmark">IMPOSTER</div>' +
        '<div class="tagline">Aranızdaki sahtekârı bulun!</div></div>' +
        '<div class="menu-list">' +
          '<button class="btn btn-primary big" data-act="newGame">' + ICON.play + "Yeni Oyun</button>" +
          '<button class="btn btn-glass" data-act="how">' + ICON.book + "Nasıl Oynanır?</button>" +
          '<button class="btn btn-glass" data-act="settings">' + ICON.gear + "Ayarlar</button>" +
        "</div>" +
        '<div class="chips-row"><span class="pill">3–12 oyuncu</span><span class="pill">Tek telefon</span><span class="pill">İnternetsiz</span></div>' +
        '<div class="brand-foot">SAMIX · GAMES · APPS · INNOVATION</div>' +
      "</div>"
    );
  };

  /* ----- Nasıl oynanır ----- */
  VIEW.how = function () {
    var steps = [
      ["Hazırlık", "Oyuncuları, imposter sayısını, kategorileri ve oyun modunu seçin. 3 ile 12 kişi aynı telefonla oynar."],
      ["Gizli roller", "Telefon elden ele geçer. Sıra sizdeyken Kelimeyi Gör’e dokunun. Normal oyuncular gizli kelimeyi görür; imposter’lar ya kelimeyi göremez ya da benzer bir kelime alır. Hazırım’a dokunmadan telefonu vermeyin."],
      ["Sözlü ipuçları", "Telefonu bir kenara bırakın. Sırayla kelimeyi doğrudan söylemeden ipucu verin. Imposter’lar kelimeyi biliyormuş gibi davranmaya çalışır. Tartışma ne zaman biterse grup karar verir."],
      ["Sözlü oylama", "Herkes şüphelendiği kişinin adını yüksek sesle söyler. Oyları grup kendisi sayar; uygulamaya oy girilmez. Beraberlikte yalnızca berabere kalanlar arasında tekrar oy verin."],
      ["Sonuç", "Sonuçları Göster’e dokunun: roller ve kelime açıklanır. Grubun doğru kişiyi bulup bulmadığına birlikte karar verirsiniz."]
    ];
    var h = '<div class="topbar"><button class="back" data-act="menu" aria-label="Geri">' + ICON.back + '</button><div><h1 class="h-title">Nasıl Oynanır?</h1></div></div><div class="scroll">';
    steps.forEach(function (s, i) {
      h += '<div class="card how"><div class="n">' + (i + 1) + "</div><div><b>" + s[0] + "</b><p>" + s[1] + "</p></div></div>";
    });
    h += '<div class="card"><div class="card-t"><span class="ic" style="--c:#bf5af2">' + ICON.mask + '</span>Oyun modları</div>' +
      '<p class="note"><b class="em">Kelimeyi Bilmiyor:</b> Imposter kelimeyi görmez.</p>' +
      '<p class="note" style="margin-top:8px"><b class="em">Benzer Kelime:</b> Imposter, ana kelimeye yakın ama farklı bir kelime alır (örneğin Kedi – Köpek). Uygun bir çift yoksa oyun otomatik olarak Kelimeyi Bilmiyor moduna geçer.</p></div>';
    h += '</div><div class="footer"><button class="btn btn-primary" data-act="newGame">' + ICON.play + "Yeni Oyun</button></div>";
    mount(h);
  };

  /* ----- Ayarlar ----- */
  function switchHtml(key, on) {
    return '<label class="switch"><input type="checkbox" data-chg="' + key + '"' + (on ? " checked" : "") + '><i></i></label>';
  }
  function segHtml(act, cur, items) {
    return '<div class="seg" role="radiogroup">' + items.map(function (it) {
      return '<button class="seg-b' + (cur === it[0] ? " on" : "") + '" role="radio" aria-checked="' + (cur === it[0]) + '" data-act="' + act + '" data-v="' + it[0] + '">' + it[1] + "</button>";
    }).join("") + "</div>";
  }
  VIEW.settings = function (opts) {
    opts = opts || {};
    mount(
      '<div class="topbar"><button class="back" data-act="menu" aria-label="Geri">' + ICON.back + '</button><div><h1 class="h-title">Ayarlar</h1></div></div>' +
      '<div class="scroll">' +
        '<div class="card"><div class="card-t" style="margin-bottom:12px"><span class="ic" style="--c:#5e5ce6">' + ICON.sun + '</span>Görünüm</div>' +
          segHtml("theme", S.theme, [["dark", "Koyu"], ["light", "Açık"], ["auto", "Otomatik"]]) +
          '<p class="note" style="margin-top:10px">Otomatik seçeneği iPhone’unuzun açık/koyu görünümünü takip eder.</p></div>' +
        '<div class="card">' +
          '<div class="opt"><div class="row"><div><div class="t">Ses efektleri</div><div class="d">Dokunma, rol gösterme ve süre dolma sesleri</div></div>' + switchHtml("sound", S.sound) + "</div></div>" +
          '<div class="opt"><div class="row"><div><div class="t">Animasyonlar</div><div class="d">Geçiş ve hareket efektleri</div></div>' + switchHtml("anim", S.anim) + "</div></div>" +
        "</div>" +
        '<div class="card about">' + logoImg("about-logo") + '<div><div class="t">SAMIX Imposter</div><div class="d">Created by SAMI<br>Sürüm 2.0</div></div></div>' +
          '<div class="card"><div class="card-t"><span class="ic" style="--c:#30d158">' + ICON.save + '</span>Kayıtlı oyun ayarları</div>' +
          '<p class="note" style="margin-bottom:12px">Oyuncu isimleri, kategoriler ve diğer seçimler bu cihazda saklanır. İsterseniz hepsini başlangıç değerlerine döndürebilirsiniz.</p>' +
          '<button class="btn btn-glass" data-act="resetAsk">' + ICON.redo + "Varsayılanlara Döndür</button></div>" +
      "</div>", { still: opts.still }
    );
  };

  /* ----- Kurulum ----- */
  function nextDefaultName() {
    var used = {};
    S.names.forEach(function (n) { used[L.norm(n)] = true; });
    for (var k = 1; k <= 99; k++) if (!used[L.norm("Oyuncu " + k)]) return "Oyuncu " + k;
    return "Oyuncu " + (S.names.length + 1);
  }
  function catSummary() {
    var cats = S.mixed ? V.KATEGORILER : V.KATEGORILER.filter(function (k) { return S.categories.indexOf(k.id) >= 0; });
    var cnt = L.candidates(S, V).length;
    if (S.mixed) return "<b>Karışık Kategoriler</b> açık: tüm kategoriler (" + V.KATEGORILER.length + ") · <b>" + cnt + "</b> kelime";
    if (!cats.length) return "Henüz kategori seçilmedi.";
    return "<b>" + cats.length + "</b> kategori seçili · <b>" + cnt + "</b> kelime";
  }

  VIEW.setup = function (opts) {
    var maxI = L.maxImposters(S.names.length);
    var h = '<div class="topbar"><button class="back" data-act="menu" aria-label="Geri">' + ICON.back + '</button><div><h1 class="h-title">Oyun Kurulumu</h1><div class="h-sub">Ayarlar otomatik kaydedilir</div></div></div><div class="scroll">';

    /* Oyuncular */
    h += '<div class="card"><div class="card-h"><div class="card-t"><span class="ic" style="--c:#0a84ff">' + ICON.users + '</span>Oyuncular</div>' +
      '<div class="stepper"><button class="step-btn" data-act="pl-" ' + (S.names.length <= L.MIN_OYUNCU ? "disabled" : "") + ' aria-label="Oyuncu azalt">−</button>' +
      '<div class="step-val">' + S.names.length + '</div>' +
      '<button class="step-btn" data-act="pl+" ' + (S.names.length >= L.MAX_OYUNCU ? "disabled" : "") + ' aria-label="Oyuncu artır">+</button></div></div>' +
      '<p class="note">3 ile 12 oyuncu. İsimlere dokunarak düzenleyebilirsiniz.</p><div class="names">';
    S.names.forEach(function (n, i) {
      h += '<input class="name-in" data-name="' + i + '" value="' + esc(n) + '" maxlength="' + L.MAX_ISIM + '" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="' + (i + 1) + '. oyuncu adı">';
    });
    h += "</div></div>";

    /* Imposter sayısı */
    h += '<div class="card"><div class="card-h"><div class="card-t"><span class="ic" style="--c:#ff453a">' + ICON.eye + '</span>Imposter Sayısı</div>' +
      '<div class="stepper"><button class="step-btn" data-act="im-" ' + (S.imposters <= 1 ? "disabled" : "") + ' aria-label="Imposter azalt">−</button>' +
      '<div class="step-val">' + S.imposters + '</div>' +
      '<button class="step-btn" data-act="im+" ' + (S.imposters >= maxI ? "disabled" : "") + ' aria-label="Imposter artır">+</button></div></div>' +
      '<p class="note">En fazla ' + maxI + " imposter seçilebilir; her zaman en az iki normal oyuncu kalır.</p></div>";

    /* Mod */
    h += '<div class="card"><div class="card-t" style="margin-bottom:12px"><span class="ic" style="--c:#bf5af2">' + ICON.mask + '</span>Oyun Modu</div>' +
      '<button class="mode ' + (S.mode === "A" ? "on" : "") + '" data-act="mode" data-m="A"><div class="radio"></div><div><b>Kelimeyi Bilmiyor</b><span>Normal oyuncular gizli kelimeyi görür. Imposter rolünü bilir ama kelimeyi görmez.</span></div></button>' +
      '<button class="mode ' + (S.mode === "B" ? "on" : "") + '" data-act="mode" data-m="B"><div class="radio"></div><div><b>Benzer Kelime</b><span>Imposter, ana kelimeye yakın ama farklı bir kelime alır. Uygun çift yoksa otomatik olarak Kelimeyi Bilmiyor modu kullanılır.</span></div></button></div>';

    /* Kategoriler */
    h += '<div class="card"><div class="card-h"><div class="card-t"><span class="ic" style="--c:#30b0c7">' + ICON.grid + '</span>Kategoriler</div></div>' +
      '<div class="cat-tools"><button class="btn btn-glass small" data-act="catAll">Tümünü Seç</button><button class="btn btn-glass small" data-act="catNone">Seçimi Temizle</button></div>' +
      '<div class="cat-grid">' +
      '<button class="cat wide ' + (S.mixed ? "on" : "") + '" data-act="mixed"><span class="ci">🎲</span>Karışık Kategoriler<span class="ck">✓</span></button>';
    V.KATEGORILER.forEach(function (k) {
      var on = S.categories.indexOf(k.id) >= 0;
      h += '<button class="cat ' + (on ? "on" : "") + (S.mixed ? " dim" : "") + '" data-act="cat" data-id="' + k.id + '" aria-pressed="' + on + '"><span class="ci">' + k.ikon + "</span><span>" + esc(k.ad) + '</span><span class="ck">✓</span></button>';
    });
    h += '</div><div class="cat-sum">' + catSummary() + "</div></div>";

    /* Seçenekler */
    h += '<div class="card"><div class="card-t" style="margin-bottom:6px"><span class="ic" style="--c:#8e8e93">' + ICON.gear + '</span>Seçenekler</div>' +
      '<div class="opt"><div class="row"><div><div class="t">Tartışma sayacı</div><div class="d">Varsayılan olarak kapalı. Açıksa tartışma ekranında geri sayım görünür.</div></div>' + switchHtml("timerOn", S.timerOn) + "</div>";
    if (S.timerOn) {
      h += '<div class="row" style="margin-top:12px"><div class="d" style="font-size:14px">Süre (dakika)</div><div class="stepper"><button class="step-btn" data-act="tm-" ' + (S.timerMin <= 1 ? "disabled" : "") + '>−</button><div class="step-val">' + S.timerMin + '</div><button class="step-btn" data-act="tm+" ' + (S.timerMin >= 15 ? "disabled" : "") + ">+</button></div></div>";
    }
    h += "</div>" +
      '<div class="opt"><div class="row"><div><div class="t">İpucu</div><div class="d">Açıksa imposter’lar, kelimenin kategorisini rol ekranında görür.</div></div>' + switchHtml("hints", S.hints) + "</div></div>" +
      '<div class="opt"><div class="row"><div><div class="t">Ses efektleri</div><div class="d">Dokunma ve süre sesleri</div></div>' + switchHtml("sound", S.sound) + "</div></div>" +
      '<div class="opt"><div class="row"><div><div class="t">Animasyonlar</div><div class="d">Geçiş ve hareket efektleri</div></div>' + switchHtml("anim", S.anim) + "</div></div>" +
      "</div>";

    h += '</div><div class="footer"><button class="btn btn-primary big" data-act="start">' + ICON.play + "Oyunu Başlat</button></div>";
    mount(h, { keepScroll: opts.keepScroll, still: opts.keepScroll });
  };

  /* ----- Oyun başlat ----- */
  function startRound() {
    G.round = L.newRound(S, V, PAIRS, G.prevWord, rnd, G.impHistory);
    G.prevWord = G.round.word;
    G.impHistory.push(G.round.imposterIdx);
    if (G.impHistory.length > 6) G.impHistory.shift();
    G.idx = 0;
    G.stage = "pass";
    G.timerDone = false;
    go("reveal");
  }

  /* ----- Rol gösterme ----- */
  function progressDots() {
    var h = '<div class="progress">';
    for (var i = 0; i < G.round.players.length; i++) {
      h += '<span class="dot ' + (i < G.idx ? "done" : i === G.idx ? "cur" : "") + '"></span>';
    }
    return h + "</div>";
  }
  VIEW.reveal = function () {
    var n = G.round.players.length;
    if (G.stage === "pass") {
      var p = G.round.players[G.idx];
      mount(
        '<div class="center">' + progressDots() +
          '<div class="pass-card"><div class="avatar">' + initial(p.name) + '</div><div class="lbl">Telefonu şu oyuncuya verin</div><div class="nm">' + esc(p.name) + "</div>" +
          '<div class="lbl">' + (G.idx + 1) + " / " + n + "</div></div>" +
          '<div class="warn">' + ICON.lock + 'Diğer oyuncular ekrana bakmasın</div></div>' +
        '<div class="footer"><button class="btn btn-primary big" data-act="seeRole">' + ICON.eye + "Kelimeyi Gör</button></div>"
      );
      return;
    }
    var v = L.roleView(G.round, G.idx);
    var card;
    if (!v.imposter) {
      card = '<div class="role-card normal"><div class="role-tag">Rolün</div><div class="role-title">Normal Oyuncu</div>' +
        '<div class="note" style="margin-bottom:8px">Gizli kelime</div><div class="secret-wrap"><div class="secret">' + esc(v.word) + '</div><button class="help-btn" data-act="explain" aria-label="Kelimenin açıklamasını göster">?</button></div>' +
        '<p class="note" style="margin-top:14px">Kelimeyi doğrudan söylemeden ipucu ver.</p></div>';
    } else if (v.mode === "B") {
      card = '<div class="role-card imp"><div class="role-tag">Rolün</div><div class="role-title">IMPOSTER</div>' +
        '<div class="note" style="margin-bottom:8px">Senin kelimen</div><div class="secret">' + esc(v.word) + "</div>" +
        '<p class="note" style="margin-top:14px">Diğerlerinin kelimesi farklı! Dikkatli dinle ve fark ettirme.</p>' +
        (v.hint ? '<div class="hint-line">' + ICON.bulb + 'İpucu · Kategori: ' + esc(v.hint) + "</div>" : "") + "</div>";
    } else {
      card = '<div class="role-card imp"><div class="role-tag">Rolün</div><div class="role-title">IMPOSTER</div>' +
        '<div class="secret none">Kelimeyi bilmiyorsun.<br>İpuçlarından tahmin et ve fark ettirme!</div>' +
        (v.hint ? '<div class="hint-line">' + ICON.bulb + 'İpucu · Kategori: ' + esc(v.hint) + "</div>" : "") + "</div>";
    }
    mount(
      '<div class="center">' + progressDots() +
        '<div class="note" style="font-size:15px"><b class="em">' + esc(v.name) + "</b>, bu ekranı sadece sen görmelisin</div>" + card + "</div>" +
      '<div class="footer"><button class="btn btn-green big" data-act="ready">' + ICON.check + "Hazırım</button></div>"
    );
  };

  VIEW.allseen = function () {
    mount(
      '<div class="center"><div class="big-icon" style="--c1:#7d7aff;--c2:#5e5ce6">' + ICON.nophone + '</div>' +
        '<h1 class="h-title" style="font-size:28px;line-height:1.3;max-width:340px">Herkes rolünü gördü mü? Telefonu bir kenara bırakın ve oyuna başlayın!</h1>' +
        '<span class="phone-down">Telefon masaya, ekran aşağı</span></div>' +
      '<div class="footer"><button class="btn btn-primary big" data-act="startDisc">' + ICON.flag + "Oyuna Başla</button></div>"
    );
  };

  /* ----- Tartışma ----- */
  function stopTimer() { if (G.tick) { clearInterval(G.tick); G.tick = null; } }
  function updateTimer() {
    var el = document.getElementById("tm");
    if (!el) { stopTimer(); return; }
    var left = G.endAt - Date.now();
    el.textContent = L.formatTime(left);
    el.classList.toggle("low", left <= 30000 && left > 0);
    if (left <= 0) {
      el.classList.remove("low"); el.classList.add("end");
      var m = document.getElementById("tmmsg");
      if (m) m.textContent = "Süre doldu! Hazırsanız tartışmayı bitirin.";
      stopTimer();
      if (!G.timerDone) {
        G.timerDone = true; sfx("alarm");
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* yoksay */ }
      }
    }
  }
  function startDiscussion() {
    G.timerDone = false;
    G.endAt = Date.now() + S.timerMin * 60000;
    sfx("start");
    go("discussion");
  }
  VIEW.discussion = function () {
    var starter = G.round.players[G.round.starter].name;
    var imp = G.round.imposterCount;
    mount(
      '<div class="center"><div class="big-icon" style="--c1:#64d2ff;--c2:#0a84ff">' + ICON.chat + '</div><h1 class="h-title">Tartışma</h1>' +
        '<p class="instr">Sırayla ipucu verin. <em>Kelimeyi doğrudan söylemeyin!</em> Imposter\'ı bulmaya çalışın.</p>' +
        (S.timerOn ? '<div class="timer" id="tm">' + L.formatTime(G.endAt - Date.now()) + '</div><div class="note" id="tmmsg">Süre sayılıyor…</div>' : "") +
        '<div class="starter">İlk ipucunu veren: <b>' + esc(starter) + '</b></div>' +
        '<div class="pill">Bu turda ' + imp + " imposter var</div>" +
        '<span class="phone-down">Telefon masada kalsın · tartışma sözlü yapılır</span></div>' +
      '<div class="footer"><button class="btn btn-primary big" data-act="discEnd">' + ICON.check + "Tartışma Bitti</button>" +
      '<button class="btn btn-ghost" data-act="exitAsk">Oyundan Çık</button></div>'
    );
    if (S.timerOn) { updateTimer(); if (G.endAt > Date.now()) G.tick = setInterval(updateTimer, 250); }
  };

  /* ----- Sözlü oylama ----- */
  VIEW.vote = function () {
    mount(
      '<div class="center" style="gap:14px"><div class="big-icon" style="--c1:#ffb340;--c2:#ff7a1a">' + ICON.ballot + '</div><h1 class="h-title">Sözlü Oylama</h1>' +
        '<div class="steps">' +
          '<div class="s"><div class="n">1</div><div>Herkes şüphelendiği kişinin adını <b>yüksek sesle</b> söyler.</div></div>' +
          '<div class="s"><div class="n">2</div><div>Oyları <b>grup kendisi sayar</b>. Telefona oy girilmez.</div></div>' +
          '<div class="s"><div class="n">3</div><div>Beraberlik olursa yalnızca berabere kalanlar arasında <b>tekrar sözlü oylama</b> yapın.</div></div>' +
        "</div>" +
        '<span class="phone-down">Oylama bitene kadar telefona dokunmayın</span></div>' +
      '<div class="footer"><button class="btn btn-primary big" data-act="showResults">' + ICON.list + "Sonuçları Göster</button>" +
      '<button class="btn btn-ghost" data-act="exitAsk">Oyundan Çık</button></div>'
    );
  };

  /* ----- Sonuçlar ----- */
  VIEW.results = function () {
    var r = G.round;
    var h = '<div class="scroll"><div style="text-align:center;padding:6px 0 14px"><h1 class="h-title">Sonuçlar</h1><div class="h-sub">Roller ve kelime açıklandı</div></div>';

    h += '<div class="card word-box"><div class="lb">Gizli Kelime</div><div class="wd">' + esc(r.word) + '</div><div class="cat-l">Kategori: ' + esc(r.category) + "</div></div>";
    if (r.mode === "B") {
      h += '<div class="card word-box"><div class="lb">Imposter Kelimesi</div><div class="wd alt">' + esc(r.alt) + "</div></div>";
    } else {
      h += '<div class="card"><p class="note" style="text-align:center">Imposter’lar bu turda kelimeyi görmedi (Kelimeyi Bilmiyor modu).' +
        (r.fellBack ? "<br>Seçili kategorilerde uygun benzer kelime çifti bulunamadığı için bu tur bu moda geçildi." : "") + "</p></div>";
    }

    h += '<div class="card"><div class="card-t" style="margin-bottom:12px"><span class="ic" style="--c:#bf5af2">' + ICON.mask + '</span>Roller</div><div class="plist">';
    r.players.forEach(function (p, i) {
      var sub = p.imposter ? (r.mode === "B" ? "Kelimesi: " + esc(p.word) : "Kelimeyi görmedi") : "Kelimesi: " + esc(p.word);
      h += '<div class="pl ' + (p.imposter ? "imp" : "nor") + '" style="animation-delay:' + (i * 60) + 'ms"><div class="av">' + initial(p.name) + "</div>" +
        '<div><div class="pn">' + esc(p.name) + '</div><div class="pw">' + sub + "</div></div>" +
        '<span class="badge ' + (p.imposter ? "imp" : "nor") + '">' + (p.imposter ? "Imposter" : "Normal") + "</span></div>";
    });
    h += "</div></div>";

    h += '<div class="card"><div class="card-t" style="margin-bottom:6px"><span class="ic" style="--c:#ff9f0a">' + ICON.trophy + '</span>Kim kazandı?</div>' +
      '<p class="note">Oylama sözlü yapıldığı için sonucu uygulama bilmez; grup birlikte karar verir.</p>' +
      '<div class="rule"><i class="ri g">' + ICON.check + '</i><div><b>Normal oyuncular kazanır:</b> grup oylamada bir imposter’ı doğru bulduysa' + (r.imposterCount > 1 ? " (birden fazla imposter varsa isterseniz bulunanları dışarıda bırakıp tekrar oylayın)." : ".") + "</div></div>" +
      '<div class="rule"><i class="ri r">' + ICON.eye + '</i><div><b>Imposter kazanır:</b> grup yanlış kişiyi seçtiyse ya da imposter kimse fark edilmediyse.</div></div>' +
      (r.mode === "A" ? '<div class="rule"><i class="ri a">' + ICON.bulb + '</i><div><b>İsteğe bağlı kural:</b> yakalanan imposter gizli kelimeyi doğru tahmin ederse son anda kazanır.</div></div>' : "") +
      "</div></div>";

    h += '<div class="footer"><button class="btn btn-primary big" data-act="replay">' + ICON.redo + "Tekrar Oyna</button>" +
      '<button class="btn btn-glass" data-act="menu">' + ICON.home + "Ana Menüye Dön</button></div>";
    mount(h);
  };

  /* ---------- Modal ---------- */
  function openModal(title, text, buttons) {
    var b = buttons.map(function (x) { return '<button class="btn ' + x.cls + '" data-act="' + x.act + '">' + x.label + "</button>"; }).join("");
    $modal.innerHTML = '<div class="box"><h3>' + title + "</h3><p>" + text + '</p><div class="btns">' + b + "</div></div>";
    $modal.classList.remove("hidden");
  }
  function openExplain(word, text) {
    $modal.innerHTML = '<div class="box explain"><div class="ex-head"><span class="ex-q">?</span><div><div class="ex-tag">Kelime açıklaması</div><h3>' + esc(word) + '</h3></div></div>' +
      '<p>' + esc(text) + '</p><div class="btns"><button class="btn btn-primary" data-act="closeModal">Anladım</button></div></div>';
    $modal.classList.remove("hidden");
  }
  function closeModal() { $modal.classList.add("hidden"); $modal.innerHTML = ""; }

  /* ---------- Olaylar ---------- */
  var LOCKED = { seeRole: 1, ready: 1, startDisc: 1, discEnd: 1, showResults: 1, replay: 1, start: 1 };
  var lockUntil = 0;

  function act(name, el) {
    if (LOCKED[name]) {
      if (Date.now() < lockUntil) return;
      lockUntil = Date.now() + 450; /* çift dokunuşla yanlışlıkla sonraki ekranı açmayı engeller */
    }
    switch (name) {
      case "menu": sfx("click"); G.round = null; closeModal(); go("menu"); break;
      case "how": sfx("click"); go("how"); break;
      case "settings": sfx("click"); go("settings"); break;
      case "newGame": sfx("click"); go("setup"); break;

      case "pl+":
        if (S.names.length < L.MAX_OYUNCU) { S.names.push(nextDefaultName()); saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); }
        break;
      case "pl-":
        if (S.names.length > L.MIN_OYUNCU) {
          S.names.pop();
          S.imposters = Math.min(S.imposters, L.maxImposters(S.names.length));
          saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true });
        }
        break;
      case "im+": if (S.imposters < L.maxImposters(S.names.length)) { S.imposters++; saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); } break;
      case "im-": if (S.imposters > 1) { S.imposters--; saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); } break;
      case "tm+": if (S.timerMin < 15) { S.timerMin++; saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); } break;
      case "tm-": if (S.timerMin > 1) { S.timerMin--; saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); } break;
      case "mode": S.mode = el.getAttribute("data-m") === "B" ? "B" : "A"; saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); break;
      case "cat":
        var id = el.getAttribute("data-id"), i = S.categories.indexOf(id);
        if (S.mixed) { S.mixed = false; if (S.categories.indexOf(id) < 0) S.categories.push(id); }
        else if (i >= 0) S.categories.splice(i, 1); else S.categories.push(id);
        saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); break;
      case "catAll": S.mixed = false; S.categories = V.KATEGORILER.map(function (k) { return k.id; }); saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); break;
      case "catNone": S.mixed = false; S.categories = []; saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); break;
      case "mixed": S.mixed = !S.mixed; saveSettings(); sfx("click"); VIEW.setup({ keepScroll: true }); break;

      case "start":
        S.names = S.names.map(function (n, k) { n = String(n).trim().slice(0, L.MAX_ISIM); return n || L.defaultName(k); });
        var err = L.validate(S, V);
        if (err) { toast(err); lockUntil = 0; return; }
        saveSettings(); G.prevWord = null; G.impHistory = []; sfx("start"); startRound(); break;

      case "seeRole": G.stage = "show"; sfx("reveal"); render(); break;
      case "ready":
        sfx("hide"); G.idx++; G.stage = "pass";
        if (G.idx >= G.round.players.length) go("allseen"); else render();
        break;
      case "startDisc": startDiscussion(); break;
      case "discEnd": sfx("click"); go("vote"); break;
      case "showResults": sfx("result"); go("results"); break;
      case "replay": sfx("start"); startRound(); break; /* ayarlar korunur, yeni kelime ve roller */

      case "exitAsk":
        openModal("Oyundan çıkılsın mı?", "Mevcut tur sona erer ve ana menüye dönersiniz.",
          [{ label: "Ana Menüye Dön", cls: "btn-danger", act: "menu" }, { label: "Vazgeç", cls: "btn-glass", act: "closeModal" }]);
        break;
      case "resetAsk":
        openModal("Ayarlar sıfırlansın mı?", "Oyuncu isimleri, kategoriler ve diğer seçimler başlangıç değerlerine döner.",
          [{ label: "Sıfırla", cls: "btn-danger", act: "resetDo" }, { label: "Vazgeç", cls: "btn-glass", act: "closeModal" }]);
        break;
      case "resetDo":
        S = L.sanitize(null, V); saveSettings(); applyBody(); closeModal(); toast("Ayarlar sıfırlandı."); $toast.style.background = "rgba(46,230,166,.95)"; $toast.style.color = "#04261d";
        setTimeout(function () { $toast.style.background = ""; $toast.style.color = ""; }, 3000);
        VIEW.settings(); break;
      case "theme":
        var tv = el.getAttribute("data-v");
        S.theme = ["dark", "light", "auto"].indexOf(tv) >= 0 ? tv : "dark";
        saveSettings(); applyBody(); sfx("click"); VIEW.settings({ still: true }); break;
      case "explain":
        /* Nur für normale Spieler auf deren Rollen-Bildschirm – nie für den Imposter */
        var epl = G.round && G.round.players[G.idx];
        if (!epl || epl.imposter || !epl.word || G.screen !== "reveal" || G.stage !== "show") return;
        sfx("click"); openExplain(epl.word, L.explain(epl.word, G.round.category, EXPL)); break;
      case "closeModal": closeModal(); break;
    }
  }

  function onClick(e) {
    var el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    act(el.getAttribute("data-act"), el);
  }
  $app.addEventListener("click", onClick);
  $modal.addEventListener("click", function (e) {
    if (e.target === $modal) { closeModal(); return; }
    onClick(e);
  });

  /* Anahtarlar */
  $app.addEventListener("change", function (e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-chg");
    if (!k) return;
    S[k] = !!e.target.checked;
    saveSettings();
    if (k === "anim") applyBody();
    if (k === "sound" && S.sound) sfx("click");
    if (k === "timerOn" && G.screen === "setup") VIEW.setup({ keepScroll: true });
  });

  /* İsim alanları (yeniden çizim yapmadan) */
  $app.addEventListener("input", function (e) {
    var i = e.target.getAttribute && e.target.getAttribute("data-name");
    if (i === null || i === undefined) return;
    S.names[parseInt(i, 10)] = e.target.value;
  });
  $app.addEventListener("focusout", function (e) {
    var i = e.target.getAttribute && e.target.getAttribute("data-name");
    if (i === null || i === undefined) return;
    var idx = parseInt(i, 10);
    var v = e.target.value.trim().slice(0, L.MAX_ISIM);
    S.names[idx] = v || L.defaultName(idx);
    e.target.value = S.names[idx];
    saveSettings();
  });
  $app.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.getAttribute && e.target.getAttribute("data-name") !== null) e.target.blur();
  });

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$modal.classList.contains("hidden")) closeModal(); });

  /* Rol ekranı açıkken uygulama arka plana giderse rolü hemen gizle */
  function hideIfAway() {
    if (G.screen === "reveal" && G.stage === "show") { G.stage = "pass"; render(); }
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) hideIfAway(); });
  window.addEventListener("pagehide", hideIfAway);

  /* Başlat */
  applyBody();
  render();

  /* Ladebildschirm beenden, sobald das Hauptmenü samt Logo bereit ist (kein künstliches Warten) */
  (function signalReady() {
    var imgs = Array.prototype.slice.call($app.querySelectorAll("img")), left = imgs.length, fired = false;
    function fire() { if (fired) return; fired = true; if (window.__samixReady) window.__samixReady(); }
    if (!left) { fire(); return; }
    imgs.forEach(function (im) {
      function one() { left--; if (left <= 0) fire(); }
      if (im.complete) one(); else { im.addEventListener("load", one); im.addEventListener("error", one); }
    });
    setTimeout(fire, 3000); /* Sicherheitsnetz: nie wegen eines Bildes hängen bleiben */
  })();

  /* Test/hata ayıklama için küçük ve zararsız bir erişim noktası */
  window.__IMPOSTER__ = { get state() { return { S: S, G: G }; }, act: act, render: render };
})();
