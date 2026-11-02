/*
 * Vishwakarma Enterprises — isolated homepage HTML intro
 * The standalone intro runs in a same-origin iframe.
 * It can notify this page with VE_INTRO_READY and VE_INTRO_FINISHED.
 * Failure to load or signal readiness reveals the normal homepage.
 */
(() => {
  "use strict";

  const config = window.VE_INTRO_CONFIG || {};
  const root = document.documentElement;

  const finishPageSetup = () => root.classList.remove("ve-intro-pending");

  const initialiseIntro = () => {
    if (!config.enabled) {
      finishPageSetup();
      return;
    }

    const overlay = document.getElementById("ve-intro-overlay");
    const frame = document.getElementById("ve-intro-frame");
    const skipButton = document.getElementById("ve-intro-skip");

    const revealWebsite = () => {
      finishPageSetup();
      if (overlay) overlay.hidden = true;
    };

    if (
      !overlay ||
      !frame ||
      !config.introSrc ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      revealWebsite();
      return;
    }

    let finished = false;
    let readyTimer = null;
    let maxTimer = null;
    const readyTimeoutMs = Math.max(3000, Number(config.readyTimeoutMs) || 12000);
    const maxDurationMs = Math.max(readyTimeoutMs, Number(config.maxDurationMs) || 90000);
    const fadeDurationMs = Math.max(0, Number(config.fadeDurationMs) || 650);

    const finishIntro = () => {
      if (finished) return;
      finished = true;

      if (readyTimer !== null) window.clearTimeout(readyTimer);
      if (maxTimer !== null) window.clearTimeout(maxTimer);

      overlay.setAttribute("aria-hidden", "true");
      overlay.classList.add("ve-intro-exiting");

      window.setTimeout(() => {
        overlay.hidden = true;
        overlay.classList.remove("ve-intro-exiting");
        finishPageSetup();
      }, fadeDurationMs);
    };

    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.contentWindow) return;

      const message = event.data;
      if (message === "VE_INTRO_READY" || message?.type === "VE_INTRO_READY") {
        if (readyTimer !== null) {
          window.clearTimeout(readyTimer);
          readyTimer = null;
        }
        return;
      }

      if (message === "VE_INTRO_FINISHED" || message?.type === "VE_INTRO_FINISHED") {
        finishIntro();
      }
    };

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");

    if (skipButton) {
      skipButton.addEventListener("click", finishIntro, { once: true });
    }

    window.addEventListener("message", onMessage);

    // A valid intro page should send VE_INTRO_READY when its UI is ready.
    // If it never does, fail open instead of trapping visitors on a blank screen.
    readyTimer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      revealWebsite();
    }, readyTimeoutMs);

    // Last-resort safety net for an intro page that never signals completion.
    maxTimer = window.setTimeout(finishIntro, maxDurationMs);

    frame.addEventListener("error", revealWebsite, { once: true });
    frame.src = config.introSrc;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseIntro, { once: true });
  } else {
    initialiseIntro();
  }
})();
