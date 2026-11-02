# Native app / host integration

The sim adapts by itself. A host app only needs to:

1. Load the sim full screen in a WebView, landscape. The app hides its own bars and keeps its rails.
2. Optionally drive the sim with these calls.

No listener, bridge or URL flag is needed.

| when | call (Android `webView.evaluateJavascript(js, cb)`, iOS `evaluateJavaScript`) |
|---|---|
| page loaded (`onPageFinished`) | `FermiAppMode.handle({cmd:'native-rails'})`: hides the sim's own rail; your rails take over |
| Controls button | `FermiAppMode.handle({cmd:'panel'})` toggles the drawer; `{cmd:'panel', open:true, tab:'controls'\|'inquiry'}` sets it |
| Play/Pause | `{cmd:'toggle-play'}` (or `{cmd:'play'}` / `{cmd:'pause'}`) |
| Reset | `{cmd:'reset'}` |
| Guided Inquiry / tour / explanation | `{cmd:'inquiry'}` / `{cmd:'guide'}` / `{cmd:'physics'}` |
| system Back | `FermiAppMode.handle({cmd:'back'})` closes the Physics sheet, tour or drawer and **returns `true`**. It returns `false` when nothing was open: close the player then (v1.1.0; with 1.0.0 use the `{type:'back'}` message) |
| rails floating over the WebView | `{cmd:'insets', left:84, right:84, top:0, bottom:0}` in CSS px; the sim keeps its content clear of them |
| paint your buttons | `FermiAppMode.state()` returns a **JSON string**: `{playing, panelOpen, tab, docked, caps:{play,reset,guide,physics,inquiry}}`. On Android the callback value arrives JSON-quoted, so unquote it, then parse. Disable buttons whose cap is false |
| is this page supported? | `typeof FermiAppMode` is `'undefined'` when the layer is missing or didn't detect the page |

**Kotlin sketch:**
```kotlin
fun js(webView: WebView, code: String, cb: ((String) -> Unit)? = null) = webView.evaluateJavascript(code) { cb?.invoke(it) }
override fun onPageFinished(v: WebView, url: String) { js(v, "window.FermiAppMode && FermiAppMode.handle({cmd:'native-rails'})") }
controls.setOnClickListener { js(web, "FermiAppMode.handle({cmd:'panel'})") }
play.setOnClickListener { js(web, "FermiAppMode.handle({cmd:'toggle-play'})"); refresh() }
fun refresh() = js(web, "window.FermiAppMode ? FermiAppMode.state() : null") { raw ->
    if (raw != "null") { val s = JSONObject(JSONTokener(raw).nextValue() as String); play.setIcon(if (s.getBoolean("playing")) PAUSE else PLAY) } }
```

**Optional push channel (events instead of polling).** Register
`WebViewCompat.addWebMessageListener(webView, "FermiApp", setOf(origin)) { …, msg, … -> }` before the page loads.
The sim then posts JSON strings to `FermiApp.postMessage`:
- `{type:'ready', supported, family, title, caps, playing}`;
- `{type:'state', playing, panelOpen, tab, docked}`;
- `{type:'back', handled}`;
- `{type:'touch'}` on each tap, useful to wake faded rails.

**Web hosts (iframe):** the same messages go to `window.parent`. Send commands with
`iframe.contentWindow.postMessage({source:'fermi-app', cmd:'panel'}, '*')`.

## Layout advice from the 363-sim rollout
- **Phone (about 800×360 dp):**
  - Rails sit at the sides; the WebView fills the middle at full height (height is the scarce dimension in landscape).
  - Left rail: Close · Reload · About. Right rail: Controls · Play/Pause · Reset · Bookmark · Open in browser.
  - If the app doesn't wire the sim buttons, it can still ship. Each sim then shows its own small rail, and nothing
    is ever dead.
- **Tablet (1280×800):** a labelled left rail; the sim's own panel is docked inside the WebView, so don't also
  build a native panel.
- **Don't rebuild the sim's controls natively** from a control-list bridge. On real sims such lists are full of
  internal buttons, unlabelled sliders and id-less controls. The sim's own panel as the drawer is complete by
  construction.
- **Platform fit gates:** if your backend marks sims "desktop only" for phones, switch it to "rotate" (landscape)
  for converted sims. Otherwise phones never get to see the mobile view.
