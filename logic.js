(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.NightMarketLogic = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function overlap(current, previous) {
    const left = Math.max(current.x, previous.x);
    const right = Math.min(current.x + current.w, previous.x + previous.w);
    return Math.max(0, right - left);
  }

  function judge(current, previous, config) {
    const left = Math.max(current.x, previous.x);
    const right = Math.min(current.x + current.w, previous.x + previous.w);
    const width = Math.max(0, right - left);
    const centerDelta = Math.abs(
      current.x + current.w / 2 - (previous.x + previous.w / 2),
    );

    let status = "normal";
    if (width < config.minOverlap) status = "fail";
    else if (centerDelta <= config.perfect) status = "perfect";

    return { left, width, centerDelta, status };
  }

  function scoreFor(status, combo) {
    const safeCombo = Number.isFinite(combo) ? Math.max(0, Math.floor(combo)) : 0;
    if (status === "perfect") {
      const nextCombo = safeCombo + 1;
      return {
        delta: Math.min(30, 10 + nextCombo),
        combo: nextCombo,
      };
    }
    if (status === "normal") {
      return { delta: 5, combo: 0 };
    }
    return { delta: 0, combo: safeCombo };
  }

  function createRoundState(options) {
    const width = options.width;
    const height = options.height;
    const config = options.config;
    const random = options.random || Math.random;
    const kindForIndex = options.kindForIndex || (() => "tanghulu");
    const first = {
      x: (width - config.startW) / 2,
      y: height - 60,
      w: config.startW,
      h: config.blockH,
      kind: kindForIndex(0),
    };

    return {
      mode: "playing",
      blocks: [first],
      current: {
        x: random() * (width - config.startW),
        y: first.y - config.blockH - config.gap,
        w: config.startW,
        h: config.blockH,
        kind: kindForIndex(1),
        dir: random() < 0.5 ? 1 : -1,
      },
      speed: config.startSpeed,
      score: 0,
      combo: 0,
      lastDropAt: 0,
      best: Number.isFinite(options.best) ? options.best : 0,
      cameraY: 0,
    };
  }

  return Object.freeze({
    overlap,
    judge,
    scoreFor,
    createRoundState,
  });
});
