const DEFAULT_SETTINGS = {
  singleTabPlacement: "next_to_origin",
  multiTabPlacement: "end_of_list",
};

const shortcutCurrentEl = document.getElementById("shortcut-current");
const openShortcutsBtn = document.getElementById("open-shortcuts");
const saveStatusEl = document.getElementById("save-status");

let saveStatusTimer = null;

function setSaveStatus(message) {
  saveStatusEl.textContent = message;
  if (saveStatusTimer) {
    clearTimeout(saveStatusTimer);
  }
  if (message) {
    saveStatusTimer = setTimeout(() => {
      saveStatusEl.textContent = "";
    }, 1600);
  }
}

function setRadioValue(name, value) {
  const input = document.querySelector(
    `input[name="${name}"][value="${value}"]`
  );
  if (input) {
    input.checked = true;
  }
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked?.value;
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  setRadioValue(
    "singleTabPlacement",
    stored.singleTabPlacement || DEFAULT_SETTINGS.singleTabPlacement
  );
  setRadioValue(
    "multiTabPlacement",
    stored.multiTabPlacement || DEFAULT_SETTINGS.multiTabPlacement
  );
}

async function saveSettings() {
  const singleTabPlacement =
    getRadioValue("singleTabPlacement") ||
    DEFAULT_SETTINGS.singleTabPlacement;
  const multiTabPlacement =
    getRadioValue("multiTabPlacement") || DEFAULT_SETTINGS.multiTabPlacement;

  await chrome.storage.sync.set({
    singleTabPlacement,
    multiTabPlacement,
  });
  setSaveStatus("Settings saved");
}

async function refreshShortcut() {
  const commands = await chrome.commands.getAll();
  const command = commands.find((item) => item.name === "duplicate-tabs");
  const shortcut = command?.shortcut?.trim();

  shortcutCurrentEl.replaceChildren();
  shortcutCurrentEl.append("Chrome shortcuts page: ");

  if (shortcut) {
    const value = document.createElement("strong");
    value.textContent = shortcut;
    shortcutCurrentEl.append(value);
  } else {
    shortcutCurrentEl.append('"not assigned"');
  }
}

openShortcutsBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

document.querySelectorAll('input[type="radio"]').forEach((input) => {
  input.addEventListener("change", () => {
    saveSettings().catch((err) => {
      console.error("Failed to save settings:", err);
      setSaveStatus("Could not save settings");
    });
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshShortcut().catch((err) => {
      console.error("Failed to refresh shortcut:", err);
    });
  }
});

Promise.all([loadSettings(), refreshShortcut()]).catch((err) => {
  console.error("Failed to initialize settings page:", err);
  setSaveStatus("Could not load settings");
});
