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
 * Contains the time in millis the user paused the record.
 * For example, if the user pause the recorder for 3 sec then for 5 sec, the array will be [3000, 5000]
 * @type {array} 
 */
let pauseTimer = [];
/**
 * Contain the index of where the user stopped when pausing
 * @type {array}
 */
let pauseTimerCheckPoint = [];
/**
 * A flag to detect if the recorder is in pause and the pause time counter is running
 * @type {boolean}
 */
let isPauseTimerRunning = false;

/**
 * Contains the current time when the user pause the recorder
 * @type {integer}
 */
let pauseStart = 0;

/**
 * Debug variables exported from config
 * @type {boolean}
 */
let debugLog;

/**
 * Load different JS library and callback when fully loaded
 * @param {Array of String} src The path(s) of the script (can be relative or absolute)
 * @param {Function} cb Callback, function to launch when loaded
*/
function loadJS(src, cb) {	
	var ref = document.getElementsByTagName("script")[0];

	for (i = 0; i < src.length; i++) {
		var script = document.createElement("script");
		script.src = src[i];
		ref.parentNode.insertBefore(script, ref);
	}

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
 * Check if log has been activated and print stringLog if so.
 * @param {string} String to print if log is activated.
 */
function logger(stringLog){
	if (debugLog)
		console.log("generic-rrweb-recorder: " + stringLog);
}

function compileDataForDownload() {
	//avoid concatenating if there is only one element
	if (audioParts.length > 1) {
		logger("Loading ConcatenateBlobs");
		// We concatenate all audio parts.
		loadJS([config.libPath + "lib/concatenate-blob/ConcatenateBlobs.js"], function () {
			ConcatenateBlobs(audioParts, 'audio/mpeg3', function(resultingBlob) {
				soundBlob = resultingBlob;
			});
			
		});
	}
	else {
		logger("No need to load ConcatenateBlobs");
		soundBlob = audioParts[0];
	}
}

/**
 * Download the record automatically
 * @param {Object} data raw data of the zip file
 * @param {string} filename The name we want to give to the downloaded filename
 */
function saveAs(data, filename) {
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

class Recorder {
	/**
 	* This is the default configuration variable
 	* @type {Object}
	*/
	
	config = {
		// The slash at the end is important
		libPath: "./",
		// Print debug log
		debug: true,
		/**
 		* encoding type is format encoding for sound. Can be mp3 or ogg
 		* Default value: "mp3";
 		* @type {string}
 		*/
		encodingType: "mp3"
	};

	manualScriptLoad = false;

	constructor(libPath, debugLog, encodingType) {
		if (libPath != undefined)
			this.config.libPath = libPath;
		if (debugLog != undefined )
			this.config.debug = debugLog;
		if (encodingType != undefined)
			this.config.encodingType = encodingType;

		debugLog = this.config.debug;
		return ;
	}

	get config() {
		return this.config;
	}
	
	loadScripts() {
		// We include Rrweb
		let that = this;
		loadJS([this.config.libPath + "lib/rrweb/dist/rrweb.min.js", this.config.libPath + "lib/web-audio-recorder/lib/WebAudioRecorder.js"], function() {
			// Once script has been loaded, launch the rest of the code
			logger("Scripts have been loaded!");
			areRecordScriptsLoaded = true;
			if (that.manualScriptLoad)
				that.startRecord();
		});
	}
	
	/**
 	* Launch the audio and screen record
 	*/
	startRecord() {
		if (areRecordScriptsLoaded) {
			recorderState = "RECORDING";
			console.log("Recording has started! ");
			let that = this;
			navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
				logger("getUserMedia() success, stream created, initializing WebAudioRecorder...");
				let audioContext = new AudioContext();
				//update the format
				logger("Format: 2 channel " + that.config.encodingType + " @ " + audioContext.sampleRate / 1000 + "kHz");
				//assign to recStream for later use
				recStream = stream;

				/* use the stream */
				let input = audioContext.createMediaStreamSource(stream);

				//Reset the events and audioParts. If you want to record another session without reloading the webpage
				events = [];
				audioParts = [];

				isEncodingOver = false;

				audioRecorder = new WebAudioRecorder(input, {
					workerDir: that.config.libPath + "lib/web-audio-recorder/lib/",
					encoding: that.config.encodingType,
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
					logger("Audio Blob is available here: " + URL.createObjectURL(blob));
					audioParts.push(blob);
                    // If the recorder has been fully stopped, print the downloadButton
					if (recorderState == "STOPPED"){
						isEncodingOver = true;
						//Say encoding is complete
					}
				}

				audioRecorder.setOptions({
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
			});
		} else {
			logger("Warning: Scripts have not been loaded. Manual load");
			this.manualScriptLoad = true;
			console.log(this.config);
			this.loadScripts();
		}
	}

	/**
 	* When the record is in pause make appear the range bar
 	*/
	pauseRecord() {
		recorderState = "PAUSED";
		if (isActive)
			isActive();
		clearInterval(interval);

		console.log("I set in pause");
		// We stop audioRecorder
		audioRecorder.finishRecording();

		// Start counting pause time
		isPauseTimerRunning = true;
		pauseStart = (new Date()).getTime();
		pauseTimerCheckPoint.push(events.length - 1);
	}

	/**
 	* Resume the record
 	* This function is very similar to {@link launchRecord}, excepted we do not
 	* need to check for permissions, they should be granted
 	*/
	resumeRecord(){
		recorderState = "RECORDING";

		audioRecorder.startRecording();

		isActive = rrweb.record({
				emit(event) {
				// push event into the events array
				events.push(event);
			},
		});
		interval = setInterval(function () {logger("Length of events " + events.length);}, 1000);

		isPauseTimerRunning = false;
		if (pauseTimer.length == 0)
			pauseTimer.push((new Date()).getTime() - pauseStart);
		else {
			logger("Adding last element: " + pauseTimer[pauseTimer.length - 1] + " to this element");
			pauseTimer.push(pauseTimer[pauseTimer.length - 1] + ((new Date()).getTime() - pauseStart));
		}
		console.log(pauseTimer);
		console.log(pauseTimerCheckPoint);
	}

	/**
 	* This function stop the record of the screen and audio.
 	*/
	stopRecord() {
		// Restore the style and onclick of recordButton
		recorderState = "STOPPED";

		console.log("The recording has been stopped");
		// We stop Rrweb
		if (isActive)
			isActive();
		clearInterval(interval);
		// We stop audioRecorder
		audioRecorder.finishRecording();
		recStream.getAudioTracks()[0].stop();
		// Set the event as Blob
		eventBlob = new Blob([JSON.stringify(events)], {type: "application/json"});

		// If user has set pause, start recomputing timestamps
		if (pauseTimer.length >= 1) {
			logger("We have to recompute timestamps");
			let i = pauseTimerCheckPoint[0] + 1;
			let j = pauseTimer.length == 1 ? events.length -1 : pauseTimerCheckPoint[1];
			let k = 1;
			for (;k < pauseTimer.length; k++) {
				logger("For interval " + i + " -> " + j + " we remove: " + pauseTimer[k -1]);
				for (;i < j; i++){ events[i].timestamp -= pauseTimer[k - 1]; }
				i = pauseTimerCheckPoint[k] + 1;
				j = pauseTimerCheckPoint[k + 1];
			}
			j = events.length - 1;
			logger("For interval " + i + " -> " + j + " we remove: " + pauseTimer[k -1]);
			for (;i < j; i++){
				events[i].timestamp -= pauseTimer[k - 1];
			}
			logger("Timestamps correction has been done");
		}
	}

	/**
	* This function launch the download of the record.
 	* It also put files in the zip for download
 	*/
	downRecord() {
		//Load Jszip (minified Because it load faster)
		loadJS([this.config.libPath + "./lib/jszip/dist/jszip.min.js"], function() {
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
			zip.generateAsync({type:"blob"}).then(function(content) {
					saveAs(content, "cours.zip");
			});
		});
	}

	/**
 	* Launch the post edit
 	*/
	postEditRecord() {
		logger("Launching the post edit...");
		localStorage.setItem('rrweb-events', JSON.stringify(events));
		localStorage.setItem('rrweb-audio', URL.createObjectURL(soundBlob));
		console.log(localStorage.getItem('rrweb-events'));
		console.log(localStorage.getItem('rrweb-audio'));
		window.open(getRightLibPath(this.config, "postEdit/newEdit.html"));
	}
}
