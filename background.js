var selectionText
var wiktionaryapi
const normalize = word => word.trim().toUpperCase()===word.trim() ? word.trim() : word.trim().replace(/ /g, "_").toLowerCase()
browser.contextMenus.create({
  id: "Wiktionary",
  title: "Wiktionary",//browser.i18n.getMessage("contextMenuItem"),
  contexts: ["selection"]
})

configs.$loaded.then(res => wiktionaryapi=res.wiktionaryapi)

function translate ( onClickData, tab ) {
	selectionText = onClickData.selectionText
	let popup = wiktionaryapi !== "" ? `https://${wiktionaryapi}/wiki/${normalize(selectionText)}` : null
	browser.browserAction.setPopup({
		"popup": popup
	})
	//Start by opening popup to make sure it is open when it is needed.
	//This is FF57+.
	// After the popup opens, it sends a message.
	browser.browserAction.openPopup()
}


browser.contextMenus.onClicked.addListener(translate)

/* popup is open, it sends a message */
browser.runtime.onMessage.addListener( message => {
	if (message.type === "Configs:updated" && message.key==="wiktionaryapi") {
		wiktionaryapi = message.value
	}
	/* respond with the word to translate */
	else if (message.ok) {
		browser.runtime.sendMessage(selectionText)
	}else if(message.ok != null && message.ok === false) {
		browser.runtime.sendMessage("A bug happened. Try again.")
	}
} )

