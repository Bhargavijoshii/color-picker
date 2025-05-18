// Pick Color button using EyeDropper API
document.getElementById("pickColor").addEventListener("click", async () => {
  try {
    const eyeDropper = new EyeDropper();
    const { sRGBHex } = await eyeDropper.open();
    setColor(sRGBHex);
  } catch (err) {
    console.error(err);
  }
});

// Live input conversion from the input box
const hexInput = document.getElementById("hexInput");
hexInput.addEventListener("input", (e) => {
  const value = e.target.value.trim();
  if (!value) return;
  convertColor(value);
});

// Copy buttons for all formats
document.querySelectorAll(".copy").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.format;
    const text = document.getElementById(id).textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showToast());
  });
});

// Clear History button functionality
document.getElementById("clearHistory").addEventListener("click", () => {
  chrome.storage.local.set({ colorHistory: [] }, displayColorHistory);
});

// Set color and update UI + save to history
function setColor(hex) {
  document.getElementById("colorDisplay").style.backgroundColor = hex;
  hexInput.value = hex;
  convertColor(hex);
  saveColorToHistory(hex);
}

// Convert input color (hex or rgb string) to all formats and update UI
function convertColor(input) {
  let hex = input.startsWith('#') ? input : rgbToHex(input);
  if (!/^#([0-9A-F]{6}|[0-9A-F]{3})$/i.test(hex)) return;

  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);

  document.getElementById("hexValue").textContent = hex;
  document.getElementById("rgbValue").textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  document.getElementById("hslValue").textContent = hsl;
  document.getElementById("cmykValue").textContent = cmyk;

  document.getElementById("colorDisplay").style.backgroundColor = hex;
}

// Show "Copied!" toast notification
function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}

// Save picked color to local storage history (max 10 colors)
function saveColorToHistory(hex) {
  chrome.storage.local.get({ colorHistory: [] }, (result) => {
    let history = result.colorHistory;
    if (!history.includes(hex)) {
      history.unshift(hex);
      if (history.length > 10) history = history.slice(0, 10);
      chrome.storage.local.set({ colorHistory: history }, displayColorHistory);
    }
  });
}

// Display saved colors as clickable swatches
function displayColorHistory() {
  chrome.storage.local.get({ colorHistory: [] }, (result) => {
    const container = document.getElementById("historyContainer"); // Correct container ID
    container.innerHTML = "";
    result.colorHistory.forEach(hex => {
      const swatch = document.createElement("div");
      swatch.className = "history-swatch";
      swatch.style.backgroundColor = hex;
      swatch.title = hex;
      swatch.addEventListener("click", () => setColor(hex));
      container.appendChild(swatch);
    });
  });
}

// Utility: Hex to RGB
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  let bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

// Utility: RGB string to Hex (e.g. "rgb(255, 0, 0)")
function rgbToHex(rgbStr) {
  let parts = rgbStr.match(/\d+/g);
  if (!parts || parts.length < 3) return '';
  return "#" + parts.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// Utility: RGB to HSL string
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Utility: RGB to CMYK string
function rgbToCmyk({ r, g, b }) {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  let k = Math.min(c, m, y);
  c = ((c - k) / (1 - k)) || 0;
  m = ((m - k) / (1 - k)) || 0;
  y = ((y - k) / (1 - k)) || 0;
  return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
}

// Load and show history on popup load
document.addEventListener("DOMContentLoaded", displayColorHistory);
