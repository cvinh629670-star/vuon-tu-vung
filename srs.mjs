const minute = 60_000;
const day = 24 * 60 * minute;
export const dailyGoal = 10;

export function dateKey(time) {
  const date = new Date(time);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

export function studyQueue(deck, cards, now, extra = false) {
  const today = dateKey(now);
  const due = deck.filter(([id]) => cards[id]?.due <= now).sort(([a], [b]) => cards[a].due - cards[b].due);
  const introduced = Object.values(cards).filter(card => card.firstDay === today).length;
  const unseen = deck.filter(([id]) => !Object.hasOwn(cards, id));
  const fresh = unseen.slice(0, extra ? dailyGoal : Math.max(0, dailyGoal - introduced));
  return { due, fresh };
}

export const grades = [
  { id: 'again', title: 'Quên', icon: 'refresh-ccw', text: '#993956', background: '#FCE6ED' },
  { id: 'hard', title: 'Khó', icon: 'cloud', text: '#85502A', background: '#FFF0DA' },
  { id: 'good', title: 'Nhớ', icon: 'check', text: '#265B44', background: '#DFF3E4' },
  { id: 'easy', title: 'Dễ', icon: 'star', text: '#5240A0', background: '#EEE7FF' },
];

export function interval(card, grade) {
  const previous = card?.days ?? 0;
  switch (grade) {
    case 'again': return 10 * minute;
    case 'hard': return Math.min(365, Math.max(1, Math.ceil(previous * 1.25))) * day;
    case 'good': return Math.min(365, Math.max(3, Math.round(previous * 2))) * day;
    case 'easy': return Math.min(365, Math.max(7, Math.round(previous * 3))) * day;
    default: throw new Error('Unknown grade');
  }
}

export function review(card, grade, now) {
  const delay = interval(card, grade);
  return { firstDay: card?.firstDay ?? dateKey(now), due: now + delay, days: delay >= day ? delay / day : 0 };
}

export function intervalLabel(delay) {
  return delay < day ? `${Math.round(delay / minute)} phút` : `${Math.round(delay / day)} ngày`;
}
