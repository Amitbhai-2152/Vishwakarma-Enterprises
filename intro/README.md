# Vishwakarma Enterprises homepage intro

## Active intro file

The homepage currently loads:

`intro/vishwakarma_enterprises_4k_intro_showcase.html`

This is the HTML file uploaded for the logo intro. Its supporting visuals and animation are inline; it uses external Tailwind CSS and Google Fonts resources.

## Playback behaviour

- The intro starts automatically on every homepage visit.
- The animation runs once (10 seconds) and then returns to the homepage.
- It starts silently because browsers generally block audible autoplay.
- The visitor can click **Enable sound + replay intro** to replay with sound.
- The homepage has its own **Skip intro** control.
- The intro sends `VE_INTRO_READY` when initialized and `VE_INTRO_FINISHED` when its timeline ends.

## Upload a newer intro

Replace the active HTML file above. Keep all required relative assets inside the `intro/` folder and update their paths in the HTML.

## Quick rollback

Open `js/intro-config.js` and change:

`enabled: true`

to:

`enabled: false`

The homepage immediately skips the intro and displays its regular content.
