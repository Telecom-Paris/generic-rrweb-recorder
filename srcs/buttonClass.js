export {Button};
import {config} from './recorder.js';
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
		this.icon = "url(" + icon + ")";
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
