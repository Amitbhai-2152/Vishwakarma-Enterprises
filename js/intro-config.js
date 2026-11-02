/*
 * Vishwakarma Enterprises — homepage logo intro configuration
 *
 * The intro stays disabled until the video file is uploaded.
 * To activate it later, change enabled to true.
 * To disable it instantly, change enabled back to false.
 */
window.VE_INTRO_CONFIG = Object.freeze({
  enabled: false,
  playEveryVisit: true,
  videoSrc: "videos/logo-intro.mp4",
  loadTimeoutMs: 20000,
  fadeDurationMs: 650
});
