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

	// Spotlight mode: how long the cross-fade / slide takes. Must match the
	// --spot-fade value in style.scss — the script waits for it before
	// resetting an outgoing logo to its starting position.
	var SPOT_TRANSITION_MS = 450;

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

	// Balanced logo sizes: reference aspect ratio and scale bounds. Must match
	// the values used for the editor preview in src/index.js.
	var BALANCE_REF_RATIO = 2;
	var BALANCE_MIN_SCALE = 0.65;
	var BALANCE_MAX_SCALE = 1.4;

	/**
	 * Apply the balanced-size scale factor to every item of a track. The scale
	 * equalises the logos' *area* instead of their height: sqrt(REF / ratio),
	 * clamped — wide logos shrink a little, compact logos grow a little. Runs
	 * after the first logo set has loaded (natural sizes are then available)
	 * and before the track is measured for the scroll animation.
	 *
	 * @param {HTMLElement} track  The .dbw-slider-track element.
	 * @param {HTMLElement} slider The parent .dbw-partner-slider element.
	 */
	function applyBalance(track, slider) {
		if (!slider.classList.contains("dbw-balance")) {
			return;
		}
		var items = track.querySelectorAll(".dbw-slider-item");
		for (var i = 0; i < items.length; i++) {
			var img = items[i].querySelector("img");
			if (!img) {
				continue;
			}
			var w = img.naturalWidth || parseInt(img.getAttribute("width"), 10);
			var h =
				img.naturalHeight || parseInt(img.getAttribute("height"), 10);
			if (!w || !h) {
				continue;
			}
			var scale = Math.sqrt(BALANCE_REF_RATIO / (w / h));
			scale = Math.min(
				BALANCE_MAX_SCALE,
				Math.max(BALANCE_MIN_SCALE, scale)
			);
			items[i].style.setProperty("--logo-scale", scale.toFixed(3));
		}
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
	 * Take the images this slider has to measure out of lazy loading.
	 *
	 * Images are saved with loading="lazy" because a logo carousel usually
	 * sits below the fold. A lazy image that has not started loading has no
	 * width, and measuring it would produce a frozen or far too fast
	 * carousel — the very bug the old forced eager loading worked around.
	 * Initialisation only happens once the slider is close to the viewport
	 * (see initLogoSliders), so switching these images to eager here loads
	 * them exactly when they are about to be seen.
	 *
	 * @param {HTMLImageElement[]} images Images that will be measured.
	 */
	function forceLoad(images) {
		images.forEach(function (img) {
			if (!img.complete && img.loading === "lazy") {
				img.loading = "eager";
			}
		});
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
		forceLoad(firstSet);
		whenImagesReady(firstSet, function () {
			// Balanced sizes change item widths, so apply them BEFORE the
			// track is measured for the scroll animation.
			applyBalance(track, slider);
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
	 * Pick the next logo for the random order — never the current one, so a
	 * logo is never "replaced" by itself.
	 *
	 * @param {number} count   Number of logos.
	 * @param {number} current Index currently on screen.
	 * @return {number} Index of the next logo.
	 */
	function pickRandomIndex(count, current) {
		if (count < 2) {
			return current;
		}
		var next = Math.floor(Math.random() * (count - 1));
		return next >= current ? next + 1 : next;
	}

	/**
	 * Whether this browser can mask an element with an image.
	 *
	 * @return {boolean} True when mask-image is supported.
	 */
	function supportsMask() {
		if (typeof CSS === "undefined" || !CSS.supports) {
			return false;
		}
		return (
			CSS.supports("mask-image", 'url("a.png")') ||
			CSS.supports("-webkit-mask-image", 'url("a.png")')
		);
	}

	/**
	 * Tint spotlight logos exactly: the item gets the chosen colour as its
	 * background and the logo as its mask, so the logo is drawn in that colour
	 * pixel for pixel — far closer to a brand colour than the approximate CSS
	 * filter, which stays in place as the fallback.
	 *
	 * The mask URL is attached here rather than in the saved markup because
	 * WordPress strips url() values from style attributes when the author
	 * lacks unfiltered_html. Without this script the logos simply keep the
	 * filter tint — nothing disappears.
	 *
	 * Capsules are skipped: they draw their own background, which the mask
	 * would cut away.
	 *
	 * @param {HTMLElement} slider The .dbw-partner-slider element.
	 * @param {NodeList}    items  The spotlight items.
	 */
	function applySpotlightTint(slider, items) {
		if (
			!slider.classList.contains("dbw-spot-tint") ||
			slider.classList.contains("dbw-capsules") ||
			!supportsMask()
		) {
			return;
		}
		for (var i = 0; i < items.length; i++) {
			var img = items[i].querySelector("img");
			if (!img) {
				continue;
			}
			var url = img.currentSrc || img.getAttribute("src");
			if (!url) {
				continue;
			}
			items[i].style.setProperty(
				"--dbw-mask",
				'url("' + url.replace(/["\\]/g, "\\$&") + '")'
			);
			items[i].classList.add("dbw-spot-masked");
		}
	}

	/**
	 * Initialise spotlight mode: one logo at a time in a single slot, handed
	 * over on a timer.
	 *
	 * The CSS does the visual work (opacity / transform transitions); this
	 * only moves the .dbw-spot-active class along. Outgoing logos briefly get
	 * .dbw-spot-out so the slide transition continues upwards, and are reset
	 * below the slot once the transition has finished — with transitions
	 * suppressed for that one frame, so the reset itself is invisible.
	 *
	 * With a reduced-motion preference no timer is started at all; the
	 * stylesheet then lays every logo out side by side instead, so none of
	 * them stays hidden.
	 *
	 * @param {HTMLElement} slider  The .dbw-partner-slider element.
	 * @param {HTMLElement} stage   The .dbw-spotlight-stage element.
	 * @param {Function}    onReady Called once the slider can be revealed.
	 */
	function initSpotlight(slider, stage, onReady) {
		var items = stage.querySelectorAll(".dbw-slider-item");
		if (items.length === 0) {
			onReady();
			return;
		}

		var hold = parseInt(stage.dataset.duration, 10) || 2000;
		var random = stage.dataset.order === "random";
		var timer = null;

		// Which logo the saved markup starts on.
		var current = 0;
		for (var i = 0; i < items.length; i++) {
			if (items[i].classList.contains("dbw-spot-active")) {
				current = i;
				break;
			}
		}

		// Move an outgoing logo back to its waiting position without letting
		// the move itself animate.
		var resetItem = function (item) {
			if (item.classList.contains("dbw-spot-active")) {
				return;
			}
			item.classList.add("dbw-spot-reset");
			item.classList.remove("dbw-spot-out");
			// Forced reflow: applies the position change while transitions
			// are still switched off.
			void item.offsetWidth;
			item.classList.remove("dbw-spot-reset");
		};

		var advance = function () {
			var next = random
				? pickRandomIndex(items.length, current)
				: (current + 1) % items.length;
			if (next === current) {
				return;
			}
			var previous = items[current];
			previous.classList.remove("dbw-spot-active");
			previous.classList.add("dbw-spot-out");
			items[next].classList.remove("dbw-spot-out");
			items[next].classList.add("dbw-spot-active");
			current = next;
			setTimeout(function () {
				resetItem(previous);
			}, SPOT_TRANSITION_MS);
		};

		slider._dbwSpot = {
			start: function () {
				if (
					timer === null &&
					items.length > 1 &&
					!prefersReducedMotion()
				) {
					timer = setInterval(advance, hold);
				}
			},
			stop: function () {
				if (timer !== null) {
					clearInterval(timer);
					timer = null;
				}
			},
		};

		// Reveal once the logos have loaded, so the first one never pops in
		// half-rendered — then start the rotation.
		var images = [];
		for (var j = 0; j < items.length; j++) {
			var img = items[j].querySelector("img");
			if (img) {
				images.push(img);
			}
		}
		forceLoad(images);
		whenImagesReady(images, function () {
			applyBalance(stage, slider);
			// Tint before revealing, so no logo is ever seen in the wrong
			// colour first.
			applySpotlightTint(slider, items);
			onReady();
			slider._dbwSpot.start();
		});
	}

	/**
	 * Pause or resume every track of a slider at once.
	 *
	 * @param {HTMLElement} slider The .dbw-partner-slider element.
	 * @param {string}      state  "paused" or "running".
	 */
	function setPlayState(slider, state) {
		// Spotlight mode runs on a timer instead of a CSS animation.
		if (slider._dbwSpot) {
			if (state === "paused") {
				slider._dbwSpot.stop();
			} else {
				slider._dbwSpot.start();
			}
		}
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

		// Spotlight mode (v2.2) replaces the scrolling tracks with a single
		// slot; everything below (pause button, hover / touch pause) applies
		// to both modes.
		var stage = slider.querySelector(".dbw-spotlight-stage");
		if (stage) {
			initSpotlight(slider, stage, reveal);
		} else if (tracks.length === 0) {
			reveal();
		} else {
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
		}

		// Optional pause/play button (accessibility). While button-paused
		// (.dbw-paused) the hover/touch handlers below leave the state alone.
		var pauseBtn = slider.querySelector(".dbw-pause-btn");
		if (pauseBtn) {
			pauseBtn.setAttribute("aria-label", "Pause animation");
			pauseBtn.addEventListener("click", function () {
				var paused = slider.classList.toggle("dbw-paused");
				setPlayState(slider, paused ? "paused" : "running");
				pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
				pauseBtn.setAttribute(
					"aria-label",
					paused ? "Resume animation" : "Pause animation"
				);
			});
		}

		// Pause on hover (desktop / pointer devices).
		slider.addEventListener("mouseenter", function () {
			setPlayState(slider, "paused");
		});
		slider.addEventListener("mouseleave", function () {
			if (!slider.classList.contains("dbw-paused")) {
				setPlayState(slider, "running");
			}
		});

		// Tap to toggle pause (touch devices). Taps on the pause button are
		// handled by its own click handler.
		var touchPaused = false;
		slider.addEventListener(
			"touchstart",
			function (e) {
				if (pauseBtn && pauseBtn.contains(e.target)) {
					return;
				}
				if (slider.classList.contains("dbw-paused")) {
					return;
				}
				if (e.touches.length === 1) {
					touchPaused = !touchPaused;
					setPlayState(slider, touchPaused ? "paused" : "running");
				}
			},
			{ passive: true }
		);
	}

	// How far ahead of the viewport a slider is initialised (and its images
	// pulled out of lazy loading).
	var INIT_MARGIN = "300px 0px";

	/**
	 * Find and initialise every carousel on the page exactly once.
	 *
	 * A slider is only initialised once it comes close to the viewport. That
	 * keeps the work (and the image loading) off the critical path for
	 * carousels further down the page, and it is what makes lazy-loaded logos
	 * safe to measure: by the time we measure, the images are loading.
	 * Browsers without IntersectionObserver initialise everything right away,
	 * exactly as before.
	 */
	function initLogoSliders() {
		var sliders = document.querySelectorAll(".dbw-partner-slider");
		var supportsObserver = typeof IntersectionObserver !== "undefined";
		var observer = supportsObserver
			? new IntersectionObserver(
					function (entries) {
						entries.forEach(function (entry) {
							if (!entry.isIntersecting) {
								return;
							}
							observer.unobserve(entry.target);
							startSlider(entry.target);
						});
					},
					{ rootMargin: INIT_MARGIN }
			  )
			: null;

		sliders.forEach(function (slider) {
			if (slider.dataset.initialized === "true") {
				return;
			}
			if (observer) {
				observer.observe(slider);
			} else {
				startSlider(slider);
			}
		});
	}

	/**
	 * Initialise one slider, guarding against a second run.
	 *
	 * @param {HTMLElement} slider The .dbw-partner-slider element.
	 */
	function startSlider(slider) {
		if (slider.dataset.initialized === "true") {
			return;
		}
		slider.dataset.initialized = "true";
		initSlider(slider);
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
