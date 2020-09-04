export {config, mainDiv};
import * as buttonClass from './buttonClass.js';
import * as utils from './utils.js';

/**
 * This is the default configuration variable
 * @type {Object}
*/
let config = {
	position: "bottom-right",
	movable: true,
	debug: true,
	recordButtonColor: null,
	pauseButtonColor: null
};

/**
 * This variable is used to see if the button is dragged or clicked.
 * Default value: false;
 * @type {boolean}
*/
let isDragged = false;
/**
 * This variable is used to see if the menu is open or closed.
 * Default value: false;
 * @type {boolean}
*/
let isMenuOpen = false;

/**
 * Main div Object
 * @type {Object}
 */
let mainDiv;

/**
 * Record Button Object
 * @type {Button}
 */
let recordButton;
/**
 * Pause Button Object
 * @type {Button}
 */
let pauseButton;
/**
 * Download Button Object
 * @type {Button}
 */
let downButton;
/**
 * Check if pause Button has been created
 * Default value: false
 * @type {boolean}
 */
let isPauseButtonCreated = false;

/**
 * Rrweb events array.
 * Default value: [] (empty)
 * @type {array}
 */
let events = [];
/**
 * Contains audio parts of recording.
 * Each time a user set pause to the recording, a blob is written into this
 * array.
 * When the user stop the record, all audio are concatenated into one.
 * At the end of the recording, the array contains at least one element.
 * Default value: [] (empty)
 * @type {array}
 */
let audioParts = [];
/**
 * Rrweb recorder.
 * Allow us to stop it when needed
 * @type {Object}
 */
let isActive;
/**
 * interval to print logs
 * Default value: every 10 seconds
 * @type {function}
*/
let interval;

/**
 * Recorder Object
 * @type {Object}
 */
let recorder;
/**
 * Audio Stream.
 * Allow us to stop it when needed
 */
let recStream;
/**
 * encoding type is format encoding for sound.
 * Default value: "mp3";
 * @type {string}
 */
let encodingType = "mp3";

/**
 * Variable to check if all script used to record are loaded.
 * Default value: false
 * @type {boolean}
 */
let areRecordScriptsLoaded = false;

/**
 * A blob of all events, for downloading
 * @type {Blob}
 */
let eventBlob;
/**
 * A blob of mp3 recording, for downloading
 * @type {Blob}
 */
let soundBlob;
/**
 * The replay page text when downloading
 * @type {string}
 */
let textData;
/**
 * The js script in the replay page (for download)
 * @type {string}
 */
let jsData;
/**
 * The css data used in the replay page (for download)
 * @type {string}
 */
let cssData;

/**
 * Time of the record.
 * Used when the range bar is displayed
 * @type {string}
 */
let totalTime;
/**
 * Sliderbar range bar Object
 * @type {Object}
 */
let sliderBar;
/**
 * Range bar text indicator
 * @type {Object}
 */
let textTime;
/**
 * Replayer created during pause, to be able to recreate frames in real time
 * Default value: null
 * @type {Object}
 */
let pauseReplayer = null;
/**
 * Frame selected each time the user use the range bar
 * @type {integer}
 */
let arrayValue;
/**
 * Check if the user came back in the timeline of events.
 * Default value: false
 * @type {boolean}
 */
// let isUserComingBack = false;

let recorderState = null;

let encodingOver = false;

let gifLoadingButton;

/**
 * Load different JS library and callback when fully loaded
 * @param {string} src The path of the script (can be relative or absolute)
 * @param {Function} cb Callback, function to launch when loaded
*/

function loadJS(src, cb, ordered) {
	"use strict";
	var tmp;
	var ref = document.getElementsByTagName("script")[0];
	var script = document.createElement("script");

	if (typeof(cb) === 'boolean') {
		tmp = ordered;
		ordered = cb;
		cb = tmp;
	}

	script.src = src;
	script.async = !ordered;
	ref.parentNode.insertBefore(script, ref);

	if (cb && typeof(cb) === "function") {
		script.onload = cb;
	}
	return script;
}

