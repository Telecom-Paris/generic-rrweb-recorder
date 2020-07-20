console.log("Auto loading !");

// This is the default configuration
let config = {
	position: "bottom-right",
	movable: true
};


// This function launch the record of the screen
function launchRecord()
{
	console.log("This should have launch the recording");
}

function buttonPosition(button)
{
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

function resetStyle()
{
	document.getElementById("recordingButton").style.left = "0";
	document.getElementById("recordingButton").style.right = "0";
}

// The goal of this function is to create basic button
function createButton(context, func, text) {
	var button = document.createElement("input");
	button.type = "button";
	button.value = text;
	button.id = "recordingButton"
	button.onclick = func;

	//Determine position from config object
	//buttonPosition(button);

	button.style.borderRadius = "50%";
	button.style.height = "100px";
	button.style.width = "100px";
	button.style.backgroundColor = "#d92027";
	button.style.backgroundImage = "url('media/camera32.png')";
	button.style.backgroundRepeat = "no-repeat"
	button.style.backgroundPosition = "center"

	if (config.movable) {
		button.style.position = "absolute";
		button.style.cursor = "move";
	}
	context.appendChild(button);
}

// The goal of this function is to make a button movable
function makeButtonMovable()
{
	//Make the button element draggable:
	dragElement(document.getElementById("recordingButton"));

	function dragElement(elmnt) {
		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		if (document.getElementById(elmnt.id + "header")) {
			/* if present, the header is where you move the DIV from:*/
			document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
		} else {
			/* otherwise, move the DIV from anywhere inside the DIV:*/
			elmnt.onmousedown = dragMouseDown;
		}

		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();
			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementDrag;
		}

		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();
			// calculate the new cursor position:
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			// set the element's new position:
			elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
			elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
		}

		function closeDragElement() {
			/* stop moving when mouse button is released:*/
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}
}

window.onload = function() {
	// We define a button that will launch recording
	createButton(document.body, launchRecord, "");
	if (config.movable)
		makeButtonMovable();
}
// Because we are using Materialize, 

/*document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, options);
  });

*/
