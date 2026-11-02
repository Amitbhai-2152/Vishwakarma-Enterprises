# Homepage logo intro video

Upload the finished logo-intro video into this folder with this exact filename:

`logo-intro.mp4`

Expected path: `videos/logo-intro.mp4`

After the video has been uploaded, activate the intro by changing:

`enabled: false`

to:

`enabled: true`

in `js/intro-config.js`.

The intro is configured to play on every homepage visit. It starts muted because browsers commonly restrict automatic playback with sound; visitors can use the on-screen sound button. The skip button remains available.

Recommended export: MP4 (H.264 video + AAC audio), 16:9, 1080p. Keep the file reasonably compressed for mobile visitors.

If the file is missing, cannot load, or autoplay is blocked, the website fails open and reveals the normal homepage.
