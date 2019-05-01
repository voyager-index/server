$(document).ready(function() {
    let theme = localStorage.getItem("theme");

    if (theme == "dark") {
        setDark();
    }

    else if (theme == "light") {
        setLight();
    }

    try {
        document.getElementById("darkswitch").onclick = function() {
            setDark();
        };

        document.getElementById("lightswitch").onclick = function() {
            setLight();
        };

        function setDark() {
            localStorage.setItem("theme", "dark");
            document.getElementById("dark").href = "/stylesheets/dark.css";
        }

        function setLight() {
            localStorage.setItem("theme", "light");
            document.getElementById("dark").href = "";
        }
    }
    catch(err) {
        console.log("Theme error.");
    }
});

