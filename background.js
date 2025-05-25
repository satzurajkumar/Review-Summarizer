// background.js - Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "summarizeReviews") {
		console.log(
			"Background script received reviews for summarization:",
			request.reviews.length
		);
		// Simulate a call to a backend/transformer model
		// In a real scenario, this would be an async fetch call to your API endpoint.
		// const backendUrl = "YOUR_BACKEND_API_ENDPOINT_HERE";
		// fetch(backendUrl, {
		//     method: 'POST',
		//     headers: { 'Content-Type': 'application/json' },
		//     body: JSON.stringify({ reviews: request.reviews })
		// })
		// .then(response => response.json())
		// .then(data => sendResponse(data))
		// .catch(error => {
		//     console.error("Error calling backend:", error);
		//     sendResponse({ error: "Failed to connect to the summarization service." });
		// });

		// Simulated summarization logic:
		try {
			const summary = simulateTransformerSummarization(request.reviews);
			console.log("Simulated summary:", summary);
			// Store the summary (optional)
			// chrome.storage.local.set({ lastSummary: summary });
			sendResponse(summary);
		} catch (e) {
			console.error("Error during simulated summarization:", e);
			sendResponse({ error: `Summarization simulation failed: ${e.message}` });
		}

		return true; // Indicates that the response will be sent asynchronously
	}
});

function simulateTransformerSummarization(reviews) {
	if (!reviews || reviews.length === 0) {
		return {
			goodSummary: "No review content provided for summarization.",
			badSummary: "No review content provided for summarization.",
		};
	}

	let goodPoints = [];
	let badPoints = [];

	// Simple keyword-based sentiment analysis (very basic simulation)
	const positiveKeywords = [
		"love",
		"great",
		"excellent",
		"good",
		"amazing",
		"perfect",
		"fantastic",
		"highly recommend",
		"satisfied",
		"happy",
		"impressed",
		"wonderful",
		"best",
		"easy to use",
		"works well",
	];
	const negativeKeywords = [
		"bad",
		"poor",
		"terrible",
		"awful",
		"disappointed",
		"hate",
		"waste",
		"broken",
		"doesn't work",
		"problem",
		"issue",
		"not good",
		"regret",
		"cheap",
		"difficult",
	];

	reviews.forEach((review) => {
		const reviewLower = review.toLowerCase();
		let isPositive = false;
		let isNegative = false;

		positiveKeywords.forEach((keyword) => {
			if (reviewLower.includes(keyword)) {
				isPositive = true;
			}
		});

		negativeKeywords.forEach((keyword) => {
			if (reviewLower.includes(keyword)) {
				isNegative = true;
			}
		});

		// Prioritize negative if both found, or just categorize
		if (isNegative) {
			badPoints.push(review);
		} else if (isPositive) {
			goodPoints.push(review);
		}
		// Reviews that are neutral or mixed might be ignored by this simple logic
	});

	// Simulate "brief but useful summary"
	let goodSummary =
		"No specific positive themes identified from the top reviews.";
	if (goodPoints.length > 0) {
		// Take first few sentences of a couple of positive reviews as a mock summary
		goodSummary =
			"Users often praise its " +
			(goodPoints[0].toLowerCase().includes("easy to use") ||
			goodPoints[0].toLowerCase().includes("simple")
				? "ease of use"
				: goodPoints[0].toLowerCase().includes("quality") ||
				  goodPoints[0].toLowerCase().includes("durable")
				? "build quality"
				: goodPoints[0].toLowerCase().includes("value") ||
				  goodPoints[0].toLowerCase().includes("price")
				? "value for money"
				: "performance") +
			". ";
		if (goodPoints.length > 1 && goodPoints[0].length > 30) {
			// Check if goodPoints[0] is substantial
			goodSummary += goodPoints[0].split(". ")[0] + ". ";
		} else if (goodPoints.length > 1 && goodPoints[1].length > 30) {
			// Check if goodPoints[1] is substantial
			goodSummary += goodPoints[1].split(". ")[0] + ". ";
		}
		goodSummary =
			goodSummary.substring(0, 200) + (goodSummary.length > 200 ? "..." : ""); // Keep it brief
	}

	let badSummary =
		"No specific negative themes identified from the top reviews.";
	if (badPoints.length > 0) {
		badSummary =
			"Some users reported issues with " +
			(badPoints[0].toLowerCase().includes("durability") ||
			badPoints[0].toLowerCase().includes("broke")
				? "durability"
				: badPoints[0].toLowerCase().includes("difficult") ||
				  badPoints[0].toLowerCase().includes("confusing")
				? "ease of use"
				: badPoints[0].toLowerCase().includes("missing") ||
				  badPoints[0].toLowerCase().includes("incomplete")
				? "missing parts"
				: "overall quality") +
			". ";
		if (badPoints.length > 1 && badPoints[0].length > 30) {
			badSummary += badPoints[0].split(". ")[0] + ". ";
		} else if (badPoints.length > 1 && badPoints[1].length > 30) {
			badSummary += badPoints[1].split(". ")[0] + ". ";
		}
		badSummary =
			badSummary.substring(0, 200) + (badSummary.length > 200 ? "..." : ""); // Keep it brief
	}

	// Fallback if no specific points found but reviews exist
	if (goodPoints.length === 0 && reviews.length > 0) {
		goodSummary =
			"General sentiment appears mixed or neutral based on available review snippets.";
	}
	if (badPoints.length === 0 && reviews.length > 0) {
		badSummary =
			"No strong negative points highlighted in the analyzed review snippets.";
	}

	return {
		goodSummary: goodSummary,
		badSummary: badSummary,
	};
}

// Placeholder for icon images (you'll need to create these)
// Create an 'images' folder in your extension directory and add:
// icon16.png (16x16)
// icon48.png (48x48)
// icon128.png (128x128)
// For example, you can use a simple letter 'S' or a chat bubble icon.

// Optional: Add a content.css file if you need to style elements injected by content.js
// For this example, it's not strictly necessary.
// Create an empty content.css file if referenced in manifest.json to avoid errors.
console.log("Amazon Review Summarizer background script loaded.");