function loadScripts() {
	// We make sure this is not a drag, but a click
	if (!isDragged) {
		// We include Rrweb
		loadJS("./lib/rrweb/dist/rrweb.min.js", function() {
			loadJS("./lib/web-audio-recorder/lib/WebAudioRecorder.js", function() {
			// Once script has been loaded, launch the rest of the code
				areRecordScriptsLoaded = true;
				launchRecord();
			});
		});
	}
}

/**
 * Compute the current time when the user is moving the range sliderBar
 */
function computeTextTime() {
	let decimalValue = (sliderBar.value + "").split(".")[1];
	isUserComingBack = true;
	let percentage = (sliderBar.value / events.length) * 100;

	utils.logger("Computed percentage is " + percentage);
	sliderBar.style.background = 'linear-gradient(to right, #82CFD0 0%, #82CFD0 ' + percentage + '%, #999999 ' + percentage + '%, #999999 100%)';
	utils.logger("onInput works, value is " + sliderBar.value);
	utils.logger("Extracted decimal is " + decimalValue);
	if (decimalValue == null) {
		arrayValue = sliderBar.value;
	}
	else if (decimalValue >= 5 && Math.ceil(sliderBar.value) <= events.length) {
		arrayValue = Math.ceil(sliderBar.value);
		utils.logger("Because value is >= 5, taking next frame, arrayValue is " + arrayValue);
	} else {
		arrayValue = Math.floor(sliderBar.value);
		utils.logger("Because value is < 5, taking previous frame, arrayValue is " + arrayValue);
	}
	textTime.innerHTML = computeTimeBetweenTwoFrames(events[arrayValue], events[0]) + " / " + totalTime;
	pauseReplayer.pause(events[arrayValue].timestamp - events[0].timestamp);
}

/**
 * Resume the record
 * This function is very similar to {@link launchRecord}, excepted we do not
 * need to check for permissions, they should be granted
 */
function resumeRecord(){
	if (!isDragged) {
		recorderState = "RECORDING";
		pauseButton.style.backgroundImage = "url('media/pause32.png')";
		document.getElementById('rrweb-pauseRecord').onclick = pauseRecord;

		if (isUserComingBack) {
			console.log("I split from 0 to " + arrayValue);
			events = events.slice(0, arrayValue);
		}

		document.getElementById('rrweb-sliderDiv').style.visibility = "hidden";

		recorder.startRecording();

		isActive = rrweb.record({
				emit(event) {
				// push event into the events array
				events.push(event);
			},
		});
		interval = setInterval(function () {utils.logger(events);}, 1000);
	}
}

/**
 * When the record is in pause make appear the range bar
 */
function pauseRecord() {
	let sliderDiv;

	if (!isDragged) {
		recorderState = "PAUSED";
		if (isActive)
			isActive();
		clearInterval(interval);

		pauseButton.style.backgroundImage = "url('media/resume32.png')";
		document.getElementById('rrweb-pauseRecord').onclick = resumeRecord;

		console.log("I set in pause");
		if (events.length > 2) {
			totalTime = computeTimeBetweenTwoFrames(events[events.length - 1], events[0]);
			if (!pauseReplayer) {
				sliderDiv = createBaseDiv("rrweb-sliderDiv");
				textTime = document.createElement("p");
				sliderBar = document.createElement("input");
				sliderBar.id = "rrweb-sliderBar";
				sliderBar.type = "range";
				sliderBar.min = "0";
				sliderBar.step = "0.1";
				pauseReplayer = new rrweb.Replayer(events, {root: document.body});
				pauseReplayer.enableInteract();
				sliderBar.oninput = computeTextTime;
				sliderDiv.appendChild(textTime);
				sliderDiv.appendChild(sliderBar);
			} else {
				document.getElementById('rrweb-sliderDiv').style.visibility = "visible";
			}

			// We stop audioRecorder
			recorder.finishRecording();

			textTime.innerHTML = totalTime + " / " + totalTime;
			sliderBar.max = events.length;
			sliderBar.value = events.length;
			sliderBar.style.background = 'linear-gradient(to right, #82CFD0 0%, #82CFD0 100%, #999999 100%, #999999 100%)';
			pauseReplayer.pause(events[events.length - 1].timestamp, events[0].timestamp);
		}
	}
}

