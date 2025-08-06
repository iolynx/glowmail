const accountsDiv = document.getElementById("accounts");
const newAccountInput = document.getElementById("newAccountEmail");
const keywordsInput = document.getElementById("keywords");
const addAccountBtn = document.getElementById("addAccountBtn");

function renderAccounts(accounts) {
	accountsDiv.innerHTML = "";

	console.log(accounts);

	accounts.forEach((account, index) => {
		const div = document.createElement("div");
		const tagsContainer = document.createElement("span");
		div.className = "account";

		account.tags.forEach((tag, tagIndex) => {
			const tagElement = document.createElement("span");
			tagElement.className = "tag";
			tagElement.textContent = tag;

			tagElement.addEventListener("click", () => {
				account.tags.splice(tagIndex, 1);
				console.log(account.tags);

				chrome.storage.sync.set({ accounts }, () => {
					console.log("Updated accounts saved to storage");
					renderAccounts(accounts);

					chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
						const tab = tabs[0]
						if (tab && tab.url && tab.url.includes("mail.google.com")) {
							chrome.tabs.sendMessage(tab.id, { action: "reHighlight" });
						}
					})
				});

			});

			tagsContainer.appendChild(tagElement);
		});

		//  ${account.tags.map(tag => `<span class="tag">${tag}  <span class="delete-btn">x</span></span>`).join("")}
		div.innerHTML = ` 
			<div class="account-header">
				<strong>${account.email}</strong>
				<button class="delete-btn" data-index = "${index}">delete</button>
			</div>
			<div class="tags"></div>
			<input type="text" placeholder="Add Tag" data-index="${index}" class="tag-input">

		`;

		div.querySelector(".tags").appendChild(tagsContainer);
		accountsDiv.appendChild(div);

		accountsDiv.appendChild(div);
	});

	document.querySelectorAll(".delete-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			const index = parseInt(btn.dataset.index);

			chrome.storage.sync.get("accounts", (data) => {
				const accounts = data.accounts || [];
				accounts.splice(index, 1); // remove account
				chrome.storage.sync.set({ accounts }, () => renderAccounts(accounts));
			});
		});
	});

	document.querySelectorAll(".tag-input").forEach(input => {
		input.addEventListener("keydown", (e) => {
			if (e.key == "Enter" && input.value.trim()) {
				const tag = input.value.trim().toLowerCase();
				const index = parseInt(input.dataset.index);

				chrome.storage.sync.get("accounts", (data) => {
					const accounts = data.accounts || [];
					accounts[index].tags.push(tag);

					chrome.storage.sync.set({ accounts }, () => renderAccounts(accounts));
				});

				input.value = "";

				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					chrome.tabs.sendMessage(tabs[0].id, { action: "reHighlight" });
				});
			}
		});
	});
}

// to load accounts
chrome.storage.sync.get("accounts", (data) => {
	renderAccounts(data.accounts || []);
});

// to add accounts
addAccountBtn.addEventListener("click", () => {
	const newEmail = newAccountInput.value.trim();
	const keywords = keywordsInput.value
		.split(",")
		.map(k => k.trim())
		.filter(k => k.length > 0);

	console.log(keywords);

	if (!newEmail) {
		return;
	}

	chrome.storage.sync.get("accounts", (data) => {
		const accounts = data.accounts || [];

		if (accounts.some(a => a.email === newEmail)) {
			alert("This account is already added.");
			return;
		}

		accounts.push({ email: newEmail, tags: keywords });

		chrome.storage.sync.set({ accounts }, () => {
			newAccountInput.value = "";
			renderAccounts(accounts);
		});
	});
});
