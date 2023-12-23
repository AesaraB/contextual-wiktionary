'use strict';
import { normalize, humanize, search, searchInput, extButton } from "./definitions.js";
import { define } from "./builder.js";

// These two code blocks operate when the popup is opened.
window.onload = () => { // Tell defineSelection.js that the popup is initialised.
	browser.runtime.sendMessage({ok: true});
	console.log("popup: opened");
	browser.storage.local.set({ history: [] });
	const anchor = browser.storage.local.get("_anchor"); // Set anchor
	anchor.then(({ _anchor }) => {
		let popup
		popup = browser.runtime.getURL('popup/popup.html#' + _anchor );
		browser.browserAction.setPopup({'popup': popup})
	})
};
browser.runtime.onMessage.addListener((selectionText) => { // defineSelection.js replies with the selectionText.
	let selection = selectionText || '';
	if (configs.preserveCase) {
		define(selection);
		return;
	}
	if (selection.toUpperCase() == selection) {  // Allcaps strings are not want to be lowercase/title case
		define(normalize(selection));
	} else {
		define(normalize(selection.toLowerCase()));
	}
	return;
});

search.addEventListener('submit', (e) => { // This is our search input stuff
	let query = e.target['0'].value;
	e.preventDefault();
	if (query.length > 0) {
		searchInput.disabled=true;
		define(query);
		setTimeout(() => {
			searchInput.disabled=false;
			searchInput.focus();
		}, 200);
	}
});

extButton.addEventListener('click', (e) => {
	e.preventDefault();
	browser.tabs.create({ url: extButton.href });
});
