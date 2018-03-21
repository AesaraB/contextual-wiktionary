var options = new Options(configs)

let customs = document.querySelectorAll(".jscolor")

for (let el of customs) {
	el.onchange = e => el.dispatchEvent(new InputEvent("input", {value: e.value}))
}

let reloadIFrame = () => document.querySelector('iframe').contentWindow.location.reload()

configs.$addObserver(reloadIFrame)

