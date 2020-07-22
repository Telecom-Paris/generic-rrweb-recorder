console.log("Auto loading !");

// This is the default configuration
let config = {
	position: "bottom-right",
	movable: true
};

let isDragged = false;
let isMenuCreated = false;
let isMenuOpen = false;

//Displayable menu variable
let div;
let recordButton;
let pauseButton;
let downButton;

//Rrweb variables
let isRrwebLoaded;
let events = [];
let isActive;
let interval;

// WebAudioRecorder variables
let isWebAudioRecorderLoaded;
let recorder;
let recStream;
let audioConfig;
let input, encodingType;

//Download variables
let isJsZipLoaded;
let textData; //code of the webpage download.html
let eventBlob;
let soundBlob;

let screenSize;

function includeScript(file) {
	var script = document.createElement('script'); 
	script.src = file;
	script.type = 'text/javascript';
	script.onload = function () {
		return true;
	}
	script.onerror = function() {
		return false;
	}
	document.getElementsByTagName('head').item(0).appendChild(script);
}

function configureAudio() {
	navigator.mediaDevices.getUserMedia({audio: true, video:false}).then(function(stream) {
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

		return {
			input: input,
			encoding: encodingType
		};
	});
}

// This function launch the record of the screen
function launchRecord() {
	if (!isDragged) {
		console.log("This should have launch the recording");
		// Update the style of record button and the onclick function.
		document.getElementById('recordButton').style.backgroundColor = "white";
		document.getElementById('recordButton').style.backgroundImage = "url('media/recording32.png')";
		document.getElementById('recordButton').style.border = "1px solid black";
		document.getElementById('recordButton').onclick = stopRecord;

		//Opening the menu to create
		openMenu();

		// This function load rrweb from local.
		// Can also load from URL
		includeScript("./rrweb/dist/rrweb.js");

		// We include WebAudioRecorder
		includeScript("./recorder/lib/WebAudioRecorder.js");

		//audioConfig = configureAudio();

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
	});

		// We launch sound recording
		recorder = new WebAudioRecorder(input, {
			workerDir: "./recorder/lib/",
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

		recorder.startRecording();

		// We launch Rrweb
		isActive = rrweb.record({
			emit(event) {
				// push event into the events array
				events.push(event);
			},
		});
		interval = setInterval(function () {console.log(events);}, 1000);
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

	// We stop audioRecorder
	recStream.getAudioTracks()[0].stop();
	recorder.finishRecording();

	// Set the event as Blob
	eventBlob = new Blob([JSON.stringify(events)], {type: "application/json"});
	if (events.length > 2) {
		div.style.width = "150px";
		console.log("I can download the page");
		downButton = new Button(div, downRecord, "downRecord", "", "url('media/down32.png')");
		downButton.createChildButton();
		downButton.show();
	}
}

// TODO: need to simpilfy this function, maybe remove it
function createMenu() {
	console.log("Oh, the menu does not seems to exit, let's create it");
	//Creating record Button as a child element
	//pauseButton = new Button(div, pauseRecord, "pauseButton", "", "url('media/pause32.png')");
	//recordButton.createChildButton();
	isMenuCreated = true;
}

function openMenu() {
	if (isDragged == false) {
		console.log("Opening the menu");
		if (!isMenuCreated)
			createMenu();
		if (!isMenuOpen) {
			div.style.width = "150px";
			//pauseButton.show();
			isMenuOpen = true;
		} else {
			//pauseButton.hide();
			div.style.width = "70px";
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

function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                textData = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
}


// This function launch the download of the record
function downRecord() {
	//Load Jszip (minified Because it load faster)
	includeScript("./jszip/dist/jszip.js", isJsZipLoaded);

	let zip = new JSZip();

	readTextFile("./download.html");
	// We add thoses files to the zip archive
	zip.file("download.html", textData);
	zip.file("data/events.json", eventBlob);
	zip.file("data/sound.mp3", soundBlob);

	// Once archive has been generated, we can download it
	zip.generateAsync({type:"blob"})
	.then(function(content) {
		saveAs(content, "example.zip");
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

function resetStyle() {
	document.getElementById("recordingButton").style.left = "0";
	document.getElementById("recordingButton").style.right = "0";
}

class Button {
	button;

	constructor(context, func, id, text, icon) {
		this.context = context;
		this.func = func;
		this.id = id;
		this.text = text;
		this.icon = icon;
	}

	show() {
		this.button.style.visibility = "visible";
	}

	hide() {
		this.button.style.visibility = "hidden";
	}

	createBasicButton() {
		this.button = document.createElement("input");
		this.button.type = "button";
		this.button.value = this.text;
		this.button.onclick = this.func;
		this.button.id = this.id;
		this.button.style.borderRadius = "50%";
		this.button.style.border = "none";
		this.button.style.backgroundImage = this.icon;
		this.button.classList.add("rr-block");
		this.button.style.backgroundRepeat = "no-repeat";
		this.button.style.backgroundPosition = "center";
	}

	createMenuButton() {
		this.createBasicButton();
		this.button.style.height = "70px";
		this.button.style.width = "70px";
		this.button.style.bottom = "0%";
		this.button.style.backgroundColor = "#d92027";
		this.button.style.position = "absolute";
		this.button.style.cursor = "move";
		this.context.appendChild(this.button);
	}

	createChildButton() {
		this.createBasicButton();
		this.button.style.height = "70px";
		this.button.style.width = "70px";
		//this.button.style.display = "block";
		//this.button.style.margin = "25% auto 15px";
		this.button.style.position = "absolute";
		this.button.style.backgroundColor = "#fdd03b";
		this.button.style.cursor = "pointer";
		this.button.style.right = "0px";
		this.context.appendChild(this.button);
	}
}

function finishDragging() {
	isDragged = false;
}

// The goal of this function is to make a button movable
function makeButtonMovable(button) {
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
			if (elmnt.offsetLeft - pos1 >= 0 && (elmnt.offsetLeft + 70) - pos1 < screenSize.width
				&& elmnt.offsetTop - pos2 >= 0 && (elmnt.offsetTop + 70) - pos2 < screenSize.height)
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

function createBaseDiv() {
	var div = document.createElement("div");
	div.style.width = "70px";
	div.style.height = "70px";
	div.style.position = "absolute";
	document.body.appendChild(div);
	return div;
}

window.onload = function() {

	// We create a div in which wi will display all menu element as block
	div = createBaseDiv();

	// We get the webpage size, avoiding being able to drop the menu out
	// of the page
	screenSize = window.screen;

	// We define a button that will launch recording
	recordButton = new Button(div, launchRecord, "recordButton", "", "url('media/camera32.png')");
	recordButton.createMenuButton();

	if (config.movable)
		makeButtonMovable(div);
}
