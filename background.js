var selectionText

browser.contextMenus.create({
  id: "Wiktionary",
  title: "Wiktionary",//browser.i18n.getMessage("contextMenuItem"),
  contexts: ["selection"]
})


function translate ( onClickData, tab ) {
	
	selectionText = onClickData.selectionText
	
	//Start by opening popup to make sure it is open when it is needed.
	//This is FF57+.
	// After the popup opens, it sends a message.
	browser.browserAction.openPopup()

}


browser.contextMenus.onClicked.addListener(translate)

/* popup is open, it sends a message */
browser.runtime.onMessage.addListener( message => {
	/* respond with the word to translate */
	if (message.ok) {
		browser.runtime.sendMessage(selectionText)
	}else if(message.ok != null && message.ok === false) {
		browser.runtime.sendMessage("A bug happened. Try again.")
	}
} )

