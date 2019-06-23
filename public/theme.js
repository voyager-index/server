$(document).ready(function() {
    let theme = localStorage.getItem('theme');

    if (theme == 'dark') {
        setDark();
    } else if (theme == 'light') {
        setLight();
    }

    try {
        document.getElementById('darkswitch').onclick = function() {
            setDark();
        };

        document.getElementById('lightswitch').onclick = function() {
            setLight();
        };
    } catch (err) {
        console.log('Theme error.');
    }

    function setDark() {
        localStorage.setItem('theme', 'dark');
        document.getElementById('dark').href = '/stylesheets/dark.css';
        document.getElementById('darkswitch').checked = true;
    }

    function setLight() {
        localStorage.setItem('theme', 'light');
        document.getElementById('dark').href = '';
        document.getElementById('lightswitch').checked = true;
    }
});
