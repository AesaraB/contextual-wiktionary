// This script is used when defining a word from the context menu, and to listen for initialisation of the popup otherwise.
const desiredPermissions = { permissions: ["activeTab", "scripting"] };
const normalize = (word) => {
	word.trim().toUpperCase() === word.trim() ? word.normalize().trim() : word.normalize().trim().replace(/ /g, "_").toLowerCase();
};
const versionNum = browser.runtime.getManifest().version;
const versionSetup = browser.storage.local.get("currentVersion");
let selectionText;
let wiktionaryapi;
let alternateapi;

versionSetup.then(({ currentVersion }) => {
	if (currentVersion == null || currentVersion !== versionNum) {
		browser.storage.local.set({
			style: "acorn",
			currentVersion: versionNum,
			patchNotesTimes: 0,
		});
	}
});

// Alternative Wiktionary api/non formatted
configs.$loaded.then((res) => {
	// Load Wiktionary API
	wiktionaryapi = res.wiktionaryapi;
	alternateapi = res.alternateapi;
});
function setWiktionary() {
	let popup;
	const anchor = configs._anchor || "";
	console.log(anchor);
	switch (
		true // Checks whether an alternative API is being used.
	) {
		case (wiktionaryapi !== "en.wiktionary.org" || "") && alternateapi:
			popup = `https://${wiktionaryapi}/api/rest_v1/page/html/${normalize(selectionText)}`;
			break;
		case !alternateapi:
			popup = `https://${wiktionaryapi}/wiki/${normalize(selectionText)}`;
			break;
		default:
			popup = browser.runtime.getURL(`popup/popup.html#${anchor.replace(/ /g, '_')}`)
	}
	browser.browserAction.setPopup({ popup: popup });
}

// Open browserAction
// Define something from the right click context menu
browser.contextMenus.create({
	id: "wiktDefine",
	title: 'Define "%s"',
	contexts: ["selection"],
});
browser.contextMenus.onClicked.addListener((clickData) => {
	selectionText = clickData.selectionText;
	console.log("bgScript: context menu item clicked");
	setWiktionary();
	browser.browserAction.openPopup();
});

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
	console.log("bgScript: shortcut pressed");
	setWiktionary();
	browser.browserAction.openPopup();
});

async function getPermissions() {
	return await browser.permissions.contains(desiredPermissions);
}

async function injectScript(tab) {
	// I should add error handling for this, but I'm so tired rn
	await browser.scripting.executeScript({
		target: {
			tabId: tab[0].id,
		},
		func: () => {
			let selection;
			const activeEl = document.activeElement; // This part is for inputs
			const start = activeEl.selectionStart;
			const end = activeEl.selectionEnd;
			if (activeEl && /^(textarea|input)$/i.test(activeEl.nodeName) && start !== end) {
				selection = activeEl.value.slice(start, end);
			} else {
				selection = window.getSelection().toString();
			}
			browser.runtime.sendMessage({
				selection: selection,
			});
		},
	});
}

// I don't know what this stuff does tbh
configs.$loaded.then((res) => {
	// Load Wiktionary API
	wiktionaryapi = res.wiktionaryapi;
	alternateapi = res.alternateapi;
});

browser.runtime.onMessage.addListener((message) => {
	switch (true) {
		case message.selection != null: // Listen for messages sent by content_scripts
			selectionText = message.selection;
			break;
		case message.type === "Configs:getLockedKeys":
			wiktionaryapi = configs.wiktionaryapi;
			alternateapi = configs.alternateapi;
			break;
		case message.ok: // If the popup opens without any errors, send the selectionText.
			browser.runtime.sendMessage(selectionText);
			selectionText = " "; // Clears memory of the selectionText for subsequent popup opening.
			break;
		case message.ok != null && message.ok === false:
			console.error("An error occurred when opening the popup.");
			browser.runtime.sendMessage("A bug happened. Try again.");
			break;
	}
});
