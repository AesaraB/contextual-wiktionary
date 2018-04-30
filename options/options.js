var options = new Options(configs)

let customs = document.querySelectorAll(".jscolor")

for (let el of customs) {
	el.onchange = e => el.dispatchEvent(new InputEvent("input", {value: e.value}))
}

/* // bugged mess. check back in ff61.
let allurls = document.getElementById('allurls')
let requester = info => {
	browser.permissions.request({origins: ["<all_urls>"]})
	.catch(er => console.error("hm2",er))
//	.then(() => {browser.contentScripts.register({
////			allFrames: true,
//		matches: ["<all_urls>"],
////			runAt: "document_idle",
//		js: [ { code: "console.log('hi')" } ]//file: "/content_scripts/doubleclick.js" } ]
//	})
//	})
//	.catch(er => console.error("hm.",er))

}
allurls.addEventListener('click', requester)
*/

let reloadIFrame = () => document.querySelector('iframe').contentWindow.location.reload()

configs.$addObserver(reloadIFrame)

