'use strict';
import { normalize, humanize, search, searchInput, link } from "./definitions.js";
import { define } from "./builder.js";

window.onload = () => { // First, tell defineSelection.js (background script) that the popup is initialised.
	browser.runtime.sendMessage({ok: true});
};

browser.runtime.onMessage.addListener((selectionText) => { //defineSelection.js replies with the selectionText.
	let selection = selectionText || '';
	if (selection.toUpperCase() == selection) {  // Don't normalise strings that are written in allcaps (for acronyms).
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
