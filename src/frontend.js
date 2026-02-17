/**
 * Logo Slider Block Frontend Script
 * Calculates exact width for perfect infinity loop
 */

(function () {
	"use strict";

	function initLogoSliders() {
		const sliders = document.querySelectorAll(".dbw-partner-slider");

		sliders.forEach((slider) => {
			if (slider.dataset.initialized === "true") return;

			const track = slider.querySelector(".dbw-slider-track");
			if (!track) return;

			const items = track.querySelectorAll(".dbw-slider-item");
			if (items.length === 0) return;

			const logoCount =
				parseInt(slider.style.getPropertyValue("--logo-count")) || 0;
			if (logoCount === 0) return;

			// Calculate width of one complete set of logos
			let setWidth = 0;
			for (let i = 0; i < logoCount && i < items.length; i++) {
				setWidth += items[i].getBoundingClientRect().width;
			}

			// Create specific keyframe animation for this slider
			const animationName =
				"dbw-scroll-" + Math.random().toString(36).substr(2, 9);

			// Use dedicated style element per slider for clean lifecycle management
			let styleEl = slider._dbwStyleEl;
			if (!styleEl) {
				styleEl = document.createElement("style");
				document.head.appendChild(styleEl);
				slider._dbwStyleEl = styleEl;
			}
			styleEl.textContent =
				"@keyframes " + animationName + " { " +
				"0% { transform: translateX(0); } " +
				"100% { transform: translateX(-" + setWidth + "px); } " +
				"}";

			// Apply animation
			const duration =
				getComputedStyle(slider).getPropertyValue("--scroll-duration") || "25s";
			track.style.animation = animationName + " " + duration + " linear infinite";

			// Hover pause
			slider.addEventListener("mouseenter", function () {
				track.style.animationPlayState = "paused";
			});
			slider.addEventListener("mouseleave", function () {
				track.style.animationPlayState = "running";
			});

			// Touch support: tap to toggle pause
			var touchPaused = false;
			slider.addEventListener("touchstart", function (e) {
				if (e.touches.length === 1) {
					touchPaused = !touchPaused;
					track.style.animationPlayState = touchPaused ? "paused" : "running";
				}
			}, { passive: true });

			slider.dataset.initialized = "true";
		});
	}

	// Initialize when DOM ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initLogoSliders);
	} else {
		initLogoSliders();
	}

	// Re-initialize on resize (debounced)
	var resizeTimeout;
	window.addEventListener("resize", function () {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function () {
			document.querySelectorAll(".dbw-partner-slider").forEach(function (slider) {
				slider.dataset.initialized = "false";
				var track = slider.querySelector(".dbw-slider-track");
				if (track) {
					track.style.animation = "";
				}
				if (slider._dbwStyleEl) {
					slider._dbwStyleEl.textContent = "";
				}
			});
			initLogoSliders();
		}, 250);
	});

	// For Gutenberg live preview
	if (window.wp && window.wp.domReady) {
		window.wp.domReady(function () {
			setTimeout(initLogoSliders, 100);
		});
	}
})();
