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
let menuButton;
let recordButton;

//Rrweb variables
let events = [];
let isActive;
let interval;

let screenSize;

function includeScript(file) {
	var script = document.createElement('script'); 
	script.src = file;
	script.type = 'text/javascript'; 
	document.getElementsByTagName('head').item(0).appendChild(script);
}

// This function launch the record of the screen
function launchRecord() {
	console.log("This should have launch the recording");

	// Update the style of record button and the onclick function.
	document.getElementById('recordButton').style.backgroundColor = "white";
	document.getElementById('recordButton').style.backgroundImage = "url('media/recording32.png')";
	document.getElementById('recordButton').style.border = "1px solid black";
	document.getElementById('recordButton').onclick = stopRecord;

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

	// Restore the style and onclick of recordButton
	document.getElementById('recordButton').style.backgroundColor = "#fdd03b";
	document.getElementById('recordButton').style.backgroundImage = "url('media/camera32.png')";
	document.getElementById('recordButton').style.border = "none";
	document.getElementById('recordButton').onclick = launchRecord;

	console.log("This should have stop the recording");
	if (isActive)
		isActive();
	clearInterval(interval);
}

// TODO: need to simpilfy this function, maybe remove it
function createMenu() {
	console.log("Oh, the menu does not seems to exit, let's create it");
	//Creating record Button as a child element
	recordButton = new ButtonHandling(div, launchRecord, "recordButton", "", "url('media/camera32.png')");
	recordButton.createChildButton();
	isMenuCreated = true;
}

function openMenu() {
	if (isDragged == false) {
		console.log("Opening the menu");
		if (!isMenuCreated)
			createMenu();
		if (!isMenuOpen) {
			div.style.height = "150px";
			recordButton.show();
			isMenuOpen = true;
		} else {
			recordButton.hide();
			div.style.height = "70px";
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

	constructor(context, func, id, text, icon) {
		this.context = context;
		this.func = func;
		this.id = id;
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
		this.button.style.height = "50px";
		this.button.style.width = "50px";
		this.button.style.display = "block";
		this.button.style.margin = "25% auto 15px";
		this.button.style.backgroundColor = "#fdd03b";
		this.button.style.cursor = "pointer";
		this.context.prepend(this.button);
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
			console.log("screenSize.width = " + screenSize.width + " screenSize.height = " + screenSize.height);
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
	// This function load rrweb from local.
	// Can also load from URL
	includeScript("./rrweb/dist/rrweb.js");

	// We create a div in which wi will display all menu element as block
	div = createBaseDiv();

	// We get the webpage size, avoiding being able to drop the menu out
	// of the page
	screenSize = window.screen;

	// We define a button that will launch recording
	menuButton = new ButtonHandling(div, openMenu, "menuButton", "", "url('media/menu32.png')");
	menuButton.createMenuButton();

	if (config.movable)
		makeButtonMovable(div);
}
