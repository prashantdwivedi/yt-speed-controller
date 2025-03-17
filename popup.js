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
