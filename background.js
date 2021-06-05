/* global configs */
var selectionText
var alternateapi
var wiktionaryapi
const normalize = word => word.trim().toUpperCase()===word.trim() ? word.trim() : word.trim().replace(/ /g, '_').toLowerCase()
browser.contextMenus.create({
	id: 'Wiktionary',
	title: 'Wiktionary',//browser.i18n.getMessage("contextMenuItem"),
	contexts: ['selection']
})

configs.$loaded.then(res => {
	wiktionaryapi = res.wiktionaryapi
	alternateapi = res.alternateapi
})

function translate ( onClickData ) {
	selectionText = onClickData.selectionText
	let popup
	let anchor = configs._anchor || ''
	if (wiktionaryapi !== '') {
		if (!alternateapi) {
			popup = `https://${wiktionaryapi}/wiki/${normalize(selectionText)}`
		} else {
			popup = `https://${wiktionaryapi}/api/rest_v1/page/html/${normalize(selectionText)}`
		}
	} else {
		popup = browser.runtime.getURL('popup/popup.html#' + (anchor.replace(/ /g, '_')))
	}

	browser.browserAction.setPopup({
		'popup': popup
	})
	//Start by opening popup to make sure it is open when it is needed.
	//This is FF57+.
	// After the popup opens, it sends a message.
	browser.browserAction.openPopup()
}


browser.contextMenus.onClicked.addListener(translate)

/* popup is open, it sends a message */
browser.runtime.onMessage.addListener( message => {
	if ( message.type === 'Configs:getLockedKeys' ) {
		wiktionaryapi = configs.wiktionaryapi
		alternateapi = configs.alternateapi
	}
	/* respond with the word to translate */
	else if (message.ok) {
		browser.runtime.sendMessage(selectionText)
	}else if(message.ok != null && message.ok === false) {
		browser.runtime.sendMessage('A bug happened. Try again.')
	}
} )
