// YouTube Speed Controller
// This script adds speed control buttons on YouTube based on user preferences

// Default configuration
let config = {
  placement: "subscribe", // 'subscribe' or 'player'
  speeds: [1, 1.5, 2, 2.5],
  increment: 0.5,
  keyboardShortcuts: {},
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
    // Remove existing controls if any
    const existingControls = document.querySelector(".yt-speed-controller");
    if (existingControls) {
      existingControls.remove();
    }

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
    minusButton.addEventListener("click", () => {
      adjustCustomSpeed(-config.increment);
    });

    // Custom speed input
    const customInput = document.createElement("input");
    customInput.type = "text";
    customInput.className = "yt-custom-speed-input";
    customInput.value = "1.0x";
    customInput.size = 4;
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
    plusButton.addEventListener("click", () => {
      adjustCustomSpeed(config.increment);
    });

    customSpeedControl.appendChild(minusButton);
    customSpeedControl.appendChild(customInput);
    customSpeedControl.appendChild(plusButton);

    speedControlContainer.appendChild(customSpeedControl);

    // Insert controls based on user preference
    if (config.placement === "subscribe") {
      // Place next to subscribe button
      const subscribeButtonContainer =
        document.querySelector("#subscribe-button");
      if (subscribeButtonContainer) {
        subscribeButtonContainer.parentNode.insertBefore(
          speedControlContainer,
          subscribeButtonContainer.nextSibling
        );
      } else {
        // If not found, try again later
        setTimeout(createSpeedControls, 1000);
        return;
      }
    } else {
      // Place on video player before autoplay toggle
      const playerControls = document.querySelector(".ytp-right-controls");
      if (playerControls) {
        // Insert at the beginning of the right controls
        playerControls.insertBefore(
          speedControlContainer,
          playerControls.firstChild
        );
        speedControlContainer.classList.add("yt-speed-controller-player");
      } else {
        // If not found, try again later
        setTimeout(createSpeedControls, 1000);
        return;
      }
    }

    // Update the custom input to show current speed
    const video = document.querySelector("video");
    if (video) {
      customInput.value = video.playbackRate + "x";
      updateActiveButtonState(video.playbackRate);
    }
  }

  // Function to create a speed button
  function createSpeedButton(text, clickHandler) {
    const button = document.createElement("button");
    button.className = "yt-speed-button";
    button.textContent = text;
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
      const buttonSpeed = parseFloat(button.textContent);
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

      const key = e.key;
      if (
        config.keyboardShortcuts &&
        config.keyboardShortcuts[key] !== undefined
      ) {
        if (config.keyboardShortcuts[key] === "custom") {
          // Focus the custom input
          const customInput = document.querySelector(".yt-custom-speed-input");
          if (customInput) {
            customInput.focus();
            customInput.select();
          }
        } else {
          setVideoSpeed(config.keyboardShortcuts[key]);
        }
        e.preventDefault();
      }
    });
  }

  // Initial setup
  createSpeedControls();
  setupKeyboardShortcuts();

  // Re-add controls when navigating between videos
  const observer = new MutationObserver((mutations) => {
    if (window.location.pathname.includes("/watch")) {
      createSpeedControls();
    }
  });

  // Start observing URL changes
  observer.observe(document.querySelector("head > title"), {
    subtree: true,
    characterData: true,
    childList: true,
  });
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
