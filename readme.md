# [Contextual Wiktionary](https://addons.mozilla.org/firefox/addon/contextual-wiktionary/)
Contextual Wiktionary is a Firefox web-extension that enables the user to search Wiktionary with the context menu or a pop-up. The Contextual Wiktionary extension uses the Unlicense license.

## Features
* Select a word and use the context-menu to search, or just use the add-on's search bar.
* Use and contribute to the world's largest open dictionary.
* Seamlessly tangent through definitions with embedded links and a search bar that lets you quickly learn what you're looking for.
* A self-contained design avoids build-up of tabs, though an external link button lets you view definitions in a new tab.
* View English definitions for non-English words.
* *Minimal* support for non-English Wiktionaries (due to API limitations).
* Themed for both light and dark modes\*, the add-on is designed to integrate\*\* easily with Firefox' design.

*\*updated Firefox Proton designs coming soon (Proton design specifications have yet to be released to my knowledge, but a Proton-like dark imitation theme is featured in the add-on).
\*\*due to API limitations, only the English Wiktionary is themed.*

# Requirements
This extension requires Firefox 57.

# Permissions
* *Context menus*
* *Wiktionary API [https://en.wiktionary.org/api/rest_v1/page/definition/\*](https://en.wiktionary.org/api/)*
* *Storage (for setting configuration)*

# Debugging the Extension
To debug Right Click Wiktionary:
1. Clone this repository
2. Init submodules with `git submodule update --init`
3. Head to `about:debugging`
4. Load the manifest.json as temporary addon.

# Acknowledgements
* This add-on was forked from [Losnappa's Right Click Wiktionary](https://gitlab.com/losnappas/Context-menu-Wiktionary/).
* Neither myself, nor Losnappas are officially affiliated with Wiktionary, or the Wikimedia Foundation in any way.
* If you like the work done on this add-on, [please consider supporting a charity](https://www.thetrevorproject.org).
