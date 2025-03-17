// YouTube Speed Controller
// This script adds speed control buttons next to the subscribe button on YouTube

// Configuration
const SPEEDS = [1, 1.5, 2, 2.5, 3, 3.5];
const MAX_SPEED = 10;

// Main function to initialize the extension
function initSpeedController() {
  // Check if we're on a YouTube video page
  if (!window.location.pathname.includes("/watch")) {
    return;
  }

  // Function to create the speed control buttons
  function createSpeedControls() {
    // Find the subscribe button container
    const subscribeButtonContainer =
      document.querySelector("#subscribe-button");
    if (!subscribeButtonContainer) {
      // If not found, try again later
      setTimeout(createSpeedControls, 1000);
      return;
    }

    // Check if our controls already exist
    if (document.querySelector(".yt-speed-controller")) {
      return;
    }

    // Create container for speed buttons
    const speedControlContainer = document.createElement("div");
    speedControlContainer.className = "yt-speed-controller";

    // Add preset speed buttons
    SPEEDS.forEach((speed) => {
      const button = createSpeedButton(speed + "x", () => {
        setVideoSpeed(speed);
      });
      speedControlContainer.appendChild(button);
    });

    // Add custom speed button
    const customButton = createSpeedButton("Custom", () => {
      const customSpeed = promptForCustomSpeed();
      if (customSpeed) {
        setVideoSpeed(customSpeed);
      }
    });
    speedControlContainer.appendChild(customButton);

    // Insert after subscribe button
    subscribeButtonContainer.parentNode.insertBefore(
      speedControlContainer,
      subscribeButtonContainer.nextSibling
    );
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
    }
  }

  // Function to update active button state
  function updateActiveButtonState(activeSpeed) {
    const buttons = document.querySelectorAll(".yt-speed-button");
    buttons.forEach((button) => {
      const buttonSpeed = parseFloat(button.textContent);
      if (
        button.textContent === activeSpeed + "x" ||
        (isNaN(buttonSpeed) && activeSpeed > Math.max(...SPEEDS))
      ) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  // Function to prompt for custom speed
  function promptForCustomSpeed() {
    const input = prompt("Enter custom speed (max 10x):", "4");
    if (input === null) return null;

    let speed = parseFloat(input);
    if (isNaN(speed)) {
      alert("Please enter a valid number");
      return null;
    }

    // Limit speed to MAX_SPEED
    speed = Math.min(Math.max(0.1, speed), MAX_SPEED);
    return speed;
  }

  // Initial setup
  createSpeedControls();

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
  initSpeedController();
} else {
  window.addEventListener("load", initSpeedController);
}

// Also run when YouTube's SPA navigation occurs
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(initSpeedController, 1500);
  }
}).observe(document, { subtree: true, childList: true });
