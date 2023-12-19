// This script modifies the config to accomodate any other languages the user may want to see first.
export { csrunner };

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
