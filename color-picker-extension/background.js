chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "getPixelColor") {
    try {
      // Capture screenshot of visible tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });

      // Create an offscreen image to get pixel data
      const img = new Image();
      img.src = dataUrl;

      img.onload = () => {
        // Create offscreen canvas
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Calculate scaling because captured image size might differ from viewport size
        const scaleX = img.width / window.innerWidth;
        const scaleY = img.height / window.innerHeight;

        // Mouse coordinates from message
        let x = message.x * scaleX;
        let y = message.y * scaleY;

        // Clamp coordinates inside image
        x = Math.min(Math.max(0, x), img.width - 1);
        y = Math.min(Math.max(0, y), img.height - 1);

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = rgbToHex(r, g, b);

        sendResponse({ color: hex });
      };

      // Return true to keep the message channel open for sendResponse inside img.onload
      return true;

    } catch (e) {
      console.error("Error getting pixel color:", e);
      sendResponse({ color: null });
    }
  }
});

// Utility: Convert RGB to Hex string
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}
