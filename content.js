let currentAccountData = null;
let initialScanDone = false;
let seenEmails = new Set();
let notifiedEmails = new Set();


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

let lastHighlightedEmails = new Set();

function highlightEmails(tags) {
	const emailRows = document.querySelectorAll("tr.zA");

	emailRows.forEach(row => {
		const emailId = row.getAttribute("data-legacy-thread-id") || row.innerText;
		const emailText = row.innerText.toLowerCase();

		const matched = tags.some(tag => emailText.includes(tag.toLowerCase()));

		if (matched) {
			row.classList.add("highlighted-email");

			if (!initialScanDone && !seenEmails.has(emailId)) {
				seenEmails.add(emailId);
				console.log('j a ', emailId);
			}

			if (initialScanDone && !seenEmails.has(emailId)) {
				console.log('holy shit one j came', emailId);
				seenEmails.add(emailId)

				const subjectElement = row.querySelector(".bog");
				const subject = subjectElement ? subjectElement.innerText : "Keyword Match";

				chrome.runtime.sendMessage({ type: "notify", subject })
			}
		} else {
			row.classList.remove("highlighted-email");
		}
	});
	initialScanDone = true;
}

function waitForGmailAccount(callback) {
	const interval = setInterval(() => {
		const email = getCurrentAccount(); // your detection function

		if (email) {
			clearInterval(interval);
			callback(email);
		}
	}, 1000); // check every 1 second
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
			setInterval(() => highlightEmails(currentAccountData.tags), 1000);
		}
	});
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('received')
	if (message.action === "reHighlight") {
		startHighlighting(getCurrentAccount());
		// highlightEmails(currentAccountData?.tags || []);
	}
});