/**
 * Launch the audio and screen record
 */
function launchRecord() {
	if (!isDragged) {
		recorderState = "RECORDING";
		console.log("Recording has started! ");
		navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
			utils.logger("getUserMedia() success, stream created, initializing WebAudioRecorder...");
			let audioContext = new AudioContext();
			//update the format
			utils.logger("Format: 2 channel " + encodingType + " @ " + audioContext.sampleRate / 1000 + "kHz");
			//assign to recStream for later use
			recStream = stream;

			/* use the stream */
			let input = audioContext.createMediaStreamSource(stream);

			if (areRecordScriptsLoaded) {
				recorder = new WebAudioRecorder(input, {
					workerDir: "./lib/web-audio-recorder/lib/",
					encoding: encodingType,
					numChannel: 2,
					onEncoderLoading: function(recorder, encodingType) {
						utils.logger("Loading " + encodingType + " encoder...");
					},
					onEncoderLoaded: function(recorder, encodingType) {
						utils.logger(encodingType + " encoder loaded");
					}
				});

				recorder.onComplete = function(recorder, blob) {
					utils.logger("Encoding complete");
					utils.logger(URL.createObjectURL(blob));
					audioParts.push(blob);
                    // If the recorder has been fully stopped, print the downloadButton
					if (recorderState == "STOPPED"){
						encodingOver = true;
						gifLoadingButton.hide();
						displayDownButton();
					}
				}

				recorder.setOptions({
					timeLimit:120,
					encodeAfterRecord: true,
					ogg: {quality: 0.5},
					mp3: {bitRate: 160}
				});

				recorder.startRecording();

				isActive = rrweb.record({
					emit(event) {
						// push event into the events array
						events.push(event);
					},
				});
				interval = setInterval(function () {utils.logger(events);}, 1000);

				// Update the style of record button and the onclick function.
				recordButton.style.backgroundColor = "white";
				recordButton.style.backgroundImage = "url('media/recording32.png')";
				recordButton.style.border = "1px solid black";
				document.getElementById('rrweb-recordButton').onclick = stopRecord;

				//Opening the menu to create
				openMenu();
			}
		});
	}
}

/**
 * This function stop the record of the screen and audio.
 */
function stopRecord() {
	// Restore the style and onclick of recordButton
	if (!isDragged) {
		recorderState = "STOPPED";
		recordButton.style.backgroundColor = "#d92027";
		recordButton.style.backgroundImage = "url('media/camera32.png')";
		recordButton.style.border = "none";
		document.getElementById('rrweb-recordButton').onclick = launchRecord;

		console.log("The recording has been stopped");
		// We stop Rrweb
		if (isActive)
			isActive();
		clearInterval(interval);

		//We close the menu
		openMenu();

		// We stop audioRecorder
		recorder.finishRecording();
		recStream.getAudioTracks()[0].stop();

		// Set the event as Blob
		eventBlob = new Blob([JSON.stringify(events)], {type: "application/json"});

		if (encodingOver == false) {
			//Display GIF loading
			gifLoadingButton = new buttonClass.Button(mainDiv, null, "rrweb-loadingDown", "Your download is almost ready !", 'media/loading32.gif', recordButton);
			gifLoadingButton.createChildButton();
			gifLoadingButton.setClickable(false);
			gifLoadingButton.show();
		}
	}
}

function displayDownButton() {
	//avoid concatenating if there is only one element
	if (audioParts.length > 1) {
		utils.logger("Loading ConcatenateBlobs");
		// We concatenate all audio parts.
		loadJS("./lib/concatenate-blob/ConcatenateBlobs.js", function () {
			ConcatenateBlobs(audioParts, 'audio/mpeg3', function(resultingBlob) {
				soundBlob = resultingBlob;
			});
				if (events.length > 2) {
				utils.changeMainDivSize(80, 0);
				utils.logger("I can download the page");
				downButton = new buttonClass.Button(mainDiv, downRecord, "rrweb-downRecord", "Download your record", 'media/down32.png', recordButton);
				downButton.createChildButton();
				downButton.show();
			}
		});
	}
	else {
		utils.logger("No need to load ConcatenateBlobs");
		soundBlob = audioParts[0];
		if (events.length > 2) {
			utils.changeMainDivSize(80, 0);
			utils.logger("I can download the page");
			downButton = new buttonClass.Button(mainDiv, downRecord, "rrweb-downRecord", "Download your record", 'media/down32.png', recordButton);
			downButton.createChildButton();
			downButton.show();
		}
	}
}

