console.log("Auto loading !");

// This is the default configuration
let config = {
	position: "bottom-right",
	movable: true
};

let isDragged = false;
let isMenuCreated = false;

// This function launch the record of the screen
function launchRecord()
{
	if (isDragged == false)
		console.log("This should have launch the recording");
}

function createMenu()
{
	console.log("Oh, the menu does not seems to exit, let's create it");
	isMenuCreated = true;
}

function openMenu()
{
	console.log("Opening the menu");
	if (!isMenuCreated)
		createMenu();
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

class ButtonHandling {
	constructor(context, func, text, icon, isMain) {
		this.context = context;
		this.func = func;
		this.text = text;
		this.icon = icon;
		this.isMain = isMain
	}
	buttonShow()
	{
		console.log("My button is showing !");
	}
	buttonDisapear()
	{
		console.log("My button disappear !");
	}
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
	button.style.backgroundImage = "url('media/menu32.png')";
	button.style.backgroundRepeat = "no-repeat"
	button.style.backgroundPosition = "center"

	if (config.movable) {
		button.style.position = "absolute";
		button.style.cursor = "move";
	}
	context.appendChild(button);
}

function finishDragging()
{
	isDragged = false;
}

// The goal of this function is to make a button movable
function makeButtonMovable()
{
	//Make the button element draggable:
	dragElement(document.getElementById("recordingButton"));

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
			isClick = false;
			e = e || window.event;
			e.preventDefault();
			// calculate the new cursor position:
			pos1 = mouseX - e.clientX;
			pos2 = mouseY - e.clientY;
			mouseX = e.clientX;
			mouseY = e.clientY;
			// set the element's new position:
			elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
			elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
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

window.onload = function() {
	// We define a button that will launch recording
	createButton(document.body, openMenu, "");
	if (config.movable)
		makeButtonMovable();
}
// Because we are using Materialize, 

/*document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, options);
  });

*/
