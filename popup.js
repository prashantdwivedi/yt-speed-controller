// Set theme based on user preference
function setPopupTheme() {
  chrome.storage.sync.get("ytSpeedControllerConfig", function (data) {
    if (data.ytSpeedControllerConfig && data.ytSpeedControllerConfig.theme) {
      const theme = data.ytSpeedControllerConfig.theme;

      if (
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.body.classList.add("dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
      }
    } else {
      // Default to system theme
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.classList.add("dark-theme");
      }
    }
  });
}

// Open options page when the options button is clicked
document.getElementById("options").addEventListener("click", function () {
  chrome.runtime.openOptionsPage();
});

// Show about information
document.getElementById("about").addEventListener("click", function () {
  window.open(
    "https://github.com/yourusername/youtube-speed-controller",
    "_blank"
  );
});

// Set theme when popup opens
document.addEventListener("DOMContentLoaded", setPopupTheme);
