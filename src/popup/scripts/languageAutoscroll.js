// This script modifies the config to accomodate any other languages the user may want to see first.
export { setAutoscroll };

function setAutoscroll() {
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
				target.classList.remove('autoScrolled');
				console.log('configs: Removed anchor', target.id);
			break;
			default:
				const existingAutoScroll = document.getElementsByClassName("autoScrolled")[0];
				if (existingAutoScroll) {
					existingAutoScroll.classList.remove("autoScrolled");
				}
				configs._anchor = target.id;
				target.classList.add('autoScrolled');
				console.log('configs: Set anchor', target.id);
		}
		setAnchor()
	}
	const elements = document.querySelectorAll("a[id].langHeadingContainer");
	elements.forEach(element => { element.addEventListener('click', listener) }
	)
}

function setAnchor() {
	let anchor = configs._anchor || '';
	const scrollY = window.scrollY
	const scrollX = window.scrollX
	location.hash = ("#" + anchor);
	window.scrollTo(scrollX, scrollY)
	let popup = browser.runtime.getURL('popup/popup.html#' + (anchor));
	browser.browserAction.setPopup({'popup': popup});
}
