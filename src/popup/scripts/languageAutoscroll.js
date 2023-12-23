// This script modifies the config to accomodate any other languages the user may want to see first.
export { csrunner };

async function csrunner() {
	await setAutoscroll();
	const listener = async e => {
		const { _anchor } = await browser.storage.local.get("_anchor");
		let target;
		if (e.target.id) {
			target = e.target;
		} else {
			target = e.target.parentElement;
		}
		e.preventDefault();
		switch(true){
			case(target.id === _anchor):
				browser.storage.local.set({ _anchor: '' });
				target.classList.remove('autoScrolled');
				console.log('configs: Removed anchor', target.id);
			break;
			default:
				browser.storage.local.set({ _anchor: target.id });
				target.classList.add('autoScrolled');
				console.log('configs: Set anchor', target.id);
		}
		await setAutoscroll();
	}
	const elements = document.querySelectorAll("a[id].langHeadingContainer");
	elements.forEach(element => { element.addEventListener('click', listener) }
	)
}

async function setAutoscroll() {
	const { _anchor } = await browser.storage.local.get("_anchor");
	const scrollY = window.scrollY
	const scrollX = window.scrollX
	location.hash = ("#" + _anchor);
	window.scrollTo(scrollX, scrollY)
	let popup = browser.runtime.getURL('popup/popup.html#' + (_anchor));
	browser.browserAction.setPopup({'popup': popup});
}
