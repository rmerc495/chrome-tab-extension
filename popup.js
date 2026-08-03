const DEFAULTS = {
  enabled: true,
};

const toggleBtn = document.getElementById("toggle-enabled");
const toggleLabel = document.getElementById("toggle-label");
const toggleStatus = document.getElementById("toggle-status");
const openOptionsBtn = document.getElementById("open-options");

function renderEnabled(enabled) {
  toggleLabel.textContent = enabled ? "Turn Off" : "Turn On";
  toggleStatus.textContent = enabled ? "On" : "Off";
  toggleStatus.classList.toggle("on", enabled);
  toggleStatus.classList.toggle("off", !enabled);
}

async function loadState() {
  const { enabled } = await chrome.storage.sync.get(DEFAULTS);
  renderEnabled(enabled !== false);
}

toggleBtn.addEventListener("click", async () => {
  const { enabled } = await chrome.storage.sync.get(DEFAULTS);
  const next = enabled === false;
  await chrome.storage.sync.set({ enabled: next });
  renderEnabled(next);
});

openOptionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

loadState().catch((err) => {
  console.error("Failed to load popup state:", err);
});
