// Shortcut template for adding new shortcuts
function createShortcutRow(key = "", action = "1") {
  const shortcutRow = document.createElement("div");
  shortcutRow.className = "shortcut-row";

  const keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.className = "shortcut-key";
  keyInput.value = key;
  keyInput.maxLength = 1;
  keyInput.placeholder = "Key";

  const actionSelect = document.createElement("select");
  actionSelect.className = "shortcut-action";

  const options = [
    { value: "1", text: "1x speed" },
    { value: "1.5", text: "1.5x speed" },
    { value: "2", text: "2x speed" },
    { value: "2.5", text: "2.5x speed" },
    { value: "custom", text: "Custom speed" },
  ];

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    if (option.value === action) {
      optionElement.selected = true;
    }
    actionSelect.appendChild(optionElement);
  });

  const removeButton = document.createElement("button");
  removeButton.className = "remove-shortcut-btn";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", function () {
    shortcutRow.remove();
  });

  shortcutRow.appendChild(keyInput);
  shortcutRow.appendChild(actionSelect);
  shortcutRow.appendChild(removeButton);

  return shortcutRow;
}

// Add a new shortcut row
function addShortcutRow() {
  const container = document.getElementById("shortcuts-container");
  container.appendChild(createShortcutRow());
}

// Save options to chrome.storage
function saveOptions() {
  const placement = document.querySelector(
    'input[name="placement"]:checked'
  ).value;
  const increment = parseFloat(
    document.querySelector('input[name="increment"]:checked').value
  );

  // Get all keyboard shortcuts
  const keyboardShortcuts = {};
  const shortcutRows = document.querySelectorAll(".shortcut-row");

  shortcutRows.forEach((row) => {
    const key = row.querySelector(".shortcut-key").value.trim();
    const action = row.querySelector(".shortcut-action").value;

    if (key) {
      keyboardShortcuts[key] =
        action === "custom" ? "custom" : parseFloat(action);
    }
  });

  const config = {
    placement: placement,
    speeds: [1, 1.5, 2, 2.5],
    increment: increment,
    keyboardShortcuts: keyboardShortcuts,
  };

  chrome.storage.sync.set(
    {
      ytSpeedControllerConfig: config,
    },
    function () {
      // Update status to let user know options were saved
      const status = document.getElementById("status");
      status.style.display = "block";
      setTimeout(function () {
        status.style.display = "none";
      }, 2000);
    }
  );
}

// Restore options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get("ytSpeedControllerConfig", function (data) {
    if (data.ytSpeedControllerConfig) {
      const config = data.ytSpeedControllerConfig;

      // Set placement
      document.querySelector(
        `input[name="placement"][value="${config.placement}"]`
      ).checked = true;

      // Set increment
      const incrementRadio = document.querySelector(
        `input[name="increment"][value="${config.increment}"]`
      );
      if (incrementRadio) {
        incrementRadio.checked = true;
      }

      // Clear existing shortcuts
      document.getElementById("shortcuts-container").innerHTML = "";

      // Add keyboard shortcuts
      if (config.keyboardShortcuts) {
        const shortcuts = Object.entries(config.keyboardShortcuts);

        if (shortcuts.length > 0) {
          shortcuts.forEach(([key, action]) => {
            const actionValue =
              action === "custom" ? "custom" : action.toString();
            document
              .getElementById("shortcuts-container")
              .appendChild(createShortcutRow(key, actionValue));
          });
        } else {
          // Add a default empty row if no shortcuts exist
          addShortcutRow();
        }
      } else {
        // Add a default empty row if no shortcuts exist
        addShortcutRow();
      }
    } else {
      // Add a default empty row if no config exists
      addShortcutRow();
    }
  });
}

// Event listeners
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document
  .getElementById("add-shortcut")
  .addEventListener("click", addShortcutRow);
