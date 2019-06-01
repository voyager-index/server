// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
import Autolinker from 'autolinker';

var MYLIBRARY = MYLIBRARY || (function(){
    var _args = {}; // private

    return {
        init : function(Args) {
            _args = Args;
            // some other initialising
        },
        helloWorld : function() {
            return _args[0];
        }
    };
}());

export {MYLIBRARY};

function dup() {
    let terminals = document.getElementsByClassName("terminals");
    let terminalContainer = document.getElementById("terminal");
    let buttonContainer = document.getElementById("button-container");

    let clone = document.createElement("textarea");
    clone.className = "terminals";
    terminalContainer.appendChild(clone);

    // Create WebSocket connection.
    let socket = new WebSocket('wss://liambeckman.com:8181');

    doTerminal(clone, socket);

    let removeTerminal = document.createElement("span");
    removeTerminal.id = "remove-terminal";
    removeTerminal.innerHTML = "-";
    buttonContainer.appendChild(removeTerminal);

    removeTerminal.onclick = function() {
        clone.remove();
        removeTerminal.remove();
        socket.close();
    }
}

function zigzagPort(message) {
    let terminals = document.getElementsByClassName("terminals");
    let original = terminals[0];
    let clone = terminals[1];

    if (message.includes("port number:")) {

        let port = message.split(" ");
        port = port[port.length - 1];

        terminals[1].innerHTML = terminals[1].innerHTML.replace(/.*$/ ,"> " + "zigzag-client " + parseInt(port));

    }
}

document.addEventListener('DOMContentLoaded', function () {

    let terminals = document.getElementsByClassName("terminals");

    let duplicateTerminal = document.getElementById("duplicate-terminal");
    if (duplicateTerminal) {
        duplicateTerminal.onclick = function() {
            if (terminals.length < 2) {
                dup();
            }
        }
    }

    let examples = document.getElementsByClassName("demo-examples");
    for (let i = 0; i < examples.length; i++) {
        let example = examples[i].innerHTML;
        examples[i].onclick = function() {
            terminals[0].innerHTML = terminals[0].innerHTML.replace(/.*$/ ,"> " + example);
            terminals[0].focus();
        }
    }


    // Create WebSocket connection.
    let socket = new WebSocket('wss://liambeckman.com:8181');
    //let socket = new WebSocket('ws://localhost:8181');

    console.log(terminals[0]);
    doTerminal(terminals[0], socket);

    const interval = setInterval(function ping() {
        if (socket.isAlive === false) {
            socket = new WebSocket('wss://liambeckman.com:8181');
            //socket = new WebSocket('ws://localhost:8181');
            doTerminal(terminals[0], socket);
        }

        else {
            socket.isAlive = false;
            socket.send("ping");
        }
    }, 3000);
});


