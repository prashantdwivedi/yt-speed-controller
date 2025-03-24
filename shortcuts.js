// Theme handling
function setTheme(theme) {
  if (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.body.classList.remove("light-theme");
  } else {
    document.body.classList.add("light-theme");
  }
}

// Global variables
let shortcuts = {};
let currentTheme = "dark";
let isRecording = false;
let currentShortcut = null;
let pendingDeleteAction = null;

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Load data from storage
  chrome.storage.sync.get("ytSpeedControllerConfig", function (data) {
    if (data.ytSpeedControllerConfig) {
      const config = data.ytSpeedControllerConfig;

      // Set theme
      if (config.theme) {
        currentTheme = config.theme;
        setTheme(currentTheme);
      }

      // Load shortcuts
      if (config.keyboardShortcuts) {
        shortcuts = config.keyboardShortcuts;
      }

      // Render shortcuts
      renderShortcuts();
    }
  });

  // Back button
  document.getElementById("back-button").addEventListener("click", function () {
    window.location.href = "popup.html";
  });

  // Add shortcut button
  document
    .getElementById("add-shortcut")
    .addEventListener("click", function () {
      document.getElementById("new-shortcut-form").style.display = "block";
      this.style.display = "none";
    });

  // Cancel button
  document
    .getElementById("cancel-shortcut")
    .addEventListener("click", function () {
      document.getElementById("new-shortcut-form").style.display = "none";
      document.getElementById("add-shortcut").style.display = "block";
      resetShortcutForm();
    });

  // Record shortcut
  document
    .getElementById("shortcut-recording")
    .addEventListener("click", function () {
      if (!isRecording) {
        startRecording();
      }
    });

  // Save shortcut
  document
    .getElementById("save-shortcut")
    .addEventListener("click", saveNewShortcut);

  // Remove defaults button
  document
    .getElementById("remove-defaults")
    .addEventListener("click", function () {
      showConfirmationModal(
        "Are you sure you want to remove default shortcuts?",
        removeDefaultShortcuts
      );
    });

  // Clear all button
  document.getElementById("clear-all").addEventListener("click", function () {
    showConfirmationModal(
      "Are you sure you want to remove ALL shortcuts?",
      clearAllShortcuts
    );
  });

  // Modal cancel button
  document
    .getElementById("modal-cancel")
    .addEventListener("click", hideConfirmationModal);

  // Modal confirm button
  document
    .getElementById("modal-confirm")
    .addEventListener("click", function () {
      if (pendingDeleteAction) {
        pendingDeleteAction();
        pendingDeleteAction = null;
      }
      hideConfirmationModal();
    });

  // Listen for keyboard events when recording
  document.addEventListener("keydown", handleKeyDown);
});

// Show confirmation modal
function showConfirmationModal(message, confirmAction) {
  const modal = document.getElementById("confirmation-modal");
  const modalMessage = document.getElementById("modal-message");

  modalMessage.textContent = message;
  pendingDeleteAction = confirmAction;

  modal.classList.add("active");
}

// Hide confirmation modal
function hideConfirmationModal() {
  const modal = document.getElementById("confirmation-modal");
  modal.classList.remove("active");
  pendingDeleteAction = null;
}

