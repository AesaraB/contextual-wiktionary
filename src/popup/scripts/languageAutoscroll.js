// This script modifies the config to accomodate any other languages the user may want to see first.
export { csrunner };

function csrunner() {
	const listener = e => {
		let target;
		if (e.target.id) {
			target = e.target;
		} else {
			target = e.target.parentElement;
		}
		e.preventDefault();
		switch(true){
			case(target.id === configs._anchor):
				configs._anchor = '';
				target.classList.remove('auto-scrolled');
				console.log('configs: Removed anchor', target.id);
			break;
			default:
				configs._anchor = target.id;
				target.classList.add('auto-scrolled');
				console.log('configs: Set anchor', target.id);
		}
		setAutoscroll()
	}
	const elements = document.querySelectorAll("a[id].langHeadingContainer");
	elements.forEach(element => { element.addEventListener('click', listener) }
	)
}

function setAutoscroll() {
	let anchor = configs._anchor || '';
	let popup = browser.runtime.getURL('popup/popup.html#' + (anchor));
	console.log(popup);
	browser.browserAction.setPopup({'popup': popup});
}
