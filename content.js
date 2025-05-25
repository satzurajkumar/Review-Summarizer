// content.js - Injected into Amazon product pages

// This script attempts to extract reviews.
// IMPORTANT: Amazon's HTML structure can change, making selectors fragile.
// This is a simplified example and may need frequent updates or more robust scraping techniques.

(function () {
	// Ensure the script doesn't run multiple times on the same page due to re-injection
	if (window.hasRunAmazonReviewExtractor) {
		return;
	}
	window.hasRunAmazonReviewExtractor = true;

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.action === "getReviews") {
			console.log("Content script received getReviews request.");
			try {
				const reviews = extractReviews();
				if (reviews.length > 0) {
					console.log(`Extracted ${reviews.length} reviews.`);
					sendResponse({ reviews: reviews });
				} else {
					console.log("No reviews found or selectors failed.");
					sendResponse({
						error:
							"Could not find review elements on the page. Selectors might be outdated or reviews are not loaded.",
					});
				}
			} catch (e) {
				console.error("Error extracting reviews:", e);
				sendResponse({ error: `Error during review extraction: ${e.message}` });
			}
			return true; // Indicates that the response will be sent asynchronously
		}
	});

	function extractReviews() {
		const reviews = [];
		// Common selectors for Amazon review text. These are highly likely to change.
		// It's better to inspect the current Amazon page structure for accurate selectors.
		// This example tries a few common patterns.
		const reviewSelectors = [
			'[data-hook="review-body"] span', // Common for main review text
			".review-text-content span", // Another common pattern
			".a-expander-partial-collapse-content span", // For "Read more" reviews
			".reviewText", // Older selector
		];

		let reviewElements = [];
		for (const selector of reviewSelectors) {
			reviewElements = document.querySelectorAll(selector);
			if (reviewElements.length > 0) break; // Stop if we find reviews with one selector
		}

		if (reviewElements.length === 0) {
			// Try to find reviews within the dedicated reviews section if it exists
			const reviewsSection =
				document.getElementById("reviewsMedley") ||
				document.getElementById("cm-cr-dpnextleft");
			if (reviewsSection) {
				for (const selector of reviewSelectors) {
					reviewElements = reviewsSection.querySelectorAll(selector);
					if (reviewElements.length > 0) break;
				}
			}
		}

		reviewElements.forEach((element) => {
			// Filter out empty or very short texts, and texts that might be part of UI elements rather than actual reviews
			const text = element.textContent?.trim();
			if (text && text.length > 20) {
				// Arbitrary length to filter out noise
				// Avoid common non-review phrases if they are mistakenly picked up
				if (
					!text.toLowerCase().includes("translate to english") &&
					!text.toLowerCase().includes("verified purchase") &&
					!text.toLowerCase().includes("customer review")
				) {
					reviews.push(text);
				}
			}
		});

		// Limit the number of reviews to avoid overwhelming the (simulated) backend
		return reviews.slice(0, 50); // Process up to 50 reviews
	}

	console.log("Amazon Review Summarizer content script loaded.");
})();
