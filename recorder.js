/**
 * This is the default configuration variable
 * @type {Object}
*/
let config = {
	position: "bottom-right",
	movable: true,
	debug: false,
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
let mainDivWidth = 70;
let mainDivHeight = 70;

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
 * @type {interger}
 */
let arrayValue;

/**
 * Load different JS library and callback when fully loaded
 * @param {string} src The path of the script (can be relative or absolute)
 * @param {Function} cb Callback, function to launch when loaded
*/
(function(w){
	var loadJS = function(src, cb, ordered){
		"use strict";
		var tmp;
		var ref = w.document.getElementsByTagName("script")[0];
		var script = w.document.createElement("script");

		if (typeof(cb) === 'boolean') {
			tmp = ordered;
			ordered = cb;
			cb = tmp;
		}

		script.src = src;
		script.async = !ordered;
		ref.parentNode.insertBefore( script, ref );

		if (cb && typeof(cb) === "function") {
			script.onload = cb;
		}
		return script;
	};
	// commonjs
	if( typeof module !== "undefined"){
		module.exports = loadJS;
	}
	else {
		w.loadJS = loadJS;
	}
}(typeof global !== "undefined" ? global : this));

function loadScripts() {
	// We make sure this is not a drag, but a click
	if (!isDragged) {
		// We include Rrweb
		loadJS("./scripts/rrweb/dist/rrweb.min.js", function() {
			loadJS("./scripts/recorder/lib/WebAudioRecorder.js", function() {
			// Once script has been loaded, launch the rest of the code
				areRecordScriptsLoaded = true;
				launchRecord();
			});
		});
	}
}

/**
 * Turn milliseconds to minutes and seconds in the following format:
 * '00:00'
 * @param {integer} millis number of millis to convert
 */
function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

/**
 * Compute time in minute and second between two rrweb events.
 * Compute doing firstFrame - secondFrame
 * @param {rrweb-event} firstFrame The first frame
 * @param {rrweb-event} secondFrame The second frame
 * @returns {string} String in the format "00:00"
 */
function computeTimeBetweenTwoFrames(firstFrame, secondFrame) {
	logger("Recording time is event[last] - event[0] = " + (firstFrame.timestamp - secondFrame.timestamp));
	logger("Aka " + millisToMinutesAndSeconds(firstFrame.timestamp - secondFrame.timestamp) + " mn and secs");
	return millisToMinutesAndSeconds(firstFrame.timestamp - secondFrame.timestamp);
}

function logger(stringLog){
	if (config.debug) {
		console.log(stringLog);
	}
}

/**
 * Compute the current time when the user is moving the range sliderBar
 */
function computeTextTime() {
	decimalValue = (sliderBar.value + "").split(".")[1];
	logger("onInput works, value is " + sliderBar.value);
	logger("Extracted decimal is " + decimalValue);
	if (decimalValue == null) {
		arrayValue = sliderBar.value;
	}
	else if (decimalValue >= 5 && Math.ceil(sliderBar.value) <= events.length) {
		arrayValue = Math.ceil(sliderBar.value);
		logger("Because value is >= 5, taking next frame, arrayValue is " + arrayValue);
	} else {
		arrayValue = Math.floor(sliderBar.value);
		logger("Because value is < 5, taking previous frame, arrayValue is " + arrayValue);
	}
	textTime.innerHTML = computeTimeBetweenTwoFrames(events[arrayValue], events[0]) + " / " + totalTime;
	pauseReplayer.pause(events[arrayValue].timestamp - events[0].timestamp);
}

/**
 * Resume the record
 * This function is very similar to {@link launchRecord}, excepted we do not
 * need to check for permissions, they should be granted
 */
function resumeRecord()
{
	if (!isDragged) {

		document.getElementById('pauseRecord').style.backgroundImage = "url('media/pause32.png')";
		document.getElementById('pauseRecord').onclick = pauseRecord;

		//if (isUserComingBack) {
		//	console.log("I split from 0 to " + arrayValue);
		//	events = events.slice(0, arrayValue);
		//}

		document.getElementById('sliderDiv').style.visibility = "hidden";

		isActive = rrweb.record({
				emit(event) {
				// push event into the events array
				events.push(event);
			},
		});
		interval = setInterval(function () {logger(events);}, 1000);
	}
}

/**
 * When the record is in pause make appear the range bar
 */
function pauseRecord() {
	let sliderDiv;

	if (isActive)
		isActive();
	clearInterval(interval);

	document.getElementById('pauseRecord').style.backgroundImage = "url('media/resume32.png')";
	document.getElementById('pauseRecord').onclick = resumeRecord;

	console.log("I set in pause");
	if (events.length > 2) {
		totalTime = computeTimeBetweenTwoFrames(events[events.length - 1], events[0]);
		//changeMainDivSize(0, 20);
		if (!pauseReplayer) {
		sliderDiv = createBaseDiv("sliderDiv");
		textTime = document.createElement("p");
		sliderBar = document.createElement("input");
		sliderBar.id = "sliderBar";
		sliderBar.type = "range";
		sliderBar.min = "0";
		sliderBar.step = "0.1";
		pauseReplayer = new rrweb.Replayer(events, {root: document.body});
		sliderBar.oninput = computeTextTime;
		sliderDiv.appendChild(textTime);
		sliderDiv.appendChild(sliderBar);
		} else {
			document.getElementById('sliderDiv').style.visibility = "visible";
		}
		textTime.innerHTML = "00:00 / " + totalTime;
		sliderBar.max = events.length;
		sliderBar.value = events.length;
		pauseReplayer.pause(events[events.length - 1].timestamp, events[0].timestamp);
	}
}

/**
 * Launch the audio and screen record
 */
function launchRecord() {
	if (!isDragged) {
		console.log("Recording has started! ");

		navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
			logger("getUserMedia() success, stream created, initializing WebAudioRecorder...");

			let audioContext = new AudioContext();

			//update the format
			logger("Format: 2 channel mp3 @ " + audioContext.sampleRate / 1000 + "kHz");

			//assign to recStream for later use
			recStream = stream;

			/* use the stream */
			let input = audioContext.createMediaStreamSource(stream);

			if (areRecordScriptsLoaded) {
				recorder = new WebAudioRecorder(input, {
					workerDir: "./scripts/recorder/lib/",
					encoding: encodingType,
					numChannel: 2,
					onEncoderLoading: function(recorder, encodingType) {
						logger("Loading " + encodingType + " encoder...");
					},
					onEncoderLoaded: function(recorder, encodingType) {
						logger(encodingType + " encoder loaded");
					}
				});

				recorder.onComplete = function(recorder, blob) {
					logger("Encoding complete");
					soundBlob = blob;
					console.log(soundBlob);
					logger(URL.createObjectURL(blob));
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
				interval = setInterval(function () {logger(events);}, 1000);

				// Update the style of record button and the onclick function.
				document.getElementById('recordButton').style.backgroundColor = "white";
				document.getElementById('recordButton').style.backgroundImage = "url('media/recording32.png')";
				document.getElementById('recordButton').style.border = "1px solid black";
				document.getElementById('recordButton').onclick = stopRecord;

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
		document.getElementById('recordButton').style.backgroundColor = "#d92027";
		document.getElementById('recordButton').style.backgroundImage = "url('media/camera32.png')";
		document.getElementById('recordButton').style.border = "none";
		document.getElementById('recordButton').onclick = launchRecord;

		console.log("The recording has been stopped");
		// We stop Rrweb
		if (isActive)
			isActive();
		clearInterval(interval);

		//We close the menu
		openMenu();

		// We stop audioRecorder
		recStream.getAudioTracks()[0].stop();
		recorder.finishRecording();

		// Set the event as Blob
		eventBlob = new Blob([JSON.stringify(events)], {type: "application/json"});

		if (events.length > 2) {
			changeMainDivSize(80, 0);
			logger("I can download the page");
			downButton = new Button(mainDiv, downRecord, "downRecord", "Download your record", 'media/down32.png', recordButton);
			downButton.createChildButton();
			downButton.show();
		}
	}
}

/**
 * Change the size of the mainDiv
 * @param {integer} newWidthInPx The will that will be added to the current width
 * @param {integer} newHeightInPx The new height that will be added to the current height
 */
function changeMainDivSize(newWidthInPx, newHeightInPx) {
	mainDivWidth += newWidthInPx;
	mainDivHeight += newHeightInPx;
	mainDiv.style.width = mainDivWidth + "px";
	mainDiv.style.height = mainDivHeight + "px";
}

/**
 * Increase size of the mainDiv and make visible pause Button
 */
function openMenu() {
	if (isDragged == false) {
		if (!isMenuOpen) {
			changeMainDivSize(80, 0);
			if (!isPauseButtonCreated) {
				pauseButton = new Button(mainDiv, pauseRecord, "pauseRecord", "Pause the record", 'media/pause32.png', recordButton);
				isPauseButtonCreated = true;
				pauseButton.createChildButton();
			} else { pauseButton.show(); }
			isMenuOpen = true;
		} else {
			pauseButton.hide();
			changeMainDivSize(-80, 0);
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


/**
 * This function launch the download of the record
 */
function downRecord() {
	//Load Jszip (minified Because it load faster)
	loadJS("./scripts/jszip/dist/jszip.js", function() {
		let zip = new JSZip();

		textData = readTextFile("./download/download.html");
		jsData = readTextFile("./download/js/index.js");
		cssData = readTextFile("./download/js/style.css");
		// We add thoses files to the zip archive

		//let addEventsToFile = "events JSON.parse(" + JSON.stringify(events) + "</script>"

		//textData += addEventsToFile + "</body></html>";
		logger("Je mets les fichiers dans l'archive");
		zip.file("download.html", textData);
		zip.file("js/index.js", jsData);
		zip.file("js/style.css", cssData);
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
		button.style.top = "50%";
	if (config.position.search("-right") > -1)
		button.style.right = "50";
	if (config.position.search("-left") > -1)
		button.style.left = "50";
}

/**
 * Create a new Button
 * @class
 *
 * @param {Object} parentElem The parent Node. The button will be append to this
 * node
 *
 * @param {Function} func On click on the button, this function will be
 * triggered
 *
 * @param {string} id The id of the button
 *
 * @param {string} text The name of the button (displayed when the mouse is over
 * the button)
 *
 * @param {string} icon The path of the image displayed in the button
 *
 * @param {Button} rightOf The button will be dispplayed to right of this
 * element
 */
class Button {
	button;
	width;

	constructor(parentElem, func, id, text, icon, rightOf) {
		this.parentElem = parentElem;
		this.func = func;
		this.id = id;
		this.text = text;
		this.icon = "url(" + icon + ")";
		this.width = rightOf != null ? rightOf.getWidth() + 80 : 0;
	}

	/**
	 * Return width of the button
	 */
	getWidth() { return this.width; }

	/**
	 * Set the button to visible
	 */
	show() { this.button.style.visibility = "visible"; }

	/**
	 * Hide the button
	 */
	hide() { this.button.style.visibility = "hidden"; }

	/**
	 * Set all element for a basic button
	 */
	createBasicButton() {
		this.button = document.createElement("input");
		this.button.type = "button";
		this.button.onclick = this.func;
		this.button.id = this.id;
		this.button.style.backgroundImage = this.icon;
		this.button.classList.add("rr-block");
		this.button.title = this.text;
	}

	/**
	 * Create main Button (recording button).
	 * Call {@link Button#createBasicButton createBasicButton}.
	 */
	createMenuButton() {
		this.createBasicButton();
		this.button.classList.add("Buttons");
		if (config.recordButtonColor)
			this.button.style.backgroundColor = config.recordButtonColor;
		this.parentElem.appendChild(this.button);
	}

	/**
	 * Create others button that are not mainButton.
	 * Call {@link Button#createBasicButton createBasicButton}.
	 */
	createChildButton() {
		this.createBasicButton();
		if (config.recordPauseColor)
			this.button.style.backgroundColor = config.pauseButtonColor;
		this.button.classList.add("Buttons");
		this.button.classList.add("ChildButton")
		this.button.style.left = this.width + "px";
		this.parentElem.appendChild(this.button);
	}
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
}

/**
 * When the page has finished Loading
 * @function window.onload
 */
window.onload = function() {
	// We create a mainDiv in which wi will display all menu element as block
	mainDiv = createBaseDiv("mainDivButton");

	// We load CSS
	loadCss("media/style.css");

	// We define a button that will launch recording
	recordButton = new Button(mainDiv, loadScripts, "recordButton", "Start recording! ", 'media/camera32.png', null);
	recordButton.createMenuButton();

	buttonPosition(mainDiv);

	if (config.movable)
		makeElementMovable(mainDiv);
}
