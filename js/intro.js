/*
 * Vishwakarma Enterprises — isolated homepage logo intro
 * Safe fallback: any missing/broken video or autoplay failure reveals the website.
 */
(() => {
  "use strict";

  const config = window.VE_INTRO_CONFIG || {};
  const root = document.documentElement;

  const labels = () => {
    const english = root.lang === "en";
    return english
      ? { enableSound: "Enable sound", muteSound: "Mute sound", skip: "Skip intro" }
      : { enableSound: "आवाज़ चालू करें", muteSound: "आवाज़ बंद करें", skip: "इंट्रो छोड़ें" };
  };

  const removePendingState = () => {
    root.classList.remove("ve-intro-pending");
  };

  const initialiseIntro = () => {
    if (!config.enabled) {
      removePendingState();
      return;
    }

    const overlay = document.getElementById("ve-intro-overlay");
    const video = document.getElementById("ve-intro-video");
    const skipButton = document.getElementById("ve-intro-skip");
    const soundButton = document.getElementById("ve-intro-sound");

    const revealWebsite = () => {
      removePendingState();
      if (overlay) overlay.hidden = true;
    };

    if (
      !overlay ||
      !video ||
      !config.videoSrc ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      revealWebsite();
      return;
    }

    let finished = false;
    let loadTimer = null;

    const finishIntro = () => {
      if (finished) return;
      finished = true;

      if (loadTimer !== null) window.clearTimeout(loadTimer);
      video.pause();
      overlay.setAttribute("aria-hidden", "true");
      overlay.classList.add("ve-intro-exiting");

      const fadeDuration = Number(config.fadeDurationMs) || 650;
      window.setTimeout(() => {
        overlay.hidden = true;
        overlay.classList.remove("ve-intro-exiting");
        removePendingState();
      }, fadeDuration);
    };

    const updateSoundLabel = () => {
      const text = labels();
      const isMuted = video.muted;
      soundButton.textContent = isMuted ? text.enableSound : text.muteSound;
      soundButton.setAttribute("aria-label", soundButton.textContent);
      soundButton.setAttribute("aria-pressed", String(!isMuted));
    };

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    if (skipButton) {
      skipButton.textContent = labels().skip;
      skipButton.addEventListener("click", finishIntro, { once: true });
    }

    if (soundButton) {
      updateSoundLabel();
      soundButton.addEventListener("click", () => {
        video.muted = !video.muted;
        updateSoundLabel();
      });
    }

    video.addEventListener("ended", finishIntro, { once: true });
    video.addEventListener("error", finishIntro, { once: true });

    video.addEventListener("canplay", () => {
      if (loadTimer !== null) {
        window.clearTimeout(loadTimer);
        loadTimer = null;
      }

      const playback = video.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(finishIntro);
      }
    }, { once: true });

    loadTimer = window.setTimeout(
      finishIntro,
      Math.max(3000, Number(config.loadTimeoutMs) || 20000)
    );

    video.src = config.videoSrc;
    video.load();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseIntro, { once: true });
  } else {
    initialiseIntro();
  }
})();
