// Copy buttons on the first-bot guide. A file of its own because the CSP
// allows same-origin scripts only — an inline handler would be blocked.
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".tpl .copy");
  if (!button) return;
  const text = button.parentElement.querySelector("pre").textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  } catch {
    // No clipboard access (older browser, or not HTTPS): select it instead.
    const range = document.createRange();
    range.selectNodeContents(button.parentElement.querySelector("pre"));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = "Selected — Ctrl+C";
  }
  setTimeout(() => { button.textContent = "Copy"; }, 1600);
});
