// This script modifies the config to accomodate any other languages the user may want to see first.
export { csrunner, expand };
const SCROLLDOWNWAIT = 10; // Opening the slider autoscrolls. -- In ms: the timeout before scrolling lower again.

// Expander for the button
function expand() {
	const slider = document.getElementById('slider');
	if (slider && !slider.classList.toggle('closed')) {
		// Scroll down with the expanding div
		scrollDown(0, 0);
	}
}

// TODO: improve this.. looks terrible sometimes.... but ehh---
// Compare current height to next height. If they don't match, then re-scroll to bottom and go again. If they do, goto step 1 10 times to make this thing less glitchy.
function scrollDown(cur, tries) {
	// Scrolls down with the expanding div.
	if (cur != document.body.scrollHeight) {
		window.scrollTo(0, document.body.scrollHeight);
		// Now this is lexical
		const x = document.body.scrollHeight;
		setTimeout(() => scrollDown(x, 0), SCROLLDOWNWAIT);
	} else if (tries < 10) {
		setTimeout(() => scrollDown(cur, tries + 1), SCROLLDOWNWAIT);
	}
}

function csrunner() {
    const els = document.querySelectorAll('#content h2[id]');

    const listener = e => {
        e.preventDefault();
        const x = document.querySelector('.auto-scrolled');
		
		switch(true){
			case(x):
				x.classList.remove('auto-scrolled')
				break;
			case(e.target.id === configs._anchor):
            configs._anchor = '';
				e.target.classList.remove('auto-scrolled');
				console.log('removed anchor', e.target.id, configs);
				setAutoscroll()
				break;
			default:
				configs._anchor = e.target.id;
				e.target.classList.add('auto-scrolled');
				console.log('set anchor', e.target.id, configs);
				setAutoscroll()
				
		}
	}
    els.forEach(el => {el.addEventListener('click', listener)})

}

function setAutoscroll() {
	let anchor = configs._anchor || '';
	let popup = browser.runtime.getURL('popup/popup.html#' + (anchor.replace(/ /g, '_')));
	browser.browserAction.setPopup({'popup': popup});
}
