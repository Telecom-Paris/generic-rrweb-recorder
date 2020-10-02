let audioBlob;
let customElemCounter = 0;

let cursorCanvas = document.getElementById('postEditBar');
let cursorCanvasData = {
    ctx:  cursorCanvas.getContext('2d'),
    size: cursorCanvas.getBoundingClientRect(),
    clear: function() {
        this.ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    }
};

const eventCanvas = document.getElementById('eventBar');
let eventCanvasData = {
    ctx:  eventCanvas.getContext('2d'),
    size: eventCanvas.getBoundingClientRect(),
    clear: function() {
        this.ctx.clearRect(0, 0, eventCanvas.width, eventCanvas.height);
    }
};

let cursorIcon = new Image();
cursorIcon.src = "../media/postEdit/postEditBar.png";
let cursorIconData = {
    size: { width: 5 }
}

let deleteIcon = new Image();
deleteIcon.src = "../media/postEdit/delete.png";

let isClick = false;
let isMouseDown = false;

let startPosition = 0;
let endPosition = 0;

let isShiftPressed = false;

let playButtonStatus = "PAUSED";

let sliderbarValue = 0;

let replayDivSize;

let wavesurfer;

let svgButton = {
    play: "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M8 5v14l11-7z\"/></svg>",
    pause: "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M6 19h4V5H6v14zm8-14v14h4V5h-4z\"/></svg>",
    noSound: "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z\"/></svg>",
    smallSound: "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M7 9v6h4l5 5V4l-5 5H7z\"/></svg>",
    mediumSound: "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z\"/></svg>",
    largeSound: "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z\"/></svg>"
};

async function launchRrweb(manualLoad) {
    // Loading data
    if (manualLoad == false) {
        events = JSON.parse(localStorage.getItem('rrweb-events'));
        audioDom = new Audio(localStorage.getItem('rrweb-audio'));
        
    }
    audioBlob = await fetch(localStorage.getItem('rrweb-audio')).then(r => r.blob());

    console.log(events);
     
    //Empty replayerDiv in case of manual loading
    document.getElementById('replayDiv').innerHTML = "";

    if (events && audioDom.src) {
        // Resize the content with the screensize
        let screenDimension = {width: window.screen.width - 300, height: window.screen.height - 300};
        let replayDimension = {width: events[0].data.width, height: events[0].data.height};

        let scale = Math.min( 
            screenDimension.width / replayDimension.width, screenDimension.height / replayDimension.height);
        
        replayDivSize = document.getElementById('replayDiv').offsetWidth;

        document.getElementById('eventBar').width = replayDivSize;
        document.getElementById('postEditBar').width = replayDivSize;
        document.getElementById('waveform').style.width = replayDivSize + "px";
        document.getElementById('wave-timeline').style.width = replayDivSize + "px";
        //document.getElementById("postEditionWrapper").style.transform = "scale(" + scale + ")";
        
        // Loading libraries
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            height: 100,
            plugins: [
                WaveSurfer.timeline.create({
                    container: "#wave-timeline",
                    fillParent: true
                })
            ]
        });
        
        cutterLib = new mp3cutter("../lib/web-audio-recorder/lib/");

		// Creating new replayer Object
		replay = new rrweb.Replayer(events, {root: document.getElementById('replayDiv')});

		// Enable interaction with user
        replay.enableInteract();

        // Load audio blob, for audio wave 
        wavesurfer.loadBlob(audioBlob);

        // Draw cursor icon a start of canvas
        cursorIcon.onload = function(){
            cursorCanvasData.ctx.drawImage(this, 0,0, cursorIconData.size.width, 100);
        }

        // Draw event point on canvas considering their timestamps
        let i;
        eventCanvasData.ctx.fillStyle = "#3399ff";
        for (let k = 0; k < events.length; k++){
            i = replayDivSize / replay.getMetaData().totalTime * (events[k].timestamp - events[0].timestamp);
            eventCanvasData.ctx.arc(i, 50, 5, 0, 2 * Math.PI);
            eventCanvasData.ctx.fill();
        }

        // Listen for events
        setListeners();
    }
}

function launchRrwebWhenCustomLoad(){
    customElemCounter++;

    if (customElemCounter == 2)
        launchRrweb(true);
}

function loadEventsFromUser() {
    var inputEvents, inputSound, fileSound, fileEvents;
    let soundFr, eventFr; 

    if (typeof window.FileReader !== 'function') {
        alert("The file API isn't supported on this browser yet.");
        return;
    }

    inputEvents = document.getElementById('event-selector');
    inputSound = document.getElementById('sound-selector');

    if (!inputEvents.files || !inputSound.files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
    } else if (!inputEvents.files[0] || !inputSound.files[0]) {
        alert("Please select files before clicking 'Load'");
    } else {
        fileSound = inputSound.files[0];
        fileEvents = inputEvents.files[0];
        eventFr = new FileReader();
                    
        eventFr.readAsText(fileEvents);
        eventFr.onload = function() {
            console.log("Finished loading events");
            events = JSON.parse(eventFr.result);
            console.log(events);
            launchRrwebWhenCustomLoad();
        };

        soundFr = new FileReader();
        soundFr.readAsDataURL(fileSound);
        soundFr.onload = function() {
            console.log("Finished loading sound");
            audioDom = new Audio(soundFr.result);
            console.log(audioDom);
            launchRrwebWhenCustomLoad();
        };                   
    }
}



