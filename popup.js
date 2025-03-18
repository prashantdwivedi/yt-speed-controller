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

// Display shortcuts in the main popup
function displayShortcuts(shortcuts) {
  const container = document.getElementById("shortcuts-container");

  // Clear container
  container.innerHTML = "";

  // If no shortcuts, show message
  if (!shortcuts || Object.keys(shortcuts).length === 0) {
    container.innerHTML = `
        <div class="no-shortcuts">
          No shortcuts configured yet
        </div>
      `;
    return;
  }

  // Create shortcuts list
  const shortcutsList = document.createElement("div");
  shortcutsList.className = "shortcuts-list";

  // Display up to 3 shortcuts
  let count = 0;
  for (const [shortcut, action] of Object.entries(shortcuts)) {
    if (count >= 3) {
      // Add a "more" message if there are more than 3 shortcuts
      const moreMessage = document.createElement("div");
      moreMessage.className = "shortcut-item";
      moreMessage.style.textAlign = "center";
      moreMessage.style.color = "var(--text-secondary)";
      moreMessage.textContent = `+ ${
        Object.keys(shortcuts).length - 3
      } more shortcuts`;
      shortcutsList.appendChild(moreMessage);
      break;
    }

    // Create shortcut item
    const shortcutItem = document.createElement("div");
    shortcutItem.className = "shortcut-item";

    // Create action text
    const actionText = document.createElement("div");
    actionText.className = "shortcut-action";
    actionText.textContent = getActionLabel(action);

    // Create keys display
    const keysDisplay = document.createElement("div");
    keysDisplay.className = "shortcut-keys";

    // Parse the shortcut string
    const keys = shortcut.split("+");
    keys.forEach((key, index) => {
      const keyBadge = document.createElement("span");
      keyBadge.className = "key-badge";
      keyBadge.textContent = key;
      keysDisplay.appendChild(keyBadge);

      if (index < keys.length - 1) {
        const plus = document.createElement("span");
        plus.className = "key-plus";
        plus.textContent = "+";
        keysDisplay.appendChild(plus);
      }
    });

    // Add elements to shortcut item
    shortcutItem.appendChild(actionText);
    shortcutItem.appendChild(keysDisplay);

    shortcutsList.appendChild(shortcutItem);
    count++;
  }

  container.appendChild(shortcutsList);
}

// Get readable label for action
function getActionLabel(action) {
  if (action === "custom") {
    return "Custom Speed Input";
  } else {
    return `Speed: ${action}x`;
  }
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

  // Get the existing config to preserve shortcuts
  chrome.storage.sync.get("ytSpeedControllerConfig", function (data) {
    let config = {
      theme: theme,
      placement: placement,
      speeds: [1, 1.5, 2, 2.5],
      increment: increment,
      keyboardShortcuts: {},
    };

    // Preserve existing shortcuts if they exist
    if (
      data.ytSpeedControllerConfig &&
      data.ytSpeedControllerConfig.keyboardShortcuts
    ) {
      config.keyboardShortcuts = data.ytSpeedControllerConfig.keyboardShortcuts;
    }

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
  });
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

      // Display shortcuts
      if (config.keyboardShortcuts) {
        displayShortcuts(config.keyboardShortcuts);
      }
    } else {
      // Set default theme
      setTheme("dark"); // Default to dark theme
      document.querySelector(
        'input[name="theme"][value="dark"]'
      ).checked = true;
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

  // Manage shortcuts button
  document
    .getElementById("manage-shortcuts")
    .addEventListener("click", function () {
      window.location.href = "shortcuts.html";
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
