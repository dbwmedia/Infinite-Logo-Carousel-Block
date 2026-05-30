/**
 * Infinite Logo Carousel Block – Frontend Script
 *
 * Builds a per-track keyframe animation sized to exactly one logo set, so the
 * loop is seamless regardless of logo count or individual image dimensions.
 * Supports single-row and multi-row layouts (each row is its own track and can
 * scroll in either direction).
 *
 * Key design points:
 * - The carousel starts hidden (CSS) and is revealed only once every track is
 *   ready, so the visitor never sees the layout build up / shift on load.
 * - The width is measured only AFTER the first logo set of a track has finished
 *   loading. Measuring earlier (e.g. with lazy-loaded, not-yet-loaded images)
 *   yields zero-width images and therefore a frozen carousel.
 * - A ResizeObserver keeps the animation correct when a track changes size
 *   later on (responsive breakpoints, lazy/late-loading images, web fonts).
 */
(function () {
	"use strict";

	var SETTLE_DELAY = 250; // Debounce (ms) for the no-ResizeObserver fallback.

	// Calibration width (px). For a carousel wider than this the scroll speed
	// equals (this width / configured duration) pixels per second — so a
	// SMALLER value here means a slower carousel overall. It also keeps the
	// speed consistent regardless of the number of logos. Narrower carousels
	// keep their plain configured duration.
	var REFERENCE_WIDTH = 1000;

	/**
	 * Whether the visitor has asked for reduced motion. The carousel then stays
	 * static (the matching CSS media query also disables the fallback animation).
	 *
	 * @return {boolean} True when reduced motion is preferred.
	 */
	function prefersReducedMotion() {
		return (
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		);
	}

	/**
	 * Whether an element's resolved background colour is dark. getComputedStyle
	 * always returns rgb()/rgba(), so this works for theme CSS variables,
	 * named colours and hex alike — unlike a save-time hex-only check.
	 *
	 * @param {HTMLElement} el Element to inspect.
	 * @return {boolean} True when the background is dark.
	 */
	function isBackgroundDark(el) {
		var parts = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
		if (!parts || parts.length < 3) {
			return true;
		}
		var r = parseFloat(parts[0]);
		var g = parseFloat(parts[1]);
		var b = parseFloat(parts[2]);
		return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
	}

	/**
	 * Give every filled capsule a logo colour that contrasts its actual
	 * background. Outline capsules are skipped — they use an explicitly chosen
	 * logo colour. Runs before the carousel is revealed, so there is no flash
	 * of an invisible (white-on-white) logo.
	 *
	 * @param {HTMLElement} slider The .dbw-partner-slider element.
	 */
	function fixCapsuleContrast(slider) {
		if (
			!slider.classList.contains("dbw-capsules") ||
			slider.classList.contains("dbw-cap-outline") ||
			slider.classList.contains("dbw-cap-logo-manual")
		) {
			return;
		}
		["dbw-cap-a", "dbw-cap-b"].forEach(function (colorClass) {
			var sample = slider.querySelector("." + colorClass);
			if (!sample) {
				return;
			}
			var dark = isBackgroundDark(sample);
			var add = dark ? "dbw-logo-light" : "dbw-logo-dark";
			var remove = dark ? "dbw-logo-dark" : "dbw-logo-light";
			var capsules = slider.querySelectorAll("." + colorClass);
			for (var i = 0; i < capsules.length; i++) {
				capsules[i].classList.add(add);
				capsules[i].classList.remove(remove);
			}
		});
	}

	/**
	 * Measure the combined width of one full logo set (the first `logoCount`
	 * items of a track).
	 *
	 * @param {NodeList} items     All slider items inside the track.
	 * @param {number}   logoCount Number of items that form one set.
	 * @return {number} Width of one set in pixels.
	 */
	function measureSetWidth(items, logoCount) {
		var width = 0;
		for (var i = 0; i < logoCount && i < items.length; i++) {
			width += items[i].getBoundingClientRect().width;
		}
		return width;
	}

	/**
	 * Apply (or update) the scroll animation for a single track.
	 *
	 * Skips work when the measured width has not meaningfully changed, so the
	 * animation does not restart on every sub-pixel layout fluctuation.
	 *
	 * @param {HTMLElement} track    The .dbw-slider-track element.
	 * @param {number}      setWidth Width of one logo set in pixels.
	 */
	function applyAnimation(track, setWidth) {
		// Without a usable measurement we leave the CSS fallback animation in place.
		if (setWidth < 1) {
			return;
		}

		// Ignore sub-pixel jitter so the animation does not restart needlessly.
		if (Math.abs(setWidth - (track._dbwSetWidth || 0)) < 1) {
			return;
		}
		track._dbwSetWidth = setWidth;

		// One stable keyframe name per track, reused across recalculations.
		var animationName = track._dbwAnimName;
		if (!animationName) {
			animationName = "dbw-scroll-" + Math.random().toString(36).slice(2, 11);
			track._dbwAnimName = animationName;
		}

		// A dedicated <style> element per track keeps the lifecycle clean.
		var styleEl = track._dbwStyleEl;
		if (!styleEl) {
			styleEl = document.createElement("style");
			document.head.appendChild(styleEl);
			track._dbwStyleEl = styleEl;
		}
		styleEl.textContent =
			"@keyframes " + animationName + "{" +
			"0%{transform:translateX(0)}" +
			"100%{transform:translateX(-" + setWidth + "px)}}";

		// Scale the configured duration to the actual set width, so the visual
		// speed stays consistent regardless of the number of logos. A wide set
		// (many logos) would otherwise race past at the same fixed duration.
		var baseDuration =
			parseFloat(
				getComputedStyle(track).getPropertyValue("--scroll-duration")
			) || 25;
		var durationSec = baseDuration * Math.max(1, setWidth / REFERENCE_WIDTH);
		var duration = durationSec.toFixed(2) + "s";

		var reverse = track.dataset.direction === "reverse";
		track.style.animation =
			animationName + " " + duration + " linear infinite" +
			(reverse ? " reverse" : "");
	}

	/**
	 * Invoke `callback` once every image in `images` has finished loading
	 * (or failed). Resolves immediately when there is nothing to wait for.
	 *
	 * @param {HTMLImageElement[]} images   Images to wait for.
	 * @param {Function}           callback Called once when all images settled.
	 */
	function whenImagesReady(images, callback) {
		var pending = images.length;
		if (pending === 0) {
			callback();
			return;
		}
		var settle = function () {
			pending--;
			if (pending === 0) {
				callback();
			}
		};
		images.forEach(function (img) {
			if (img.complete) {
				settle();
			} else {
				img.addEventListener("load", settle, { once: true });
				img.addEventListener("error", settle, { once: true });
			}
		});
	}

	/**
	 * Initialise a single track: measure, animate and keep it self-healing.
	 *
	 * `onReady` is invoked exactly once as soon as the track is ready to be
	 * shown – on every code path, so the slider can never stay hidden.
	 *
	 * @param {HTMLElement} track   The .dbw-slider-track element.
	 * @param {HTMLElement} slider  The parent .dbw-partner-slider element.
	 * @param {Function}    onReady Called once when this track is ready.
	 */
	function initTrack(track, slider, onReady) {
		var items = track.querySelectorAll(".dbw-slider-item");
		if (items.length === 0) {
			onReady();
			return;
		}

		// Logo count: per-track data attribute (v1.3+), with a fallback to the
		// slider-level CSS variable for content saved before v1.3.
		var logoCount = parseInt(track.dataset.logoCount, 10);
		if (!logoCount) {
			logoCount =
				parseInt(slider.style.getPropertyValue("--logo-count"), 10) || 0;
		}
		if (logoCount === 0) {
			onReady();
			return;
		}

		// Respect the reduced-motion preference: leave the row completely
		// static instead of building and applying a scroll animation.
		if (prefersReducedMotion()) {
			onReady();
			return;
		}

		// Animation is only applied once the first logo set has loaded; before
		// that any measurement would be wrong and freeze the carousel.
		var imagesReady = false;

		var recalc = function () {
			if (!imagesReady) {
				return;
			}
			applyAnimation(track, measureSetWidth(items, logoCount));
		};

		// Collect the images of the first set and start once they are loaded.
		var firstSet = [];
		for (var i = 0; i < logoCount && i < items.length; i++) {
			var img = items[i].querySelector("img");
			if (img) {
				firstSet.push(img);
			}
		}
		whenImagesReady(firstSet, function () {
			imagesReady = true;
			recalc();
			onReady();
		});

		// Self-healing: re-measure whenever the track changes size – responsive
		// breakpoints, lazy/late-loading images, web fonts swapping in, etc.
		if (typeof ResizeObserver !== "undefined") {
			var rafId;
			var observer = new ResizeObserver(function () {
				cancelAnimationFrame(rafId);
				rafId = requestAnimationFrame(recalc);
			});
			observer.observe(track);
			track._dbwObserver = observer;
		} else {
			// Fallback for browsers without ResizeObserver support.
			var resizeTimer;
			window.addEventListener("resize", function () {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(recalc, SETTLE_DELAY);
			});
		}
	}

	/**
	 * Pause or resume every track of a slider at once.
	 *
	 * @param {HTMLElement} slider The .dbw-partner-slider element.
	 * @param {string}      state  "paused" or "running".
	 */
	function setPlayState(slider, state) {
		var tracks = slider.querySelectorAll(".dbw-slider-track");
		for (var i = 0; i < tracks.length; i++) {
			tracks[i].style.animationPlayState = state;
		}
	}

	/**
	 * Initialise a slider: every track inside it, the shared hover/touch pause
	 * behaviour, and the reveal once all tracks are ready.
	 *
	 * @param {HTMLElement} slider The .dbw-partner-slider element.
	 */
	function initSlider(slider) {
		var tracks = slider.querySelectorAll(".dbw-slider-track");

		// Correct filled-capsule logo contrast against the resolved background
		// colour — needed when the capsule colour is a theme CSS variable.
		fixCapsuleContrast(slider);

		// Reveal the carousel only once every track is ready (images loaded
		// and animation applied). This prevents the visible build-up / shift
		// while images and layout are still settling.
		var revealed = false;
		var reveal = function () {
			if (revealed) {
				return;
			}
			revealed = true;
			slider.classList.add("dbw-ready");
		};

		if (tracks.length === 0) {
			reveal();
			return;
		}

		var pending = tracks.length;
		var trackReady = function () {
			pending--;
			if (pending === 0) {
				reveal();
			}
		};

		tracks.forEach(function (track) {
			initTrack(track, slider, trackReady);
		});

		// Pause on hover (desktop / pointer devices).
		slider.addEventListener("mouseenter", function () {
			setPlayState(slider, "paused");
		});
		slider.addEventListener("mouseleave", function () {
			setPlayState(slider, "running");
		});

		// Tap to toggle pause (touch devices).
		var touchPaused = false;
		slider.addEventListener(
			"touchstart",
			function (e) {
				if (e.touches.length === 1) {
					touchPaused = !touchPaused;
					setPlayState(slider, touchPaused ? "paused" : "running");
				}
			},
			{ passive: true }
		);
	}

	/**
	 * Find and initialise every carousel on the page exactly once.
	 */
	function initLogoSliders() {
		var sliders = document.querySelectorAll(".dbw-partner-slider");
		sliders.forEach(function (slider) {
			if (slider.dataset.initialized === "true") {
				return;
			}
			slider.dataset.initialized = "true";
			initSlider(slider);
		});
	}

	// Initialise as soon as the DOM is ready.
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initLogoSliders);
	} else {
		initLogoSliders();
	}

	// Gutenberg editor live preview (harmless on the front end).
	if (window.wp && window.wp.domReady) {
		window.wp.domReady(function () {
			setTimeout(initLogoSliders, 100);
		});
	}
})();
