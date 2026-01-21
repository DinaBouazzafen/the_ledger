$(function () {
  console.log("script.js loaded");

  let typed = "";
  const terminal = $("#terminal");
  const scrollBox = $(".terminal-container");

  let currentScreen = "intro";
  const screenStack = [];

  // permissions
  const permissions = {
    "01": false,
    "02": false,
    "03": false,
  };

  // dev override (hidden)
  const DEV_PREFIX = ":";

  const $overlay = $("#videoOverlay");
  const video = document.getElementById("bgVideo");

  let autoFollow = true;

  // typewriting
  const TYPE_SPEED = 50;
  const TYPE_JITTER = 10;
  let isTyping = false;

  // intro gating (video stays until SPACE)
  let waitingForSpace = true;
  let introVideoActive = false;

  /* -----------------------------
     SCROLL
  ----------------------------- */
  function isNearBottom(px = 40) {
    const el = scrollBox[0];
    return el.scrollTop + el.clientHeight >= el.scrollHeight - px;
  }

  scrollBox.on("scroll", () => {
    autoFollow = isNearBottom(60);
  });

  function scrollBottom() {
    if (autoFollow) scrollBox[0].scrollTop = scrollBox[0].scrollHeight;
  }

  function scrollBy(px) {
    scrollBox[0].scrollTop += px;
    autoFollow = isNearBottom(60);
  }

  /* -----------------------------
     TOPBAR
  ----------------------------- */
  function syncTopbar(screen) {
    const blocks = document.querySelectorAll(".bar-block");
    blocks.forEach((b) => (b.style.background = "#1a1a1a"));

    switch (screen) {
      case "intro":
        document.querySelector('[data-step="intro"]').style.background = "white";
        break;
      case "politics":
      case "capitalism":
      case "syptoms":
        document.querySelector('[data-step="01"]').style.background = "#a7a6a6";
        break;
      case "ligo":
        document.querySelector('[data-step="02"]').style.background = "#717070";
        break;
      case "censorship":
        document.querySelector('[data-step="03"]').style.background = "#313131";
        break;
    }
  }

  /* -----------------------------
     UTIL
  ----------------------------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const escapeHtml = (s) =>
    String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");

  function clearInputLine() {
    typed = "";
    $("#typed").text("");
  }

  function print(cmd) {
    terminal.append("<br>&gt; " + escapeHtml(cmd));
    scrollBottom();
  }

  function printBlock(text) {
    terminal.append("<br>" + escapeHtml(text).replaceAll("\n", "<br>"));
    scrollBottom();
  }

  async function fakeDenied(reason = "ACCESS DENIED") {
    const lines = [
      "ACCESS DENIED",
      "",
      "REASON:",
      "  " + reason,
      "",
      "TRACE:",
      "  /dev/codelostbytrumpsgreed",
    ];
    for (const l of lines) {
      terminal.append("<br>" + escapeHtml(l));
      scrollBottom();
      await sleep(120);
    }
    for (let i = 0; i < 4; i++) {
      terminal.append("<br>...");
      scrollBottom();
      await sleep(90);
    }
  }

  function pushScreen(s) {
    screenStack.push(currentScreen);
    currentScreen = s;
    syncTopbar(currentScreen);
  }

  function goBack() {
    if (!screenStack.length) return false;
    currentScreen = screenStack.pop();
    syncTopbar(currentScreen);
    reloadScreen();
    return true;
  }

  /* -----------------------------
     TYPEWRITER
  ----------------------------- */
  async function typewriter(text, speed = TYPE_SPEED) {
    isTyping = true;

    terminal.html("");
    autoFollow = true;

    const safe = escapeHtml(text);

    for (let c of safe) {
      terminal.append(c === "\n" ? "<br>" : c);
      scrollBottom();
      await sleep(speed + Math.random() * TYPE_JITTER);
    }

    isTyping = false;
  }

  async function typewriterAppend(text, speed = TYPE_SPEED) {
    isTyping = true;

    const safe = escapeHtml(text);

    for (let c of safe) {
      terminal.append(c === "\n" ? "<br>" : c);
      scrollBottom();
      await sleep(speed + Math.random() * TYPE_JITTER);
    }

    isTyping = false;
  }

  /* -----------------------------
     VIDEO
  ----------------------------- */
  function showVideo(src, ms = 5000) {
    return new Promise((res) => {
      if (!$overlay.length || !video) return res();

      $overlay.show();
      video.pause();
      video.loop = false;
      video.src = src;
      video.load();
      video.currentTime = 0;

      const done = () => {
        video.pause();
        $overlay.hide();
        res();
      };

      video.onended = done;
      video.play().catch(() => {});
      setTimeout(done, ms);
    });
  }

  async function playVideoThenLoad(v, f) {
    await showVideo(v);
    const d = await $.get(f);
    await typewriter(d);
  }

  /* -----------------------------
     INTRO: video stays until SPACE
  ----------------------------- */
  function showIntroVideo() {
    terminal.html("");
    autoFollow = true;

    waitingForSpace = true;
    introVideoActive = true;

    if ($overlay.length && video) {
      $overlay.show();
      video.pause();
      video.loop = true;
      video.src = "videos/intro.mp4";
      video.load();
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    terminal.append(
      "<br><br><span style='opacity:.6'>[ PRESS SPACE TO ENTER ]</span>"
    );
    scrollBottom();
  }

  async function enterIntro() {
    if (!introVideoActive) return;

    waitingForSpace = false;
    introVideoActive = false;

    if (video) {
      video.pause();
      video.loop = false;
    }
    if ($overlay.length) $overlay.hide();

    terminal.html("");
    const d = await $.get("./intro.md");
    await typewriter(d);
  }

  /* -----------------------------
     LS
  ----------------------------- */
  function showLS() {
    const lines = [
      "COMMANDS:",
      "  ls                       list system commands",
      "  back                     return to previous location",
      "  clear                    clear terminal",
      "",
      "ESCALATION PHRASES:",
    ];

    if (!permissions["01"]) {
      lines.push(
        "  DISMANTLE SYSTEM          request access to 01_POLITICIZATION"
      );
    }
    if (permissions["01"] && !permissions["02"]) {
      lines.push(
        "  DONE WITH CAPITALISM      request access to 02_LIGO_FUNDS"
      );
    }
    if (permissions["02"] && !permissions["03"]) {
      lines.push(
        "  CENSORSHIP IS SO 1984     request access to 03_CENSORSHIP"
      );
    }

    lines.push(
      "",
      "DIRECTORIES:",
      `  01_POLITICIZATION         ${permissions["01"] ? "[OPEN]" : "[LOCKED]"}`,
      `  02_LIGO_FUNDS             ${permissions["02"] ? "[OPEN]" : "[LOCKED]"}`,
      `  03_CENSORSHIP             ${permissions["03"] ? "[OPEN]" : "[LOCKED]"}`
    );

    if (currentScreen === "ligo") {
      lines.push(
        "",
        "LIGO ARCHIVE QUERIES:",
        "  archive                  show all years",
        "  milestones               milestones only",
        "  YYYY                     isolate year"
      );
    }

    printBlock(lines.join("\n"));
  }

  /* -----------------------------
     OPEN DIR
  ----------------------------- */
  async function openDir(dir, force = false) {
    if (!["01", "02", "03"].includes(dir)) {
      return fakeDenied("NO SUCH DIRECTORY");
    }

    if (!permissions[dir] && !force) {
      return fakeDenied("LOCKED: " + dir);
    }

    if (dir === "01") {
      pushScreen("politics");
      return playVideoThenLoad("videos/pol.mp4", "./politics.md");
    }

    if (dir === "02") {
      pushScreen("ligo");
      await showVideo("videos/ligo.mp4");
      return showLigoBoot();
    }

    if (dir === "03") {
      pushScreen("censorship");
      return playVideoThenLoad("videos/censor.mp4", "./censor.md");
    }
  }

  /* -----------------------------
     LIGO
  ----------------------------- */
  let ligoRecords = null;
  let ligoTailHint = null;

  async function loadLigoDataOnce() {
    if (ligoRecords) return;

    const raw = await $.get("./ligo.md");
    const lines = raw.split(/\r?\n/);

    ligoRecords = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (line.startsWith('Type "CENSORSHIP') || line.startsWith("Type \"CENSORSHIP")) {
        ligoTailHint = line;
        break;
      }

      if (!/^\d{4}/.test(line)) {
        i++;
        continue;
      }

      const year = line;
      i++;

      while (i < lines.length && lines[i].trim() === "") i++;
      const money = lines[i]?.trim() || "";
      i++;

      const textLines = [];
      while (i < lines.length && !/^\d{4}/.test(lines[i])) {
        if (lines[i].trim() === "") break;
        textLines.push(lines[i]);
        i++;
      }

      ligoRecords.push({
        year,
        money,
        text: textLines.join("\n").trim(),
      });

      while (i < lines.length && lines[i].trim() === "") i++;
    }
  }

  async function showLigoBoot() {
    terminal.html("");
    autoFollow = true;

    const bootText = [
      ">> 02_LIGO_FUNDS",
      "STATUS: READ-ONLY",
      "INTEGRITY: DEGRADED",
      "RECORD RANGE: 1984–2026",
      "",
      "AVAILABLE QUERIES:",
      "  archive",
      "  milestones",
      "  YYYY",
      "",
      "Type a query.",
    ].join("\n");

    await typewriter(bootText);
  }

  function isMilestone(r) {
    return /GW|DETECTION|APPROV|UPGRADE|AWARD|CUT/i.test(r.text);
  }

  async function renderLigoResults(records) {
    terminal.html("");
    autoFollow = true;

    for (const r of records) {
      await typewriter([
        r.year,
        r.money,
        r.text,
        ""
      ].join("\n"));
      await sleep(250);
    }

    if (ligoTailHint) {
      printBlock("\nNOTE:");
      printBlock("  Some records reference restricted material.");
      printBlock("  " + ligoTailHint);
    }

    printBlock("\nTip: ls | back");
  }

  async function renderLigoStack(records) {
    terminal.html("");
    autoFollow = true;

    await typewriter(
      [
        ">> 02_LIGO_FUNDS",
        "MODE: MILESTONES",
        "--------------------------------",
      ].join("\n")
    );

    for (const r of records) {
      await typewriterAppend(
        [
          "",
          r.year,
          r.money,
          r.text,
          "--------------------------------",
        ].join("\n")
      );
      await sleep(150);
    }

    if (ligoTailHint) {
      await typewriterAppend(
        [
          "",
          "NOTE:",
          "  Some records reference restricted material.",
          "  " + ligoTailHint,
        ].join("\n")
      );
    }

    await typewriterAppend("\n\nTip: ls | back");
  }

  async function handleLigoQuery(inputUpper) {
    await loadLigoDataOnce();

    if (inputUpper === "ARCHIVE") return renderLigoResults(ligoRecords);

    if (inputUpper === "MILESTONES") {
      const hits = ligoRecords.filter(isMilestone);
      return renderLigoStack(hits);
    }

    if (/^\d{4}$/.test(inputUpper)) {
      const hits = ligoRecords.filter((r) => r.year.startsWith(inputUpper));
      if (!hits.length) {
        return fakeDenied("NO RECORD FOUND FOR " + inputUpper);
      }
      return renderLigoResults(hits);
    }

    await fakeDenied("INVALID QUERY");
    printBlock("Hint: archive | milestones | YYYY");
  }

  /* -----------------------------
     RELOAD SCREEN (for back)
  ----------------------------- */
  async function reloadScreen() {
    // cancel intro gate if leaving intro
    if (currentScreen !== "intro") {
      waitingForSpace = false;
      introVideoActive = false;
      if ($overlay.length) $overlay.hide();
      if (video) {
        video.pause();
        video.loop = false;
      }
    }

    if (currentScreen === "intro") {
      syncTopbar("intro");
      showIntroVideo();
      return;
    }

    if (currentScreen === "politics") {
      return playVideoThenLoad("videos/pol.mp4", "./politics.md");
    }

    if (currentScreen === "capitalism") {
      const d = await $.get("./af.md");
      return typewriter(d);
    }

    if (currentScreen === "syptoms") {
      const d = await $.get("./syptoms.md");
      return typewriter(d);
    }

    if (currentScreen === "ligo") {
      await showVideo("videos/ligo.mp4");
      return showLigoBoot();
    }

    if (currentScreen === "censorship") {
      return playVideoThenLoad("videos/censor.mp4", "./censor.md");
    }
  }

  /* -----------------------------
     START
  ----------------------------- */
  syncTopbar("intro");
  showIntroVideo();

  /* -----------------------------
     INPUT
  ----------------------------- */
  $(document).on("keydown", async (e) => {
    // SPACE gate for intro
    if (currentScreen === "intro" && waitingForSpace && e.code === "Space") {
      e.preventDefault();
      clearInputLine();
      await enterIntro();
      return;
    }

    // lock while typing
    if (isTyping) {
      e.preventDefault();
      return;
    }

    const k = e.key;

    // scroll keys
    if (k === "ArrowUp") { e.preventDefault(); scrollBy(-80); return; }
    if (k === "ArrowDown") { e.preventDefault(); scrollBy(80); return; }

    if (k === "Enter") {
      const cmd = typed.trim();
      const U = cmd.toUpperCase();

      // echo command (except during intro gate)
      print(cmd);

      // DEV OVERRIDE (hidden)
      if (cmd.startsWith(DEV_PREFIX)) {
        clearInputLine();

        const forceCmd = cmd.slice(1).trim().toUpperCase();
        if (forceCmd.startsWith("OPEN ")) {
          const d = forceCmd.split(" ")[1];
          terminal.html("");
          autoFollow = true;
          await openDir(d, true);
        }
        return;
      }

      if (U === "LS") showLS();
      else if (U === "CLEAR") terminal.html("");
      else if (U === "BACK") goBack();
      else if (U.startsWith("OPEN ")) {
        const d = U.split(" ")[1];
        await openDir(d, false);
      }

      // STORY UNLOCKS
      else if (U === "DISMANTLE SYSTEM") {
        permissions["01"] = true;
        pushScreen("politics");
        await playVideoThenLoad("videos/pol.mp4", "./politics.md");
      } else if (U === "DONE WITH CAPITALISM") {
        permissions["02"] = true;
        pushScreen("ligo");
        await showVideo("videos/ligo.mp4");
        await showLigoBoot();
      } else if (U === "CENSORSHIP IS SO 1984") {
        permissions["03"] = true;
        pushScreen("censorship");
        await playVideoThenLoad("videos/censor.mp4", "./censor.md");
      } else if (U === "EXIT THE LOOP") {
        // reset back to intro gate
        screenStack.length = 0;
        currentScreen = "intro";
        syncTopbar("intro");
        showIntroVideo();
        clearInputLine();
        return;
      }

      // LIGO queries
      else if (currentScreen === "ligo") {
        clearInputLine();
        await handleLigoQuery(U);
        return;
      }

      else {
        await fakeDenied("UNKNOWN COMMAND");
        printBlock("Hint: type ls");
      }

      clearInputLine();
      return;
    }

    if (k === "Backspace") {
      typed = typed.slice(0, -1);
      $("#typed").text(typed);
      return;
    }

    // prevent space from typing into the prompt while intro video is waiting
    if (currentScreen === "intro" && waitingForSpace && e.code === "Space") {
      e.preventDefault();
      return;
    }

    if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typed += k;
      $("#typed").text(typed);
    }
  });
});
