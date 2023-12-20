'use strict';
import { normalize, humanize, search, searchInput, link } from "./definitions.js";
import { define } from "./builder.js";

// These two code blocks operate when the popup is opened.
window.onload = () => { // Tell defineSelection.js that the popup is initialised.
	browser.runtime.sendMessage({ok: true});
	console.log("popup: opened");
};
browser.runtime.onMessage.addListener((selectionText) => { // defineSelection.js replies with the selectionText.
	let selection = selectionText || '';
	if (selection.toUpperCase() == selection) {  // Allcaps strings are not want to be lowercase/title case
		define(normalize(selection));
	} else {
		define(normalize(selection.toLowerCase()));
	}
});

search.addEventListener('submit', (e) => { // This is our search input stuff
	searchInput.disabled=true;
	e.preventDefault();
	define(e.target['0'].value);
	setTimeout(() => {
	 	searchInput.disabled=false;
		searchInput.focus();
	}, 200);
});

link.addEventListener('click', (e) => {
	e.preventDefault();
	browser.tabs.create({ url: link.href });
});
