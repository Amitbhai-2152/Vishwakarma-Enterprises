# Upload your homepage intro HTML here

## Exact upload location

Replace this file with your finished intro HTML:

`intro/index.html`

You can upload supporting files into this same `intro/` folder, for example:

- `intro/style.css`
- `intro/animation.js`
- `intro/images/logo.png`
- `intro/audio/intro.mp3`

Use relative paths in your HTML, such as `./style.css`, `./animation.js`, and `./images/logo.png`.

## Tell the homepage when the intro is ready and finished

The homepage displays the intro in a full-screen iframe. To let the homepage know that the page is ready, add this to your intro HTML after its main elements are ready:

```html
<script>
  window.parent.postMessage("VE_INTRO_READY", window.location.origin);
</script>
```

When your final animation/timeline ends, call:

```javascript
window.parent.postMessage("VE_INTRO_FINISHED", window.location.origin);
```

You can put the second call in your animation's `animationend` handler or at the end of your timeline. Do not call it immediately on page load.

A **Skip intro** button is also displayed above the intro. As a safety measure, the homepage reveals itself if the intro does not send its ready signal within 12 seconds, or if it runs longer than 90 seconds.

## Activate after upload

In `js/intro-config.js`, change:

`enabled: false`

to:

`enabled: true`

The intro is configured to play on every homepage visit. Keep the file disabled until your actual HTML intro and its assets are uploaded.

## Quick rollback

Change `enabled: true` back to `enabled: false` in `js/intro-config.js`. No homepage content needs to be removed.
