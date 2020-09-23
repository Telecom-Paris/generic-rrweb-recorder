/**
 * This is the default configuration variable
 * @type {Object}
*/
let config = {
	// The slash at the end is important
	libPath: "./",
	startOnload: true,
	position: "bottom-right",
	movable: true,
	debug: true,
	// color is a string
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
let mainDivSize = {width: 70, height: 70};

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
 * The object of the gif button. This button is not clickable,
 * it is just showing a running gif.
 * @type {Object}
 */
let gifLoadingButton;
/**
 * Post Edition Button Object
 * @type {Button}
 */
let postEdButton;
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
 * Audio Recorder Object
 * @type {Object}
 */
let audioRecorder;
/**
 * Audio Stream.
 * Allow us to stop it when needed
 */
let recStream;
/**
 * encoding type is format encoding for sound. Can be mp3 or ogg
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
 * Recorder status. Can be "PLAYING", "PAUSED" or "STOPPED"
 * Default value: null;
 * @type {string}
 */
let recorderState = null;

/**
 * A flag to detect if encoding is finished.
 * Avoid downloading archive before the audio encoder has finished
 * Default value: false.
 * @type {boolean}
 */
let isEncodingOver = false;

/**
 * Save the last element created (the most right)
 * @type {Button}
 */
let lastButton;

/**
 * Load different JS library and callback when fully loaded
 * @param {string} src The path of the script (can be relative or absolute)
 * @param {Function} cb Callback, function to launch when loaded
*/
function loadJS(src, cb, ordered) {
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
		//script.onerror = onScriptLoadFail(script.src);
		script.onload = cb;
	}
	return script;
}

