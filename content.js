let currentAccountData = null;
let initialScanDone = false; //delete this :cash:
let seenEmails = new Set();
let notifiedEmails = new Set();
let observer = null;


function getCurrentAccount() {
	// const accountElement = document.querySelector("a[aria-label*='Google Account']");
	const accountElement = document.querySelector(
		"a.gb_B.gb_Za.gb_0[aria-label*='Google Account']"
	);
	if (accountElement) {
		const label = accountElement.getAttribute('aria-label');
		const match = label.match(/\(([^)]+@[^)]+)\)/);
		return match ? match[1] : null;
	}
	return null;
}

function processEmailRow(row, tags, notifyNew = true) {
	const emailId = row.getAttribute("data-legacy-thread-id") || row.innerText;
	const emailText = row.innerText.toLowerCase();

	const matched = tags.some(tag => emailText.includes(tag.toLowerCase()));

	if (matched) {
		row.classList.add("highlighted-email");

		if (!seenEmails.has(emailId)) {
			seenEmails.add(emailId);

			if (notifyNew) {
				// notify if new email
				const subjectElement = row.querySelector(".bog");
				const subject = subjectElement ? subjectElement.innerText : "Keyword Match";

				chrome.runtime.sendMessage({ type: "notify", subject });
			}
		}
	} else {
		row.classList.remove("highlighted-email");
	}
}

function reHighlightAll(tags) {
	const emailRows = document.querySelectorAll("tr.zA");
	emailRows.forEach(row => processEmailRow(row, tags, false));
}

function observeNewEmails(tags) {
	const inboxNode = document.querySelector("div[role='main']");
	if (!inboxNode) {
		console.warn("Inbox node not found, retrying...");
		setTimeout(() => observeNewEmails(tags), 1000);
		return;
	}

	if (observer) observer.disconnect();

	observer = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				if (node.nodeType === 1 && node.matches("tr.zA")) {
					processEmailRow(node, tags, true);
				}
			});
		});
	});

	observer.observe(inboxNode, { childList: true, subtree: true });

	reHighlightAll(tags);
}

function waitForGmailAccount(callback) {
	const interval = setInterval(() => {
		const email = getCurrentAccount();

		if (email) {
			clearInterval(interval);
			callback(email);
		}
	}, 1000);
}

waitForGmailAccount(email => {
	console.log("Detected Gmail account:", email);
	startHighlighting(email);
});

function startHighlighting(account) {
	if (!account) return;

	chrome.storage.sync.get("accounts", (data) => {
		const accounts = data.accounts || [];
		currentAccountData = accounts.find(a => a.email === account);

		if (currentAccountData && currentAccountData.tags.length > 0) {
			observeNewEmails(currentAccountData.tags);
		}
	});
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "reHighlight") {
		startHighlighting(getCurrentAccount());
	}
});

