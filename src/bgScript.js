// This script is used when defining a word from the context menu, and to listen for initialisation of the popup otherwise.

var selectionText, alternateapi, wiktionaryapi
const desiredPermissions = {permissions: ["activeTab", "scripting"]};

// Define something from the right click context menu
browser.contextMenus.create({
	id: 'wiktDefine',
	title: 'Define "%s"',
	contexts: ["selection"] 
})
browser.contextMenus.onClicked.addListener((clickData) => {
	selectionText = clickData.selectionText;
	console.log("bgScript: context menu item clicked");
	browser.browserAction.openPopup();
})

// Shortcut
browser.commands.onCommand.addListener(() => {
	browser.permissions.request(desiredPermissions);
	if (getPermissions) {
		browser.tabs
			.query({
				currentWindow: true,
				active: true,
			})
			.then(injectScript)
			.catch((error) => console.error(`Error: ${error}`));
	}
	console.log("bgScript: shortcut pressed")
	browser.browserAction.openPopup();
});

async function getPermissions() {
	return await browser.permissions.contains(desiredPermissions);
}

async function injectScript(tab) { // I should add error handling for this, but I'm so tired rn
	await browser.scripting.executeScript({
		target: {
			tabId: tab[0].id
		},
		func: () => {
			let selection;
			let activeEl = document.activeElement, start, end;
			if ( activeEl &&
				/^(textarea|input)$/i.test(activeEl.nodeName) &&
				(start = activeEl.selectionStart) != (end = activeEl.selectionEnd)) {
				selection = activeEl.value.slice(start, end);
			} else {
				selection = window.getSelection().toString();
			}
			browser.runtime.sendMessage({
				selection: selection,
			});
		}
	})
}

// I don't know what this stuff does tbh
configs.$loaded.then(res => { // Load Wiktionary API
	wiktionaryapi = res.wiktionaryapi
	alternateapi = res.alternateapi
})

browser.runtime.onMessage.addListener(message => {
	switch(true) {
		case(message.selection != null): // Listen for messages sent by content_scripts
			selectionText = message.selection;
		break;
		case(message.type === 'Configs:getLockedKeys'):
			wiktionaryapi = configs.wiktionaryapi;
			alternateapi = configs.alternateapi;
		break;
		case(message.ok): // If the popup opens without any errors, send the selectionText.
			browser.runtime.sendMessage(selectionText);
			selectionText = " "; // Clears memory of the selectionText for subsequent popup opening.
		break;
		case(message.ok != null && message.ok === false):
			console.error('An error occurred when opening the popup.');
			browser.runtime.sendMessage('A bug happened. Try again.');
		break;
	}
})