function drawCursor(xAxe) {
    console.log("Compute is: " + (xAxe - cursorCanvasData.size.left - cursorIconData.size.width) + "(" + xAxe + " "+ cursorCanvasData.size.left + " " + cursorIconData.size.width +")");
    cursorCanvasData.ctx.drawImage(cursorIcon, xAxe - cursorCanvasData.size.left - cursorIconData.size.width,
        0, cursorIconData.size.width, 100);
    //cursorCanvasData.ctx.drawImage(cursorIcon, xAxe,
    //  0, cursorIconData.size.width, 100);
}

function setReplayerPos(cursorPos) {
    console.log("Set replayer pos! ");
}

cursorCanvas.addEventListener('mousemove', function(event) {
    if (isMouseDown && isShiftPressed) {
        console.log("IsMouseDown is true");
        cursorCanvasData.clear();

          // draw rectangle
        cursorCanvasData.ctx.globalAlpha = 0.3; // set global alpha (transparency)
        cursorCanvasData.ctx.beginPath();
          
        cursorCanvasData.ctx.rect(startPosition, 0, event.clientX - cursorCanvasData.size.left - startPosition, 100);
        endPosition = event.clientX - cursorCanvasData.size.left - startPosition;
        cursorCanvasData.ctx.fillStyle = "#3399ff";
        cursorCanvasData.ctx.fill();
    }
    else if (isMouseDown) {
        startPosition = event.clientX - cursorCanvasData.size.left;

        //Recompute cursor place
        cursorCanvasData.clear();
        drawCursor(event.clientX);
        setReplayerPos(event.clientX);
    }
}, false);

    
function clickPlayButton() {
    if (playButtonStatus == "PAUSED") {
        playButtonStatus = "PLAYING";
                    
        console.log("The replayer has started");
                    
        // display pause Button
        document.getElementById('playButton').innerHTML = svgButton.pause;
                    
        let totalTimeInSec = replay.getMetaData().totalTime;

        console.log(events.length + " / " + totalTimeInSec);
        let eventsPerSecond = (100 * replayDivSize) / totalTimeInSec;
                    
        console.log("TotalTimeInSec = " + totalTimeInSec);
        console.log(eventsPerSecond);

        interval = setInterval(function() {
                sliderbarValue += Math.ceil(eventsPerSecond);
                cursorCanvasData.clear();
                drawCursor(sliderbarValue);
                //console.log("value is now " + document.getElementById('sliderBar').value + " / " + document.getElementById('sliderBar').max);
                //document.getElementById('textTimer').innerHTML = convertTextTimer(replay.getCurrentTime()) + " / " + totalTime;
        }, 100);
                    
        replay.play();
        //replay.play(currentTime);
        audioDom.play();
    } else if (playButtonStatus == "PLAYING") {
        playButtonStatus = "PAUSED";
                    
        console.log("The replay has paused");
                    
        currentTime = replay.getCurrentTime();
                    
        // display play button
        document.getElementById('playButton').innerHTML = svgButton.play;
                    
        clearInterval(interval);
                    
        replay.pause();
        audioDom.pause();
                    
        console.log("Replay time is " + replay.getCurrentTime() / 1000);
		audioDom.currentTime = replay.getCurrentTime() / 1000;
    }
}
function setListeners() {
    document.onkeypress = function(event) {
        console.log("ON KEY PRESS " + event.keyCode);
        switch (event.keyCode) {
            case 100: // 'd' key
                console.log("D key has been pressed");
                console.log(startPosition + "/" + endPosition);

                if (startPosition > -1 && endPosition > 0) {
                    //Recompute cursor place
                    cursorCanvasData.clear();
                    drawCursor(event.clientX);
                    eventCanvasData.ctx.drawImage(deleteIcon, startPosition, 0, endPosition, 100);
                }
                break;
        }
    };

    document.onkeydown = function(event) {
        console.log(event.keyCode);
        switch (event.keyCode) {
            case 16: // Shift key, used for selection
                isShiftPressed = true;
                console.log('SHIFT key pressed');
                break;
        }
    };

    document.onkeyup = function(event) {
        switch (event.keyCode) {
            case 16:
                isShiftPressed = false;
                console.log('SHIFT key released');
                break;
        }
    };

    //let eventPerPixels = events.length / cursorCanvas.width;

    cursorCanvas.addEventListener('mousedown', function(event) {
        isMouseDown = true;
        startPosition = event.clientX - cursorCanvasData.size.left;
        // Recompute cursor place
        cursorCanvasData.clear();

        drawCursor(event.clientX);

        // Compute event position based on cursor position
        console.log("cursorCanvas width is " +  cursorCanvas.width);
        //console.log("Event per pixels is " +  eventPerPixels);
        //replay.pause(events[arrayIndex].timestamp - events[0].timestamp);
    }, false);

    cursorCanvas.addEventListener('mouseup', function(event) {
        isMouseDown = false;
        cursorCanvasData.ctx.globalAlpha = 1.0;

        //drawCursor(event.clientX);
    }, false);

    document.querySelector('#slider').oninput = function () {
        wavesurfer.zoom(Number(this.value));
        console.log("Zoom on the timebar");
    };
}

function updateStatusSoundIcon(rangeBarValue) {
    let soundIcon = document.getElementById('soundBarIcon');
                                
    if (rangeBarValue == 0) {
        // sound off icon
        soundIcon.innerHTML = svgButton.noSound;
    } else if (rangeBarValue >= 1 && rangeBarValue <= 3) {
        // Sound icon with 0 volume bar
        soundIcon.innerHTML = svgButton.smallSound;
    } else if (rangeBarValue >= 4 && rangeBarValue <= 7) {
        // Sound icon with 1 sound bar
        soundIcon.innerHTML = svgButton.mediumSound;
    } else if (rangeBarValue > 8) {
        // Sound icon with 2 sound bar
        soundIcon.innerHTML = svgButton.largeSound;
    }
    audioDom.volume = rangeBarValue / 10;
}