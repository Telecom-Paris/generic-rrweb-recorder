console.log("Auto loading !");



// This is the default configuration
let config = {
	position: "bottom-right",
	movable: true
};

let isDragged = false;
let isMenuCreated = false;
let isMenuOpen = false;

let recordButton;
let replayButton;

let events = [];
let isActive;
let interval;


function includeScript(file) {
	var script = document.createElement('script'); 
	script.src = file;
	script.type = 'text/javascript'; 
	document.getElementsByTagName('head').item(0).appendChild(script);
}

// This function launch the record of the screen
function launchRecord() {
	console.log("This should have launch the recording");
	isActive = rrweb.record({
		emit(event) {
			// push event into the events array
			events.push(event);
		},
	});
	interval = setInterval(function () {console.log(events);}, 1000) ;
}

// This function launch the record of the screen
function stopRecord() {
	console.log("This should have launch the recording");
	if (isActive)
		isActive();
	clearInterval(interval);

function createMenu() {
	console.log("Oh, the menu does not seems to exit, let's create it");
	//Creating record Button as a child element
	recordButton = new ButtonHandling(document.body, launchRecord, "?", "");
	recordButton.createChildButton();
	isMenuCreated = true;
}

function openMenu() {
	if (isDragged == false)
	{
		console.log("Opening the menu");
		if (!isMenuCreated)
			createMenu();
		if (!isMenuOpen) {
			recordButton.show();
			isMenuOpen = true;
		}
		else
		{
			recordButton.hide();
			isMenuOpen = false;
		}
	}
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

class ButtonHandling {
	button;

	constructor(context, func, text, icon) {
		this.context = context;
		this.func = func;
		this.text = text;
		this.icon = icon;
	}

	show() {
		console.log("My button is showing !");
		this.button.style.visibility = "visible";
	}

	hide() {
		console.log("My button disappear !");
		this.button.style.visibility = "hidden";
	}

	createBasicButton() {
		this.button = document.createElement("input");
		this.button.type = "button";
		this.button.value = this.text;
		this.button.onclick = this.func;
		this.button.style.borderRadius = "50%";
		this.button.style.border = "none";
	}

	createMenuButton() {
		this.createBasicButton();
		this.button.id="menuButton";
		this.button.style.height = "70px";
		this.button.style.width = "70px";
		this.button.style.backgroundColor = "#d92027";
		this.button.style.backgroundImage = "url('media/menu32.png')";
		this.button.style.backgroundRepeat = "no-repeat";
		this.button.style.backgroundPosition = "center";
		if (config.movable) {
			this.button.style.position = "absolute";
			this.button.style.cursor = "move";
		}
		this.context.appendChild(this.button);
	}

	createChildButton() {
		this.createBasicButton();
		this.button.style.height = "50px";
		this.button.style.width = "50px";
		this.button.style.backgroundColor = "yellow";
		this.context.appendChild(this.button);
	}
}

function finishDragging() {
	isDragged = false;
}

// The goal of this function is to make a button movable
function makeButtonMovable() {
	//Make the button element draggable:
	dragElement(document.getElementById("menuButton"));

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

function createBaseDiv() {
	
}

window.onload = function() {
	includeScript("./rrweb/dist/rrweb.js");
	createBaseDiv();
	// We define a button that will launch recording
	var menuButton = new ButtonHandling(document.body, openMenu, "", "");
	menuButton.createMenuButton();
	
	if (config.movable)
		makeButtonMovable();
}
