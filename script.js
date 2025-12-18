$(function () {
  console.log("script.js loaded, jQuery version:", $.fn.jquery);

  let typed = "";

  const terminal = $("#terminal");                 // content
  const scrollBox = $(".terminal-container");      // scroll container

  let currentScreen = "intro";

  const $overlay = $("#videoOverlay");
  const video = document.getElementById("bgVideo");

  // Used to cancel any running async renderer (like LIGO animation)
  let activeRenderer = null;

  /* -----------------------------
     SCROLL LOGIC
  ----------------------------- */
  let autoFollow = true;

  function isNearBottom($el, px = 40) {
    const el = $el[0];
    return el.scrollTop + el.clientHeight >= el.scrollHeight - px;
  }

  scrollBox.on("scroll", function () {
    autoFollow = isNearBottom(scrollBox, 60);
  });

  function scrollToBottomIfFollowing() {
    if (!autoFollow) return;
    const el = scrollBox[0];
    el.scrollTop = el.scrollHeight;
  }

  function scrollByPixels(px) {
    const el = scrollBox[0];
    el.scrollTop += px;
    autoFollow = isNearBottom(scrollBox, 60);
  }

  /* -----------------------------
     UTILITIES
  ----------------------------- */
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
  }

  function setText($el, txt) {
    $el.text(String(txt));
  }

  /* -----------------------------
     TYPEWRITER
  ----------------------------- */
  async function typewriterText(text, speedMs = 8, cancelRenderer = true) {
    if (cancelRenderer) activeRenderer = null;

    terminal.html("");
    autoFollow = true;

    const safe = escapeHtml(text);
    for (let i = 0; i < safe.length; i++) {
      if (safe[i] === "\n") terminal.append("<br>");
      else terminal.append(safe[i]);

      scrollToBottomIfFollowing();
      await sleep(speedMs + Math.random() * 6);
    }
    scrollToBottomIfFollowing();
  }

  /* -----------------------------
     VIDEO
  ----------------------------- */
  function showVideo(src, ms = 5000) {
    return new Promise((resolve) => {
      if (!$overlay.length || !video) { resolve(); return; }

      $overlay.show();

      video.pause();
      video.src = src;
      video.load();
      video.currentTime = 0;

      const done = () => {
        video.pause();
        $overlay.hide();
        resolve();
      };

      video.onended = done;
      video.play().catch(() => {});
      setTimeout(done, ms);
    });
  }

  /* -----------------------------
     LOAD SCREENS
  ----------------------------- */
  function loadScreen(file, opts = {}) {
    const { typeSpeedMs = 10 } = opts;

    activeRenderer = null;

    $.get(file)
      .done(async (data) => {
        console.log("Loaded:", file);
        await typewriterText(data, typeSpeedMs, true);
      })
      .fail((xhr, status) => {
        terminal.html("ERROR loading " + file + ": " + status);
      });
  }

  async function playVideoThenLoad(videoSrc, mdFile, ms = 5000) {
    activeRenderer = null;
    await showVideo(videoSrc, ms);
    loadScreen(mdFile, { typeSpeedMs: 10 });
  }

  function print(text) {
    terminal.append("<br>&gt; " + escapeHtml(text));
    scrollToBottomIfFollowing();
  }

  /* -----------------------------
     LIGO SPECIAL
  ----------------------------- */
  function isYearLine(line) {
    return /^\d{4}(\s*\(.*\))?$/.test(line.trim());
  }

  function parseLigo(raw) {
    const lines = String(raw).split(/\r?\n/);

    const items = [];
    let i = 0;

    let tailMessage = "";

    while (i < lines.length) {
      const line = lines[i];

      if (/^Type\s+"/i.test(line.trim())) {
        tailMessage = lines.slice(i).join("\n").trim();
        break;
      }

      if (!isYearLine(line)) { i++; continue; }

      const year = line.trim();
      i++;

      while (i < lines.length && lines[i].trim() === "") i++;
      const money = (lines[i] || "").trim();
      i++;

      const textLines = [];
      while (i < lines.length) {
        const peek = lines[i];

        if (/^Type\s+"/i.test(peek.trim())) break;
        if (isYearLine(peek)) break;

        textLines.push(peek.replace(/\s+$/g, ""));
        i++;
      }

      const text = textLines.join("\n").trimEnd();
      items.push({ year, money, text });
    }

    return { items, tailMessage };
  }

  function moneyToNumber(moneyStr) {
    const s = String(moneyStr).replace(/\$/g, "").replace(/M/i, "").trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  async function animateDots(totalMs = 700, stepMs = 120) {
    const $d = $(`<div class="ligo-dots">...</div>`);
    terminal.append($d);
    scrollToBottomIfFollowing();

    const steps = Math.max(1, Math.floor(totalMs / stepMs));
    for (let i = 0; i < steps; i++) {
      const k = (i % 3) + 1;
      setText($d, ".".repeat(k));
      scrollToBottomIfFollowing();
      await sleep(stepMs);
    }
    $d.remove();
  }

  async function typeSpan($el, text, speedMs = 12) {
    setText($el, "");
    const t = String(text);
    let buf = "";
    for (let i = 0; i < t.length; i++) {
      buf += t[i];
      setText($el, buf);
      scrollToBottomIfFollowing();
      await sleep(speedMs + Math.random() * 6);
    }
  }

  async function countMoney($el, targetM, durationMs = 520) {
    const steps = 30;
    const stepMs = Math.max(10, Math.floor(durationMs / steps));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const val = targetM * t;
      setText($el, `$${val.toFixed(1)}M`);
      scrollToBottomIfFollowing();
      await sleep(stepMs);
    }
  }

  function milestoneBanner(yearOnly, text) {
    const t = String(text || "").toUpperCase();
    const y = String(yearOnly);

    if (t.includes("GW150914") || (y === "2015" && t.includes("FIRST DIRECT DETECTION"))) {
      return [
        "!! MILSTONE: FIRST DETECTION",
        "   EVENT: GW150914",
        "   STATUS: CONFIRMED SIGNAL",
      ].join("\n");
    }
    if (t.includes("GW170817") || (y === "2017" && t.includes("NEUTRON STAR"))) {
      return [
        "!! MILSTONE: MULTI-MESSENGER ERA",
        "   EVENT: GW170817",
        "   NOTE : BINARY NEUTRON STAR",
      ].join("\n");
    }
    if (y === "1994" && (t.includes("APPROVES") || t.includes("MREFC") || t.includes("CONSTRUCTION"))) {
      return [
        "!! AUTHORIZATION GRANTED",
        "   NSF: FULL CONSTRUCTION APPROVED",
        "   PROGRAM: INITIAL LIGO (MREFC)",
      ].join("\n");
    }
    if (y === "1991" && t.includes("NSF")) {
      return [
        "!! FUNDING INFLECTION",
        "   NSF: FIRST MAJOR AWARD",
        "   SHIFT: NATIONAL-SCALE PROJECT",
      ].join("\n");
    }
    if (y === "2008" && (t.includes("FINAL") || t.includes("ADVANCED LIGO"))) {
      return [
        "!! TRANSITION PHASE",
        "   INITIAL LIGO: FINAL OPERATIONS",
        "   ADVANCED LIGO: CONSTRUCTION APPROVED",
      ].join("\n");
    }
    if (y === "2018" && t.includes("A+")) {
      return [
        "!! UPGRADE TRACK",
        "   PROGRAM: A+ BEGINS",
        "   GOAL   : SENSITIVITY EXPANSION",
      ].join("\n");
    }
    if (y === "2024" && (t.includes("NEW") || t.includes("AWARD") || t.includes("OPERATIONS"))) {
      return [
        "!! NEW AWARD LOGGED",
        "   NSF: MULTI-YEAR O&M",
        "   CONTINUITY: OPERATIONS SECURED",
      ].join("\n");
    }
    if (y.startsWith("2026") && (t.includes("PROPOSED") || t.includes("CUT"))) {
      return [
        "!! ANOMALY: PROPOSED CUT",
        "   RISK: SINGLE-DETECTOR SCENARIO",
        "   STATUS: PENDING / UNRESOLVED",
      ].join("\n");
    }

    const snippet = String(text || "").trim().split(/\s+/).slice(0, 8).join(" ");
    return [
      `!! RECORD EMPHASIS: ${y}`,
      `   NOTE: ${snippet}${snippet ? "…" : ""}`,
    ].join("\n");
  }

  async function playLigoTimeline(file) {
    // start a cancellable session
    const renderId = Symbol("ligo");
    activeRenderer = renderId;
    const stillActive = () => activeRenderer === renderId;

    terminal.html("");
    autoFollow = true;

    let raw;
    try {
      raw = await $.get(file);
    } catch {
      if (!stillActive()) return;
      terminal.html("ERROR loading " + file);
      return;
    }

    if (!stillActive()) return;

    const { items, tailMessage } = parseLigo(raw);

    const bootLines = [
      ">> 02_LIGO_FUNDS",
      "QUERY: LIGO_FUNDING_STREAM",
      "MODE: READONLY",
      "STREAM: OPEN",
    ];

    await typewriterText(bootLines.join("\n"), 6, false);
    if (!stillActive()) return;

    terminal.append("<br>--------------------------------");
    scrollToBottomIfFollowing();

    const milestoneYears = new Set(["1991", "1994", "2008", "2015", "2017", "2018", "2024", "2026"]);

    for (let idx = 0; idx < items.length; idx++) {
      if (!stillActive()) return;

      const it = items[idx];
      const yearOnly = (String(it.year).match(/^\d{4}/) || [it.year])[0];

      const $card = $(
        `<div class="ligo-card">
          <div class="ligo-meta">
            <span class="ligo-year"></span>
            <span class="ligo-money"></span>
          </div>
          <div class="ligo-text"></div>
          <div class="ligo-alert"></div>
        </div>`
      );

      terminal.append($card);

      const $y = $card.find(".ligo-year");
      const $m = $card.find(".ligo-money");
      const $t = $card.find(".ligo-text");
      const $a = $card.find(".ligo-alert");

      await typeSpan($y, `[${it.year}]`, 12);
      if (!stillActive()) return;

      await countMoney($m, moneyToNumber(it.money), 520);
      if (!stillActive()) return;

      await typeSpan($t, "↳ " + (it.text || "").trim(), 6);
      if (!stillActive()) return;

      if (milestoneYears.has(yearOnly) || /\bGW\d+\b/i.test(it.text)) {
        setText($a, milestoneBanner(yearOnly, it.text));
        $card.addClass("ligo-glitch");
        await sleep(180);
        $card.removeClass("ligo-glitch");
      } else {
        setText($a, "");
      }

      scrollToBottomIfFollowing();

      if (idx !== items.length - 1) {
        await animateDots(650, 120);
      }
    }

    if (!stillActive()) return;

    terminal.append("<br>--------------------------------");
    scrollToBottomIfFollowing();

    if (tailMessage) {
      terminal.append("<br>" + escapeHtml(tailMessage).replaceAll("\n", "<br>"));
      scrollToBottomIfFollowing();
    }
  }

  /* -----------------------------
     START INTRO
  ----------------------------- */
  playVideoThenLoad("videos/intro.mp4", "./intro.md", 5000);

  /* -----------------------------
     INPUT HANDLING
  ----------------------------- */
  $(document).on("keydown", function (e) {
    const key = e.key;

    // Arrow/paging keys scroll the terminal container
    if (key === "ArrowUp")    { e.preventDefault(); scrollByPixels(-80);  return; }
    if (key === "ArrowDown")  { e.preventDefault(); scrollByPixels(80);   return; }
    if (key === "PageUp")     { e.preventDefault(); scrollByPixels(-450); return; }
    if (key === "PageDown")   { e.preventDefault(); scrollByPixels(450);  return; }
    if (key === "Home")       { e.preventDefault(); scrollBox[0].scrollTop = 0; autoFollow = false; return; }
    if (key === "End")        { e.preventDefault(); scrollBox[0].scrollTop = scrollBox[0].scrollHeight; autoFollow = true; return; }

    // Enter submits command
    if (key === "Enter") {
      const cmd = typed.trim();
      const cmdUpper = cmd.toUpperCase();

      print(cmd);

      if (currentScreen === "intro") {
        if (cmdUpper === "DISMANTLE SYSTEM") {
          currentScreen = "politics";
          playVideoThenLoad("videos/pol.mp4", "./politics.md", 5000);
        } else {
          print("Invalid command. Try: DISMANTLE SYSTEM");
        }
      } else if (currentScreen === "politics") {
        if (cmdUpper === "DONE WITH CAPITALISM") {
          currentScreen = "capitalism";
          loadScreen("./af.md", { typeSpeedMs: 10 });
        } else {
          print("Invalid command. Try: DONE WITH CAPITALISM");
        }
      } else if (currentScreen === "capitalism") {
        if (cmdUpper === "RESIST POLITICIZATION") {
          currentScreen = "syptoms";
          loadScreen("./syptoms.md", { typeSpeedMs: 10 });
        } else {
          print("Invalid command. Try: RESIST POLITICIZATION");
        }
      } else if (currentScreen === "syptoms") {
        if (cmdUpper === "TRACE THE MONEY") {
          currentScreen = "ligo";
          activeRenderer = null;
          showVideo("videos/ligo.mp4", 5000).then(() => playLigoTimeline("./ligo.md"));
        } else {
          print("Invalid command. Try: TRACE THE MONEY");
        }
      } else if (currentScreen === "ligo") {
        if (cmdUpper === "CENSORSHIP IS SO 1984") {
          activeRenderer = null;
          currentScreen = "censorship";
          playVideoThenLoad("videos/censor.mp4", "./censor.md", 5000);
        } else {
          print('Try: "CENSORSHIP IS SO 1984"');
        }
      } else if (currentScreen === "censorship") {
        if (cmdUpper === "EXIT THE LOOP") {
          activeRenderer = null;
          currentScreen = "intro";
          playVideoThenLoad("videos/intro.mp4", "./intro.md", 5000);
        } else {
          print('Try: "EXIT THE LOOP"');
        }
      }

      typed = "";
      $("#typed").text("");
      return;
    }

    // Backspace edits
    if (key === "Backspace") {
      typed = typed.slice(0, -1);
      $("#typed").text(typed);
      return;
    }

    // Normal typing
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typed += key;
      $("#typed").text(typed);
    }
  });
});