/**
 * Increase size of the mainDiv and make visible pause Button
 */
function openMenu() {
	if (isDragged == false) {
		if (!isMenuOpen) {
			utils.changeMainDivSize(80, 0);
			if (!isPauseButtonCreated) {
				pauseButton = new buttonClass.Button(mainDiv, pauseRecord, "rrweb-pauseRecord", "Pause the record", 'media/pause32.png', recordButton);
				isPauseButtonCreated = true;
				pauseButton.createChildButton();
			} else { pauseButton.show(); }
			isMenuOpen = true;
		} else {
			pauseButton.hide();
			utils.changeMainDivSize(-80, 0);
			isMenuOpen = false;
		}
	}
}

/**
 * Download the record automatically
 * @param {Object} data raw data of the zip file
 * @param {string} filename The name we want to give to the downloaded filename
 */
function saveAs(data, filename)
{
	// Create invisible link
	const a = document.createElement("a");
	a.style.display = "none";
	document.body.appendChild(a);

	// Set the HREF to a Blob representation of the data to be downloaded
	a.href = window.URL.createObjectURL(
		new Blob([data], { type: "application/zip" })
	);

	// Use download attribute to set set desired file name
	a.setAttribute("download", filename);

	// Trigger the download by simulating click
	a.click();

	// Cleanup
	window.URL.revokeObjectURL(a.href);
	document.body.removeChild(a);
}

/** This function read a server-local text file
 *  (does not work in localhost due to CORS request not being HTTPS)
 */
function readTextFile(file)
{
	var rawFile = new XMLHttpRequest();
	var isFileValid = false;
	rawFile.open("GET", file, false);
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4) {
			if(rawFile.status === 200 || rawFile.status == 0) {
				isFileValid = true;
			}
		}
	}
	rawFile.send(null);
	if (isFileValid)
		return rawFile.responseText;
	else
		return "error";
}

