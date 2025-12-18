$(function () {
  console.log("script.js loaded, jQuery version:", $.fn.jquery);

  let typed = "";
  const terminal = $("#terminal");
  terminal.css("white-space", "pre-wrap");

  let currentScreen = "intro";

  const $overlay = $("#videoOverlay");
  const video = document.getElementById("bgVideo");

  /* -----------------------------
     UTILITIES
  ----------------------------- */
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  /* -----------------------------
     TYPEWRITER
  ----------------------------- */
  async function typewriterText(text, speedMs = 8) {
    const el = terminal[0];
    terminal.html("");

    const safe = escapeHtml(text);
    let i = 0;

    while (i < safe.length) {
      if (safe[i] === "\n") {
        terminal.append("<br>");
        i++;
      } else {
        terminal.append(safe[i]);
        i++;
      }

      el.scrollTop = el.scrollHeight;

      const jitter = Math.random() * 6;
      await sleep(speedMs + jitter);
    }
  }

  /* -----------------------------
     VIDEO
  ----------------------------- */
  function showVideo(src, ms = 5000) {
    return new Promise((resolve) => {
      if (!$overlay.length || !video) {
        console.warn("Missing #videoOverlay or #bgVideo, skipping video.");
        resolve();
        return;
      }

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

      video.play().catch((err) => {
        console.warn("Video play blocked:", err);
      });

      setTimeout(done, ms);
    });
  }

  /* -----------------------------
     LOAD SCREENS
  ----------------------------- */
  function loadScreen(file, opts = {}) {
    const { typeSpeedMs = 8 } = opts;

    $.get(file)
      .done(async function (data) {
        console.log("Loaded:", file);
        await typewriterText(data, typeSpeedMs);
      })
      .fail(function (xhr, status) {
        terminal.html("ERROR loading " + file + ": " + status);
      });
  }

  async function playVideoThenLoad(videoSrc, mdFile, ms = 5000) {
    await showVideo(videoSrc, ms);
    loadScreen(mdFile, { typeSpeedMs: 10 });
  }

  function print(text) {
    terminal.append("<br>&gt; " + escapeHtml(text));
    terminal.scrollTop(terminal[0].scrollHeight);
  }

  /* -----------------------------
     START INTRO
  ----------------------------- */
  playVideoThenLoad("videos/intro.mp4", "./intro.md", 5000);

  /* -----------------------------
     INPUT HANDLING
  ----------------------------- */
  $(window).on("keydown", function (e) {
    const key = e.key;

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
          playVideoThenLoad("videos/ligo.mp4", "./ligo.md", 5000);
        } else {
          print("Invalid command. Try: TRACE THE MONEY");
        }
      }

      typed = "";
      $("#typed").text("");
      return;
    }

    if (key === "Backspace") {
      typed = typed.slice(0, -1);
      $("#typed").text(typed);
      return;
    }

    // Optional: stop browser shortcuts messing with typing
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typed += key;
      $("#typed").text(typed);
    }
  });
});


