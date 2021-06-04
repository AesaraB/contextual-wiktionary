var options = new Options(configs)

for (const el of customs) {
	el.onchange = e => el.dispatchEvent(new InputEvent('input', {value: e.value}))
}

const reloadIFrame = () => document.querySelector('iframe').contentWindow.location.reload()

configs.$addObserver(reloadIFrame)