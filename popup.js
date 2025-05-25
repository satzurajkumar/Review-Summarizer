// Get references to DOM elements
const summarizeBtn = document.getElementById("summarizeBtn");
const goodSummaryP = document.getElementById("goodSummary");
const badSummaryP = document.getElementById("badSummary");
const loadingIndicator = document.getElementById("loadingIndicator");
const summaryResultsDiv = document.getElementById("summaryResults");
const errorMessageDiv = document.getElementById("errorMessage");
const noReviewsMessageDiv = document.getElementById("noReviewsMessage");

// Function to display messages (error or no reviews)
function showMessage(type, message) {
	errorMessageDiv.classList.add("hidden");
	noReviewsMessageDiv.classList.add("hidden");
	summaryResultsDiv.classList.add("hidden"); // Hide summaries when showing a message

	if (type === "error") {
		errorMessageDiv.textContent = message;
		errorMessageDiv.classList.remove("hidden");
	} else if (type === "no_reviews") {
		noReviewsMessageDiv.textContent = message;
		noReviewsMessageDiv.classList.remove("hidden");
	}
}

// Function to show/hide loading indicator
function setLoading(isLoading) {
	if (isLoading) {
		loadingIndicator.classList.remove("hidden");
		summarizeBtn.disabled = true;
		summarizeBtn.classList.add("opacity-50", "cursor-not-allowed");
		summaryResultsDiv.classList.add("hidden"); // Hide previous results
		errorMessageDiv.classList.add("hidden"); // Hide previous errors
		noReviewsMessageDiv.classList.add("hidden"); // Hide previous no-reviews message
	} else {
		loadingIndicator.classList.add("hidden");
		summarizeBtn.disabled = false;
		summarizeBtn.classList.remove("opacity-50", "cursor-not-allowed");
	}
}

// Event listener for the summarize button
summarizeBtn.addEventListener("click", async () => {
	setLoading(true);
	goodSummaryP.textContent = "Processing...";
	badSummaryP.textContent = "Processing...";

	try {
		// Get the current active tab
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});

		if (tab && tab.id) {
			// Send a message to the content script to extract reviews
			// The content script will then send reviews to the background script
			chrome.scripting.executeScript(
				{
					target: { tabId: tab.id },
					files: ["content.js"],
				},
				() => {
					if (chrome.runtime.lastError) {
						console.error(
							"Script injection failed: ",
							chrome.runtime.lastError.message
						);
						showMessage(
							"error",
							`Failed to inject script: ${chrome.runtime.lastError.message}. Try reloading the Amazon page.`
						);
						setLoading(false);
						return;
					}
					// After script injection, send message to content script
					chrome.tabs.sendMessage(
						tab.id,
						{ action: "getReviews" },
						(response) => {
							if (chrome.runtime.lastError) {
								// This error often means the content script isn't there or didn't respond.
								console.error(
									"Error sending message to content script:",
									chrome.runtime.lastError.message
								);
								showMessage(
									"error",
									"Could not communicate with the Amazon page. Please ensure you are on a product page and try again. If the issue persists, the page structure might have changed."
								);
								setLoading(false);
								return;
							}

							if (response && response.reviews) {
								if (response.reviews.length === 0) {
									showMessage(
										"no_reviews",
										"No reviews found on this page, or they could not be extracted. Ensure you are on a product page with reviews."
									);
									setLoading(false);
									return;
								}
								// Send reviews to background script for summarization
								chrome.runtime.sendMessage(
									{ action: "summarizeReviews", reviews: response.reviews },
									(summaryResponse) => {
										if (chrome.runtime.lastError) {
											console.error(
												"Error getting summary from background script:",
												chrome.runtime.lastError.message
											);
											showMessage(
												"error",
												`Summarization failed: ${chrome.runtime.lastError.message}`
											);
											setLoading(false);
											return;
										}

										if (
											summaryResponse &&
											summaryResponse.goodSummary &&
											summaryResponse.badSummary
										) {
											goodSummaryP.textContent = summaryResponse.goodSummary;
											badSummaryP.textContent = summaryResponse.badSummary;
											summaryResultsDiv.classList.remove("hidden");
											errorMessageDiv.classList.add("hidden");
											noReviewsMessageDiv.classList.add("hidden");
										} else if (summaryResponse && summaryResponse.error) {
											showMessage("error", summaryResponse.error);
										} else {
											showMessage(
												"error",
												"Failed to get a valid summary. The backend might be unavailable or returned an unexpected response."
											);
										}
										setLoading(false);
									}
								);
							} else if (response && response.error) {
								showMessage("error", response.error);
								setLoading(false);
							} else {
								showMessage(
									"error",
									"No reviews were extracted from the page. The page structure might be unsupported or reviews are not present."
								);
								setLoading(false);
							}
						}
					);
				}
			);
		} else {
			showMessage(
				"error",
				"Could not get active tab information. Please try again."
			);
			setLoading(false);
		}
	} catch (error) {
		console.error("Error in popup.js:", error);
		showMessage("error", `An unexpected error occurred: ${error.message}`);
		setLoading(false);
	}
});

// Optional: Load a previously stored summary if available (not implemented in this version for simplicity)
// window.addEventListener('DOMContentLoaded', () => {
//   chrome.storage.local.get(['lastSummary'], (result) => {
//     if (result.lastSummary) {
//       goodSummaryP.textContent = result.lastSummary.goodSummary;
//       badSummaryP.textContent = result.lastSummary.badSummary;
//       summaryResultsDiv.classList.remove('hidden');
//     }
//   });
// });
