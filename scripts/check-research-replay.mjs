import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the actual replay controller with a deterministic frame clock.
const context = {window: {}};
runInNewContext(readFileSync('dist/product-examples.js', 'utf8'), context);
const element = () => ({style: {}, attributes: {}, setAttribute(key, value) { this.attributes[key] = String(value); }});
const progress = element(), play = element(), body = element(), status = element();
const steps = context.window.productExamples.research.map((_, i) => Object.assign(element(), {dataset: {autoStep: String(i)}}));
let onClick, onVisibility, nextFrame, disconnected = false, now = 0;
const host = {
  dataset: {step: '0'},
  querySelector: selector => ({'.auto-progress span': progress, '[data-auto-play]': play, '.record-body': body, '[data-process-status]': status}[selector]),
  querySelectorAll: () => steps,
  addEventListener: (event, handler) => { if (event === 'click') onClick = handler; },
};
Object.assign(context, {
  document: {hidden: false},
  matchMedia: () => ({matches: false}),
  IntersectionObserver: class {
    constructor(callback) { onVisibility = visible => callback([{isIntersecting: visible}]); }
    observe() { onVisibility(true); }
    disconnect() { disconnected = true; }
  },
  requestAnimationFrame: callback => { nextFrame = callback; return 1; },
  cancelAnimationFrame: () => { nextFrame = undefined; },
});
runInNewContext(readFileSync('dist/product-records.js', 'utf8'), context);
const controller = new AbortController();
context.window.productRecordViews.mount({querySelector: () => host}, 'research', controller.signal);
nextFrame(now);
function advance(ms) {
  for (let elapsed = 0; elapsed < ms; elapsed += 50) {
    now += 50;
    assert.ok(nextFrame, 'Replay frame must remain scheduled until disposal');
    nextFrame(now);
  }
}
function click(selector, button = play) {
  onClick({target: {closest: query => query === selector ? button : null}});
}
advance(3250);
assert.equal(host.dataset.step, '0');
assert.equal(progress.style.transform, 'scaleX(0.5)');
advance(3250);
assert.equal(host.dataset.step, 1, 'A full progress bar advances the active stage');
assert.equal(progress.style.transform, 'scaleX(0)');
assert.equal(steps[1].attributes['aria-pressed'], 'true');
assert.ok(body.innerHTML.includes('stage2_refinement/round3/winner.json'));

click('[data-auto-play]');
const frozen = progress.style.transform;
advance(7000);
assert.equal(host.dataset.step, 1);
assert.equal(progress.style.transform, frozen, 'Pause must freeze both bar and stage');
click('[data-auto-play]');
context.document.hidden = true;
advance(7000);
assert.equal(progress.style.transform, frozen, 'Hidden documents must not animate a false progress bar');
context.document.hidden = false;
onVisibility(false);
advance(7000);
assert.equal(progress.style.transform, frozen, 'Offscreen replay must freeze both bar and stage');
onVisibility(true);
advance(6500);
assert.equal(host.dataset.step, 2);

click('[data-auto-step]', steps[4]);
assert.equal(host.dataset.step, 4);
assert.equal(host.dataset.playing, false);
advance(7000);
assert.equal(progress.style.transform, 'scaleX(0)', 'Manual selection pauses and resets progress');
click('[data-auto-play]');
advance(6500);
assert.equal(host.dataset.step, 0, 'Playback wraps from the final stage to the first');
controller.abort();
assert.equal(nextFrame, undefined);
assert.equal(disconnected, true);
console.log('Passed: research stage/progress synchronization, pause, visibility, manual selection, wrap and disposal.');
