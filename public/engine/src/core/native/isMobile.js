
window.funkin = window.funkin || {};

window.funkin.mobile = (function () {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // comprobe mobile or touch
  return (
    /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      ua,
    ) ||
    (navigator.maxTouchPoints > 0 && /Macintosh|Android/.test(ua))
  );
})();