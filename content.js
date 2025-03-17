// YouTube Speed Controller
// This script adds speed control buttons on YouTube based on user preferences

// Default configuration
let config = {
  placement: "player", // 'subscribe' or 'player'
  speeds: [1, 1.5, 2, 2.5],
  increment: 0.5,
  keyboardShortcuts: {},
  theme: "system", // 'light', 'dark', or 'system'
};

// Load user configuration
chrome.storage.sync.get("ytSpeedControllerConfig", function (data) {
  if (data.ytSpeedControllerConfig) {
    config = { ...config, ...data.ytSpeedControllerConfig };
  }
  initSpeedController();
});

// Main function to initialize the extension
function initSpeedController() {
  // Check if we're on a YouTube video page
  if (!window.location.pathname.includes("/watch")) {
    return;
  }

  // Function to create the speed control buttons
  function createSpeedControls() {
    // Remove ALL existing controls to prevent duplication
    removeExistingControls();

    // Create container for speed buttons
    const speedControlContainer = document.createElement("div");
    speedControlContainer.className = "yt-speed-controller";

    // Add preset speed buttons
    config.speeds.forEach((speed) => {
      const button = createSpeedButton(speed + "x", () => {
        setVideoSpeed(speed);
      });
      speedControlContainer.appendChild(button);
    });

    // Create custom speed control with plus/minus buttons
    const customSpeedControl = document.createElement("div");
    customSpeedControl.className = "yt-custom-speed-control";

    // Minus button
    const minusButton = document.createElement("button");
    minusButton.className = "yt-speed-button yt-speed-adjust";
    minusButton.textContent = "-";
    minusButton.setAttribute("aria-label", "Decrease playback speed");
    minusButton.addEventListener("click", () => {
      adjustCustomSpeed(-config.increment);
    });

    // Custom speed input
    const customInput = document.createElement("input");
    customInput.type = "text";
    customInput.className = "yt-custom-speed-input";
    customInput.value = "1.0x";
    customInput.size = 4;
    customInput.setAttribute("aria-label", "Custom playback speed");
    customInput.addEventListener("change", () => {
      const value = parseFloat(customInput.value.replace("x", ""));
      if (!isNaN(value) && value > 0 && value <= 10) {
        setVideoSpeed(value);
      } else {
        // Reset to current speed if invalid
        const video = document.querySelector("video");
        if (video) {
          customInput.value = video.playbackRate + "x";
        } else {
          customInput.value = "1.0x";
        }
      }
    });

    // Plus button
    const plusButton = document.createElement("button");
    plusButton.className = "yt-speed-button yt-speed-adjust";
    plusButton.textContent = "+";
    plusButton.setAttribute("aria-label", "Increase playback speed");
    plusButton.addEventListener("click", () => {
      adjustCustomSpeed(config.increment);
    });

    customSpeedControl.appendChild(minusButton);
    customSpeedControl.appendChild(customInput);
    customSpeedControl.appendChild(plusButton);

    speedControlContainer.appendChild(customSpeedControl);

    // Insert controls based on user preference
    if (config.placement === "subscribe") {
      // Place next to subscribe button - FIXED VERSION
      insertNextToSubscribeButton(speedControlContainer);
    } else {
      // Place on video player - KEEP THIS CODE UNCHANGED
      insertIntoVideoPlayer(speedControlContainer);
    }

    // Update the custom input to show current speed
    const video = document.querySelector("video");
    if (video) {
      customInput.value = video.playbackRate + "x";
      updateActiveButtonState(video.playbackRate);
    }
  }

  // Function to remove all existing controls
  function removeExistingControls() {
    // Remove player controls
    const existingPlayerControls = document.querySelectorAll(
      ".yt-speed-controller-container"
    );
    existingPlayerControls.forEach((control) => control.remove());

    // Remove subscribe button controls
    const existingSubscribeControls = document.querySelectorAll(
      ".yt-speed-controller-wrapper"
    );
    existingSubscribeControls.forEach((control) => control.remove());
  }

  // Function to insert controls next to subscribe button
  function insertNextToSubscribeButton(speedControlContainer) {
    const subscribeButton = document.querySelector("#subscribe-button");

    if (subscribeButton) {
      // Create a wrapper with proper styling
      const wrapper = document.createElement("div");
      wrapper.className = "yt-speed-controller-wrapper subscribe-placement";
      wrapper.id = "yt-speed-subscribe-controls"; // Add ID for easier selection
      wrapper.style.cssText =
        "display: inline-flex; margin-left: 16px; align-items: center;";
      wrapper.appendChild(speedControlContainer);

      // Find the owner container which is next to the subscribe button
      const ownerContainer = document.querySelector("#owner");

      if (ownerContainer) {
        // Check if we already have controls in the owner container
        const existingControls = ownerContainer.querySelector(
          "#yt-speed-subscribe-controls"
        );
        if (existingControls) {
          existingControls.remove();
        }

        // Insert into the owner container
        ownerContainer.appendChild(wrapper);
      } else {
        // If not found, try again later
        setTimeout(createSpeedControls, 1000);
      }
    } else {
      // If not found, try again later
      setTimeout(createSpeedControls, 1000);
    }
  }

  // Function to insert controls into video player
  function insertIntoVideoPlayer(speedControlContainer) {
    const rightControls = document.querySelector(".ytp-right-controls");
    if (rightControls) {
      // Create a container that mimics YouTube's button style
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "ytp-button yt-speed-controller-container";
      buttonContainer.id = "yt-speed-player-controls"; // Add ID for easier selection

      // Force width with inline style - critical fix
      buttonContainer.style.cssText =
        "width: auto !important; min-width: auto !important; max-width: none !important;";

      // Set attribute for CSS targeting
      buttonContainer.setAttribute("data-force-width", "auto");

      // Add the speed controls to this container
      buttonContainer.appendChild(speedControlContainer);
      speedControlContainer.classList.add("yt-speed-controller-player");

      // Check if we already have controls in the right controls
      const existingControls = rightControls.querySelector(
        "#yt-speed-player-controls"
      );
      if (existingControls) {
        existingControls.remove();
      }

      // Get the first button in right controls
      const firstButton = rightControls.firstChild;

      // Insert before the first button in right controls
      if (firstButton) {
        rightControls.insertBefore(buttonContainer, firstButton);
      } else {
        rightControls.appendChild(buttonContainer);
      }

      // Additional attempt to force width via JavaScript
      setTimeout(() => {
        if (buttonContainer) {
          buttonContainer.style.width = "auto";
          buttonContainer.style.setProperty("width", "auto", "important");
        }
      }, 100);
    } else {
      // If not found, try again later
      setTimeout(createSpeedControls, 1000);
    }
  }

  // Function to create a speed button
  function createSpeedButton(text, clickHandler) {
    const button = document.createElement("button");
    button.className = "yt-speed-button";
    button.textContent = text;
    button.setAttribute("aria-label", `Set playback speed to ${text}`);
    button.addEventListener("click", clickHandler);
    return button;
  }

  // Function to set video speed
  function setVideoSpeed(speed) {
    const video = document.querySelector("video");
    if (video) {
      video.playbackRate = speed;
      // Update active button state
      updateActiveButtonState(speed);
      // Update custom input
      const customInput = document.querySelector(".yt-custom-speed-input");
      if (customInput) {
        customInput.value = speed + "x";
      }
    }
  }

  // Function to adjust custom speed
  function adjustCustomSpeed(delta) {
    const video = document.querySelector("video");
    if (video) {
      let newSpeed = Math.round((video.playbackRate + delta) * 10) / 10;
      newSpeed = Math.min(Math.max(0.1, newSpeed), 10);
      setVideoSpeed(newSpeed);
    }
  }

  // Function to update active button state
  function updateActiveButtonState(activeSpeed) {
    const buttons = document.querySelectorAll(
      ".yt-speed-button:not(.yt-speed-adjust)"
    );
    buttons.forEach((button) => {
      if (button.textContent === activeSpeed + "x") {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  // Setup keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Only process if not typing in an input field
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Build the shortcut string based on modifier keys
      let shortcut = "";
      if (e.ctrlKey) shortcut += "Ctrl+";
      if (e.altKey) shortcut += "Alt+";
      if (e.shiftKey) shortcut += "Shift+";
      if (e.metaKey) shortcut += "Meta+"; // Command key on Mac

      // Add the pressed key
      shortcut += e.key;

      if (
        config.keyboardShortcuts &&
        config.keyboardShortcuts[shortcut] !== undefined
      ) {
        if (config.keyboardShortcuts[shortcut] === "custom") {
          // Focus the custom input
          const customInput = document.querySelector(".yt-custom-speed-input");
          if (customInput) {
            customInput.focus();
            customInput.select();
          }
        } else {
          setVideoSpeed(config.keyboardShortcuts[shortcut]);
        }
        e.preventDefault();
      }
    });
  }

  // Function to check if controls need to be reapplied
  function checkAndReapplyControls() {
    if (window.location.pathname.includes("/watch")) {
      if (config.placement === "player") {
        // Check if our player controls exist
        const playerControls = document.querySelector(
          "#yt-speed-player-controls"
        );
        if (!playerControls) {
          createSpeedControls();
        } else {
          // Ensure width is still set to auto (YouTube might override it)
          playerControls.style.cssText =
            "width: auto !important; min-width: auto !important; max-width: none !important;";
        }
      } else {
        // Check if our subscribe controls exist
        const subscribeControls = document.querySelector(
          "#yt-speed-subscribe-controls"
        );
        if (!subscribeControls) {
          createSpeedControls();
        }
      }
    }
  }

  // Function to inject a style element to force width
  function injectWidthFix() {
    // Remove any existing style element
    const existingStyle = document.getElementById(
      "yt-speed-controller-width-fix"
    );
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create a new style element
    const style = document.createElement("style");
    style.id = "yt-speed-controller-width-fix";
    style.textContent = `
      .ytp-button.yt-speed-controller-container,
      .ytp-button.yt-speed-controller-container[style],
      .ytp-button.yt-speed-controller-container[style*="width"],
      div[class*="ytp-button"][class*="yt-speed-controller-container"],
      div[data-force-width="auto"] {
        width: auto !important;
        min-width: auto !important;
        max-width: none !important;
      }
      
      /* Subscribe placement styles */
      .yt-speed-controller-wrapper.subscribe-placement {
        display: inline-flex;
        margin-left: 16px;
        align-items: center;
      }
      
      .subscribe-placement .yt-speed-controller {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .subscribe-placement .yt-speed-button {
        background-color: rgba(0, 0, 0, 0.05);
        color: #0f0f0f;
        border-radius: 18px;
        padding: 8px 12px;
        font-size: 14px;
        height: 36px;
        line-height: 1;
        margin: 0 2px;
      }
      
      .subscribe-placement .yt-speed-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      .subscribe-placement .yt-speed-button.active {
        background-color: #0f0f0f;
        color: white;
      }
      
      html[dark] .subscribe-placement .yt-speed-button {
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      html[dark] .subscribe-placement .yt-speed-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      html[dark] .subscribe-placement .yt-speed-button.active {
        background-color: #fff;
        color: #0f0f0f;
      }
    `;

    // Add the style to the document head
    document.head.appendChild(style);
  }

  // Initial setup
  injectWidthFix();
  createSpeedControls();
  setupKeyboardShortcuts();

  // Periodically check if controls need to be reapplied
  setInterval(checkAndReapplyControls, 2000);

  // Re-add controls when navigating between videos
  const observer = new MutationObserver((mutations) => {
    if (window.location.pathname.includes("/watch")) {
      // Small delay to let YouTube's UI stabilize
      setTimeout(() => {
        injectWidthFix();
        createSpeedControls();
      }, 500);
    }
  });

  // Start observing URL changes
  observer.observe(document.querySelector("head > title"), {
    subtree: true,
    characterData: true,
    childList: true,
  });

  // Also observe the player for changes that might remove our controls
  const playerObserver = new MutationObserver((mutations) => {
    // Check if our controls are still present
    checkAndReapplyControls();
  });

  // Start observing the player container
  const playerContainer = document.querySelector(".html5-video-player");
  if (playerContainer) {
    playerObserver.observe(playerContainer, {
      childList: true,
      subtree: true,
    });
  }
}

// Initialize when the page is fully loaded
if (document.readyState === "complete") {
  // Config will be loaded from storage before initialization
} else {
  window.addEventListener("load", () => {
    // Config will be loaded from storage before initialization
  });
}

// Also run when YouTube's SPA navigation occurs
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      // Only re-initialize if we already have config
      if (config) {
        initSpeedController();
      }
    }, 1500);
  }
}).observe(document, { subtree: true, childList: true });