// https://stackoverflow.com/questions/6249095/how-to-set-caretcursor-position-in-contenteditable-element-div
function setCaret(el) {
    var range = document.createRange();
    var sel = window.getSelection();
    console.log('el:', el.childNodes);
    console.log('el:', el.childNodes.length);
    range.setStart(el.lastChild, el.lastChild.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
}


function doTerminal(terminal, socket) {
    function heartbeat() {
        socket.isAlive = true;
    }

    terminal.spellcheck = false;
    console.log("Connecting to server...");

    let info = document.getElementById("info");
    info.innerHTML = "Status: Connecting...";
    info.style.backgroundColor = "#ff357a";

    // Connection opened
    socket.onopen = function (event) {
        console.log("Sending initial message to server.");
        info.innerHTML = "Status: Connected. Press ENTER to blast off!";
        info.style.backgroundColor = "#49ccd4";

        let userPrompt = MYLIBRARY.helloWorld();

        if (terminal.innerHTML == "") {
            terminal.innerHTML = "> " + userPrompt;
        }

        socket.isAlive = true;

        let message = "";
        let messages = [];
        let commands = [];
        let commNum = 0;
        let up = 0;
        let down = 0;
        let ctrl = false;

        // Listen for messages
        socket.onmessage = function(event) {
            message = event.data.toString();
            console.log("MESSAGE:", message);

            if (message == "pong") {
                heartbeat();
                return;
            }

            message.split('\n');

            if (message.includes('\r')) {
                console.log("SUCCESS");
                message = message.replace(/\r/g,"");
                terminal.innerHTML = terminal.innerHTML.replace(/.*$/ ,message);
            }

            else {
                message = Autolinker.link(message);
                terminal.innerHTML += message + '> ';
                setCaret(terminal);
            }


            messages = message.split("\n");
            terminal.scrollTop = terminal.scrollHeight;
            zigzagPort(message);
        }

        terminal.addEventListener("click",function(e){
            console.log("click");
        });

        // https://stackoverflow.com/questions/22092762/how-to-detect-ctrlc-and-ctrlv-key-pressing-using-regular-expression/22092839
        terminal.addEventListener("keydown",function(e){
            e = e || window.event;
            var key = e.which || e.keyCode; // keyCode detection
            var ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false); // ctrl detection

            if ( key == 76 && ctrl ) {
                console.log("Ctrl + L Pressed !");
                let lines = terminal.innerHTML.split("\n");
                terminal.innerHTML = lines[lines.length - 1];
                event.preventDefault();
                e.preventDefault();
                setCaret(terminal);
            }
            else if ( key == 67 && ctrl ) {
                console.log("Ctrl + C Pressed !");
                socket.send("SIGINT");
                terminal.innerHTML += "\n";
            }

            else if ( key == 90 && ctrl ) {
                console.log("Ctrl + Z Pressed !");
                socket.send("SIGTSTP");
                terminal.innerHTML += "\n";
            }

            else if ( key == 85 && ctrl ) {
                console.log("Ctrl + U Pressed !");
                e.preventDefault();
                terminal.innerHTML = terminal.innerHTML.replace(/.*$/ ,"&gt ");
                setCaret(terminal);
            }

        },false);

        terminal.onkeydown = function (event) {
            let key = event.keyCode;
            let lines = terminal.textContent.split("\n");

            console.log("key:", key);

            if (key == 8) {
                console.log(lines[lines.length - 1].length);
                if (lines[lines.length - 1].length <= 1) {
                    event.preventDefault();
                }
            }

            /*
            else if (key == 9) {
                event.preventDefault();
                terminal.innerHTML += "TAB detected";
                terminal.innerHTML += "\n> ";
                socket.send("TAB");
            }
            */

            else if (key == 38) {
                event.preventDefault();
                if ((up - down) < commands.length && down <= up) {
                    up += 1;
                    terminal.innerHTML = terminal.innerHTML.replace(/.*$/ ,"> " + commands[commands.length - up + down]);
                }
                console.log("commands:", commands);
            }

            else if (key == 40) {
                event.preventDefault();
                if (down < up && (up - down) <= commands.length) {
                    down += 1;
                    if (down == up) {
                        terminal.innerHTML = terminal.innerHTML.replace(/.*$/ ,"> ");
                    }
                    else {
                        terminal.innerHTML = terminal.innerHTML.replace(/.*$/ ,"> " + commands[commands.length - up + down]);
                    }
                }
            }

            else if (key == 13)
            {
                let comm = '';
                event.preventDefault();
                terminal.innerHTML += "\n";
                up = 0;
                down = 0;
                comm = lines[lines.length-1];
                console.log("you entered:", comm);

                if (messages.length > 0) {
                    comm = comm.substring(messages[messages.length - 1].length - 1);
                }

                comm = comm.substring(1);
                comm = comm.replace(/^[ ]*/g, "");

                if (comm == "clear") {
                    event.preventDefault();
                    terminal.innerHTML = "> ";
                    commands[commNum] = comm;
                    commNum += 1;
                }

                else if (comm == "") {
                    event.preventDefault();
                    terminal.innerHTML += "\n> ";
                }

                else {
                    socket.send(comm);
                    commands[commNum] = comm;
                    commNum += 1;

                    if (comm == "zigzag-server") {
                        let terminals = document.getElementsByClassName("terminals");
                        if (terminals.length < 2) {
                            dup();
                        }
                    }
                }

                terminal.scrollTop = terminal.scrollHeight;
            }
        }
    }
}
