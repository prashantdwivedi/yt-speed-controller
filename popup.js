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

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    const currentTheme = document.querySelector(
      'input[name="theme"]:checked'
    ).value;
    if (currentTheme === "system") {
      setTheme("system");
    }
  });

// Create a new shortcut row from template
function createShortcutRow(shortcutData = {}) {
  const template = document.getElementById("shortcut-template");
  const clone = document.importNode(template.content, true);
  const row = clone.querySelector(".shortcut-row");

  // Set modifiers if provided
  if (shortcutData.shortcut) {
    const parts = shortcutData.shortcut.split("+");
    const key = parts.pop(); // Last part is the key

    // Set modifiers
    const modifiers = parts.map((m) => m.trim());
    row.querySelectorAll(".modifier-key").forEach((checkbox) => {
      const modifier = checkbox.getAttribute("data-modifier");
      if (modifiers.includes(modifier)) {
        checkbox.checked = true;
      }
    });

    // Set key
    row.querySelector(".shortcut-key").value = key;
  }

  // Set action if provided
  if (shortcutData.action !== undefined) {
    const actionSelect = row.querySelector(".shortcut-action");
    for (let i = 0; i < actionSelect.options.length; i++) {
      if (actionSelect.options[i].value === shortcutData.action.toString()) {
        actionSelect.selectedIndex = i;
        break;
      }
    }
  }

  // Add event listener to remove button
  row.querySelector(".remove-btn").addEventListener("click", function () {
    row.remove();
  });

  return row;
}

// Add a new shortcut row
function addShortcutRow(shortcutData) {
  const container = document.getElementById("shortcuts-container");
  container.appendChild(createShortcutRow(shortcutData));
}

// Get shortcut string from a row
function getShortcutFromRow(row) {
  let shortcut = "";

  // Get modifiers
  row.querySelectorAll(".modifier-key:checked").forEach((checkbox) => {
    shortcut += checkbox.getAttribute("data-modifier") + "+";
  });

  // Get key
  const key = row.querySelector(".shortcut-key").value.trim();
  if (key) {
    shortcut += key;
    return shortcut;
  }

  return null; // No key specified
}

// Save options to chrome.storage
function saveOptions() {
  const saveButton = document.getElementById("save");
  const status = document.getElementById("status");

  // Hide save button and show status message
  saveButton.style.display = "none";
  status.style.display = "block";

  const theme = document.querySelector('input[name="theme"]:checked').value;
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
    const shortcut = getShortcutFromRow(row);
    if (shortcut) {
      const action = row.querySelector(".shortcut-action").value;
      keyboardShortcuts[shortcut] =
        action === "custom" ? "custom" : parseFloat(action);
    }
  });

  const config = {
    theme: theme,
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
      // After 2 seconds, hide the status message and show the save button again
      setTimeout(function () {
        status.style.display = "none";
        saveButton.style.display = "block";
      }, 2000);
    }
  );
}

// Restore options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get("ytSpeedControllerConfig", function (data) {
    if (data.ytSpeedControllerConfig) {
      const config = data.ytSpeedControllerConfig;

      // Set theme
      if (config.theme) {
        document.querySelector(
          `input[name="theme"][value="${config.theme}"]`
        ).checked = true;
        setTheme(config.theme);
      } else {
        setTheme("system"); // Default
      }

      // Set placement
      if (config.placement) {
        document.querySelector(
          `input[name="placement"][value="${config.placement}"]`
        ).checked = true;
      }

      // Set increment
      if (config.increment) {
        const incrementRadio = document.querySelector(
          `input[name="increment"][value="${config.increment}"]`
        );
        if (incrementRadio) {
          incrementRadio.checked = true;
        }
      }

      // Clear existing shortcuts
      document.getElementById("shortcuts-container").innerHTML = "";

      // Add keyboard shortcuts
      if (config.keyboardShortcuts) {
        const shortcuts = Object.entries(config.keyboardShortcuts);

        if (shortcuts.length > 0) {
          shortcuts.forEach(([shortcut, action]) => {
            const actionValue =
              action === "custom" ? "custom" : action.toString();
            addShortcutRow({ shortcut, action: actionValue });
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
      // Set default theme
      setTheme("dark"); // Default to dark theme
      document.querySelector(
        'input[name="theme"][value="dark"]'
      ).checked = true;
      // Add a default empty row if no config exists
      addShortcutRow();
    }
  });
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  restoreOptions();

  // Theme change listeners
  document.querySelectorAll('input[name="theme"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      setTheme(this.value);
    });
  });

  // Add shortcut button
  document
    .getElementById("add-shortcut")
    .addEventListener("click", function () {
      addShortcutRow();
    });

  // Save button
  document.getElementById("save").addEventListener("click", saveOptions);

  // GitHub link
  document.getElementById("github-link").addEventListener("click", function () {
    window.open(
      "https://github.com/prashantdwivedi/yt-speed-controller",
      "_blank"
    );
  });
});
