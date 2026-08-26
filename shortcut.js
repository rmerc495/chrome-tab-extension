function isDuplicateShortcut(event) {
  if (event.repeat || event.altKey) {
    return false;
  }

  const isD = event.key === "d" || event.key === "D";
  if (!isD || !event.shiftKey) {
    return false;
  }

  const isMac = navigator.platform.toUpperCase().includes("MAC");
  if (isMac) {
    return event.metaKey && !event.ctrlKey;
  }

  return event.ctrlKey && !event.metaKey;
}

function onKeyDown(event) {
  if (!isDuplicateShortcut(event)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  chrome.runtime.sendMessage({ type: "duplicate-tabs" }).catch(() => {
    // Ignore after extension reload while a tab is still open.
  });
}

window.addEventListener("keydown", onKeyDown, true);