function addslashes(str) {
    return str.replace(/\\/g, '\\\\').
        replace(/\u0008/g, '\\b').
        replace(/\t/g, '\\t').
        replace(/\n/g, '\\n').
        replace(/\f/g, '\\f').
        replace(/\r/g, '\\r').
        replace(/'/g, '\\\'').
        replace(/"/g, '\\"').
        replace(/\//g, '\\/');
}

/**
 * This function launch the download of the record
 */
function downRecord() {
	//Load Jszip (minified Because it load faster)
	loadJS("./lib/jszip/dist/jszip.js", function() {
		let zip = new JSZip();

		textData = readTextFile("./download/download.html");
        let textDataEnd = readTextFile("./download/download_end.html");
		jsData = readTextFile("./lib/rrweb/dist/rrweb.min.js");
		cssData = readTextFile("./lib/rrweb/dist/rrweb.min.css");
		
        // We add thoses files to the zip archive

        console.log(addslashes(JSON.stringify(events)));
		let addEventsToFile = "let events_string = \"" + addslashes(JSON.stringify(events)) + '";';

		textData += addEventsToFile + textDataEnd;
		utils.logger("Je mets les fichiers dans l'archive");
		zip.file("download.html", textData);
		zip.file("js/rrweb.min.js", jsData);
		zip.file("js/rrweb.min.css", cssData);
		zip.file("data/events.json", eventBlob);
		zip.file("data/sound.mp3", soundBlob);

		// Once archive has been generated, we can download it
		zip.generateAsync({type:"blob"})
		.then(function(content) {
			saveAs(content, "cours.zip");
		});
	});
}

function buttonPosition(button) {
	if (config.position.search("bottom") > -1)
		button.style.bottom = "50";
	if (config.position.search("top") > -1)
		button.style.top = "50";
	if (config.position.search("middle") > -1)
		button.style.top = "50";
	if (config.position.search("-right") > -1)
		button.style.right = "50";
	if (config.position.search("-left") > -1)
		button.style.left = "50";
}

function finishDragging() {
	isDragged = false;
}

/**
 * The goal of this function is to make an element movable with mouse
 * @param {string} element The element id
 */
function makeElementMovable(element) {
	//Make the button element draggable:
	dragElement(element);

	function dragElement(elmnt) {
        utils.logger("Make element draggable");
		var pos1 = 0, pos2 = 0, mouseX = 0, mouseY = 0;
		let isClick = true;
		if (document.getElementById(elmnt.id + "header")) {
			/* if present, the header is where you move the element from:*/
			document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
		} else {
			elmnt.onmousedown = dragMouseDown;
		}

		/**
		 * Change the behaviour when the mouse is down
		 * @parent {event} The event when triggered
		 */
		function dragMouseDown(e) {
			isDragged = true;
			e = e || window.event;
			e.preventDefault();
			// get the mouse cursor position at startup:
			mouseX = e.clientX;
			mouseY = e.clientY;
			document.onmouseup = closeDragElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementDrag;
		}

		/**
		 * Compute the new element position and put it at the right place
		 * @parent {event} The event when triggered
		 */
		function elementDrag(e) {
			// If this function is called, then this it not a "click"
			isClick = false;
			e = e || window.event;
			e.preventDefault();
			// calculate the new cursor position:
			pos1 = mouseX - e.clientX;
			pos2 = mouseY - e.clientY;
			mouseX = e.clientX;
			mouseY = e.clientY;
			// set the element's new position, only if not going out of the window:
			if (elmnt.offsetLeft - pos1 >= 0 && (elmnt.offsetLeft + 70) - pos1 < window.screen.width
				&& elmnt.offsetTop - pos2 >= 0 && (elmnt.offsetTop + 70) - pos2 < window.screen.height)
			{
				elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
				elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
			}
		}

		/**
		 * End the drag
		 * @parent {event} The event when triggered
		 */
		function closeDragElement() {
			/* stop moving when mouse button is released:*/
			document.onmouseup = null;
			document.onmousemove = null;
			// we add a "delay" to prevent misclick while dragging
			// ONLY if elementDrag is not called (Because the mouse is not moving)
			isClick ? finishDragging() : setTimeout(finishDragging, 300);
			isClick = true;
		}
	}
}

/**
 * Create base div containing recorder, pause, resume, stop and downloader
 * buttons.
 * @param {string} mainDivId Specify the div id
 * @return {Object} Return the object of the div, allowing to be modifiable
 */
function createBaseDiv(mainDivId) {
	var mainDiv = document.createElement("div");
	mainDiv.classList.add("rr-block");
	mainDiv.id = mainDivId;
	document.body.appendChild(mainDiv);
	return mainDiv;
}

/**
 * Load CSS file from path given
 * @param {string} path The path for the css file to load
 */
function loadCss(path) {
	var head = document.getElementsByTagName('head')[0];
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = path;
	link.media = 'all';
	head.appendChild(link);
    utils.logger("Loaded Css !");
}

/**
 * When the page has finished Loading
 * @function window.onload
 */
window.onload = function() {
    utils.logger("Page has finished Loading, launching generic-rrweb-recorder");
	// We create a mainDiv in which wi will display all menu element as block
	mainDiv = createBaseDiv("rrweb-mainDivButton");

	// We load CSS
	loadCss("media/style.css");

	// We define a button that will launch recording
	recordButton = new buttonClass.Button(mainDiv, loadScripts, "rrweb-recordButton", "Start recording! ", 'media/camera32.png', null);
	recordButton.createMenuButton();

	buttonPosition(mainDiv);

    utils.logger("Main Button has been created");
    
	if (config.movable)
		makeElementMovable(mainDiv);
}
