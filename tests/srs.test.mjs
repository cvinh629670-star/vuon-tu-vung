import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dateKey, dailyGoal, grades, interval, review, studyQueue } from '../srs.mjs';

const deck = JSON.parse(readFileSync(new URL('../data/words.json', import.meta.url), 'utf8'));
const start = new Date(2026, 10, 25, 9).getTime();

test('fixed deck contains 3,000 unique words with pronunciation and Vietnamese meaning', () => {
  assert.equal(deck.length, 3000);
  assert.equal(new Set(deck.map(row => row[0])).size, deck.length);
  assert.ok(deck.every(row => row.slice(0, 4).length === 4 && row.slice(0, 4).every(field => field.trim())));
});

test('grades schedule distinct intervals, and remembering extends the review interval', () => {
  assert.deepEqual(grades.map(({ id }) => interval(undefined, id)), [600_000, 86_400_000, 259_200_000, 604_800_000]);
  const first = review(undefined, 'good', start);
  const second = review(first, 'good', first.due);
  assert.equal(second.days, 6);
  assert.equal(second.firstDay, dateKey(start));
  assert.equal(review(second, 'again', second.due).days, 0);
});

test('due cards appear at the scheduled time and do not count twice toward the daily goal', () => {
  const first = studyQueue(deck, {}, start);
  assert.equal(first.fresh.length, dailyGoal);
  const cards = Object.fromEntries(first.fresh.map(([word]) => [word, review(undefined, 'again', start)]));
  assert.equal(studyQueue(deck, cards, start + 599_999).due.length, 0);
  assert.equal(studyQueue(deck, cards, start + 600_000).due.length, dailyGoal);
  assert.equal(studyQueue(deck, cards, start + 600_000).fresh.length, 0);
  const tomorrow = studyQueue(deck, cards, new Date(2026, 10, 26, 9).getTime());
  assert.equal(tomorrow.fresh.length, dailyGoal);
  assert.ok(tomorrow.fresh.every(([word]) => !Object.hasOwn(cards, word)));
});

test('extra study continues past the goal and stops at the end of the fixed deck', () => {
  const smallDeck = deck.slice(0, dailyGoal * 2 + 1);
  const cards = {};
  const finish = words => {
    for (const [word] of words) cards[word] = review(undefined, 'good', start);
  };
  finish(studyQueue(smallDeck, cards, start).fresh);
  assert.equal(studyQueue(smallDeck, cards, start).fresh.length, 0);
  const extra = studyQueue(smallDeck, cards, start, true).fresh;
  assert.deepEqual(extra, smallDeck.slice(dailyGoal, dailyGoal * 2));
  finish(extra);
  const last = studyQueue(smallDeck, cards, start, true).fresh;
  assert.deepEqual(last, smallDeck.slice(-1));
  finish(last);
  assert.equal(studyQueue(smallDeck, cards, start, true).fresh.length, 0);
});
