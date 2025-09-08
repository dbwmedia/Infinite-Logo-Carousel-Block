/**
 * Logo Slider Block Frontend Script
 * Calculates exact width for perfect infinity loop
 */

(function () {
	"use strict";

	function initLogoSliders() {
		const sliders = document.querySelectorAll(".dbw-partner-slider");

		sliders.forEach((slider) => {
			// Skip if already initialized
			if (slider.dataset.initialized === "true") return;

			const track = slider.querySelector(".dbw-slider-track");
			if (!track) return;

			const items = track.querySelectorAll(".dbw-slider-item");
			if (items.length === 0) return;

			// Find out how many original logos we have
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
			const keyframes = `
                @keyframes ${animationName} {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-${setWidth}px);
                    }
                }
            `;

			// Add animation to document
			let styleSheet = document.getElementById("dbw-slider-styles");
			if (!styleSheet) {
				styleSheet = document.createElement("style");
				styleSheet.id = "dbw-slider-styles";
				document.head.appendChild(styleSheet);
			}
			styleSheet.innerHTML += keyframes;

			// Apply new animation to track
			const duration =
				getComputedStyle(slider).getPropertyValue("--scroll-duration") || "25s";
			track.style.animation = `${animationName} ${duration} linear infinite`;

			// Hover pause functionality
			slider.addEventListener("mouseenter", () => {
				track.style.animationPlayState = "paused";
			});

			slider.addEventListener("mouseleave", () => {
				track.style.animationPlayState = "running";
			});

			// Mark as initialized
			slider.dataset.initialized = "true";
		});
	}

	// Initialize when DOM ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initLogoSliders);
	} else {
		initLogoSliders();
	}

	// Re-initialize on resize
	let resizeTimeout;
	window.addEventListener("resize", function () {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function () {
			// Reset all sliders
			document.querySelectorAll(".dbw-partner-slider").forEach((slider) => {
				slider.dataset.initialized = "false";
				const track = slider.querySelector(".dbw-slider-track");
				if (track) {
					track.style.animation = "";
				}
			});
			// Clear old styles
			const styleSheet = document.getElementById("dbw-slider-styles");
			if (styleSheet) {
				styleSheet.innerHTML = "";
			}
			// Re-initialize
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
