// This script is used when defining a word from the context menu, and to listen for initialisation of the popup otherwise.

var selectionText
var alternateapi
var wiktionaryapi
const normalize = word => word.trim().toUpperCase()===word.trim() ? word.trim() : word.trim().replace(/ /g, '_').toLowerCase()


configs.$loaded.then(res => { // Load Wiktionary API
	wiktionaryapi = res.wiktionaryapi
	alternateapi = res.alternateapi
})

browser.contextMenus.create({
	id: 'wiktDefine',
	title: 'Define "%s"',
	contexts: ["selection"] 
})

browser.contextMenus.onClicked.addListener(translate) // Calls the translate function.

function translate (onClickData) {
	selectionText = onClickData.selectionText
	let popup
	let anchor = configs._anchor || ''
	
	switch(true) { // Checks whether an alternative API is being used.
		case((wiktionaryapi !== 'en.wiktionary.org' || '') && alternateapi):
			popup = `https://${wiktionaryapi}/api/rest_v1/page/html/${normalize(selectionText)}`;
			break;
		case(!alternateapi):
			popup = `https://${wiktionaryapi}/wiki/${normalize(selectionText)}`;
			break;
		default:
			popup = browser.runtime.getURL('popup/popup.html#' + (anchor.replace(/ /g, '_')))
	}
	
	browser.browserAction.setPopup({'popup': popup})
	browser.browserAction.openPopup()
}

browser.runtime.onMessage.addListener(message => { // Listen for messages sent by the popup.
	switch(true) {
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
