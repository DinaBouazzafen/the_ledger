$(function () {
    console.log("script.js loaded, jQuery version:", $.fn.jquery);

    let typed = "";
    const terminal = $("#terminal");

    terminal.css("white-space", "pre-wrap");

    let currentScreen = "intro";

    console.log("Loading intro.md...");
    loadScreen("./intro.md");

    function loadScreen(file) {
        $.get(file)
            .done(function (data) {
                console.log("Loaded:", file);
                terminal.html(data);
                terminal.scrollTop(terminal[0].scrollHeight);
            })
            .fail(function (xhr, status, err) {
                console.error("Failed to load", file, status, err);
                terminal.html("ERROR loading " + file + ": " + status);
            });
    }

    function print(text) {
        terminal.append("\n" + text);
        terminal.scrollTop(terminal[0].scrollHeight);
    }

    $(window).on("keydown", function (e) {
        const key = e.key;
        // quick debug
        // console.log("key:", key);

        if (key === "Enter") {
            const cmd = typed.trim();
            const cmdUpper = cmd.toUpperCase();

            print("> " + cmd);

            if (currentScreen === "intro") {
                if (cmdUpper === "DISMANTLE SYSTEM") {
                    currentScreen = "politics";
                    loadScreen("./politics.md");
                } else {
                    print('Invalid command. Try: DISMANTLE SYSTEM');
                }
            } else if (currentScreen === "politics") {
                if (cmdUpper === "DOWN WITH CAPITALISM") {
                    currentScreen = "capitalism";
                    loadScreen("./af.md");
                } else {
                    print('Invalid command. Try: DOWN WITH CAPITALISM');
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

        if (key.length === 1) {
            typed += key;
            $("#typed").text(typed);
        }
    });
});