// Render shortcuts list with updated UI to match the image
function renderShortcuts() {
  const container = document.getElementById("shortcuts-list");
  container.innerHTML = "";

  if (Object.keys(shortcuts).length === 0) {
    container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          No shortcuts configured yet.<br>
          Add your first shortcut below.
        </div>
      `;
    return;
  }

  for (const [shortcut, action] of Object.entries(shortcuts)) {
    const shortcutItem = document.createElement("div");
    shortcutItem.className = "shortcut-item";

    // Create action text
    const actionText = document.createElement("div");
    actionText.className = "shortcut-action";
    actionText.textContent = getActionLabel(action);

    // Create keys container and display
    const keysContainer = document.createElement("div");
    keysContainer.className = "shortcut-keys-container";

    // Create the pill-shaped key display
    const keysDisplay = document.createElement("div");
    keysDisplay.className = "shortcut-keys";

    // Format the shortcut string with plus signs
    const formattedShortcut = shortcut.replace(/\+/g, " + ");
    keysDisplay.textContent = formattedShortcut;

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-shortcut";
    deleteButton.innerHTML = '<i class="ph ph-trash"></i>';
    deleteButton.setAttribute("data-shortcut", shortcut);
    deleteButton.addEventListener("click", function () {
      showConfirmationModal(
        "Are you sure you want to delete this shortcut?",
        () => deleteShortcut(shortcut)
      );
    });

    // Add elements to containers
    keysContainer.appendChild(keysDisplay);
    keysContainer.appendChild(deleteButton);

    // Add elements to shortcut item
    shortcutItem.appendChild(actionText);
    shortcutItem.appendChild(keysContainer);

    container.appendChild(shortcutItem);
  }
}

// Get readable label for action
function getActionLabel(action) {
  if (action === "custom") {
    return "Custom Speed Input";
  } else {
    return `Speed: ${action}x`;
  }
}

// Start recording a shortcut
function startRecording() {
  isRecording = true;
  currentShortcut = {
    modifiers: {
      Ctrl: false,
      Alt: false,
      Shift: false,
      Meta: false,
    },
    key: null,
  };

  const recordingElement = document.getElementById("shortcut-recording");
  recordingElement.classList.add("active");
  recordingElement.innerHTML = `
      <span class="shortcut-recording-text">Press keys now...</span>
      <i class="ph ph-keyboard"></i>
    `;
}

// Handle key down during recording
function handleKeyDown(e) {
  if (!isRecording) return;

  // Prevent default browser shortcuts
  e.preventDefault();

  // Update modifiers
  if (currentShortcut) {
    if (e.key === "Control" || e.key === "Ctrl") {
      currentShortcut.modifiers.Ctrl = true;
    } else if (e.key === "Alt") {
      currentShortcut.modifiers.Alt = true;
    } else if (e.key === "Shift") {
      currentShortcut.modifiers.Shift = true;
    } else if (e.key === "Meta" || e.key === "Command") {
      currentShortcut.modifiers.Meta = true;
    } else if (e.key === "Escape") {
      // Cancel recording on Escape
      stopRecording(true);
      return;
    } else {
      // For any other key, set it as the main key and stop recording
      currentShortcut.key = e.key;
      stopRecording();
    }

    updateRecordingDisplay();
  }
}

// Update the recording display
function updateRecordingDisplay() {
  if (!currentShortcut) return;

  let shortcutText = "";
  if (currentShortcut.modifiers.Ctrl) shortcutText += "Ctrl + ";
  if (currentShortcut.modifiers.Alt) shortcutText += "Alt + ";
  if (currentShortcut.modifiers.Shift) shortcutText += "Shift + ";
  if (currentShortcut.modifiers.Meta) shortcutText += "Meta + ";

  if (currentShortcut.key) {
    shortcutText += currentShortcut.key;
  } else {
    // Remove trailing " + " if no key is pressed yet
    shortcutText = shortcutText.replace(/ \+ $/, "");
  }

  const recordingElement = document.getElementById("shortcut-recording");
  recordingElement.innerHTML = `
      <span class="shortcut-recording-text">${
        shortcutText || "Press keys now..."
      }</span>
      <i class="ph ph-keyboard"></i>
    `;
}

// Stop recording
function stopRecording(cancel = false) {
  isRecording = false;

  const recordingElement = document.getElementById("shortcut-recording");
  recordingElement.classList.remove("active");

  if (cancel || !currentShortcut.key) {
    resetShortcutForm();
    return;
  }

  // Keep the display showing the recorded shortcut
  // It will be used when saving
}

// Save new shortcut
function saveNewShortcut() {
  if (!currentShortcut || !currentShortcut.key) {
    alert("Please record a shortcut first");
    return;
  }

  // Build the shortcut string
  let shortcutString = "";
  if (currentShortcut.modifiers.Ctrl) shortcutString += "Ctrl+";
  if (currentShortcut.modifiers.Alt) shortcutString += "Alt+";
  if (currentShortcut.modifiers.Shift) shortcutString += "Shift+";
  if (currentShortcut.modifiers.Meta) shortcutString += "Meta+";
  shortcutString += currentShortcut.key;

  // Get the action value
  const actionSelect = document.getElementById("shortcut-action");
  const actionValue = actionSelect.value;

  // Add to shortcuts
  shortcuts[shortcutString] =
    actionValue === "custom" ? "custom" : parseFloat(actionValue);

  // Save to storage
  saveShortcuts();

  // Reset form and update UI
  document.getElementById("new-shortcut-form").style.display = "none";
  document.getElementById("add-shortcut").style.display = "block";
  resetShortcutForm();
  renderShortcuts();
}

// Reset shortcut form
function resetShortcutForm() {
  currentShortcut = null;

  const recordingElement = document.getElementById("shortcut-recording");
  recordingElement.classList.remove("active");
  recordingElement.innerHTML = `
      <span class="shortcut-recording-text">Click to record shortcut</span>
      <i class="ph ph-keyboard"></i>
    `;

  document.getElementById("shortcut-action").selectedIndex = 0;
}

// Delete shortcut
function deleteShortcut(shortcut) {
  delete shortcuts[shortcut];
  saveShortcuts();
  renderShortcuts();
}

// Remove default shortcuts
function removeDefaultShortcuts() {
  const defaultShortcuts = {
    "Ctrl+1": 1,
    "Ctrl+2": 2,
    "Ctrl+5": 0.5,
    "Ctrl+0": "custom",
  };

  // Remove only default shortcuts
  for (const key in defaultShortcuts) {
    delete shortcuts[key];
  }

  saveShortcuts();
  renderShortcuts();
}

// Clear all shortcuts
function clearAllShortcuts() {
  shortcuts = {};
  saveShortcuts();
  renderShortcuts();
}

// Save shortcuts to storage
function saveShortcuts() {
  chrome.storage.sync.get("ytSpeedControllerConfig", function (data) {
    let config = data.ytSpeedControllerConfig || {};
    config.keyboardShortcuts = shortcuts;

    chrome.storage.sync.set({ ytSpeedControllerConfig: config });
  });
}
