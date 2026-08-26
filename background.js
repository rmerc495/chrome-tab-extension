const DEFAULT_SETTINGS = {
  enabled: true,
  singleTabPlacement: "next_to_origin",
  multiTabPlacement: "end_of_list",
};

async function getSettings() {
  return chrome.storage.sync.get(DEFAULT_SETTINGS);
}

async function unpinIfNeeded(tab) {
  if (tab?.id != null && tab.pinned) {
    await chrome.tabs.update(tab.id, { pinned: false });
  }
}

async function moveTabsToIndex(tabIds, startIndex) {
  let nextIndex = startIndex;
  for (const tabId of tabIds) {
    await chrome.tabs.move(tabId, { index: nextIndex });
    nextIndex += 1;
  }
}

async function duplicateSingleTab(tab, placement) {
  const dup = await chrome.tabs.duplicate(tab.id);
  if (dup?.id == null) {
    return;
  }

  await unpinIfNeeded(dup);

  if (placement === "end_of_list") {
    await chrome.tabs.move(dup.id, { index: -1 });
  }

  if (tab.id != null) {
    await chrome.tabs.update(tab.id, { active: true });
  }
}

async function duplicateNextToEach(tabs, activeId) {
  // Left-to-right so each duplicate lands beside its origin as indices shift.
  for (const tab of tabs) {
    const dup = await chrome.tabs.duplicate(tab.id);
    if (dup?.id == null) {
      continue;
    }
    await unpinIfNeeded(dup);
  }

  if (activeId != null) {
    await chrome.tabs.update(activeId, { active: true });
  }
}

async function duplicateGrouped(tabs, activeId, placement) {
  const lastSelectedId = tabs[tabs.length - 1]?.id;
  const duplicateIds = [];

  for (const tab of tabs) {
    const dup = await chrome.tabs.duplicate(tab.id);
    if (dup?.id == null) {
      continue;
    }
    await unpinIfNeeded(dup);
    // Park duplicates at the end first so later moves are predictable.
    await chrome.tabs.move(dup.id, { index: -1 });
    duplicateIds.push(dup.id);
  }

  if (placement === "after_last_selected" && lastSelectedId != null) {
    const lastSelected = await chrome.tabs.get(lastSelectedId);
    await moveTabsToIndex(duplicateIds, lastSelected.index + 1);
  }

  if (activeId != null) {
    await chrome.tabs.update(activeId, { active: true });
  }
}

async function duplicateTabs() {
  const settings = await getSettings();
  if (settings.enabled === false) {
    return;
  }

  const highlighted = await chrome.tabs.query({
    currentWindow: true,
    highlighted: true,
  });

  if (highlighted.length === 0) {
    return;
  }

  highlighted.sort((a, b) => a.index - b.index);

  const [activeTab] = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  });
  const activeId = activeTab?.id;

  if (highlighted.length === 1) {
    await duplicateSingleTab(
      highlighted[0],
      settings.singleTabPlacement || DEFAULT_SETTINGS.singleTabPlacement
    );
    return;
  }

  const multiPlacement =
    settings.multiTabPlacement || DEFAULT_SETTINGS.multiTabPlacement;

  if (multiPlacement === "next_to_each") {
    await duplicateNextToEach(highlighted, activeId);
    return;
  }

  await duplicateGrouped(highlighted, activeId, multiPlacement);
}

let lastDuplicateAt = 0;

function runDuplicate() {
  const now = Date.now();
  // Content-script capture and chrome.commands can both fire for one keypress.
  if (now - lastDuplicateAt < 400) {
    return;
  }
  lastDuplicateAt = now;

  duplicateTabs().catch((err) => {
    console.error("Duplicate Tab failed:", err);
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "duplicate-tabs") {
    runDuplicate();
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "duplicate-tabs") {
    runDuplicate();
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage().catch(() => {
      // Options page may be unavailable in rare cases; ignore.
    });
  }
});
