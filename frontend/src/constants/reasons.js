// Shared reason taxonomy — kindness-first framing. "A reason to stay" was intentionally
// retired from public wording: no supporter should ever feel responsible for someone's survival.
// Legacy keys remain mapped so historical contributions keep their original category.
export const REASONS = [
  { k: 'loved',        label: "a reminder they're loved",        title: "Reminders You're Loved",  icon: '💛' },
  { k: 'look_forward', label: 'something to look forward to',    title: 'Things to Look Forward To', icon: '🌱' },
  { k: 'memory',       label: 'a favorite memory',               title: 'Favorite Memories',       icon: '📸' },
  { k: 'song',         label: 'a song that reminds you of them', title: 'Songs That Remind Me of You', icon: '🎵' },
  { k: 'smile',        label: 'a reason to smile',               title: 'Reasons to Smile',        icon: '😊' },
  { k: 'remember',     label: 'something you want them to remember', title: 'Things to Remember',  icon: '💌' },
  { k: 'hope',         label: 'a little hope',                   title: 'Little Hopes',            icon: '🌤' },
  { k: 'grateful',     label: "something you're grateful for",   title: 'Gratitude',               icon: '🫶' },
];

// Legacy keys from the earlier taxonomy — never break old contributions.
const LEGACY_TITLES = {
  stay: 'Reasons to Stay', keep_going: 'Reasons to Keep Going', hopeful: 'Reasons to Stay Hopeful',
  happy: 'Reasons to Be Happy', present: 'Reasons to Be Present', feel_loved: 'Reasons to Feel Loved',
};

const DEFAULT = REASONS[4]; // smile

export const reasonLabel = (k) => (REASONS.find(r => r.k === k) || DEFAULT).label;
export const reasonTitle = (k) => (REASONS.find(r => r.k === k)?.title) || LEGACY_TITLES[k] || DEFAULT.title;
