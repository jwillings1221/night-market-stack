"use strict";

const assert = require("node:assert/strict");
const game = require("../logic.js");

const CONFIG = {
  blockH: 28,
  startW: 160,
  startSpeed: 100,
  speedAdd: 3,
  maxSpeed: 300,
  perfect: 12,
  minOverlap: 10,
  gap: 80,
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (error) {
    failed++;
    console.error(`[FAIL] ${name}`);
    console.error(`       ${error.message}`);
  }
}

test("重叠：完全重合等于宽度", () => {
  assert.equal(
    game.overlap({ x: 20, w: 120 }, { x: 20, w: 120 }),
    120,
  );
});

test("重叠：部分重合只计算交集", () => {
  assert.equal(
    game.overlap({ x: 37, w: 90 }, { x: 50, w: 100 }),
    77,
  );
});

test("重叠：完全错开为 0", () => {
  assert.equal(
    game.overlap({ x: 0, w: 40 }, { x: 40, w: 50 }),
    0,
  );
});

test("判定：中心偏差等于 12px 为 PERFECT", () => {
  const result = game.judge(
    { x: 52, w: 120 },
    { x: 40, w: 120 },
    CONFIG,
  );
  assert.equal(result.centerDelta, 12);
  assert.equal(result.status, "perfect");
});

test("判定：中心偏差大于 12px 为普通", () => {
  const result = game.judge(
    { x: 52.01, w: 120 },
    { x: 40, w: 120 },
    CONFIG,
  );
  assert.equal(result.status, "normal");
});

test("判定：重叠小于 10px 为失败", () => {
  const result = game.judge(
    { x: 171, w: 20 },
    { x: 160, w: 20 },
    CONFIG,
  );
  assert.equal(result.width, 9);
  assert.equal(result.status, "fail");
});

test("判定：重叠等于 10px 不判失败", () => {
  const result = game.judge(
    { x: 170, w: 20 },
    { x: 160, w: 20 },
    CONFIG,
  );
  assert.equal(result.width, 10);
  assert.notEqual(result.status, "fail");
});

test("计分：连续 PERFECT 从 11 分开始递增", () => {
  const first = game.scoreFor("perfect", 0);
  const second = game.scoreFor("perfect", first.combo);
  const third = game.scoreFor("perfect", second.combo);
  assert.deepEqual(first, { delta: 11, combo: 1 });
  assert.deepEqual(second, { delta: 12, combo: 2 });
  assert.deepEqual(third, { delta: 13, combo: 3 });
});

test("计分：PERFECT 倍率封顶 30 分", () => {
  assert.deepEqual(game.scoreFor("perfect", 19), { delta: 30, combo: 20 });
  assert.deepEqual(game.scoreFor("perfect", 30), { delta: 30, combo: 31 });
});

test("计分：普通落块加 5 分并清空连击", () => {
  assert.deepEqual(game.scoreFor("normal", 8), { delta: 5, combo: 0 });
});

test("重开：初始状态分数和连击归零", () => {
  const values = [0.25, 0.75];
  const state = game.createRoundState({
    width: 360,
    height: 640,
    config: CONFIG,
    best: 321,
    random: () => values.shift(),
    kindForIndex: (index) => ["tanghulu", "eggette", "lemonTea"][index % 3],
  });

  assert.equal(state.mode, "playing");
  assert.equal(state.blocks.length, 1);
  assert.equal(state.blocks[0].w, 160);
  assert.equal(state.blocks[0].kind, "tanghulu");
  assert.equal(state.current.kind, "eggette");
  assert.equal(state.current.dir, -1);
  assert.equal(state.speed, 100);
  assert.equal(state.score, 0);
  assert.equal(state.combo, 0);
  assert.equal(state.best, 321);
});

test("重开：连续创建两次得到一致且独立的初始状态", () => {
  const make = () =>
    game.createRoundState({
      width: 360,
      height: 640,
      config: CONFIG,
      best: 99,
      random: () => 0.5,
      kindForIndex: (index) => index % 3,
    });
  const first = make();
  first.score = 99;
  first.combo = 7;
  first.blocks[0].w = 1;
  const second = make();
  assert.equal(second.score, 0);
  assert.equal(second.combo, 0);
  assert.equal(second.blocks[0].w, 160);
});

test("组合流程：PERFECT、普通、失败与当前规则一致", () => {
  const previous = { x: 80, w: 120 };
  const perfect = game.judge({ x: 80, w: 120 }, previous, CONFIG);
  const firstScore = game.scoreFor(perfect.status, 0);
  assert.deepEqual(firstScore, { delta: 11, combo: 1 });

  const normal = game.judge({ x: 100, w: 120 }, previous, CONFIG);
  assert.equal(normal.status, "normal");
  assert.deepEqual(game.scoreFor(normal.status, firstScore.combo), {
    delta: 5,
    combo: 0,
  });

  const failure = game.judge({ x: 200, w: 120 }, previous, CONFIG);
  assert.equal(failure.status, "fail");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
