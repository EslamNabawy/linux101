// router.js — hash routing for GitHub Pages (kept in sync with app.js canonical — Section 25)
export const TABS = [
  { id: 'home', label: 'Home', views: [{ id: 'home', label: 'Home' }] },
  { id: 'general', label: 'General Knowledge', views: [
    { id: 'cheatsheet', label: 'Cheat Sheet' },
    { id: 'topicindex', label: 'Topic Index' },
    { id: 'exercises', label: 'Practical Exercises' },
    { id: 'roadmap7', label: 'Course Roadmap' }
  ]},
  { id: 'linux101', label: 'Linux101', views: [
    { id: 'cheatsheet', label: 'Cheat Sheet' },
    { id: 'topicindex', label: 'Topic Index' },
    { id: 'exercises', label: 'Exercises' },
    { id: 'roadmap7', label: 'Roadmap' },
    { id: 'resources', label: 'Resources' }
  ]},
  { id: 'content', label: 'Guides', views: [{ id: 'library', label: 'All Guides' }] },
  { id: 'course', label: 'NTI Linux Course', views: [
    { id: 'roadmap', label: 'Roadmap (3-day)' },
    { id: 'day1', label: 'Day 1' }, { id: 'day2', label: 'Day 2' }, { id: 'day3', label: 'Day 3' },
    { id: 'day4', label: 'Day 4' }, { id: 'day5', label: 'Day 5' }
  ]},
  { id: 'links', label: 'Helpful Links', views: [ { id: 'links', label: 'Helpful Links' } ] },
  { id: 'quiz', label: 'Flashcards & Quizzes', views: [ { id: 'quiz', label: 'Flashcards & Quiz' } ] }
];
export const VIEW_MAP = {
  'home': { tab: 'home', view: 'home' },
  'cheatsheet': { tab: 'linux101', view: 'cheatsheet' },
  'commandsBank': { tab: 'linux101', view: 'cheatsheet' },
  'topicindex': { tab: 'linux101', view: 'topicindex' },
  'exercises': { tab: 'linux101', view: 'exercises' },
  'course': { tab: 'linux101', view: 'roadmap7' },
  'roadmap7': { tab: 'linux101', view: 'roadmap7' },
  'resources': { tab: 'linux101', view: 'resources' },
  'rh124': { tab: 'course', view: 'day1-content' },
  'links': { tab: 'linux101', view: 'resources' },
  'notes-rahma': { tab: 'course', view: 'day1-notes-rahma' },
  'notes-michael': { tab: 'course', view: 'day1-notes-michael' },
  'notes-hager': { tab: 'course', view: 'day1-notes-hager' },
  'notes-sagda': { tab: 'course', view: 'day2-notes-sagda' },
  'notes-tarek': { tab: 'course', view: 'day2-notes-tarek' },
  'lab': { tab: 'course', view: 'day1-lab' },
  'lab2': { tab: 'course', view: 'day2-lab' },
  'quiz': { tab: 'quiz', view: 'quiz' },
  'library': { tab: 'content', view: 'library' }
};
export const COURSE_NAV = [
  { id: 'roadmap', label: 'Roadmap (3-day)' },
  { id: 'day1', label: 'Day 1 — RHEL & Files', sub: [
    { id: 'day1-content', label: 'Content (Canonical)' },
    { id: 'day1-notes-rahma', label: "Rahma's Notes" },
    { id: 'day1-notes-michael', label: "Michael's Notes" },
    { id: 'day1-notes-hager', label: "Hager's Notes" },
    { id: 'day1-lab', label: 'Lab 1' }
  ]},
  { id: 'day2', label: 'Day 2 — Help & Users', sub: [
    { id: 'day2-content', label: 'Content (Canonical)' },
    { id: 'day2-notes-sagda', label: "Sagda's Notes" },
    { id: 'day2-notes-tarek', label: "Mohammed Tarek's Notes" },
    { id: 'day2-lab', label: 'Lab 2' }
  ]},
  { id: 'day3', label: 'Day 3 — Coming Soon', sub: [
    { id: 'day3-content', label: 'Coming Soon' }
  ]}
];
export const COURSE_RENDER_KEYS = ['roadmap','day1-content','day1-notes-rahma','day1-notes-michael','day1-notes-hager','day1-lab','day2-content','day2-notes-sagda','day2-notes-tarek','day2-lab','day3-content'];

export function tabDefaultView(tab) { const t = TABS.find(x => x.id === tab); return t ? t.views[0].id : 'cheatsheet'; }
export function buildHash(tab, view) {
  const t = encodeURIComponent(tab || 'general');
  const v = encodeURIComponent(view || 'cheatsheet');
  return `#${t}/${v}`;
}
export function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  if (!raw) return null;
  const hashPart = raw.split('?')[0];
  const slash = hashPart.indexOf('/');
  if (slash === -1) {
    const tab = decodeURIComponent(hashPart);
    if (TABS.find(x => x.id === tab)) return { tab, view: tabDefaultView(tab) };
    return null;
  }
  const tab = decodeURIComponent(hashPart.slice(0, slash));
  const viewRaw = hashPart.slice(slash + 1);
  const view = decodeURIComponent(viewRaw.split('#')[0].split('?')[0]);
  if (!tab || !view) return null;
  const tabObj = TABS.find(x => x.id === tab);
  const validView = (tab === 'course' && (COURSE_NAV.some(g => g.id === view || (g.sub && g.sub.some(s => s.id === view))))) ||
                    (tabObj && tabObj.views.some(v => v.id === view)) ||
                    COURSE_RENDER_KEYS.includes(view);
  if (!validView) return null;
  return { tab, view };
}
export let _ignoreHash = false;
export function setIgnore(v) { _ignoreHash = v; }
export function syncHash(state) {
  const expected = buildHash(state.tab, state.view);
  if (location.hash === expected) return;
  _ignoreHash = true;
  location.hash = expected;
  setTimeout(() => { _ignoreHash = false; }, 50);
}
export function titleForView(tab, view) {
  const map = {
    'cheatsheet': 'Cheat Sheet', 'topicindex': 'Topic Index', 'exercises': 'Practical Exercises', 'roadmap7': 'Course Roadmap',
    'roadmap': 'NTI Roadmap', 'day1-content': 'Day 1 — Content', 'day1-notes-rahma': "Rahma's Notes", 'day1-notes-michael': "Michael's Notes",
    'day1-notes-hager': "Hager's Notes", 'day1-lab': 'Lab 1', 'day2-content': 'Day 2 — Content', 'day2-notes-sagda': "Sagda's Notes",
    'day2-notes-tarek': "Tarek's Notes", 'day2-lab': 'Lab 2', 'day3-content': 'Day 3 — Coming Soon', 'quiz': 'Flashcards & Quiz', 'links': 'Helpful Links'
  };
  const label = map[view] || view;
  return `${label} — EslamOs`;
}
