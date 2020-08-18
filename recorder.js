// This is the default configuration
let config = {
	position: "bottom-right",
	movable: true
};

let isDragged = false;
let isMenuOpen = false;

//Displayable menu variable
let mainDiv;
let mainDivWidth = 70;
let mainDivHeight = 70;
let recordButton;
let pauseButton;
let downButton;
let isPauseButtonCreated = false;

//Rrweb variables
let events = [];
let isActive;
let interval;

// WebAudioRecorder variables
let recorder;
let recStream;
let audioConfig;
let input, encodingType;

let areRecordScriptsLoaded = false;

//Download variables
let eventBlob;
let soundBlob;
let textData, jsData, cssData;

(function( w ){
	var loadJS = function( src, cb, ordered ){
		"use strict";
		var tmp;
		var ref = w.document.getElementsByTagName( "script" )[ 0 ];
		var script = w.document.createElement( "script" );

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
	if( typeof module !== "undefined" ){
		module.exports = loadJS;
	}
	else {
		w.loadJS = loadJS;
	}
}( typeof global !== "undefined" ? global : this ));

function loadWebAudioRecorder(scriptStatus) {
		// We include WebAudioRecorder
		loadJS("./scripts/recorder/lib/WebAudioRecorder.js", function() {
			// Once script has been loaded, launch the rest of the code
			areRecordScriptsLoaded = true;
			launchRecord();
		});
}

function loadRrweb() {
	// We make sure this is not a drag, but a click
	if (!isDragged) {
		// We include Rrweb
		loadJS("./scripts/rrweb/dist/rrweb.min.js", function() {
			loadWebAudioRecorder();
		});
	}
}

let totalTime;
let sliderBar;
let textTime;
let pauseReplayer;

function computeTextTime() {
	let arrayValue;

	decimalValue = (sliderBar.value + "").split(".")[1];
	console.log("onInput works, value is " + sliderBar.value);
	console.log("Extracted decimal is " + decimalValue);
	if (decimalValue == null) {
		arrayValue = sliderBar.value;
	}
	else if (decimalValue >= 5 && Math.ceil(sliderBar.value) <= events.length) {
		arrayValue = Math.ceil(sliderBar.value);
		console.log("Because value is >= 5, taking next frame, arrayValue is " + arrayValue);
	} else {
		arrayValue = Math.floor(sliderBar.value);
		console.log("Because value is < 5, taking previous frame, arrayValue is " + arrayValue);
	}
	textTime.innerHTML = computeTimeBetweenTwoFrames(events[arrayValue], events[0]) + " / " + totalTime;
	pauseReplayer.printFrame(events[arrayValue].timestamp);
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function computeTimeBetweenTwoFrames(firstFrame, secondFrame) {
	console.log("Recording time is event[last] - event[0] = " + (firstFrame.timestamp - secondFrame.timestamp));
	console.log("Aka " + millisToMinutesAndSeconds(firstFrame.timestamp - secondFrame.timestamp) + " mn and secs");
	return millisToMinutesAndSeconds(firstFrame.timestamp - secondFrame.timestamp);
}

function pauseRecord() {
	let sliderDiv;

	if (isActive)
		isActive();
	clearInterval(interval);

	console.log("I set in pause");
	if (events.length > 2) {
		totalTime = computeTimeBetweenTwoFrames(events[events.length - 1], events[0]);
		//changeMainDivSize(0, 20);
		sliderDiv = createBaseDiv("sliderDiv");
		textTime = document.createElement("p");
		textTime.innerHTML = "00:00 / " + totalTime;
		sliderBar = document.createElement("input");
		sliderBar.id = "sliderBar";
		sliderBar.type = "range";
		sliderBar.min = "0";
		sliderBar.max = events.length;
		sliderBar.step = "0.1";
		sliderBar.value = "0";
		pauseReplayer = new rrweb.Replayer(events);
		sliderBar.oninput = computeTextTime;
		sliderDiv.appendChild(textTime);
		sliderDiv.appendChild(sliderBar);
	}
}

// This function launch the record of the screen
function launchRecord() {
	if (!isDragged) {
		console.log("Recording has started! ");

		navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
			console.log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

			audioContext = new AudioContext();

			//update the format
			console.log("Format: 2 channel mp3 @ " + audioContext.sampleRate / 1000 + "kHz");

			//assign to recStream for later use
			recStream = stream;

			/* use the stream */
			input = audioContext.createMediaStreamSource(stream);

			//get the encoding
			encodingType = "mp3";

			if (areRecordScriptsLoaded) {
				recorder = new WebAudioRecorder(input, {
					workerDir: "./scripts/recorder/lib/",
					encoding: encodingType,
					numChannel: 2,
					onEncoderLoading: function(recorder, encodingType) {
						console.log("Loading " + encodingType + " encoder...");
					},
					onEncoderLoaded: function(recorder, encodingType) {
						console.log(encodingType + " encoder loaded");
					}
				});

				recorder.onComplete = function(recorder, blob) {
					console.log("Encoding complete");
					soundBlob = blob;
					console.log(URL.createObjectURL(blob));
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
				interval = setInterval(function () {console.log(events);}, 1000);

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

// This function launch the record of the screen
function stopRecord() {

	// Restore the style and onclick of recordButton
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
		console.log("I can download the page");
		downButton = new Button(mainDiv, downRecord, "downRecord", "Download your record", 'media/down32.png', recordButton);
		downButton.createChildButton();
		downButton.show();
	}
}

function changeMainDivSize(newWidthInPx, newHeightInPx) {
	mainDivWidth += newWidthInPx;
	mainDivHeight += newHeightInPx;
	mainDiv.style.width = mainDivWidth + "px";
	mainDiv.style.height = mainDivHeight + "px";
}

function openMenu() {
	if (isDragged == false) {
		
		if (!isMenuOpen) {
			changeMainDivSize(80, 0);
			if (!isPauseButtonCreated) {
				console.log("I enter this condition");
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

// This function read a server-local text file
// (does not work in local due to CORS request not being HTTPS)
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


// This function launch the download of the record
function downRecord() {
	//Load Jszip (minified Because it load faster)
	loadJS("./scripts/jszip/dist/jszip.js", function() {
		let zip = new JSZip();

		textData = readTextFile("./download/download.html");
		jsData = readTextFile("./download/js/index.js");
		cssData = readTextFile("./download/js/style.css");
		// We add thoses files to the zip archive
		console.log("Je mets les fichiers dans l'archive");
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
		button.style.bottom = "0";
	if (config.position.search("top") > -1)
		button.style.top = "0";
	if (config.position.search("middle") > -1)
		button.style.top = "50%";
	if (config.position.search("-right") > -1)
		button.style.right = "0";
	if (config.position.search("-left") > -1)
		button.style.left = "0";
}

class Button {
	button;
	width;

	constructor(context, func, id, text, icon, rightOf) {
		this.context = context;
		this.func = func;
		this.id = id;
		this.text = text;
		this.icon = "url(" + icon + ")";
		this.width = rightOf != null ? rightOf.getWidth() + 80 : 0;
	}

	getWidth() { return this.width; }

	show() { this.button.style.visibility = "visible"; }

	hide() { this.button.style.visibility = "hidden"; }

	createBasicButton() {
		this.button = document.createElement("input");
		this.button.type = "button";
		this.button.onclick = this.func;
		this.button.id = this.id;
		this.button.style.backgroundImage = this.icon;
		this.button.classList.add("rr-block");
		this.button.title = this.text;
	}

	createMenuButton() {
		this.createBasicButton();
		this.button.classList.add("Buttons");
		this.context.appendChild(this.button);
	}

	createChildButton() {
		this.createBasicButton();
		this.button.classList.add("Buttons");
		this.button.classList.add("ChildButton")
		this.button.style.left = this.width + "px";
		this.context.appendChild(this.button);
	}
}

function finishDragging() {
	isDragged = false;
}

// The goal of this function is to make a button movable
function makeElementMovable(button) {
	//Make the button element draggable:
	dragElement(button);

	function dragElement(elmnt) {
		var pos1 = 0, pos2 = 0, mouseX = 0, mouseY = 0;
		let isClick = true;
		if (document.getElementById(elmnt.id + "header")) {
			/* if present, the header is where you move the element from:*/
			document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
		} else {
			elmnt.onmousedown = dragMouseDown;
		}

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

function createBaseDiv(mainDivId) {
	var mainDiv = document.createElement("div");
	mainDiv.id = mainDivId;
	document.body.appendChild(mainDiv);
	return mainDiv;
}

function loadCss() {
	var head = document.getElementsByTagName('head')[0];
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = 'media/style.css';
	link.media = 'all';
	head.appendChild(link);
}

// When the page has finished Loading
window.onload = function() {
	// We create a mainDiv in which wi will display all menu element as block
	mainDiv = createBaseDiv("mainDivButton");

	loadCss();

	// We define a button that will launch recording
	recordButton = new Button(mainDiv, loadRrweb, "recordButton", "Start recording! ", 'media/camera32.png', null);
	recordButton.createMenuButton();

	if (config.movable)
		makeElementMovable(mainDiv);
}
