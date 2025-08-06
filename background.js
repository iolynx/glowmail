chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type == "notify") {
		chrome.notifications.create({
			type: "basic",
			iconUrl: "emailicon.png",
			title: "New Matching Email",
			message: `New Email Matched: ${message.subject || "Keyword Match"}`,
			priority: 2,
		});
	}
});