function onScriptLoadFail(scriptSrc) {
	alert("The script at this address: " + scriptSrc + " failed to load. Please check your internet connection or if the script exist");
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
  
/**
 * Change the size of the mainDiv
 * @param {integer} newWidthInPx The will that will be added to the current width
 * @param {integer} newHeightInPx The new height that will be added to the current height
 */
function changeMainDivSize(newWidthInPx, newHeightInPx) {
	mainDivSize.width += newWidthInPx;
 	mainDivSize.height += newHeightInPx;
 	mainDiv.style.width = mainDivSize.width + "px";
 	mainDiv.style.height = mainDivSize.height + "px";
}
  
/**
 * Check if log has been activated and print stringLog if so.
 * @param {string} String to print if log is activated.
 */
function logger(stringLog){
	if (config.debug)
		console.log("generic-rrweb-recorder: " + stringLog);
}
  
function loadScripts() {
	// We make sure this is not a drag, but a click
	if (!isDragged) {
		// We include Rrweb
		loadJS(getRightLibPath("lib/rrweb/dist/rrweb.min.js", false), function() {
			loadJS(getRightLibPath("lib/web-audio-recorder/lib/WebAudioRecorder.js", false), function() {
				// Once script has been loaded, launch the rest of the code
				areRecordScriptsLoaded = true;
				launchRecord();
			});
		});
	}
}

/**
 * Resume the record
 * This function is very similar to {@link launchRecord}, excepted we do not
 * need to check for permissions, they should be granted
 */
function resumeRecord(){
	if (!isDragged) {
		recorderState = "RECORDING";
		pauseButton.style.backgroundImage = getRightLibPath('media/pause32.png', true);
		document.getElementById('rrweb-pauseRecord').onclick = pauseRecord;

		audioRecorder.startRecording();

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

	if (!isDragged) {
		recorderState = "PAUSED";
		if (isActive)
			isActive();
		clearInterval(interval);

		pauseButton.style.backgroundImage = getRightLibPath('media/resume32.png', true);
		document.getElementById('rrweb-pauseRecord').onclick = resumeRecord;

		console.log("I set in pause");
		if (events.length > 2) {
			// We stop audioRecorder
			audioRecorder.finishRecording();

			//sliderBar.style.background = 'linear-gradient(to right, #82CFD0 0%, #82CFD0 100%, #999999 100%, #999999 100%)';
		}
	}
}

/**
 * Launch the post edit
 */
function postEdit() {
	logger("Launching the post edit...");
	localStorage.setItem('rrweb-events', JSON.stringify(events));
	localStorage.setItem('rrweb-audio', URL.createObjectURL(soundBlob));
	console.log(localStorage.getItem('rrweb-events'));
	console.log(localStorage.getItem('rrweb-audio'));
	window.location = getRightLibPath("edit/edit.html");
}

function displayPostEditButton() {
	//avoid concatenating if there is only one element
	if (events.length > 2) {
		changeMainDivSize(80, 0);
		logger("I can download the page");
		postEdButton = new Button(mainDiv, postEdit, "rrweb-postEdit", "Edit your record", 'media/edit32.png', recordButton);
		postEdButton.createChildButton();
		postEdButton.show();
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
			logger("getUserMedia() success, stream created, initializing WebAudioRecorder...");
			let audioContext = new AudioContext();
			//update the format
			logger("Format: 2 channel " + encodingType + " @ " + audioContext.sampleRate / 1000 + "kHz");
			//assign to recStream for later use
			recStream = stream;

			/* use the stream */
			let input = audioContext.createMediaStreamSource(stream);

			if (areRecordScriptsLoaded) {
				//Reset the events and audioParts. If you want to record another session without reloading the webpage
				events = [];
				audioParts = [];

				//Check if edit and download buttons are visible
				if (postEdButton && postEdButton.isVisible())
					postEdButton.hide();
				if (downButton && downButton.isVisible())
					downButton.hide();

				isEncodingOver = false;

				audioRecorder = new WebAudioRecorder(input, {
					workerDir: config.libPath + "lib/web-audio-recorder/lib/",
					encoding: encodingType,
					numChannel: 2,
					onEncoderLoading: function(recorder, encodingType) {
						logger("Loading " + encodingType + " encoder...");
					},
					onEncoderLoaded: function(recorder, encodingType) {
						logger(encodingType + " encoder loaded");
					}
				});

				audioRecorder.onComplete = function(recorder, blob) {
					logger("Encoding complete");
					logger(URL.createObjectURL(blob));
					audioParts.push(blob);
                    // If the recorder has been fully stopped, print the downloadButton
					if (recorderState == "STOPPED"){
						isEncodingOver = true;
						gifLoadingButton.hide();
						displayPostEditButton();
						compileDataForDownload();
					}
				}

				audioRecorder.setOptions({
					timeLimit:120,
					encodeAfterRecord: true,
					ogg: {quality: 0.5},
					mp3: {bitRate: 160}
				});

				audioRecorder.startRecording();

				isActive = rrweb.record({
					emit(event) {
						// push event into the events array
						events.push(event);
					},
				});
				interval = setInterval(function () {logger("Length of events " + events.length);}, 1000);

				// Update the style of record button and the onclick function.
				recordButton.style.backgroundColor = "white";
				recordButton.style.backgroundImage = getRightLibPath('media/recording32.png', true);
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
		recordButton.style.backgroundImage = getRightLibPath('media/camera32.png', true);
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
		audioRecorder.finishRecording();
		recStream.getAudioTracks()[0].stop();

		// Set the event as Blob
		eventBlob = new Blob([JSON.stringify(events)], {type: "application/json"});

		if (isEncodingOver == false) {
			//Display GIF loading
			gifLoadingButton = new Button(mainDiv, null, "rrweb-loadingDown", "Your download is almost ready !", 'media/loading32.gif', recordButton);
			gifLoadingButton.createChildButton();
			gifLoadingButton.setClickable(false);
			gifLoadingButton.show();
		}
	}
}

function getRightLibPath(path, isURL) {
	if (isURL) return "url(" + config.libPath + path + ")";
	else return config.libPath + path;
}

function showDownButton() {
	if (events.length > 2) {
		changeMainDivSize(80, 0);
		logger("I can download the page");
		downButton = new Button(mainDiv, downRecord, "rrweb-downRecord", "Download your record", 'media/down32.png', postEdButton);
		downButton.createChildButton();
		downButton.show();
	}
}

function compileDataForDownload() {
	//avoid concatenating if there is only one element
	if (audioParts.length > 1) {
		logger("Loading ConcatenateBlobs");
		// We concatenate all audio parts.
		loadJS(config.libPath + "lib/concatenate-blob/ConcatenateBlobs.js", function () {
			ConcatenateBlobs(audioParts, 'audio/mpeg3', function(resultingBlob) {
				soundBlob = resultingBlob;
				showDownButton();
			});
			
		});
	}
	else {
		logger("No need to load ConcatenateBlobs");
		soundBlob = audioParts[0];
		showDownButton();
	}
}

/**
 * Increase size of the mainDiv and make visible pause Button
 */
function openMenu() {
	if (isDragged == false) {
		if (!isMenuOpen) {
			changeMainDivSize(80, 0);
			if (!isPauseButtonCreated) {
				pauseButton = new Button(mainDiv, pauseRecord, "rrweb-pauseRecord", "Pause the record", 'media/pause32.png', recordButton);
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
 *  @param {String} file path to read file
 */
function readTextFile(file) {
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
 * This function escape all special character that could break JSON parsing
 * This function is used when downloading record
 * @param {string} str String given containing all the events.
 * @return Return a well escaped string.
 */
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
 * This function launch the download of the record.
 * It also put files in the zip for download
 */
function downRecord() {
	//Load Jszip (minified Because it load faster)
	loadJS("./lib/jszip/dist/jszip.js", function() {
		let zip = new JSZip();

		let textData = readTextFile("./download/download.html");
        let textDataEnd = readTextFile("./download/download_end.html");
		jsData = readTextFile("./lib/rrweb/dist/rrweb.min.js");
		cssData = readTextFile("./lib/rrweb/dist/rrweb.min.css");
        // We add thoses files to the zip archive

		console.log(addslashes(JSON.stringify(events)));
		let addEventsToFile = "let events_string = \"" + addslashes(JSON.stringify(events)) + '";';

		textData += addEventsToFile + textDataEnd;
		zip.file("index.html", textData);
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

/**
 * Set the button position according to user config
 * @param {Object} button The object to apply the style to
 */
function buttonPosition(button) {
	if (config.position.search("bottom") > -1)
		button.style.bottom = "50px";
	if (config.position.search("top") > -1)
		button.style.top = "50px";
	if (config.position.search("middle") > -1)
		button.style.top = "50px";
	if (config.position.search("-right") > -1)
		button.style.right = "50px";
	if (config.position.search("-left") > -1)
		button.style.left = "50px";
}

/**
 * Allow to detect if the div is dragged or clicked
 */
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
        logger("Make element draggable");
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
			if (elmnt.offsetLeft - pos1 >= 0 && (elmnt.offsetLeft + mainDivSize.width) - pos1 < window.screen.width
				&& elmnt.offsetTop - pos2 >= 0 && (elmnt.offsetTop + mainDivSize.width) - pos2 < window.screen.height)
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
	logger("Loaded Css !");
}

/**
 * Create base elements for replay.
 * Very useful if you need to manually launch the recorder.
 */
class Recorder {
	constructor() {
		logger("Page has finished Loading, launching generic-rrweb-recorder");
		// We create a mainDiv in which we will display all menu element as block
		mainDiv = createBaseDiv("rrweb-mainDivButton");

		// We load CSS
		loadCss(getRightLibPath("media/style.css", false));

		// We define a button that will launch recording
		recordButton = new Button(mainDiv, loadScripts, "rrweb-recordButton", "Start recording! ",'media/camera32.png', null);
		recordButton.createMenuButton();

		buttonPosition(mainDiv);

		logger("Main Button has been created");

		if (config.movable)
			makeElementMovable(mainDiv);
	}
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
	constructor(parentElem, func, id, text, icon, rightOf) {
		this.parentElem = parentElem;
		this.func = func;
		this.id = id;
		this.text = text;
		this.icon = getRightLibPath(icon, true);
		this.width = rightOf != null ? rightOf.getWidth() + 80 : 0;
	}

	setClickable(isClickable) {
        this.button.disabled = isClickable;
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
	 * Return if the button is visible or not
	 */
	isVisible() { return this.button.style.visibility; }

	/**
	 * Set all element for a basic button
	 */
	createBasicButton() {
		this.button = document.createElement("input");
		this.button.type = "button";
		this.button.onclick = this.func;
		this.button.id = this.id;
		this.button.style.backgroundImage = this.icon;
		this.button.title = this.text;
		this.style = this.button.style;
	}

	/**
	 * Create main Button (recording button).
	 * Call {@link Button#createBasicButton createBasicButton}.
	 */
	createMenuButton() {
		this.createBasicButton();
		this.button.classList.add("rrweb-Buttons");
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
		this.button.classList.add("rrweb-Buttons");
		this.button.classList.add("rrweb-ChildButton")
		this.button.style.left = this.width + "px";
		this.parentElem.appendChild(this.button);
	}
}

/**
 * When the page has finished Loading
 * @function window.onload
 */
window.onload = function() {
	if (config.startOnload) {
		new Recorder();
	}
}