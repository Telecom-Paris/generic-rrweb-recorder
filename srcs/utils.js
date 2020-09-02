import {config} from './recorder.js';
export {millisToMinutesAndSeconds, computeTimeBetweenTwoFrames, logger, changeMainDivSize};

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
	mainDivWidth += newWidthInPx;
	mainDivHeight += newHeightInPx;
	mainDiv.style.width = mainDivWidth + "px";
	mainDiv.style.height = mainDivHeight + "px";
}

/**
 * Check if log has been activated and print stringLog if so.
 * @param {string} String to print if log is activated.
 */
function logger(stringLog){
	if (config.debug) {
		console.log("generic-rrweb-recorder: " + stringLog);
	}
}

