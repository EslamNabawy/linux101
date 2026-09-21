// ===== STATE =====
const STORAGE_KEY = 'linuxcs_state_v2';
const LEGACY_KEY = 'linuxcs_state_v1';

function loadState() {
  try {
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') return saved;
    // migration from v1
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (legacy && typeof legacy === 'object') {
      // prune stale keys that no longer exist in DATA schema
      try { localStorage.removeItem(LEGACY_KEY); } catch(_e) {}
      return legacy;
    }
  } catch (e) { /* ignore */ }
  return {};
}

function pruneCollapsed(obj, validKeys) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  const set = new Set(validKeys);
  for (const k of Object.keys(obj)) if (set.has(k)) out[k] = obj[k];
  return out;
}

const savedState = loadState();

const THEMES = ['dark', 'midnight', 'light', 'paper'];
const THEME_LABELS = { dark: 'Dark', midnight: 'Midnight', light: 'Light', paper: 'Paper' };
function themeIconSvg(theme){
  if(theme==='dark') return '<svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
  if(theme==='midnight') return '<svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/><path d="M19 14l1.1 2.8L23 18l-2.9 1.2L19 22l-1.1-2.8L15 18l2.9-1.2z"/><path d="M6 14l.9 2.2L9 17l-2.1.9L6 20l-.9-2.2L3 17l2.1-.9z"/></svg>';
  if(theme==='light') return '<svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  // paper
  return '<svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg>';
}
function cycleTheme(current){
  const idx = THEMES.indexOf(current);
  return THEMES[(idx + 1) % THEMES.length];
}
const _validTheme = THEMES.includes(savedState.theme) ? savedState.theme : 'dark';

const TAB_ALIASES = { 'general': 'linux101', 'links': 'linux101', '': 'home', 'index': 'home' };
const VIEW_ALIASES = { 'links': 'resources', 'home': 'home', 'general': 'cheatsheet', 'roadmap7': 'roadmap', 'content-library': 'library' };
function normalizeTab(tab){ if(!tab) return 'home'; tab=String(tab).toLowerCase().trim(); if(TAB_ALIASES[tab]) return TAB_ALIASES[tab]; if(!['home','linux101','course','quiz','content'].includes(tab)) return tab; return tab; }
function normalizeView(view){ if(!view) return 'home'; view=String(view).trim(); if(VIEW_ALIASES[view]) return VIEW_ALIASES[view]; return view; }
const _initialTab = normalizeTab(savedState.tab || 'home');
const _initialView = normalizeView(savedState.view || 'home');
// migrate old defaults: cheat sheet was implicit home
const _migratedTab = (_initialTab==='linux101' && _initialView==='cheatsheet' && !location.hash) ? 'home' : _initialTab;
const _migratedView = (_initialTab==='linux101' && _initialView==='cheatsheet' && !location.hash) ? 'home' : _initialView;
const state = {
  tab: _migratedTab,
  view: _migratedView,
  searchTerm: '',
  cmdTerm: savedState.cmdTerm || '',
  cmdCats: savedState.cmdCats || [],
  cmdDifficulty: savedState.cmdDifficulty || [],
  cmdSort: savedState.cmdSort || 'name',
  cmdView: savedState.cmdView || 'grid',
  cmdFav: savedState.cmdFav || [],
  cmdFavOnly: savedState.cmdFavOnly || false,
  theme: _validTheme,
  collapsedCategories: savedState.collapsedCategories || {},
  collapsedExercises: savedState.collapsedExercises || {},
  collapsedDeepDives: savedState.collapsedDeepDives || {},
  collapsedRH124: savedState.collapsedRH124 || {},
  collapsedBank: savedState.collapsedBank || {},
  collapsedNotes: savedState.collapsedNotes || {},
  collapsedGroups: savedState.collapsedGroups || {},
  recentViews: savedState.recentViews || [],
  completedLab: savedState.completedLab || {},
  completedModules: savedState.completedModules || {},
  expandedModules: savedState.expandedModules || {},
  quizScores: savedState.quizScores || {},
  readGuides: savedState.readGuides || {}
};
// Hub filter state (session-only, not persisted)
let _clLevelFilter = 'all';
let _clTerm = '';

function saveState() {
  const persist = {
    tab: state.tab,
    view: state.view,
    cmdTerm: state.cmdTerm,
    cmdCats: state.cmdCats,
    cmdDifficulty: state.cmdDifficulty,
    cmdSort: state.cmdSort,
    cmdView: state.cmdView,
    cmdFav: state.cmdFav,
    cmdFavOnly: state.cmdFavOnly,
    theme: state.theme,
    collapsedCategories: state.collapsedCategories,
    collapsedExercises: state.collapsedExercises,
    collapsedDeepDives: state.collapsedDeepDives,
    collapsedRH124: state.collapsedRH124,
    collapsedBank: state.collapsedBank,
    collapsedNotes: state.collapsedNotes,
    collapsedGroups: state.collapsedGroups,
    recentViews: state.recentViews,
    completedLab: state.completedLab,
    completedModules: state.completedModules,
    expandedModules: state.expandedModules,
    quizScores: state.quizScores,
    readGuides: state.readGuides
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persist)); } catch (e) { /* ignore */ }
}

// ===== LAZY DATA LOADER (T4: 289KB → 60KB lite + on-demand 225KB) =====
let _ntiCache = null;
let _ntiFetch = null;
async function loadScriptFallback(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}
async function getNti() {
  if (_ntiCache) return _ntiCache;
  if (typeof DATA !== 'undefined' && DATA.nti && DATA.nti.days) { _ntiCache = DATA.nti; return _ntiCache; }
  if (_ntiFetch) return _ntiFetch;
  _ntiFetch = (async () => {
    try {
      const r = await fetch('assets/data/nti.json?v=24');
      if (r.ok) {
        const j = await r.json();
        _ntiCache = j;
        if (typeof DATA !== 'undefined') {
          DATA.nti = j;
          if (j.notes) DATA.notes = j.notes;
          if (j.flashcards && !DATA.flashcards) DATA.flashcards = j.flashcards;
          if (j.labs && !DATA.labs) DATA.labs = j.labs;
        }
        return _ntiCache;
      }
    } catch(_e) {}
    // Fallback for file:// or fetch fail: load full data.js
    try {
      await loadScriptFallback('assets/js/data.js?v=24');
      if (typeof DATA !== 'undefined' && DATA.nti) { _ntiCache = DATA.nti; return _ntiCache; }
    } catch(_e) {}
    return null;
  })();
  return _ntiFetch;
}
async function getNotesData() {
  if (typeof DATA !== 'undefined' && DATA.notes && Object.keys(DATA.notes).length) return DATA.notes;
  try {
    const r = await fetch('assets/data/nti.json?v=24');
    if (r.ok) {
      const j = await r.json();
      if (j.notes) {
        if (typeof DATA !== 'undefined') DATA.notes = j.notes;
        return j.notes;
      }
    }
  } catch(_e) {}
  try {
    const idx = await fetch('assets/data/index.json?v=24').then(r=>r.json());
    const notes = {};
    await Promise.all((idx.notes||[]).map(async k => {
      try { const rr = await fetch(`assets/data/notes/${k}.json?v=24`); if(rr.ok) notes[k]=await rr.json(); } catch(_e){}
    }));
    if (typeof DATA !== 'undefined') DATA.notes = notes;
    return notes;
  } catch(_e) { return (typeof DATA!=='undefined'&&DATA.notes)||{}; }
}
async function ensureNtiReady() {
  const needNti = state.tab === 'course' || state.tab === 'quiz' || !!state.searchTerm.trim();
  if (!needNti) return;
  await getNti();
  // also hydrate flashcard decks if needed via separate file (nti.json already contains them in current build)
  try {
    if (_ntiCache && !_ntiCache.flashcards) {
      const r = await fetch('assets/data/flashcards.json?v=24'); if(r.ok) _ntiCache.flashcards = await r.json();
    }
  } catch(_e){}
}

// ===== SYNTAX HIGHLIGHTING =====
function highlightCode(code) {
  let s = String(code == null ? '' : code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Tokenize: each rule wraps its match in a placeholder so later rules
  // can't re-match the HTML we generate (the old impl matched the '/' in
  // its own </span> closers and shredded the markup).
  const spans = [];
  const keep = (cls, txt) => { spans.push(`<span class="${cls}">${txt}</span>`); return '\u0000' + (spans.length - 1) + '\u0000'; };
  // Comments: '#' starts a comment only at line start or after whitespace/;/|/&/( —
  // NOT inside parameter expansions like ${#arr[@]}
  s = s.replace(/(^|[\s;&|(])(#.*)$/gm, (m, pre, cmt) => pre + keep('comment-token', cmt));
  // Strings: single line only, so an unmatched quote can't swallow the rest of the block
  s = s.replace(/"[^\n"]*"/g, m => keep('str-token', m));
  s = s.replace(/~\/[^\s\u0000"'|]*/g, m => keep('path-token', m));
  s = s.replace(/(^|[=(\[{:\s])(\/[^\s\u0000"'|]*)/g, (m, pre, path) => pre + keep('path-token', path));
  s = s.replace(/(\s)(-{1,2}[a-zA-Z][\w-]*)/g, (m, ws, flag) => ws + keep('flag-token', flag));
  // Restore nested placeholders too (a kept span may contain earlier placeholders)
  while (s.indexOf('\u0000') !== -1) {
    const next = s.replace(/\u0000(\d+)\u0000/g, (m, i) => spans[+i]);
    if (next === s) break;
    s = next;
  }
  return s;
}

function highlightCommandName(cmd) {
  if (!cmd) return '';
  const parts = String(cmd).split(' ');
  return `<span class="cmd-token">${escapeHtml(parts[0])}</span>` + (parts.length > 1 ? ' ' + escapeHtml(parts.slice(1).join(' ')) : '');
}

function highlightMatch(text, term) {
  if (!term || !text) return text;
  const escTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escTerm})`, 'gi');
  // Avoid injecting <mark> inside HTML tags: split by tags and only highlight outside
  if (text.includes('<')) {
    return text.split(/(<[^>]*>)/g).map(part => {
      if (part.startsWith('<')) return part;
      return part.replace(regex, '<mark>$1</mark>');
    }).join('');
  }
  return text.replace(regex, '<mark>$1</mark>');
}

// ===== RENDER CHEAT SHEET =====
function renderCheatSheet() {
  const term = state.searchTerm.toLowerCase();
  let html = `
    <h1 class="view-title">Cheat Sheet</h1>
    <p class="view-subtitle">Essential Linux commands — search, copy, and learn.</p>
  `;

  let totalShown = 0;
  let categoriesHtml = '';

  DATA.categories.forEach(cat => {
    let cmdsHtml = '';
    let matchCount = 0;

    cat.commands.forEach(cmd => {
      const matches = !term ||
        cmd.command.toLowerCase().includes(term) ||
        cmd.description.toLowerCase().includes(term) ||
        cmd.example.toLowerCase().includes(term) ||
        (cmd.notes && cmd.notes.toLowerCase().includes(term));

      if (!matches) return;
      matchCount++;
      totalShown++;

      cmdsHtml += `
        <div class="cmd-row">
          <div class="cmd-grid">
            <div class="cmd-name">${highlightMatch(highlightCommandName(cmd.command), state.searchTerm)}</div>
            <div>
              <div class="cmd-desc">${highlightMatch(escapeHtml(cmd.description), state.searchTerm)}</div>
              <div class="cmd-example">
                <code>${highlightMatch(highlightCode(cmd.example), state.searchTerm)}</code>
                <button class="copy-btn" data-action="explain-cmd" data-cmd="${escapeCopyAttr(cmd.example)}" title="Explain with explainshell.com" aria-label="Explain this command with explainshell">
                  ${EXTLINK_SVG}
                </button>
                <button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(cmd.example)}" title="Copy" aria-label="Copy code">
                  ${ICONS.copy}
                </button>
              </div>
              ${cmd.notes ? `
                <div class="cmd-note">
                  ${ICONS.alert}
                  <span>${highlightMatch(escapeHtml(cmd.notes), state.searchTerm)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    if (matchCount === 0) return;
    const isCollapsed = state.collapsedCategories[cat.id] !== false && !term;

    categoriesHtml += `
      <div class="category ${isCollapsed ? 'collapsed' : ''}" data-cat-id="${cat.id}">
        <div class="category-header" data-action="toggle-category" data-id="${escapeHtml(cat.id)}" role="button" tabindex="0">
          <div class="category-icon">${ICONS[cat.icon] || ICONS.file}</div>
          <div class="category-title">${cat.title}</div>
          <div class="category-count">${matchCount}</div>
          <div class="chevron">${ICONS.chevron}</div>
        </div>
        <div class="category-body">
          ${cmdsHtml}
        </div>
      </div>
    `;
  });

  if (totalShown === 0) {
    html += `
      <div class="no-results">
        ${ICONS.search}
        <h3>No commands found</h3>
        <p>Try a different search term.</p>
      </div>
    `;
  } else {
    html += categoriesHtml;
  }

  return html;
}

// ===== RENDER COMMANDS BANK =====
function renderCommandsBank() {
  const term = state.searchTerm.toLowerCase().trim();
  let html = `
    <h1 class="view-title">The Linux Commands Bank</h1>
    <p class="view-subtitle">A searchable reference of essential Linux commands.</p>
  `;

  // Filter logic including hidden keywords
  const filteredCommands = DATA.commandsBank.filter(cmd => {
    if (!term) return true;
    const visibleText = `${cmd.command} ${cmd.category} ${cmd.briefDescription}`.toLowerCase();
    const hiddenKeywords = cmd.keywords.join(' ').toLowerCase();
    return visibleText.includes(term) || hiddenKeywords.includes(term);
  });

  if (filteredCommands.length === 0) {
    html += `
      <div class="no-results">
        ${ICONS.search}
        <h3>No commands found</h3>
        <p>Try a different search term or synonym.</p>
      </div>
    `;
  } else {
    // Group by category for cleaner display
    const grouped = {};
    filteredCommands.forEach(cmd => {
      if (!grouped[cmd.category]) grouped[cmd.category] = [];
      grouped[cmd.category].push(cmd);
    });

    Object.keys(grouped).forEach(catName => {
      let cmdsHtml = '';
      grouped[catName].forEach(cmd => {
        const example = cmd.command; // Render the command itself as the code snippet
        cmdsHtml += `
          <div class="cmd-row">
            <div class="cmd-grid">
              <div class="cmd-name">${highlightMatch(escapeHtml(cmd.command), state.searchTerm)}</div>
              <div>
                <div class="cmd-desc">${highlightMatch(escapeHtml(cmd.briefDescription), state.searchTerm)}</div>
                <div class="cmd-example">
                  <code>${highlightMatch(highlightCode(example), state.searchTerm)}</code>
                  <button class="copy-btn" data-action="explain-cmd" data-cmd="${escapeCopyAttr(example)}" title="Explain with explainshell.com" aria-label="Explain this command with explainshell">
                    ${EXTLINK_SVG}
                  </button>
                  <button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(example)}" title="Copy" aria-label="Copy code">
                    ${ICONS.copy}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      const isCollapsed = state.collapsedBank[catName] !== false && !term;
      html += `
        <div class="category ${isCollapsed ? 'collapsed' : ''}" data-cat-id="${catName}">
          <div class="category-header" data-action="toggle-bank" data-id="${escapeHtml(catName)}" role="button" tabindex="0">
            <div class="category-icon">${ICONS.database}</div>
            <div class="category-title">${catName}</div>
            <div class="category-count">${grouped[catName].length}</div>
            <div class="chevron">${ICONS.chevron}</div>
          </div>
          <div class="category-body">
            ${cmdsHtml}
          </div>
        </div>
      `;
    });
  }

  return html;
}

// ===== RENDER EXERCISES =====
function renderExercises() {
  let html = `
    ${breadcrumbs([{label:'Linux101', tab:'linux101'}, {label:'Practical Exercises'}])}
    <h1 class="view-title">Practical Exercises</h1>
    <p class="view-subtitle">Hands-on drills — common Linux tasks with deeper context.</p>
  `;

  DATA.exercises.forEach(ex => {
    const isCollapsed = state.collapsedExercises[ex.id] !== false;
    let bodyHtml = `<p class="exercise-text">${ex.text}</p>`;
    
    if (ex.code) {
      ex.code.forEach(c => {
        bodyHtml += `
          <div class="exercise-code">
            <code>${highlightCode(c)}</code>
            <button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(c)}">${ICONS.copy}</button>
          </div>
        `;
      });
    }

    if (ex.steps) {
      ex.steps.forEach(step => {
        bodyHtml += `
          <div class="exercise-step">
            <h6>${step.subtitle}</h6>
            <p class="exercise-text">${step.text}</p>
            ${step.code.map(c => `
              <div class="exercise-code">
                <code>${highlightCode(c)}</code>
                <button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(c)}">${ICONS.copy}</button>
              </div>
            `).join('')}
          </div>
        `;
      });
    }

    if (ex.deepDive) {
      const isDeepDiveExpanded = state.collapsedDeepDives[ex.id] === true;
      bodyHtml += `
        <div class="deep-dive-container ${isDeepDiveExpanded ? 'expanded' : ''}">
          <div class="deep-dive-header" data-action="toggle-deepdive" data-id="${ex.id}" role="button" tabindex="0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <span>Deeper Explanation</span>
          </div>
          <div class="deep-dive-body">
            ${ex.deepDive.map(p => `<p>${p}</p>`).join('')}
          </div>
        </div>
      `;
    }

    html += `
      <div class="exercise-card ${isCollapsed ? 'collapsed' : ''}">
        <div class="exercise-header" data-action="toggle-exercise" data-id="${ex.id}" role="button" tabindex="0">
          <div class="exercise-icon">${ICONS.clipboard}</div>
          <div class="exercise-title">${ex.id}. ${ex.title}</div>
          <div class="chevron">${ICONS.chevron}</div>
        </div>
        <div class="exercise-body">
          ${bodyHtml}
        </div>
      </div>
    `;
  });

  return html;
}


// ===== RH124 SECTIONS (shared for search) =====
const RH124_SECTIONS = [
    {
      id: "outline",
      title: "Course Outlines",
      icon: "file",
      content: `
        <div class="table-wrap"><table class="comparison-table"><thead><tr><th>Day</th><th>Content</th></tr></thead>
          <tbody>
            <tr><td><strong>Day 1</strong></td><td>Get Started with RHEL<br>Access the Command Line<br>Manage Files from the Command Line</td></tr>
            <tr><td><strong>Day 2</strong></td><td>Get Help in RHEL<br>Create, View, and Edit Text Files<br>Manage Local Users and Groups</td></tr>
            <tr><td><strong>Day 3</strong></td><td>Control Access to Files<br>Manage Linux Processes<br>Monitor Control Services and Daemons</td></tr>
            <tr><td><strong>Day 4</strong></td><td>Configure and Secure SSH<br>Analyzing and Storing Logs<br>Manage Networking</td></tr>
            <tr><td><strong>Day 5</strong></td><td>Archiving and Transferring Files<br>Install and Update Software Packages<br>Access Linux File Systems</td></tr>
          </tbody>
        </table></div>
      `
    },
    {
      id: "basics",
      title: "Linux Basics & Distributions",
      icon: "folder",
      content: `
        <div class="rh124-content">
          <p><strong>Goal:</strong> Define open source, Linux, Linux distributions, and Red Hat Enterprise Linux.</p>
          <h6>Why Linux?</h6>
          <ul>
            <li>Community support & High Security</li>
            <li>High Stability & Ease of Maintenance</li>
            <li>Runs on Any hardware</li>
            <li>It is Free & Open Source</li>
            <li>Ease of Use, flexibility, and Customization</li>
          </ul>
          <h6>History</h6>
          <p>Timeline: AT&T UNIX (1969) -> BSD -> GNU -> Minix -> Linux (1991 by Linus Torvalds).</p>
          <h6>Distributions</h6>
          <p>Linux branches into families like Debian (Ubuntu, Mint), Fedora (RHEL, CentOS), and SUSE (SLES, OpenSUSE).</p>
        </div>
      `
    },
    {
      id: "components",
      title: "Linux Components",
      icon: "cpu",
      content: `
        <div class="rh124-content">
          <h6>Kernel</h6>
          <ul>
            <li>Is the core of the operating system.</li>
            <li>Contains components like device drivers.</li>
            <li>It loads into RAM when the machine boots and stays resident in RAM until the machine powers off.</li>
          </ul>
          <h6>Shell</h6>
          <ul>
            <li>C shell, ksh, Bash</li>
            <li>Provides an interface by which the user can communicate with the kernel.</li>
            <li>"bash" is the most commonly used shell on Linux.</li>
            <li>The shell parses commands entered by the user and translates them into logical segments to be executed by the kernel or other utilities.</li>
          </ul>
        </div>
      `
    },
    {
      id: "requirements",
      title: "Minimum Requirements for RHEL 9",
      icon: "alert",
      content: `
        <div class="rh124-content">
          <ul>
            <li><strong>Network:</strong> Working network connection</li>
            <li><strong>Media:</strong> Installation media</li>
            <li><strong>Disk Partitions:</strong> 10 GB for root (/) | 1 GB for Swap | 4 GB for /home | 512M for /boot</li>
            <li><strong>RAM:</strong> 2 GB of RAM or more</li>
            <li><strong>Storage:</strong> 20 GB of disk space or more</li>
            <li><strong>CPU:</strong> Dual or quad-core processor</li>
          </ul>
        </div>
      `
    },
    {
      id: "cmdline",
      title: "Access the Command Line & Syntax",
      icon: "eye",
      content: `
        <div class="rh124-content">
          <p><strong>Goal:</strong> Log in to a Linux system and run simple commands from the shell.</p>
          <p>Commands have the following syntax: <code>command [options] [arguments]</code></p>
          <p>Each item is separated by a space. Options modify the command's behavior. Arguments are file names or other information needed by the command. Separate commands with a semicolon (<code>;</code>).</p>
          <h6>Right Examples:</h6>
          <div class="exercise-code"><code># Right:<br>ls -l /dev<br>ls -a /dev<br>mail -s test root<br>who -u<br>ls -ld</code></div>
          <h6>Wrong Examples:</h6>
          <div class="exercise-code"><code># Wrong:<br>ls - l /dev<br>ls-a /dev<br>mail test root -s<br>-u who<br>ls-ld</code></div>
        </div>
      `
    },
    {
      id: "shortcuts",
      title: "Shell Shortcuts",
      icon: "network",
      content: `
        <div class="rh124-content">
          <div class="table-wrap"><table class="comparison-table"><thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><code>Ctrl+A</code></td><td>Jump to the beginning of the command line.</td></tr>
              <tr><td><code>Ctrl+E</code></td><td>Jump to the end of the command line.</td></tr>
              <tr><td><code>Ctrl+U</code></td><td>Clear from the cursor to the beginning of the command line.</td></tr>
              <tr><td><code>Ctrl+K</code></td><td>Clear from the cursor to the end of the command line.</td></tr>
              <tr><td><code>Ctrl+LeftArrow</code></td><td>Jump to the beginning of the previous word on the command line.</td></tr>
              <tr><td><code>Ctrl+RightArrow</code></td><td>Jump to the end of the next word on the command line.</td></tr>
              <tr><td><code>Ctrl+R</code></td><td>Search the history list of commands for a pattern.</td></tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "files",
      title: "Manage Files from the Command Line",
      icon: "folder",
      content: `
        <div class="rh124-content">
          <p><strong>Goal:</strong> Copy, move, create, delete, and organize files from the Bash shell.</p>
          <h6>Objectives:</h6>
          <ul>
            <li>Describe how Linux organizes files, and the purposes of various directories in the file-system hierarchy.</li>
            <li>Specify the absolute location and relative location of files to the current working directory, determine and change the working directory, and list the contents of directories.</li>
            <li>Create, copy, move, and remove files and directories.</li>
            <li>Create multiple file name references to the same file with hard links and symbolic (or "soft") links.</li>
            <li>Efficiently run commands that affect many files by using pattern-matching features of the Bash shell.</li>
          </ul>
        </div>
      `
    }
  ];

// ===== RENDER RH124 NOTES (body) =====
function renderRH124Body() {
  let html = '';

  const sections = RH124_SECTIONS;

  sections.forEach(sec => {
    const isCollapsed = state.collapsedRH124[sec.id] !== false;
    html += `
      <div class="rh124-card ${isCollapsed ? 'collapsed' : ''}">
        <div class="rh124-header" data-action="toggle-rh124" data-id="${escapeHtml(sec.id)}" role="button" tabindex="0">
          <div class="rh124-icon">${ICONS[sec.icon] || ICONS.file}</div>
          <div class="rh124-title">${sec.title}</div>
          <div class="chevron">${ICONS.chevron}</div>
        </div>
        <div class="rh124-body">
          ${sec.content}
        </div>
      </div>
    `;
  });

  return html;
}

// ===== RENDER LINKS GUIDE (body) =====
function renderLinksBody() {
  const soft = DATA.links.soft;
  const hard = DATA.links.hard;
  let html = '';

  html += `
    <div class="links-diagram">
      <svg width="560" height="280" viewBox="0 0 560 280" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="220" height="240" rx="8" fill="var(--bg-tertiary)" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6,4"/>
        <text x="130" y="45" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="13" font-weight="600">Soft Link (symlink)</text>
        <rect x="50" y="70" width="160" height="40" rx="6" fill="var(--bg-secondary)" stroke="var(--border)"/>
        <text x="130" y="88" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">config_link</text>
        <text x="130" y="103" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">→ /var/www/.../config.yaml</text>
        <path d="M 130 115 L 130 155" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowSoft)"/>
        <text x="145" y="140" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">path</text>
        <rect x="50" y="165" width="160" height="50" rx="6" fill="var(--bg-secondary)" stroke="var(--border)"/>
        <text x="130" y="185" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">config.yaml</text>
        <text x="130" y="202" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">inode: 98765</text>
        <text x="130" y="245" text-anchor="middle" fill="var(--danger)" font-family="var(--font-sans)" font-size="11">If deleted → link breaks ✗</text>

        <rect x="320" y="20" width="220" height="240" rx="8" fill="var(--bg-tertiary)" stroke="var(--accent)" stroke-width="1.5"/>
        <text x="430" y="45" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="13" font-weight="600">Hard Link</text>
        <rect x="350" y="70" width="160" height="40" rx="6" fill="var(--bg-secondary)" stroke="var(--border)"/>
        <text x="430" y="88" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">app_log_backup</text>
        <text x="430" y="103" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">inode: 12345</text>
        <path d="M 400 115 L 400 155" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowHard)"/>
        <path d="M 460 115 L 460 155" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowHard)"/>
        <text x="490" y="140" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">inode</text>
        <rect x="350" y="165" width="160" height="50" rx="6" fill="var(--accent-dim)" stroke="var(--accent)"/>
        <text x="430" y="185" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="12">inode: 12345</text>
        <text x="430" y="202" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">disk data</text>
        <text x="430" y="245" text-anchor="middle" fill="var(--accent)" font-family="var(--font-sans)" font-size="11">If deleted → link works ✓</text>

        <defs>
          <marker id="arrowSoft" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)"/>
          </marker>
          <marker id="arrowHard" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)"/>
          </marker>
        </defs>
      </svg>
    </div>
  `;

  html += `
    <div class="links-section">
      <h3>Soft Links <span class="badge">ln -s</span></h3>
      <div class="link-card">
        <p>${soft.definition}</p>
        <ul>${soft.properties.map(p => `<li>${p}</li>`).join('')}</ul>
        <div class="link-code"><code>${highlightCode(soft.syntax)}</code><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(soft.syntax)}">${ICONS.copy}</button></div>
        <div class="link-code"><code>${highlightCode(soft.example)}</code><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(soft.example)}">${ICONS.copy}</button></div>
      </div>
    </div>
  `;

  html += `
    <div class="links-section">
      <h3>Hard Links <span class="badge">ln</span></h3>
      <div class="link-card">
        <p>${hard.definition}</p>
        <ul>${hard.properties.map(p => `<li>${p}</li>`).join('')}</ul>
        <div class="link-code"><code>${highlightCode(hard.syntax)}</code><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(hard.syntax)}">${ICONS.copy}</button></div>
        <div class="link-code"><code>${highlightCode(hard.example)}</code><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(hard.example)}">${ICONS.copy}</button></div>
      </div>
    </div>
  `;

  html += `
    <div class="links-section">
      <h3>Quick Comparison</h3>
      <div class="table-wrap"><table class="comparison-table">
        <thead><tr><th>Feature</th><th>Soft Link (ln -s)</th><th>Hard Link (ln)</th></tr></thead>
        <tbody>
          ${DATA.links.comparison.map(row => `<tr><td>${row.feature}</td><td>${row.soft}</td><td>${row.hard}</td></tr>`).join('')}
        </tbody>
      </table></div>
    </div>
  `;

  html += `
    <div class="warning-callout">
      ${ICONS.alert}
      <p><strong>Important:</strong> Always use an <strong>absolute path</strong> for the target when creating a symlink you'll reference from other locations (<code>ln -s /full/path/...</code>) — a relative target is resolved relative to the <em>link's</em> location, not your current directory, and is a common source of "broken link" confusion.</p>
    </div>
  `;

  return html;
}

// ===== DIAGRAMS =====
function linkDiagramSVG() {
  return `<svg width="560" height="280" viewBox="0 0 560 280" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="20" width="220" height="240" rx="8" fill="var(--bg-tertiary)" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6,4"/>
    <text x="130" y="45" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="13" font-weight="600">Soft Link (symlink)</text>
    <rect x="50" y="70" width="160" height="40" rx="6" fill="var(--bg-secondary)" stroke="var(--border)"/>
    <text x="130" y="88" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">config_link</text>
    <text x="130" y="103" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">→ /var/www/.../config.yaml</text>
    <path d="M 130 115 L 130 155" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowSoft)"/>
    <text x="145" y="140" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">path</text>
    <rect x="50" y="165" width="160" height="50" rx="6" fill="var(--bg-secondary)" stroke="var(--border)"/>
    <text x="130" y="185" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">config.yaml</text>
    <text x="130" y="202" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">inode: 98765</text>
    <text x="130" y="245" text-anchor="middle" fill="var(--danger)" font-family="var(--font-sans)" font-size="11">If deleted → link breaks ✗</text>
    <rect x="320" y="20" width="220" height="240" rx="8" fill="var(--bg-tertiary)" stroke="var(--accent)" stroke-width="1.5"/>
    <text x="430" y="45" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="13" font-weight="600">Hard Link</text>
    <rect x="350" y="70" width="160" height="40" rx="6" fill="var(--bg-secondary)" stroke="var(--border)"/>
    <text x="430" y="88" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">app_log_backup</text>
    <text x="430" y="103" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">inode: 12345</text>
    <path d="M 400 115 L 400 155" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowHard)"/>
    <path d="M 460 115 L 460 155" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowHard)"/>
    <text x="490" y="140" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">inode</text>
    <rect x="350" y="165" width="160" height="50" rx="6" fill="var(--accent-dim)" stroke="var(--accent)"/>
    <text x="430" y="185" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="12">inode: 12345</text>
    <text x="430" y="202" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="10">disk data</text>
    <text x="430" y="245" text-anchor="middle" fill="var(--accent)" font-family="var(--font-sans)" font-size="11">If deleted → link works ✓</text>
    <defs>
      <marker id="arrowSoft" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)"/></marker>
      <marker id="arrowHard" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)"/></marker>
    </defs>
  </svg>`;
}

function architectureSVG() {
  return `<svg viewBox="0 0 760 130" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="ar" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/></marker></defs>
    <rect x="10" y="35" width="120" height="50" rx="6" fill="var(--bg-tertiary)" stroke="var(--border)"/><text x="70" y="65" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">CLI / Terminal</text>
    <line x1="130" y1="60" x2="170" y2="60" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/>
    <rect x="175" y="35" width="120" height="50" rx="6" fill="var(--bg-tertiary)" stroke="var(--border)"/><text x="235" y="65" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">Shell (bash)</text>
    <line x1="295" y1="60" x2="335" y2="60" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/>
    <rect x="340" y="35" width="120" height="50" rx="6" fill="var(--bg-tertiary)" stroke="var(--border)"/><text x="400" y="65" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">Applications</text>
    <line x1="460" y1="60" x2="500" y2="60" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/>
    <rect x="505" y="35" width="120" height="50" rx="6" fill="var(--bg-tertiary)" stroke="var(--border)"/><text x="565" y="65" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">Kernel</text>
    <line x1="625" y1="60" x2="665" y2="60" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/>
    <rect x="670" y="35" width="80" height="50" rx="6" fill="var(--accent-dim)" stroke="var(--accent)"/><text x="710" y="65" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="12">Hardware</text>
    <text x="390" y="112" text-anchor="middle" fill="var(--text-dim)" font-family="var(--font-sans)" font-size="11">User types a command → Shell interprets → Kernel talks to Hardware</text>
  </svg>`;
}

function syntaxSVG() {
  return `<svg viewBox="0 0 600 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="30" width="140" height="40" rx="6" fill="var(--accent-dim)" stroke="var(--accent)"/><text x="90" y="55" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="13">command</text>
    <text x="172" y="55" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="16">[</text>
    <rect x="186" y="30" width="150" height="40" rx="6" fill="var(--bg-tertiary)" stroke="var(--border)"/><text x="261" y="55" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">options -l -a</text>
    <text x="340" y="55" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="16">]</text>
    <text x="362" y="55" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="16">[</text>
    <rect x="376" y="30" width="160" height="40" rx="6" fill="var(--bg-tertiary)" stroke="var(--border)"/><text x="456" y="55" text-anchor="middle" fill="var(--text)" font-family="var(--font-mono)" font-size="12">arguments /path</text>
    <text x="540" y="55" fill="var(--text-dim)" font-family="var(--font-mono)" font-size="16">]</text>
  </svg>`;
}

function diagramSVG(kind) {
  if (kind === 'links') return linkDiagramSVG();
  if (kind === 'architecture') return architectureSVG();
  if (kind === 'syntax') return syntaxSVG();
  return '';
}

// ===== RENDER NOTE BLOCKS =====
function cleanHeadings(html){
  if(!html || !html.includes('#')) return html;
  // Convert markdown headings inside <p>...</p> or raw lines: ### Title -> <h6>, ## -> <h5>, # -> <h4>
  // Handle <p>### Title</p> and also raw "### Title"
  return html
    .replace(/<p>\s*#{3}\s+([^<]+?)\s*<\/p>/g, '<h6>$1</h6>')
    .replace(/<p>\s*#{2}\s+([^<]+?)\s*<\/p>/g, '<h5>$1</h5>')
    .replace(/<p>\s*#\s+([^<]+?)\s*<\/p>/g, '<h4>$1</h4>')
    .replace(/^#{3}\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{2}\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#\s+(.+)$/gm, '<h4>$1</h4>')
    // Remove any remaining stray ## at line start inside <p> (e.g., "## Title<br>")
    .replace(/<p>\s*##\s*/g, '<p>')
    .replace(/##\s+/g, '');
}
function renderBlock(b) {
  switch (b.t) {
    case 'text': {
      let html = cleanHeadings(b.html);
      // Also strip any remaining leading ## that survived
      html = html.replace(/^\s*#{1,6}\s+/gm, '');
      return `<div class="note-intro">${html}</div>`;
    }
    case 'list':
      return `<ul class="note-list">${b.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    case 'steps':
      return `<ul class="note-list">${b.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    case 'table':
      return `<div class="table-wrap"><table class="comparison-table"><thead><tr>${b.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'code': {
      const code = b.code;
      const lang = b.lang || 'bash';
      return `<div class="cmd-example"><span class="code-label" aria-hidden="true">${escapeHtml(lang)}</span><code>${highlightCode(code)}</code><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(code)}" title="Copy" aria-label="Copy code">${ICONS.copy}</button></div>`;
    }
    case 'callout': {
      const kind = b.kind || 'info';
      const klass = kind === 'warn' ? 'warning' : (kind === 'danger' ? 'danger' : (kind === 'tip' ? 'tip' : 'info'));
      const label = { info: 'INFO', tip: 'TIP', warning: 'WARNING', danger: 'DANGER' }[klass] || 'NOTE';
      let cHtml = cleanHeadings(b.html);
      cHtml = cHtml.replace(/^\s*#{1,6}\s+/gm, '');
      return `<div class="callout callout--${klass}" data-label="${label}">${ICONS.alert}<p>${cHtml}</p></div>`;
    }
    case 'arabic':
      return `<div class="arabic-note" lang="ar" dir="rtl">${escapeHtml(b.text)}</div>`;
    case 'diagram': {
      const CAP = { links: 'Symbolic vs hard links', architecture: 'Linux / RHEL system architecture', syntax: 'Command-line syntax and shell parsing' };
      return `<div class="note-diagram"><div class="diagram-card" role="img" aria-label="${CAP[b.kind] || ''}">${diagramSVG(b.kind)}</div><div class="diagram-caption">${CAP[b.kind] || ''}</div></div>`;
    }
    default:
      return '';
  }
}

// ===== RENDER MULTI-AUTHOR NOTES (body, flat long-form) =====
function renderNotesBody(authorKey) {
  const note = DATA.notes[authorKey];
  const secId = (s) => `note-sec-${authorKey}-${s}`;
  // reading time: avg 180 wpm
  const totalWords = note.sections.reduce((acc, s) => acc + s.blocks.reduce((a,b) => {
    if(b.t==='text' || b.t==='callout') return a + stripHtml(b.html||'').split(/\s+/).length;
    if(b.t==='list' || b.t==='steps') return a + (b.items||[]).join(' ').split(/\s+/).length;
    if(b.t==='code') return a + (b.code||'').split(/\s+/).length;
    if(b.t==='table') return a + (b.head||[]).join(' ').split(/\s+/).length + (b.rows||[]).flat().join(' ').split(/\s+/).length;
    return a;
  }, 0), 0);
  const readingTime = Math.max(1, Math.round(totalWords / 180));
  const sectionCount = note.sections.length;
  const dayLabel = note.day ? `Day ${note.day}` : 'Contributor';
  let html = breadcrumbs([{label:'Course', tab:'course'}, {label: dayLabel, tab:'course', view: note.day===1?'day1-content': note.day===2?'day2-content':'day1-content'}, {label: note.author + "'s Notes"}]);
  html += `<div class="note-page note-page--enhanced">`;
  // Hero
  html += `
    <div class="note-hero">
      <div class="note-hero-card">
        <div class="note-hero-avatar" aria-hidden="true">${escapeHtml(note.avatar)}</div>
        <div class="note-hero-main">
          <div class="note-hero-eyebrow"><span class="note-hero-day">${escapeHtml(dayLabel)}</span> <span aria-hidden="true">·</span> ${sectionCount} sections <span aria-hidden="true">·</span> ${readingTime} min read</div>
          <h1 class="note-hero-title">${escapeHtml(note.author)}'s Notes</h1>
          <p class="note-hero-subtitle">${escapeHtml(note.subtitle)}</p>
          <div class="note-hero-meta">
            <span class="note-meta-chip"><span class="note-meta-dot" aria-hidden="true"></span> ${escapeHtml(note.author)}</span>
            <span class="note-meta-chip note-meta-chip--muted">${escapeHtml(dayLabel)} · Contributor note</span>
          </div>
        </div>
        <div class="note-hero-actions">
          <button class="note-hero-print" data-action="print-note" aria-label="Print notes">${ICONS.file} Print</button>
        </div>
      </div>
      <div class="note-progress" role="progressbar" aria-label="Reading progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><div class="note-progress-fill" id="noteProgressFill" style="width:0%"></div></div>
    </div>`;
  // Toolbar (sticky miniheader enhanced)
  html += `
    <div class="note-miniheader note-toolbar">
      <div class="note-toolbar-left">
        <div class="mini-avatar">${escapeHtml(note.avatar)}</div>
        <div class="mini-name">${escapeHtml(note.author)}</div>
        <span class="note-toolbar-count">${sectionCount} topics</span>
      </div>
      <div class="note-toolbar-right">
        <select class="note-jump" data-action="jump-note" data-author="${escapeHtml(authorKey)}" aria-label="Jump to section">
          <option value="">Jump to section…</option>
          ${note.sections.map(s => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('')}
        </select>
      </div>
    </div>`;
  html += `<div class="note-layout note-layout--enhanced"><aside class="note-toc" aria-label="Table of contents">`;
  html += `<div class="note-toc-header"><span class="note-toc-title">On this page</span><span class="note-toc-count">${sectionCount}</span></div><nav class="note-toc-list">`;
  note.sections.forEach(s => {
    const icon = s.icon && ICONS[s.icon] ? ICONS[s.icon] : ICONS.file;
    html += `<a href="#${secId(s.id)}" data-action="jump-note-link" data-author="${escapeHtml(authorKey)}" data-sec="${escapeHtml(s.id)}"><span class="note-toc-icon" aria-hidden="true">${icon}</span><span class="note-toc-text">${escapeHtml(s.title)}</span></a>`;
  });
  html += `</nav></aside><div class="note-content">`;
  note.sections.forEach((s, idx) => {
    const body = s.blocks.map(renderBlock).join('');
    const icon = s.icon && ICONS[s.icon] ? ICONS[s.icon] : ICONS.file;
    const blockCount = s.blocks.length;
    html += `<section class="note-section note-section--enhanced" id="${secId(s.id)}">
      <div class="note-section-header">
        <div class="note-section-icon" aria-hidden="true">${icon}</div>
        <div class="note-section-head">
          <h2 class="note-section-title">${escapeHtml(s.title)}</h2>
          <div class="note-section-meta"><span>#${idx+1}</span> <span aria-hidden="true">·</span> ${blockCount} blocks <span aria-hidden="true">·</span> Source: ${escapeHtml(note.author)}</div>
        </div>
        <button class="note-anchor" data-action="copy" data-copy="${escapeCopyAttr(location.origin + location.pathname + '#'+secId(s.id))}" title="Copy link to section" aria-label="Copy link to section">${ICONS.link}</button>
      </div>
      <div class="note-section-body">${body}</div>
    </section>`;
  });
  html += `</div></div></div>`;
  // Cross-nav
  html += `<div class="note-crossnav"><button class="chip" data-action="set-view" data-tab="course" data-view="${note.day===1?'day1-content':'day2-content'}">← Back to ${escapeHtml(dayLabel)} content</button><button class="toggle-complete" data-action="print-note">${ICONS.file} Print notes</button></div>`;
  return html;
}

function goToNoteSection(authorKey, secId) {
  const el = document.getElementById(`note-sec-${authorKey}-${secId}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== RENDER LAB (body) =====
function renderLabBody() {
  const lab = DATA.lab;
  let html = breadcrumbs([{label:'Course', tab:'course'}, {label:'Day 1', tab:'course', view:'day1-content'}, {label:'Lab Task'}]);
  html += `<h1 class="view-title">${escapeHtml(lab.title || 'Lab Task')}</h1>`;
  html += `<p class="view-subtitle">${escapeHtml(lab.subtitle || 'Hands-on task for this day.')}</p>`;
  const total = lab.tasks.length;
  const doneCount = lab.tasks.filter(t => state.completedLab[t.id]).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  html += `<div class="lab-progress"><span class="lab-count">${doneCount} / ${total} tasks complete</span><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
  lab.tasks.forEach(task => {
    const done = state.completedLab[task.id];
    html += `
      <div class="task-card ${done ? 'done' : ''}" id="task-${task.id}">
        <div class="task-header"><span class="source-badge">${escapeHtml(task.tag)}</span><span class="task-title">${escapeHtml(task.title)}</span></div>
        <p class="task-objective">${escapeHtml(task.objective)}</p>
        <ol class="task-steps">${task.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
        <label class="task-checkbox"><input type="checkbox" data-action="toggle-lab-task" data-id="${escapeHtml(task.id)}" ${done ? 'checked' : ''}> Mark this task complete</label>
      </div>`;
  });
  return html;
}

// ===== RENDER TOPIC INDEX (pill cloud + popover) =====
function renderTopicIndex() {
  let html = breadcrumbs([{label:'Linux101', tab:'linux101'}, {label:'Topic Index'}]);
  html += `<h1 class="view-title">Topic Index</h1>`;
  html += `<p class="view-subtitle">Overlapping topics across contributors. Click a topic to jump.</p>`;
  html += `<div class="topic-cloud">`;
  DATA.topicIndex.forEach((t, i) => {
    const size = t.links.length >= 4 ? 'lg' : (t.links.length <= 1 ? 'sm' : '');
    html += `<button class="topic-pill" data-size="${size}" data-action="toggle-topic" data-index="${i}">${escapeHtml(t.title)}</button>`;
  });
  html += `</div><div id="topicPopover"></div>`;
  return html;
}

// ===== LINUX 101 CONTENT LIBRARY =====
let _libraryCache = null;
let _libraryFetch = null;
async function getContentLibrary() {
  if (_libraryCache) return _libraryCache;
  if (typeof window !== 'undefined' && window.DATA_CONTENT_LIBRARY) { _libraryCache = window.DATA_CONTENT_LIBRARY; return _libraryCache; }
  if (_libraryFetch) return _libraryFetch;
  _libraryFetch = (async () => {
    try {
      const r = await fetch('assets/data/content-library.json?v=34');
      if (r.ok) { _libraryCache = await r.json(); return _libraryCache; }
    } catch (_e) {}
    try {
      await loadScriptFallback('assets/js/data-library.js?v=34');
      if (window.DATA_CONTENT_LIBRARY) { _libraryCache = window.DATA_CONTENT_LIBRARY; return _libraryCache; }
    } catch (_e) {}
    return null;
  })();
  return _libraryFetch;
}

// ===== CMD ↔ GUIDE CROSS-LINK (Phase 1 data) =====
let _cmdGuidesCache = null;
let _cmdGuidesFetch = null;
async function getCmdGuides() {
  if (_cmdGuidesCache) return _cmdGuidesCache;
  if (typeof window !== 'undefined' && window.DATA_CMD_GUIDES) { _cmdGuidesCache = window.DATA_CMD_GUIDES; return _cmdGuidesCache; }
  if (_cmdGuidesFetch) return _cmdGuidesFetch;
  _cmdGuidesFetch = (async () => {
    try {
      const r = await fetch('assets/data/cmd-guides.json?v=34');
      if (r.ok) { _cmdGuidesCache = await r.json(); return _cmdGuidesCache; }
    } catch (_e) {}
    try {
      await loadScriptFallback('assets/js/data-cmd-guides.js?v=34');
      if (window.DATA_CMD_GUIDES) { _cmdGuidesCache = window.DATA_CMD_GUIDES; return _cmdGuidesCache; }
    } catch (_e) {}
    _cmdGuidesCache = {};
    return _cmdGuidesCache;
  })();
  return _cmdGuidesFetch;
}
function getGuidesForCommandSync(cmd) {
  if (!_cmdGuidesCache) return null;
  return _cmdGuidesCache[String(cmd).toLowerCase()] || [];
}
function getGuidesCountSync(cmd) {
  const arr = getGuidesForCommandSync(cmd);
  if (arr === null) return 0;
  return arr.length;
}
// fire-and-forget preload so cards can show 📖 counts quickly
try { getCmdGuides().then(()=>{ if(state.tab==='linux101' && state.view==='cheatsheet') try{ renderCmdResults(); }catch(_e){} }); } catch(_e){}

function librarySectionMeta(id) {
  const lib = (typeof DATA !== 'undefined' && DATA.content && DATA.content.sections) || [];
  return lib.find(s => s.id === id) || null;
}

const LIB_TRACKS = [
  { id: 'foundations',      label: 'Start Here — Foundations' },
  { id: 'system-ops',       label: 'System Operations' },
  { id: 'network-security', label: 'Networking & Security' },
  { id: 'ops-automation',   label: 'Servers & Automation' }
];
const LIB_LEVELS = [
  { id: 'all',          label: 'All levels' },
  { id: 'beginner',     label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced',     label: 'Advanced' }
];
function libGuideMeta() {
  return (typeof DATA !== 'undefined' && DATA.content && Array.isArray(DATA.content.sections)) ? DATA.content.sections : [];
}
function libMin(words) { return Math.max(1, Math.round((words || 0) / 180)); }

function clCard(s, opts) {
  const o = opts || {};
  const read = !!state.readGuides[s.id];
  const icon = ICONS[s.icon] || ICONS.folder;
  const lvlClass = 'cl-level--' + (s.level || 'beginner');
  return `
    <button class="cl-card${read ? ' is-read' : ''}" data-action="open-content-section" data-section="${escapeHtml(s.id)}" aria-label="Open guide: ${escapeHtml(s.title)}">
      <div class="cl-card-top">
        <div class="cl-card-icon" aria-hidden="true">${icon}</div>
        ${o.num ? `<span class="cl-card-num">#${s.order}</span>` : ''}
        ${read ? `<span class="cl-card-read" title="Marked as read">${ICONS.check}</span>` : ''}
      </div>
      <div class="cl-card-title">${escapeHtml(s.title)}</div>
      <div class="cl-card-preview">${escapeHtml(s.preview || '')}</div>
      <div class="cl-card-foot">
        <span class="cl-chip cl-chip--lvl ${lvlClass}">${escapeHtml(s.level || 'beginner')}</span>
        <span class="cl-chip">~${libMin(s.words)} min</span>
        <span class="cl-chip">${s.parts} parts</span>
      </div>
    </button>`;
}

function renderContentLibrary() {
  const sections = libGuideMeta().slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  let html = breadcrumbs([{label:'Linux101', tab:'content'}, {label:'Guides'}]);
  const totalWords = sections.reduce((a, s) => a + (s.words || 0), 0);
  const readCount = sections.filter(s => state.readGuides[s.id]).length;
  html += `<h1 class="view-title">Linux Guides</h1>`;
  html += `<p class="view-subtitle">${sections.length} deep-dive guides — from first principles to production ops. Follow a track top-to-bottom, or jump to what you need.</p>`;
  html += `<div class="cl-statsbar">
    <span class="cl-stat"><strong>${sections.length}</strong> guides</span>
    <span class="cl-stat"><strong>~${Math.round(totalWords / 180)}</strong> min total reading</span>
    <span class="cl-stat"><strong>${LIB_TRACKS.length}</strong> tracks</span>
    <span class="cl-stat"><strong>${readCount}/${sections.length}</strong> read</span>
  </div>`;

  // Start-here strip: the first three foundations beginner guides
  const starters = sections.filter(s => s.track === 'foundations' && s.level === 'beginner').slice(0, 3);
  if (starters.length === 3 && !_clTerm && _clLevelFilter === 'all') {
    html += `<div class="cl-start">
      <div class="cl-start-head"><span class="cl-start-badge">START HERE</span><span class="cl-start-sub">New to Linux? Read these three in order.</span></div>
      <div class="cl-start-strip">`;
    starters.forEach((s, i) => {
      const read = !!state.readGuides[s.id];
      html += `
        <button class="cl-step${read ? ' is-read' : ''}" data-action="open-content-section" data-section="${escapeHtml(s.id)}" aria-label="Start with ${escapeHtml(s.title)}">
          <span class="cl-step-num">${i + 1}</span>
          <span class="cl-step-body">
            <span class="cl-step-title">${escapeHtml(s.title)}</span>
            <span class="cl-step-meta">~${libMin(s.words)} min${read ? ' · read ✓' : ''}</span>
          </span>
          <span class="cl-step-arrow" aria-hidden="true">${i < 2 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' : ''}</span>
        </button>`;
    });
    html += `</div></div>`;
  }

  // Filter row
  html += `<div class="cl-filterrow">
    <div class="cl-filter-chips" role="group" aria-label="Filter by level">
      ${LIB_LEVELS.map(l => `<button class="cl-fchip${_clLevelFilter === l.id ? ' is-active' : ''}" data-action="cl-set-level" data-level="${l.id}">${l.label}</button>`).join('')}
    </div>
    <input type="text" class="cl-filter-input" id="clFilterInput" placeholder="Filter guides…" value="${escapeHtml(_clTerm)}" aria-label="Filter guides" autocomplete="off" spellcheck="false">
  </div>`;

  // Tracks
  const term = _clTerm.toLowerCase();
  const visible = sections.filter(s =>
    (_clLevelFilter === 'all' || s.level === _clLevelFilter) &&
    (!term || `${s.title} ${s.preview || ''} ${s.category || ''}`.toLowerCase().includes(term)));
  html += `<div id="clTracks">`;
  if (!visible.length) {
    html += `<div class="no-results"><h3>No guides match “${escapeHtml(_clTerm)}”</h3><p>Try a broader term or clear the level filter.</p></div>`;
  }
  LIB_TRACKS.forEach(track => {
    const list = visible.filter(s => s.track === track.id).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!list.length) return;
    const doneInTrack = list.filter(s => state.readGuides[s.id]).length;
    const trackWords = list.reduce((a, s) => a + (s.words || 0), 0);
    html += `<section class="cl-track">
      <div class="cl-track-head">
        <h2 class="cl-track-title">${escapeHtml(track.label)}</h2>
        <span class="cl-track-meta">${list.length} guides · ~${Math.round(trackWords / 180)} min${doneInTrack ? ` · ${doneInTrack} read` : ''}</span>
      </div>
      <div class="cl-grid">${list.map(s => clCard(s, {})).join('')}</div>
    </section>`;
  });
  html += `</div>`;
  return html;
}

function setClLevel(level) {
  _clLevelFilter = level || 'all';
  render();
}
function setClTerm(term) {
  _clTerm = term || '';
  const box = document.getElementById('clTracks');
  if (!box) { render(); return; }
  // re-render just the track area to keep the input focused
  const sections = libGuideMeta().slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const t = _clTerm.toLowerCase();
  const visible = sections.filter(s =>
    (_clLevelFilter === 'all' || s.level === _clLevelFilter) &&
    (!t || `${s.title} ${s.preview || ''} ${s.category || ''}`.toLowerCase().includes(t)));
  let html = '';
  if (!visible.length) {
    html += `<div class="no-results"><h3>No guides match “${escapeHtml(_clTerm)}”</h3><p>Try a broader term or clear the level filter.</p></div>`;
  }
  LIB_TRACKS.forEach(track => {
    const list = visible.filter(s => s.track === track.id).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!list.length) return;
    html += `<section class="cl-track">
      <div class="cl-track-head">
        <h2 class="cl-track-title">${escapeHtml(track.label)}</h2>
        <span class="cl-track-meta">${list.length} guides</span>
      </div>
      <div class="cl-grid">${list.map(s => clCard(s, {})).join('')}</div>
    </section>`;
  });
  box.innerHTML = html;
}

function toggleGuideRead(id) {
  if (!id) return;
  state.readGuides[id] = !state.readGuides[id];
  saveState();
  render();
}

async function openContentSection(id) {
  setView('content', id);
}

async function renderContentSection(id) {
  const meta = librarySectionMeta(id);
  const lib = await getContentLibrary();
  const data = lib && Array.isArray(lib.sections) ? lib.sections.find(s => s.id === id) : null;

  const trackLabel = (LIB_TRACKS.find(t => t.id === meta?.track) || {}).label || 'Guides';
  let html = breadcrumbs([
    {label:'Linux101', tab:'content'},
    {label:trackLabel, tab:'content', view:'library'},
    {label: meta ? meta.title : id}
  ]);
  if (!data || !data.parts || !data.parts.length) {
    html += `<div class="no-results">${ICONS.file}<h3>Content not available</h3><p>This guide hasn't been built into the site yet.</p></div>`;
    return html;
  }

  const totalWords = data.words || 0;
  const readingTime = Math.max(1, Math.round(totalWords / 180));
  const partCount = data.parts.length;
  const secId = p => `lib-${id}-${p.id}`;
  const isRead = !!state.readGuides[id];
  // per-part reading estimates
  const partMin = p => {
    const w = p.blocks.reduce((a, b) => {
      if (b.t === 'text' || b.t === 'callout') return a + stripHtml(b.html || '').split(/\s+/).filter(Boolean).length;
      if (b.t === 'list' || b.t === 'steps') return a + (b.items || []).join(' ').split(/\s+/).filter(Boolean).length;
      if (b.t === 'code') return a + (b.code || '').split('\n').length;
      if (b.t === 'table') return a + ((b.head || []).join(' ') + ' ' + (b.rows || []).flat().join(' ')).split(/\s+/).filter(Boolean).length;
      return a;
    }, 0);
    return Math.max(1, Math.round(w / 180));
  };
  // prev/next in learning order
  const all = libGuideMeta().slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const pos = all.findIndex(s => s.id === id);
  const prev = pos > 0 ? all[pos - 1] : null;
  const next = pos >= 0 && pos < all.length - 1 ? all[pos + 1] : null;

  // Hero
  const guideCmds = (meta && Array.isArray(meta.commands) && meta.commands.length) ? meta.commands : (data && Array.isArray(data.commands) ? data.commands : []);
  const heroCmdsHtml = guideCmds.length
    ? `<!-- commands-hero-row --><div class="hero-chip-row">${guideCmds.slice(0,10).map(c=>`<button class="hero-chip" data-action="jump-to-cmd" data-cmd="${escapeHtml(c)}" title="Open ${escapeHtml(c)} in command bank">${escapeHtml(c)}</button>`).join('')}${guideCmds.length>10 ? `<span class="chip chip--sm guide-chip">+${guideCmds.length-10}</span>` : ''}</div><!-- /commands-hero-row -->`
    : '';
  html += `<div class="note-page note-page--enhanced"><div class="note-hero"><div class="note-hero-card">
    <div class="note-hero-avatar" aria-hidden="true">${ICONS[meta?.icon] || ICONS.folder}</div>
    <div class="note-hero-main">
      <div class="note-hero-eyebrow"><span class="note-hero-day">Guide ${meta?.order ? '#' + meta.order : ''}</span> <span aria-hidden="true">·</span> ${partCount} parts <span aria-hidden="true">·</span> ~${readingTime} min read</div>
      <h1 class="note-hero-title">${escapeHtml(meta ? meta.title : data.title || id)}</h1>
      <p class="note-hero-subtitle">${escapeHtml(meta ? meta.preview : '')}</p>
      <div class="note-hero-meta">
        <span class="cl-chip cl-chip--lvl cl-level--${meta?.level || 'beginner'}">${escapeHtml(meta?.level || 'beginner')}</span>
        <span class="cl-chip">${escapeHtml(trackLabel)}</span>
        ${isRead ? '<span class="cl-chip cl-chip--read">read ✓</span>' : ''}
      </div>
      ${heroCmdsHtml}
    </div>
    <div class="note-hero-actions">
      <button class="note-hero-print${isRead ? ' is-read' : ''}" data-action="toggle-guide-read" data-id="${escapeHtml(id)}" aria-pressed="${isRead}" aria-label="Mark guide as read">${ICONS.check} ${isRead ? 'Read ✓' : 'Mark as read'}</button>
      <button class="note-hero-print" data-action="print-note" aria-label="Print guide">${ICONS.file} Print</button>
    </div>
  </div>
  <div class="note-progress" role="progressbar" aria-label="Reading progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><div class="note-progress-fill" id="noteProgressFill" style="width:0%"></div></div>
  </div>`;
  // Toolbar with jump dropdown
  html += `<div class="note-miniheader note-toolbar">
    <div class="note-toolbar-left">
      <div class="mini-avatar">${ICONS[meta?.icon] || ICONS.folder}</div>
      <div class="mini-name">Guide</div>
      <span class="note-toolbar-count">${partCount} parts · ~${readingTime} min</span>
    </div>
    <div class="note-toolbar-right">
      <select class="note-jump" data-action="jump-lib-part" aria-label="Jump to part">
        <option value="">Jump to part…</option>
        ${data.parts.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.title)}</option>`).join('')}
      </select>
    </div>
  </div>`;
  // TOC + body
  html += `<div class="note-layout note-layout--enhanced"><aside class="note-toc" aria-label="Table of contents">`;
  html += `<div class="note-toc-header"><span class="note-toc-title">On this page</span><span class="note-toc-count">${partCount}</span></div><nav class="note-toc-list">`;
  data.parts.forEach((p, idx) => {
    html += `<a href="#${secId(p)}" data-action="jump-note-link" data-author="__lib__" data-sec="${escapeHtml(p.id)}"><span class="note-toc-num" aria-hidden="true">${idx + 1}</span><span class="note-toc-text">${escapeHtml(p.title)}</span><span class="note-toc-time">~${partMin(p)}m</span></a>`;
  });
  html += `</nav></aside><div class="note-content">`;
  data.parts.forEach((p, idx) => {
    const body = p.blocks.map(renderBlock).join('');
    html += `<section class="note-section note-section--enhanced" id="${secId(p)}">
      <div class="note-section-header">
        <div class="note-section-num" aria-hidden="true">${String(idx + 1).padStart(2, '0')}</div>
        <div class="note-section-head">
          <h2 class="note-section-title">${escapeHtml(p.title)}</h2>
          <div class="note-section-meta">~${partMin(p)} min</div>
        </div>
        <button class="note-anchor" data-action="copy" data-copy="${escapeCopyAttr(location.origin + location.pathname + '#' + secId(p))}" title="Copy link to section" aria-label="Copy link to section">${ICONS.link}</button>
      </div>
      <div class="note-section-body">${body}</div>
    </section>`;
  });
  html += `</div></div></div>`;
  // Prev / All / Next footer — follows the learning order across tracks
  html += `<div class="cl-pn">`;
  html += prev
    ? `<button class="cl-pn-btn cl-pn-prev" data-action="open-content-section" data-section="${escapeHtml(prev.id)}"><span class="cl-pn-dir">← Previous</span><span class="cl-pn-title">${escapeHtml(prev.title)}</span></button>`
    : `<span class="cl-pn-spacer" aria-hidden="true"></span>`;
  html += `<button class="chip" data-action="set-view" data-tab="content" data-view="library">All guides</button>`;
  html += next
    ? `<button class="cl-pn-btn cl-pn-next" data-action="open-content-section" data-section="${escapeHtml(next.id)}"><span class="cl-pn-dir">Next →</span><span class="cl-pn-title">${escapeHtml(next.title)}</span></button>`
    : `<span class="cl-pn-spacer" aria-hidden="true"></span>`;
  html += `</div>`;
  return html;
}

function toggleTopicPopover(i, btn) {
  const box = document.getElementById('topicPopover');
  if (!box) return;
  if (box.dataset.open === String(i)) {
    box.innerHTML = '';
    box.dataset.open = '';
    btn.classList.remove('active');
    return;
  }
  const t = DATA.topicIndex[i];
  btn.parentElement.querySelectorAll('.topic-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  box.dataset.open = String(i);
  box.innerHTML = `<div class="topic-popover"><h4>${escapeHtml(t.title)}</h4><div class="topic-desc" style="font-size:12.5px;color:var(--text-dim);margin-bottom:8px">${escapeHtml(t.desc)}</div><div class="topic-links">${t.links.map(l => `<button class="topic-link" data-action="go-view" data-view="${escapeHtml(l.view)}">${escapeHtml(l.label)}</button>`).join('')}</div></div>`;
}

// ===== TOGGLES & NAV HELPERS =====
function toggleNoteSection(author, id) {
  const key = author + ':' + id;
  state.collapsedNotes[key] = state.collapsedNotes[key] === false ? true : false;
  render(); saveState();
}

function toggleLabTask(id, el) {
  state.completedLab[id] = el.checked;
  const card = document.getElementById('task-' + id);
  if (card) card.classList.toggle('done', el.checked);
  // live-update progress bar without full re-render
  const lab = DATA.lab;
  if (lab) {
    const total = lab.tasks.length;
    const doneCount = lab.tasks.filter(t => state.completedLab[t.id]).length;
    const pct = total ? Math.round((doneCount / total) * 100) : 0;
    const bar = document.querySelector('.lab-progress .progress-fill');
    const countEl = document.querySelector('.lab-progress .lab-count');
    if (bar) bar.style.width = pct + '%';
    if (countEl) countEl.textContent = `${doneCount} / ${total} tasks complete`;
    if (doneCount === total) showToast('Lab complete — great work!');
  }
  saveState();
}

const TABS = [
  { id: 'home', label: 'Home', views: [{ id: 'home', label: 'Home', icon: 'home' }] },
  { id: 'linux101', label: 'Linux101', views: [
    { id: 'cheatsheet', label: 'Commands', icon: 'terminal' },
    { id: 'topicindex', label: 'Topic Index', icon: 'hash' },
    { id: 'exercises', label: 'Exercises', icon: 'clipboard' },
    { id: 'roadmap7', label: 'Roadmap', icon: 'map' },
    { id: 'resources', label: 'Resources', icon: 'link' }
  ]},
  { id: 'course', label: 'Course', views: [
    { id: 'roadmap', label: 'Roadmap', icon: 'map' },
    { id: 'day1', label: 'Day 1', icon: 'file' },
    { id: 'day2', label: 'Day 2', icon: 'file' },
    { id: 'day3', label: 'Day 3', icon: 'file' },
    { id: 'day4', label: 'Day 4', icon: 'file' },
    { id: 'day5', label: 'Day 5', icon: 'file' }
  ]},
  { id: 'quiz', label: 'Practice Lab', views: [ { id: 'quiz', label: 'Drill & Quiz', icon: 'zap' } ] },
  { id: 'content', label: 'Guides', icon: 'folder', views: [
    { id: 'library', label: 'All Guides', icon: 'folder' }
  ]}
];
const LEGACY_TABS = ['general', 'links'];
const VIEW_MAP = {
  'home': { tab: 'home', view: 'home' },
  'cheatsheet': { tab: 'linux101', view: 'cheatsheet' },
  'cheatsheet-legacy': { tab: 'linux101', view: 'cheatsheet' },
  'commandsBank': { tab: 'linux101', view: 'cheatsheet' },
  'topicindex': { tab: 'linux101', view: 'topicindex' },
  'exercises': { tab: 'linux101', view: 'exercises' },
  'course': { tab: 'linux101', view: 'roadmap7' },
  'roadmap7': { tab: 'linux101', view: 'roadmap7' },
  'resources': { tab: 'linux101', view: 'resources' },
  'links': { tab: 'linux101', view: 'resources' },
  'rh124': { tab: 'course', view: 'day1-content' },
  'notes-rahma': { tab: 'course', view: 'day1-notes-rahma' },
  'notes-michael': { tab: 'course', view: 'day1-notes-michael' },
  'notes-hager': { tab: 'course', view: 'day1-notes-hager' },
  'notes-sagda': { tab: 'course', view: 'day2-notes-sagda' },
  'notes-tarek': { tab: 'course', view: 'day2-notes-tarek' },
  'lab': { tab: 'course', view: 'day1-lab' },
  'lab2': { tab: 'course', view: 'day2-lab' },
  'quiz': { tab: 'quiz', view: 'quiz' },
  'content': { tab: 'content', view: 'library' },
  'content-library': { tab: 'content', view: 'library' },
  'library': { tab: 'content', view: 'library' }
};

// ===== HASH ROUTER (GitHub Pages deep-link support) canonical + legacy aliases =====
function buildHash(tab, view) {
  const t = encodeURIComponent(tab || 'home');
  const v = encodeURIComponent(view || 'home');
  // home is canonical root: #home/home
  return `#${t}/${v}`;
}
function normalizeHashView(tab, view){
  // legacy view aliases -> canonical
  if(view==='links') return 'resources';
  if(view==='roadmap7') return 'roadmap';
  if(view==='course' && tab==='linux101') return 'roadmap7';
  return view;
}
function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  if (!raw) return { tab: 'home', view: 'home' };
  // support bare hash like #linux101/cheatsheet or #general/links
  const hashPart = raw.split('?')[0];
  const slash = hashPart.indexOf('/');
  if (slash === -1) {
    let tab = decodeURIComponent(hashPart);
    // support old view-only hashes
    if(VIEW_MAP[tab]) return { tab: VIEW_MAP[tab].tab, view: VIEW_MAP[tab].view };
    tab = normalizeTab(tab);
    if (TABS.find(x => x.id === tab)) return { tab, view: tabDefaultView(tab) };
    if (LEGACY_TABS.includes(decodeURIComponent(hashPart))) {
      const ntab = normalizeTab(decodeURIComponent(hashPart));
      if (TABS.find(x => x.id === ntab)) return { tab: ntab, view: tabDefaultView(ntab) };
    }
    return null;
  }
  let tab = decodeURIComponent(hashPart.slice(0, slash));
  let viewRaw = hashPart.slice(slash + 1);
  let view = decodeURIComponent(viewRaw.split('#')[0].split('?')[0]);
  // allow old hash without tab: #cheatsheet etc already handled via slash -1
  // normalize aliases
  const vm = VIEW_MAP[view];
  if(vm && !TABS.find(x=>x.id===tab)) { tab = vm.tab; view = vm.view; }
  else {
    tab = normalizeTab(tab);
    view = normalizeView(view);
    view = normalizeHashView(tab, view);
  }
  if (!tab || !view) return null;
  // validate tab/view exists
  const tabObj = TABS.find(x => x.id === tab);
  const validView = (tab === 'course' && (COURSE_NAV.some(g => g.id === view || (g.sub && g.sub.some(s => s.id === view))))) ||
                    (tabObj && tabObj.views.some(v => v.id === view)) ||
                    (tab === 'content' && typeof DATA !== 'undefined' && DATA.content && Array.isArray(DATA.content.sections) && DATA.content.sections.some(s => s.id === view)) ||
                    Object.values(COURSE_RENDER).length && view in COURSE_RENDER;
  if (!validView) {
    // try legacy view alias
    const altView = VIEW_ALIASES[view] ? VIEW_ALIASES[view] : null;
    if (altView && tabObj && tabObj.views.some(v => v.id === altView)) { view = altView; }
    else return null;
  }
  return { tab, view };
}
let _ignoreHash = false;
function syncHash() {
  const expected = buildHash(state.tab, state.view);
  if (location.hash === expected) return;
  _ignoreHash = true;
  location.hash = expected;
  setTimeout(() => { _ignoreHash = false; }, 50);
}
function titleForView(tab, view) {
  if(tab==='home' && view==='home') return 'Linux101 — Home';
  const map = {
    'cheatsheet': 'Linux101 — Commands',
    'topicindex': 'Topic Index',
    'exercises': 'Exercises',
    'roadmap7': 'Roadmap',
    'resources': 'Resources',
    'roadmap': 'Course Roadmap',
    'day1-content': 'Day 1 — Content',
    'day1-notes-rahma': "Rahma's Notes",
    'day1-notes-michael': "Michael's Notes",
    'day1-notes-hager': "Hager's Notes",
    'day1-lab': 'Lab 1',
    'day2-content': 'Day 2 — Content',
    'day2-notes-sagda': "Sagda's Notes",
    'day2-notes-tarek': "Tarek's Notes",
    'day2-lab': 'Lab 2',
    'day3-content': 'Day 3 — Coming Soon',
    'library': 'Guides',
    'quiz': 'Practice Lab — Drill & Quiz',
    'links': 'Resources'
  };
  let label = map[view] || view;
  if (tab === 'content' && view !== 'library') {
    const meta = librarySectionMeta(view);
    if (meta) label = meta.title;
  }
  return `${label} — EslamOs`;
}

// Course sub-navigation: each day splits into Content / Notes / Lab sub-pages.
// Fully replaced from Course Content Resources (single source of truth)
const COURSE_NAV = [
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

const COURSE_RENDER = {
  'roadmap': () => renderNTIRoadmap(),
  'day1-content': () => renderNTICanonical('day1'),
  'day1-notes-rahma': () => renderNotesBody('rahma'),
  'day1-notes-michael': () => renderNotesBody('michael'),
  'day1-notes-hager': () => renderNotesBody('hager'),
  'day1-lab': () => renderLabBodyForDay('day1'),
  'day2-content': () => renderNTICanonical('day2'),
  'day2-notes-sagda': () => renderNotesBody('sagda'),
  'day2-notes-tarek': () => renderNotesBody('tarek'),
  'day2-lab': () => renderLabBodyForDay('day2'),
  'day3-content': () => renderNTICanonical('day3')
};
// ===== HOME FIRST RENDERING (data-driven from content-meta.json) =====
function goHome(){ setView('home','home'); }
function viewLabel(view){
  const m = { home:'Home', cheatsheet:'Commands', topicindex:'Topic Index', exercises:'Exercises', roadmap7:'Roadmap', resources:'Resources', library:'Guides', quiz:'Practice Lab', roadmap:'Roadmap', 'day1-content':'Day 1', 'day2-content':'Day 2' };
  if(m[view]) return m[view];
  const meta = librarySectionMeta(view); if(meta) return meta.title;
  return view;
}
function renderHome(){
  const sections = (typeof DATA!=='undefined' && DATA.content && DATA.content.sections) ? DATA.content.sections.slice().sort((a,b)=>(a.order||0)-(b.order||0)) : [];
  const tracks = (typeof DATA!=='undefined' && DATA.content && DATA.content.tracks) ? DATA.content.tracks : LIB_TRACKS;
  const linkCount = (DATA.helpfulLinks||[]).length;
  const cmdCount = (function(){ try{ return buildCommandIndex().length;}catch(e){return 0;}})();
  const totalWords = sections.reduce((a,s)=>a+(s.words||0),0);
  const readCount = sections.filter(s=> state.readGuides[s.id]).length;
  // Start here: foundations beginner first, fallback to any beginner
  let starters = sections.filter(s=> s.track==='foundations' && s.level==='beginner').slice(0,4);
  if(starters.length<4) starters = starters.concat(sections.filter(s=> s.level==='beginner' && !starters.includes(s)).slice(0,4-starters.length));
  // Recently visited: resolve to titles
  const recent = (state.recentViews||[]).filter(v=>v!=='home').slice(0,6);
  function recentTitle(v){
    if(VIEW_MAP[v]) { const mm=VIEW_MAP[v]; if(mm.view==='home') return 'Home'; return viewLabel(mm.view); }
    const meta = librarySectionMeta(v); if(meta) return meta.title;
    return v;
  }
  let html = '';
  html += `<div class="home-hero decor-bg">
    <h1 class="home-title">Linux101</h1>
    <p class="home-tagline">Linux knowledge without the noise.</p>
    <div class="hero-visual" aria-hidden="true"><svg viewBox="0 0 640 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect x="20" y="20" width="170" height="100" rx="8" stroke="var(--border)" fill="var(--bg-secondary)"/><circle cx="34" cy="32" r="4" fill="var(--accent)"/><circle cx="48" cy="32" r="4" fill="var(--accent-alt)"/><circle cx="62" cy="32" r="4" fill="var(--border)"/>
      <rect x="30" y="44" width="70" height="6" rx="2" fill="var(--accent)" opacity=".9"/><rect x="30" y="58" width="120" height="4" rx="2" fill="var(--text-dim)" opacity=".5"/><rect x="30" y="68" width="90" height="4" rx="2" fill="var(--text-dim)" opacity=".35"/><text x="30" y="90" fill="var(--accent)" font-family="JetBrains Mono,monospace" font-size="9">$ learn → practice → build</text>
      <line x1="190" y1="70" x2="230" y2="70" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 4"/><polygon points="230,66 230,74 238,70" fill="var(--accent)"/>
      <g><rect x="238" y="36" width="76" height="68" rx="8" stroke="var(--border)" fill="var(--bg-tertiary)"/><text x="276" y="58" text-anchor="middle" fill="var(--text)" font-size="8" font-family="Inter,sans-serif" font-weight="700">LINUX</text><text x="276" y="70" text-anchor="middle" fill="var(--text-dim)" font-size="7">filesystem</text><path d="M256 78l8 8 12-8" stroke="var(--accent)" stroke-width="1.2" fill="none"/></g>
      <line x1="314" y1="70" x2="354" y2="70" stroke="var(--border)" stroke-width="1.5"/><polygon points="354,66 354,74 362,70" fill="var(--border)"/>
      <g><rect x="362" y="26" width="76" height="32" rx="6" stroke="var(--border)" fill="var(--bg-secondary)"/><circle cx="378" cy="42" r="6" stroke="var(--accent)" fill="none"/><circle cx="378" cy="42" r="2" fill="var(--accent)"/><text x="400" y="45" fill="var(--text)" font-size="7" font-weight="600">Network</text></g>
      <g><rect x="362" y="64" width="76" height="32" rx="6" stroke="var(--border)" fill="var(--bg-secondary)"/><rect x="374" y="72" width="14" height="14" rx="2" stroke="var(--accent)" fill="none"/><line x1="388" y1="79" x2="398" y2="79" stroke="var(--accent)"/><text x="406" y="84" fill="var(--text)" font-size="7" font-weight="600">Container</text></g>
      <g><rect x="362" y="102" width="76" height="28" rx="6" stroke="var(--border)" fill="var(--bg-secondary)"/><path d="M374 116l4 4 8-8" stroke="var(--success)" stroke-width="1.2" fill="none"/><text x="392" y="119" fill="var(--text)" font-size="7" font-weight="600">Automate</text></g>
      <line x1="438" y1="42" x2="478" y2="70" stroke="var(--border)" stroke-width="1.2" opacity=".7"/><line x1="438" y1="80" x2="478" y2="80" stroke="var(--border)" stroke-width="1.2" opacity=".7"/><line x1="438" y1="116" x2="478" y2="90" stroke="var(--border)" stroke-width="1.2" opacity=".7"/>
      <g><rect x="478" y="48" width="140" height="64" rx="8" stroke="var(--accent)" fill="color-mix(in srgb, var(--accent) 6%, transparent)"/><text x="548" y="68" text-anchor="middle" fill="var(--accent)" font-size="8" font-weight="700">Labs • Practice</text><text x="548" y="80" text-anchor="middle" fill="var(--text-dim)" font-size="7">hands-on • quiz • flashcards</text><circle cx="520" cy="92" r="2" fill="var(--accent)"/><circle cx="540" cy="92" r="2" fill="var(--accent)" opacity=".6"/><circle cx="560" cy="92" r="2" fill="var(--accent)" opacity=".3"/></g>
    </svg></div>
    <button class="home-search" data-action="open-spotlight" aria-label="Search Linux101">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>Search Linux101 — commands, guides, labs…</span>
      <span class="home-search-kbd">/</span>
    </button>
    <p class="home-meta">${sections.length} guides · ~${Math.round(totalWords/180)} min · ${cmdCount} commands · <span style="color:var(--accent)">${readCount} read</span></p>
  </div>`;
  // START HERE with icons
  html += `<section class="home-section"><div class="home-section-head"><h2>START HERE</h2><p>New to Linux? Follow this path.</p></div><div class="home-start-grid">`;
  starters.forEach((s,i)=>{
    const sI = ICONS[s.icon] || ICONS.terminal;
    html += `<button class="home-start-card" data-action="open-content-section" data-section="${escapeHtml(s.id)}" aria-label="Open ${escapeHtml(s.title)}">
      <span class="home-start-num">0${i+1}</span>
      <span class="card-icon icon-sm" aria-hidden="true">${sI}</span>
      <span class="home-start-body"><span class="home-start-title">${escapeHtml(s.title)}</span><span class="home-start-preview">${escapeHtml(s.preview||'')}</span><span class="home-start-meta">${escapeHtml(s.level)} · ~${libMin(s.words)} min</span></span>
      <span class="home-start-arrow">→</span>
    </button>`;
  });
  html += `</div></section>`;
  // EXPLORE with visual category anchors
  html += `<section class="home-section"><div class="home-section-head"><h2>EXPLORE LINUX101</h2><p>Guides grouped by track — data-driven from content-meta.json</p></div><div class="home-tracks">`;
  tracks.forEach(tr=>{
    const list = sections.filter(s=>s.track===tr.id);
    if(!list.length) return;
    const tIconKey = (ICONS._map && ICONS._map[tr.id]) || 'folder';
    const tIcon = ICONS[tIconKey] || ICONS.folder;
    html += `<div class="home-track"><div class="section-visual"><span class="card-icon icon-sm" aria-hidden="true">${tIcon}</span><h3 class="home-track-title">${escapeHtml(tr.label)}</h3><span class="home-track-count">${list.length} guides</span></div><div class="home-track-list">`;
    list.slice(0,6).forEach(s=>{
      const sIcon = ICONS[s.icon] || ICONS.file;
      html += `<button class="home-topic" data-action="open-content-section" data-section="${escapeHtml(s.id)}"><span class="icon-xs" aria-hidden="true" style="color:var(--text-dim)">${sIcon}</span><span class="home-topic-title">${escapeHtml(s.title)}</span><span class="home-topic-level">${escapeHtml(s.level)}</span></button>`;
    });
    if(list.length>6) html += `<button class="home-more" data-action="set-view" data-tab="content" data-view="library">+${list.length-6} more in ${escapeHtml(tr.label)} →</button>`;
    html += `</div></div>`;
  });
  html += `</div><div class="home-explore-foot"><button class="chip" data-action="set-view" data-tab="content" data-view="library">View all ${sections.length} guides →</button></div></section>`;
  // QUICK TOOLS
  html += `<section class="home-section"><div class="home-section-head"><h2>QUICK TOOLS</h2></div><div class="home-tools-grid">
    <button class="home-tool" data-action="set-view" data-tab="linux101" data-view="cheatsheet"><span class="home-tool-icon">${ICONS.terminal}</span><span class="home-tool-label">Cheat Sheet</span><span class="home-tool-desc">Search ${cmdCount} commands</span></button>
    <button class="home-tool" data-action="set-view" data-tab="linux101" data-view="exercises"><span class="home-tool-icon">${ICONS.clipboard}</span><span class="home-tool-label">Exercises</span><span class="home-tool-desc">Hands-on drills</span></button>
    <button class="home-tool" data-action="set-view" data-tab="quiz" data-view="quiz"><span class="home-tool-icon">${ICONS.zap}</span><span class="home-tool-label">Flashcards</span><span class="home-tool-desc">Quiz & memorize</span></button>
    <button class="home-tool" data-action="set-view" data-tab="linux101" data-view="topicindex"><span class="home-tool-icon">${ICONS.hash||ICONS.folder}</span><span class="home-tool-label">Topic Index</span><span class="home-tool-desc">Cross-topic map</span></button>
    <button class="home-tool" data-action="set-view" data-tab="quiz" data-view="quiz"><span class="home-tool-icon">${ICONS.check}</span><span class="home-tool-label">Quiz</span><span class="home-tool-desc">Test yourself</span></button>
    <button class="home-tool" data-action="set-view" data-tab="linux101" data-view="resources"><span class="home-tool-icon">${ICONS.link}</span><span class="home-tool-label">Resources</span><span class="home-tool-desc">${linkCount} links</span></button>
  </div></section>`;
  // NTI COURSE
  html += `<section class="home-section home-section--course"><div class="home-section-head"><h2>NTI LINUX COURSE</h2><p>3-day track — canonical content, notes, labs</p></div><div class="home-course-row">
    <button class="home-course-step" data-action="set-view" data-tab="course" data-view="roadmap"><span class="home-course-dot">◉</span> Roadmap</button>
    <span class="home-course-arrow">→</span>
    <button class="home-course-step" data-action="set-view" data-tab="course" data-view="day1-content">Day 1</button>
    <span class="home-course-arrow">→</span>
    <button class="home-course-step" data-action="set-view" data-tab="course" data-view="day2-content">Day 2</button>
    <span class="home-course-arrow">→</span>
    <button class="home-course-step" data-action="set-view" data-tab="course" data-view="day1-lab">Labs</button>
  </div></section>`;
  // RECENTLY VISITED
  if(recent.length){
    html += `<section class="home-section"><div class="home-section-head"><h2>RECENTLY VISITED</h2></div><div class="home-recent">`;
    recent.forEach(v=>{
      const title = recentTitle(v);
      html += `<button class="home-recent-item" data-action="go-view" data-view="${escapeHtml(v)}">${escapeHtml(title)}</button>`;
    });
    html += `</div></section>`;
  }
  // footer link
  html += `<div class="home-foot"><a class="sidebar-link" href="https://github.com/EslamNabawy/linux101" target="_blank" rel="noopener">github.com/EslamNabawy/linux101 →</a></div>`;
  return html;
}

function emptyVisual(kind){
  const base = 'color:var(--text-dim)';
  if(kind==='search') return `<div class="empty-state-visual" aria-hidden="true" style="${base}"><svg viewBox="0 0 120 80" width="96" height="64" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="12" y="12" width="64" height="44" rx="6" stroke="var(--border)" fill="var(--bg-secondary)"/><circle cx="24" cy="22" r="2.5" fill="var(--accent)"/><line x1="20" y1="34" x2="64" y2="34" stroke="var(--accent)" opacity=".8"/><line x1="20" y1="42" x2="58" y2="42" stroke="currentColor" opacity=".3"/><circle cx="72" cy="44" r="14" stroke="currentColor" opacity=".5"/><line x1="82" y1="54" x2="92" y2="64" stroke="currentColor"/></svg></div>`;
  if(kind==='favorites') return `<div class="empty-state-visual" aria-hidden="true" style="${base}"><svg viewBox="0 0 120 80" width="96" height="64" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M60 18l7 14 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2z" stroke="var(--border)" fill="var(--bg-secondary)"/><circle cx="60" cy="44" r="3" fill="var(--accent)" opacity=".5"/></svg></div>`;
  if(kind==='history') return `<div class="empty-state-visual" aria-hidden="true" style="${base}"><svg viewBox="0 0 120 80" width="96" height="64" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="60" cy="40" r="22" stroke="var(--border)"/><path d="M60 28v12l8 8" stroke="var(--accent)"/><circle cx="60" cy="40" r="2" fill="var(--accent)"/></svg></div>`;
  return `<div class="empty-state-visual" aria-hidden="true" style="${base}"><svg viewBox="0 0 120 80" width="96" height="64" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="20" y="20" width="80" height="40" rx="6" stroke="var(--border)" fill="var(--bg-secondary)"/><line x1="28" y1="36" x2="72" y2="36" stroke="var(--accent)"/><line x1="28" y1="44" x2="64" y2="44" stroke="currentColor" opacity=".3"/></svg></div>`;
}
// Icon semantic map — content-driven, single family extension
(function extendIcons(){
  if(typeof ICONS==='undefined') return;
  const add = (k,v)=>{ if(!ICONS[k]) ICONS[k]=v; };
  add('shield','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 4v5c0 5-3.5 9-7 11-3.5-2-7-6-7-11V6l7-4z"/></svg>');
  add('lock','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>');
  add('container','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="2" y1="12" x2="22" y2="12"/></svg>');
  add('workflow','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="7" y="14" width="7" height="7" rx="1"/><path d="M6 10v2a2 2 0 002 2h2"/><path d="M16 10v2a2 2 0 01-2 2h-2"/></svg>');
  add('beaker','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H15"/><path d="M10 3v6l-4 11h12l-4-11V3"/><line x1="6" y1="14" x2="18" y2="14"/></svg>');
  add('star','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9 16 14 18 21 12 17 6 21 8 14 2 9 9 9 12 2"/></svg>');
  add('gitBranch','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v6c0 2 1 3 3 3h3"/><path d="M18 15V9a3 3 0 00-3-3h-3"/></svg>');
  add('play','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>');
  add('wrench','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 7a2 2 0 11-4 4l-5 5a2 2 0 01-3 0l1-1a2 2 0 013 0l5-5z"/><path d="M8 7l3 3"/></svg>');
  add('hardDrive','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="1"/><line x1="12" y1="14" x2="20" y2="14"/><line x1="12" y1="18" x2="20" y2="18"/></svg>');
  // semantic aliases for track mapping
  ICONS._map = {
    foundations:'terminal', 'system-ops':'hardDrive', 'network-security':'shield', 'ops-automation':'container',
    reference:'book', system:'hardDrive', editing:'file', development:'terminal', storage:'hardDrive',
    monitoring:'activity', troubleshooting:'wrench', logging:'file', networking:'network', security:'shield',
    containers:'container', automation:'workflow', data:'database', terminal:'terminal'
  };
})();

function breadcrumbs(items) {
  if (!items || !items.length) return '';
  // Home-first: auto-prepend Home crumb unless already on home
  const isHome = state.tab==='home' && state.view==='home';
  if(!isHome && items[0] && items[0].label!=='Home') items = [{label:'Home', tab:'home', view:'home'}].concat(items);
  const html = items.map((it, idx) => {
    const isLast = idx === items.length - 1;
    if (isLast || (!it.view && !it.tab)) return `<span class="crumb current" aria-current="page">${escapeHtml(it.label)}</span>`;
    if (it.tab && it.view) return `<button class="crumb link" data-action="breadcrumb" data-tab="${escapeHtml(it.tab)}" data-view="${escapeHtml(it.view)}">${escapeHtml(it.label)}</button>`;
    if (it.view) return `<button class="crumb link" data-action="go-view" data-view="${escapeHtml(it.view)}">${escapeHtml(it.label)}</button>`;
    if (it.tab) return `<button class="crumb link" data-action="switch-tab" data-tab="${escapeHtml(it.tab)}">${escapeHtml(it.label)}</button>`;
    return `<span class="crumb current" aria-current="page">${escapeHtml(it.label)}</span>`;
  }).join('<span class="crumb-sep" aria-hidden="true">›</span>');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${html}</nav>`;
}
function tabDefaultView(tab) { const t = TABS.find(x => x.id === tab); return t ? t.views[0].id : 'cheatsheet'; }

// ===== COURSE CANONICAL RENDER (single source of truth) =====
function renderNTICanonical(dayId){
  const day = (DATA.nti && DATA.nti.days && DATA.nti.days[dayId]) || null;
  if(!day){
    // fallback to old placeholder
    return renderDayPlaceholder(dayId);
  }
  // Day3 coming soon has single section
  const isComingSoon = day.title && day.title.toLowerCase().includes('coming soon');
  let html = breadcrumbs([{label:'Course', tab:'course'}, {label: dayId==='day1'?'Day 1': dayId==='day2'?'Day 2':'Day 3', tab:'course', view: dayId+'-content'}, {label: isComingSoon?'Coming Soon':'Content'}]);
  // Override for day3: simpler breadcrumb
  if(dayId==='day3'){
    html = breadcrumbs([{label:'Course', tab:'course'}, {label:'Day 3'}]);
  } else {
    html = breadcrumbs([{label:'Course', tab:'course'}, {label:'Roadmap', tab:'course', view:'roadmap'}, {label: dayId==='day1'?'Day 1':'Day 2'}]);
  }
  html += `<h1 class="view-title">${escapeHtml(day.title)}</h1>`;
  if(day.subtitle) html += `<p class="view-subtitle">${escapeHtml(day.subtitle)}</p>`;
  if(isComingSoon){
    // Render its sections as is
    html += `<div class="note-page"><div class="note-layout"><aside class="note-toc" style="display:none"></aside><div class="note-content" style="border:none;padding:0">`;
    day.sections.forEach(sec=>{
      const body = sec.blocks.map(renderBlock).join('');
      html += `<section class="note-section"><h2>${escapeHtml(sec.title)}</h2>${body}</section>`;
    });
    html += `</div></div></div>`;
    html += `<div class="day-nav-foot" style="display:flex;gap:10px;flex-wrap:wrap"><button class="toggle-complete" data-action="set-view" data-tab="course" data-view="day2-content">Review Day 2</button><button class="chip" data-action="set-view" data-tab="course" data-view="roadmap">Back to Roadmap</button></div>`;
    return html;
  }
  // For day1/day2: render with TOC similar to notes
  const secId = (s) => `nti-sec-${dayId}-${s}`;
  html += `<div class="note-page">`;
  html += `<div class="note-miniheader"><div class="mini-avatar">${dayId==='day1'?'1':'2'}</div><div class="mini-name">${escapeHtml(day.title)}</div><select data-action="jump-nti" data-day="${escapeHtml(dayId)}"><option value="">Jump to section…</option>${day.sections.map(s=>`<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('')}</select></div>`;
  html += `<div class="note-layout"><aside class="note-toc">`;
  day.sections.forEach(s=>{ html += `<a href="#${secId(s.id)}" data-action="jump-note-link" data-author="${escapeHtml(dayId)}" data-sec="${escapeHtml(s.id)}">${escapeHtml(s.title)}</a>`; });
  html += `</aside><div class="note-content">`;
  day.sections.forEach(s=>{
    const body = s.blocks.map(renderBlock).join('');
    html += `<section class="note-section" id="${secId(s.id)}"><h2>${escapeHtml(s.title)}</h2>${body}</section>`;
  });
  html += `</div></div></div>`;
  // Cross-links
  if(dayId==='day1'){
    html += `<div class="day-nav-foot" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="toggle-complete" data-action="set-view" data-tab="course" data-view="day1-lab">Go to Lab 1 →</button><button class="chip" data-action="set-view" data-tab="course" data-view="day2-content">Next: Day 2 →</button></div>`;
  } else if(dayId==='day2'){
    html += `<div class="day-nav-foot" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="toggle-complete" data-action="set-view" data-tab="course" data-view="day2-lab">Go to Lab 2 →</button><button class="chip" data-action="set-view" data-tab="course" data-view="day1-content">← Back to Day 1</button><button class="chip" data-action="set-view" data-tab="course" data-view="day3-content">Day 3 (Coming Soon)</button></div>`;
  }
  return html;
}

function renderLabBodyForDay(dayId){
  // Prefer Course.labs, fallback to DATA.labs or DATA.lab
  const lab = (DATA.nti && DATA.nti.labs && DATA.nti.labs[dayId]) || (DATA.labs && DATA.labs[dayId]) || (dayId==='day1' ? DATA.lab : null);
  if(!lab || !lab.tasks || !lab.tasks.length){
    // fallback to generic placeholder
    return renderCourseDayLab(dayId);
  }
  const num = dayId.replace('day','');
  let html = breadcrumbs([{label:'Course', tab:'course'}, {label:'Day ' + num, tab:'course', view: dayId+'-content'}, {label:'Lab ' + num}]);
  html += `<h1 class="view-title">${escapeHtml(lab.title || ('Lab ' + num))}</h1>`;
  html += `<p class="view-subtitle">${escapeHtml(lab.subtitle || 'Hands-on tasks. Tick when done.')}</p>`;
  const total = lab.tasks.length;
  const doneCount = lab.tasks.filter(t=> state.completedLab[t.id]).length;
  const pct = total ? Math.round((doneCount/total)*100):0;
  html += `<div class="lab-progress"><span class="lab-count">${doneCount} / ${total} tasks complete</span><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
  lab.tasks.forEach(task=>{
    const done = state.completedLab[task.id];
    html += `<div class="task-card ${done?'done':''}" id="task-${task.id}"><div class="task-header"><span class="source-badge">${escapeHtml(task.tag||'Lab')}</span><span class="task-title">${escapeHtml(task.title)}</span></div><p class="task-objective">${escapeHtml(task.objective||'')}</p><ol class="task-steps">${(task.steps||[]).map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol><label class="task-checkbox"><input type="checkbox" data-action="toggle-lab-task" data-id="${escapeHtml(task.id)}" ${done?'checked':''}> Mark this task complete</label></div>`;
  });
  html += `<div class="day-nav-foot" style="display:flex;gap:10px;flex-wrap:wrap"><button class="toggle-complete" data-action="set-view" data-tab="course" data-view="${dayId}-content">← Back to Content</button>${dayId==='day1'?`<button class="chip" data-action="set-view" data-tab="course" data-view="day2-content">Next: Day 2 →</button>`:''}${dayId==='day2'?`<button class="chip" data-action="set-view" data-tab="course" data-view="day3-content">Day 3 (Coming Soon)</button>`:''}</div>`;
  return html;
}

function goToView(view) {
  const m = VIEW_MAP[view] || { tab: 'home', view: 'home' };
  setView(m.tab, m.view);
}

async function setView(tab, view) {
  tab = normalizeTab(tab); view = normalizeView(view);
  state.tab = tab;
  state.view = view;
  state.searchTerm = '';
  if(view!=='home' && tab!=='home') pushRecent(view);
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  // home-first: update body class for layout, hide legacy tabs logic
  document.body.classList.toggle('is-home', tab==='home' && view==='home');
  document.body.classList.toggle('is-content', tab==='content' || tab==='linux101' || tab==='course' || tab==='quiz');
  scrollActiveTabIntoView();
  renderSubNav();
  await render(); saveState();
  try { syncHash(); } catch(_e) {}
  try { document.title = titleForView(tab, view); } catch(_e) {}
  window.scrollTo({top:0, behavior:'instant'});
  const contentEl = document.getElementById('content');
  if (contentEl) contentEl.focus({preventScroll:true});
}

function scrollActiveTabIntoView() {
  // Home-first: no tab bar to scroll; no-op kept for legacy call sites
}

function switchTab(tab) {
  setView(tab, tabDefaultView(tab));
}

function renderSubNav() {
  // Permanent sidebar removed in Home-first redesign. Keep stub for compatibility.
  const layout = document.getElementById('layout');
  if(layout){
    layout.classList.toggle('is-home', state.tab==='home' && state.view==='home');
  }
}

function pushRecent(view) {
  if (!view) return;
  state.recentViews = [view, ...state.recentViews.filter(v => v !== view)].slice(0, 10);
}

// ===== RENDER COURSE =====
function renderCourse() {
  const modules = DATA.course.modules;
  const completedCount = Object.values(state.completedModules).filter(Boolean).length;
  const progress = Math.round((completedCount / modules.length) * 100);

  let html = `
    ${breadcrumbs([{label:'Linux101', tab:'linux101'}, {label:'Roadmap'}])}
    <h1 class="view-title">Course Roadmap</h1>
    <p class="view-subtitle">7 modules — from first command to confident power user.</p>
    <div class="progress-bar">
      <div class="progress-bar-header">
        <span>Your Progress</span>
        <span class="progress-count">${completedCount} / ${modules.length} modules</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>
    <div class="roadmap">
  `;

  modules.forEach(mod => {
    const isCompleted = state.completedModules[mod.number];
    const isExpanded = state.expandedModules[mod.number];
    html += `
      <div class="module ${isCompleted ? 'completed' : ''} ${isExpanded ? 'expanded' : ''}">
        <div class="module-dot">
          ${isCompleted ? ICONS.check : `<span style="font-size:11px;font-family:var(--font-mono);color:var(--text-dim);">${mod.number}</span>`}
        </div>
        <div class="module-card">
          <div class="module-header" data-action="toggle-module" data-num="${mod.number}" role="button" tabindex="0">
            <span class="module-number">M${mod.number}</span>
            <span class="module-title">${escapeHtml(mod.title)}</span>
            <span class="module-chevron">${ICONS.chevron}</span>
          </div>
          <div class="module-body">
            <div class="module-section">
              <h5>Concepts</h5>
              <ul>${mod.concepts.map(c => `<li>${c}</li>`).join('')}</ul>
            </div>
            <div class="module-section">
              <h5>Skills</h5>
              <ul>${mod.skills.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
            <div class="project-box">
              <h5>Project</h5>
              <p>${escapeHtml(mod.project)}</p>
            </div>
            <div class="module-actions">
              <button class="toggle-complete" data-action="toggle-complete" data-num="${mod.number}">
                ${ICONS.check}
                ${isCompleted ? 'Completed' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// ===== GLOBAL SEARCH RESULTS =====
function renderSearchResults() {
  const term = state.searchTerm.toLowerCase();
  const t = state.searchTerm;
  let html = `
    ${breadcrumbs([{label:'Search', view:'cheatsheet'}, {label:`“${escapeHtml(t)}”`}])}
    <h1 class="view-title">Search results</h1>
    <p class="view-subtitle">Matches for "${escapeHtml(t)}" across all sections. <button class="topic-link" data-action="clear-search" style="margin-left:8px">Clear search ✕</button></p>
  `;

  const results = [];

  DATA.categories.forEach(cat => {
    cat.commands.forEach(cmd => {
      const hay = `${cmd.command} ${cmd.description} ${cmd.example} ${cmd.notes || ''}`.toLowerCase();
      if (hay.includes(term)) results.push({ section: 'Cheat Sheet', title: cmd.command, desc: cmd.description, example: cmd.example });
    });
  });

  DATA.commandsBank.forEach(cmd => {
    const hay = `${cmd.command} ${cmd.category} ${cmd.briefDescription} ${cmd.keywords.join(' ')}`.toLowerCase();
    if (hay.includes(term)) results.push({ section: 'Commands Bank', title: cmd.command, desc: cmd.briefDescription, example: cmd.command });
  });

  DATA.exercises.forEach(ex => {
    const hay = `${ex.title} ${ex.text} ${(ex.deepDive || []).join(' ')}`.toLowerCase();
    if (hay.includes(term)) results.push({ section: 'Exercises', title: `${ex.id}. ${ex.title}`, desc: ex.text.replace(/<[^>]+>/g, '').slice(0, 180) });
  });

  const linkText = `${DATA.links.soft.definition} ${DATA.links.soft.properties.join(' ')} ${DATA.links.hard.definition} ${DATA.links.hard.properties.join(' ')} ${DATA.links.comparison.map(r => r.feature + r.soft + r.hard).join(' ')}`.toLowerCase();
  if (linkText.includes(term)) results.push({ section: 'Links Guide', title: 'Soft vs Hard Links', desc: 'Soft (symbolic) and hard link definitions, properties, and comparison.' });

  DATA.course.modules.forEach(mod => {
    const hay = `${mod.title} ${mod.concepts.join(' ')} ${mod.skills.join(' ')} ${mod.project}`.toLowerCase();
    if (hay.includes(term)) results.push({ section: 'Course', title: `M${mod.number}: ${mod.title}`, desc: mod.project });
  });

  if (DATA.notes) {
    Object.keys(DATA.notes).forEach(authorKey => {
      const note = DATA.notes[authorKey];
      note.sections.forEach(sec => {
        const hay = `${note.author} ${note.subtitle} ${sec.title} ${getNoteText(sec.blocks)}`.toLowerCase();
        if (hay.includes(term)) results.push({ section: `${note.author}'s Notes`, title: sec.title, desc: 'See the ' + note.author + ' Notes section for details.' });
      });
    });
  }
  if (DATA.lab) {
    DATA.lab.tasks.forEach(task => {
      const hay = `${task.tag} ${task.title} ${task.objective} ${task.steps.join(' ')}`.toLowerCase();
      if (hay.includes(term)) results.push({ section: 'Lab 1', title: task.title, desc: task.objective });
    });
  }
  // Search new COURSE CANONICAL days (single source of truth)
  if (DATA.nti && DATA.nti.days) {
    Object.keys(DATA.nti.days).forEach(dayId=>{
      const day = DATA.nti.days[dayId];
      if(!day || !day.sections) return;
      const dayLabel = dayId==='day1'?'Day 1': dayId==='day2'?'Day 2':'Day 3';
      day.sections.forEach(sec=>{
        const hay = `${day.title} ${day.subtitle||''} ${sec.title} ${getNoteText(sec.blocks)}`.toLowerCase();
        if(hay.includes(term)) results.push({ section: dayLabel, title: sec.title, desc: sec.blocks.find(b=>b.t==='text')?.html?.replace(/<[^>]+>/g,'').slice(0,160) || 'See canonical content' });
      });
    });
    // labs per day
    if(DATA.nti.labs){
      Object.keys(DATA.nti.labs).forEach(labId=>{
        const lab = DATA.nti.labs[labId];
        if(!lab || !lab.tasks) return;
        lab.tasks.forEach(task=>{
          const hay = `${task.tag} ${task.title} ${task.objective} ${(task.steps||[]).join(' ')}`.toLowerCase();
          if(hay.includes(term)) results.push({ section: `Lab ${labId.replace('day','')}`, title: task.title, desc: task.objective });
        });
      });
    }
    // flashcards
    if(DATA.nti.flashcards){
      DATA.nti.flashcards.forEach(fc=>{
        const hay = `${fc.q} ${fc.a}`.toLowerCase();
        if(hay.includes(term)) results.push({ section: 'Flashcards Course', title: fc.q.slice(0,60), desc: fc.a.slice(0,140) });
      });
    }
  }

  (typeof RH124_SECTIONS !== 'undefined' ? RH124_SECTIONS : []).forEach(sec => {
    const hay = `${sec.title} ${sec.content}`.toLowerCase();
    if (hay.includes(term)) results.push({ section: 'RH124 Notes', title: sec.title, desc: 'See the RH124 Day 1 Notes section for details.' });
  });

  if (results.length === 0) {
    const popular = ['ls', 'cd', 'grep', 'chmod', 'rm'];
    const pops = popular.map(p => {
      const c = DATA.commandsBank.find(x => x.command === p);
      if (!c) return '';
      return `<div class="cmd-row"><div class="cmd-grid"><div class="cmd-name">${escapeHtml(c.command)}</div><div><div class="cmd-desc">${escapeHtml(c.briefDescription)}</div><div class="cmd-example"><code>${highlightCode(c.command)}</code><button class="copy-btn" data-action="explain-cmd" data-cmd="${escapeCopyAttr(c.command)}" title="Explain with explainshell.com" aria-label="Explain this command with explainshell">${EXTLINK_SVG}</button><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(c.command)}">${ICONS.copy}</button></div></div></div></div>`;
    }).join('');
    const recent = state.recentViews.length
      ? `<div class="links-section"><h3>Recently viewed</h3><div class="topic-links">${state.recentViews.slice(0, 5).map(v => `<button class="topic-link" data-action="go-view" data-view="${escapeHtml(v)}">${escapeHtml(v.replace('notes-', ''))}</button>`).join('')}</div></div>`
      : '';
    return html + `<div class="no-results">${emptyVisual('search')}<h3>No matches found</h3><p>Try a different search term or synonym.</p></div><div class="links-section"><h3>Popular commands</h3>${pops}</div>${recent}`;
  }

  const grouped = {};
  results.forEach(r => { (grouped[r.section] = grouped[r.section] || []).push(r); });

  Object.keys(grouped).forEach(sec => {
    const items = grouped[sec];
    const shown = items.slice(0, 4);
    const extra = items.slice(4);
    const extraHtml = extra.length
      ? `<div class="search-group-extra" id="sgex-${escId(sec)}" style="display:none">${extra.map(r => searchRow(r, t)).join('')}</div><button class="topic-link" style="margin-top:8px" data-action="toggle-search-group" data-sec="${escId(sec)}">See all ${items.length} results</button>`
      : '';
    html += `
      <div class="category">
        <div class="category-header" style="cursor:default">
          <div class="category-icon">${ICONS.search}</div>
          <div class="category-title">${sec}</div>
          <div class="category-count">${items.length}</div>
        </div>
        <div class="category-body">${shown.map(r => searchRow(r, t)).join('')}${extraHtml}</div>
      </div>`;
  });

  return html;
}

function searchRow(r, t) {
  return `<div class="cmd-row"><div class="cmd-grid"><div class="cmd-name">${highlightMatch(escapeHtml(r.title), t)}</div><div>${r.desc ? `<div class="cmd-desc">${highlightMatch(escapeHtml(r.desc), t)}</div>` : ''}${r.example ? `<div class="cmd-example"><code>${highlightMatch(highlightCode(r.example), t)}</code><button class="copy-btn" data-action="explain-cmd" data-cmd="${escapeCopyAttr(r.example)}" title="Explain with explainshell.com" aria-label="Explain this command with explainshell">${EXTLINK_SVG}</button><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(r.example)}" aria-label="Copy code">${ICONS.copy}</button></div>` : ''}</div></div><span class="source-badge search-badge">${escapeHtml(r.section)}</span></div>`;
}

function escId(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '_'); }

function toggleSearchGroup(sec) {
  const el = document.getElementById('sgex-' + sec);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ===== QUIZ & FLASHCARDS =====
function buildQuizDeck() {
  // Prefer Course Day1+Day2 flashcards (single source of truth) if present; fallback to commandsBank
  const ntiCards = (DATA.nti && DATA.nti.flashcards) || DATA.flashcards;
  if (ntiCards && ntiCards.length) {
    // ntiCards are {q,a} from notes; map to flashcard shape
    return ntiCards.map(c => ({
      front: c.q || c.front,
      back: c.a || c.back,
      category: c.category || 'Course'
    })).filter(c=> c.front && c.back);
  }
  return DATA.commandsBank.map(c => ({
    front: c.command,
    back: c.briefDescription,
    category: c.category
  }));
}

function renderQuiz() {
  const deck = buildQuizDeck();
  const best = state.quizScores.best || 0;
  const total = deck.length;
  let html = `
    ${breadcrumbs([{label:'Practice Lab', tab:'quiz'}])}
    <h1 class="view-title">Practice Lab — Drill & Quiz</h1>
    <p class="view-subtitle">Flip the cards to memorize, then take the quiz. Day 1 & Day 2 course material — ${total} Q&A from Rahma, Michael, Hager, Sagda & Tarek notes.</p>
    <div class="progress-bar">
      <div class="progress-bar-header">
        <span>Best Quiz Score</span>
        <span class="progress-count">${best} / ${total}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${total ? Math.round((best / total) * 100) : 0}%"></div></div>
    </div>
  `;

  // Flashcards
  html += `<div class="links-section"><h3>Flashcards <span class="badge">${total} cards</span></h3><div class="flashcard-grid">`;
  deck.forEach((card, i) => {
    html += `
      <button class="flashcard" data-action="flip-flashcard" data-index="${i}" title="Click to flip" aria-label="Flashcard ${escapeHtml(card.front)}: press to reveal" aria-pressed="false">
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <span class="flashcard-cat">${escapeHtml(card.category)}</span>
            <code>${escapeHtml(card.front)}</code>
            <span class="flashcard-hint">click to reveal</span>
          </div>
          <div class="flashcard-back">
            <span class="flashcard-cat">${escapeHtml(card.category)}</span>
            <p>${escapeHtml(card.back)}</p>
          </div>
        </div>
      </button>`;
  });
  html += `</div></div>`;

  // Multiple-choice quiz
  html += `
    <div class="links-section">
      <h3>Multiple Choice Quiz</h3>
      <div class="quiz-box" id="quizBox">
        <button class="toggle-complete" data-action="start-quiz">${ICONS.check} Start Quiz</button>
      </div>
    </div>
  `;

  return html;
}

let quizState = null;
let quizOpen = [];

function makeQuizQ(front, back, deck) {
  const others = deck.filter(d => d.back !== back).sort(() => Math.random() - 0.5).slice(0, 3).map(d => d.back);
  const options = [back, ...others].sort(() => Math.random() - 0.5);
  return { command: front, answer: back, options };
}

function startQuiz(questionsOverride) {
  const deck = buildQuizDeck();
  let questions;
  if (questionsOverride && questionsOverride.length) {
    questions = questionsOverride.map(q => makeQuizQ(q.front, q.back, deck));
  } else {
    const pool = deck.slice().sort(() => Math.random() - 0.5);
    const qCount = Math.min(10, deck.length);
    questions = [];
    for (let i = 0; i < qCount; i++) questions.push(makeQuizQ(pool[i].front, pool[i].back, deck));
  }
  quizState = { questions, score: 0, wrong: [], answered: {} };
  quizOpen = questions.map(() => true);
  renderQuizQuestions();
}

function toggleQuizAcc(i) {
  if (!quizState) return;
  quizOpen[i] = !quizOpen[i];
  renderQuizQuestions();
}

function answerQuiz(i, chosen, btn) {
  if (!quizState || quizState.answered[i]) return;
  const q = quizState.questions[i];
  const correct = chosen === q.answer;
  quizState.answered[i] = { chosen, correct };
  if (correct) quizState.score += 1;
  else quizState.wrong.push({ front: q.command, back: q.answer });
  const best = Math.max(state.quizScores.best || 0, quizState.score);
  state.quizScores.best = best;
  saveState();
  renderQuizQuestions();
}

function quizAccItem(q, i) {
  const open = quizOpen[i];
  const a = quizState.answered[i];
  let body = '';
  if (open) {
    if (!a) {
      body = `<div class="quiz-options">${q.options.map(opt => `<button class="quiz-option" data-action="answer-quiz" data-i="${i}" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join('')}</div>`;
    } else {
      body = `<div class="quiz-feedback-inline">
        <span class="quiz-answered ${a.correct ? 'correct' : 'wrong'}">${a.correct ? ICONS.check + ' Correct' : ICONS.alert + ' Incorrect'}</span>
        ${!a.correct ? `<span class="quiz-correct-answer">Answer: ${escapeHtml(q.answer)}</span>` : ''}
      </div>`;
    }
  }
  const status = a ? (a.correct ? '✓' : '✗') : (open ? '' : ICONS.chevron);
  return `
    <div class="quiz-acc-item ${open ? 'open' : ''} ${a ? (a.correct ? 'done-correct' : 'done-wrong') : ''}">
      <div class="quiz-acc-header" data-action="toggle-quiz-acc" data-i="${i}" role="button" tabindex="0">
        <span class="quiz-acc-q">Q${i + 1}. What does <code>${escapeHtml(q.command)}</code> do?</span>
        <span class="quiz-acc-status">${status}</span>
      </div>
      <div class="quiz-acc-body">${body}</div>
    </div>`;
}

let _lastMissed = [];
function renderQuizQuestions() {
  const box = document.getElementById('quizBox');
  if (!quizState) return;
  const total = quizState.questions.length;
  const complete = (quizState.score + quizState.wrong.length) >= total;
  const missed = quizState.wrong;
  _lastMissed = missed.slice();
  box.innerHTML = `
    <div class="quiz-progress">Score: <strong>${quizState.score}</strong> / ${total}${state.quizScores.best ? ` &middot; Best: ${state.quizScores.best}` : ''}</div>
    <div class="quiz-accordion">
      ${quizState.questions.map((q, i) => quizAccItem(q, i)).join('')}
    </div>
    ${complete ? `
      <div class="no-results">
        <h3>Quiz complete!</h3>
        <p>You scored <strong>${quizState.score} / ${total}</strong>.</p>
        ${missed.length ? `<button class="toggle-complete" data-action="retry-missed">${ICONS.check} Retry ${missed.length} missed</button>` : ''}
        <button class="toggle-complete" data-action="start-quiz">${ICONS.check} Try Again</button>
      </div>` : ''}
  `;
}

function flipCard(i, el) {
  el.classList.toggle('flipped');
}

// ===== HELPERS =====
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) {
  if (s == null) return '';
  return String(s).replace(/\\/g, '\\\\')
           .replace(/'/g, "\\'")
           .replace(/\r/g, '')
           .replace(/\n/g, '\\n');
}
function escapeAttrHtml(s) { return escapeHtml(s); }
function escapeCopyAttr(s) { return escapeHtml(s).replace(/\n/g, '&#10;').replace(/\r/g, ''); }
function stripHtml(s) { return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function getNoteText(blocks) {
  return blocks.map(b => {
    if (b.t === 'text' || b.t === 'callout') return stripHtml(b.html || '');
    if (b.t === 'arabic') return b.text || '';
    if (b.t === 'code') return b.code || '';
    if (b.t === 'table') return (b.head || []).concat(...(b.rows || [])).join(' ');
    if (b.t === 'list' || b.t === 'steps') return (b.items || []).join(' ');
    return '';
  }).join(' ').toLowerCase();
}

function copyText(text, btn) {
  const onSuccess = () => {
    btn.classList.add('copied');
    const original = btn.getAttribute('aria-label') || 'Copy';
    btn.setAttribute('aria-label', 'Copied!');
    showToast('Copied to clipboard');
    setTimeout(() => { btn.classList.remove('copied'); btn.setAttribute('aria-label', original); }, 1500);
  };
  const fallback = (t) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.setAttribute('readonly','');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onSuccess();
    } catch(_e) { showToast('Copy failed'); }
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallback(text));
  } else fallback(text);
}
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role','status');
    t.setAttribute('aria-live','polite');
    Object.assign(t.style, {position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%) translateY(20px)',background:'var(--bg-elevated)',color:'var(--text)',border:'1px solid var(--border)',padding:'10px 16px',borderRadius:'999px',fontSize:'13px',zIndex:'9999',opacity:'0',transition:'opacity 180ms, transform 180ms',pointerEvents:'none',boxShadow:'var(--shadow)'});
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._hide);
  t._hide = setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(10px)'; }, 1800);
}

// ===== SPOTLIGHT SEARCH (overlay) =====
let _spotlightOpen = false;
let _spotlightIndex = -1;
let _spotlightResults = [];
function openSpotlight(){
  const el = document.getElementById('spotlight');
  const input = document.getElementById('spotlightInput');
  if(!el || !input) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  _spotlightOpen = true;
  _spotlightIndex = -1;
  // fire-and-forget: warm the guide index so spotlight can match guide parts
  getContentLibrary().then(lib => {
    if(_spotlightOpen && lib && (input.value || '').trim()) renderSpotlight(input.value);
  }).catch(()=>{});
  setTimeout(()=> input.focus(), 30);
  renderSpotlight(input.value || '');
}
function closeSpotlight(){
  const el = document.getElementById('spotlight');
  if(!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  _spotlightOpen = false;
  _spotlightIndex = -1;
  const trig = document.getElementById('searchTrigger');
  if(trig && document.activeElement && document.activeElement.closest('#spotlight')) trig.focus();
}
function spotlightCollect(term){
  const t = (term||'').toLowerCase().trim();
  if(!t) return [];
  const results = [];
  const add = (section, title, desc, view, tab, extra) => results.push({section, title, desc, view, tab, extra});
  // commands
  try{
    const cmds = buildCommandIndex();
    cmds.forEach(c=>{
      const hay = `${c.command} ${c.category} ${c.briefDescription} ${c.keywords.join(' ')}`.toLowerCase();
      if(hay.includes(t)) add('Commands', c.command, c.briefDescription, 'cheatsheet', 'linux101', c.example);
    });
  }catch(_e){}
  // nti days
  if(DATA.nti && DATA.nti.days){
    Object.keys(DATA.nti.days).forEach(dayId=>{
      const day = DATA.nti.days[dayId];
      if(!day||!day.sections) return;
      const dayLabel = dayId==='day1'?'Day 1':dayId==='day2'?'Day 2':'Day 3';
      day.sections.forEach(sec=>{
        const hay = `${day.title} ${sec.title} ${getNoteText(sec.blocks)}`.toLowerCase();
        if(hay.includes(t)) add(dayLabel, sec.title, 'Canonical content', dayId+'-content', 'course', null);
      });
    });
    if(DATA.nti.labs){
      Object.keys(DATA.nti.labs).forEach(labId=>{
        const lab = DATA.nti.labs[labId];
        if(!lab||!lab.tasks) return;
        lab.tasks.forEach(task=>{
          const hay = `${task.title} ${task.objective}`.toLowerCase();
          if(hay.includes(t)) add('Lab '+labId.replace('day',''), task.title, task.objective.slice(0,90), labId+'-lab', 'course', null);
        });
      });
    }
    if(DATA.nti.flashcards){
      DATA.nti.flashcards.forEach(fc=>{
        const hay = `${fc.q} ${fc.a}`.toLowerCase();
        if(hay.includes(t)) add('Practice', fc.q.slice(0,48), fc.a.slice(0,80), 'quiz', 'quiz', null);
      });
    }
  }
  // exercises
  if(DATA.exercises){
    DATA.exercises.forEach(ex=>{
      const hay = `${ex.title} ${stripHtml(ex.text)}`.toLowerCase();
      if(hay.includes(t)) add('Exercises', ex.title, stripHtml(ex.text).slice(0,90), 'exercises', 'linux101', null);
    });
  }
  // resources
  if(DATA.helpfulLinks){
    DATA.helpfulLinks.forEach(l=>{
      const hay = `${l.title} ${l.desc}`.toLowerCase();
      if(hay.includes(t)) add('Resources', l.title, l.desc.slice(0,90), 'resources', 'linux101', l.url);
    });
  }
  // topicIndex
  if(DATA.topicIndex){
    DATA.topicIndex.forEach(tp=>{
      if(tp.title.toLowerCase().includes(t) || tp.desc.toLowerCase().includes(t)) add('Topic', tp.title, tp.desc.slice(0,80), 'topicindex', 'linux101', null);
    });
  }
  // guides (Linux 101 Content Library) — metadata from DATA.content, part titles from lazy library data
  try{
    const libMeta = (typeof DATA !== 'undefined' && DATA.content && DATA.content.sections) || [];
    const libData = (_libraryCache && _libraryCache.sections) || [];
    libMeta.forEach(s=>{
      const body = libData.find(x => x.id === s.id);
      let matchedPart = null;
      if(body && Array.isArray(body.parts)){
        matchedPart = body.parts.find(p => p.title.toLowerCase().includes(t)) || null;
      }
      const hay = `${s.title} ${s.preview || ''} ${s.category || ''} ${matchedPart ? matchedPart.title : ''}`.toLowerCase();
      if(hay.includes(t)) add('Guide', s.title, matchedPart ? 'Part: ' + matchedPart.title : (s.preview || '').slice(0, 90), s.id, 'content', null);
    });
  }catch(_e){}
  return results.slice(0, 18);
}
function renderSpotlight(term){
  const meta = document.getElementById('spotlightMeta');
  const box = document.getElementById('spotlightResults');
  if(!meta || !box) return;
  if(!term || !term.trim()){
    meta.textContent = 'Type to search — try “chmod”, “inode”, “vim” or “lab”';
    box.innerHTML = `<div class="spotlight-empty">
      <div class="spotlight-hints">
        <button class="spotlight-hint" data-action="spotlight-hint" data-term="chmod">chmod</button>
        <button class="spotlight-hint" data-action="spotlight-hint" data-term="grep">grep</button>
        <button class="spotlight-hint" data-action="spotlight-hint" data-term="inode">inode</button>
        <button class="spotlight-hint" data-action="spotlight-hint" data-term="vim">vim</button>
        <button class="spotlight-hint" data-action="spotlight-hint" data-term="lab">lab</button>
      </div>
      <p class="spotlight-hint-text">Quick filters — tap to try</p>
    </div>`;
    _spotlightResults = [];
    _spotlightIndex = -1;
    return;
  }
  const results = spotlightCollect(term);
  _spotlightResults = results;
  _spotlightIndex = results.length ? 0 : -1;
  meta.textContent = results.length ? `${results.length} result${results.length!==1?'s':''} for “${term}”` : `No results for “${term}”`;
  if(!results.length){
    const popular = ['ls','cd','grep','chmod','vim'];
    const pops = popular.map(p=> `<button class="spotlight-hint" data-action="spotlight-hint" data-term="${p}">${p}</button>`).join('');
    box.innerHTML = `<div class="spotlight-empty"><p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">Try a broader term</p><div class="spotlight-hints">${pops}</div></div>`;
    return;
  }
  const badgeIcon = (sec)=>{
    const m={Commands:'terminal', Guide:'book', Practice:'beaker', Exercises:'clipboard', Resources:'link', Topic:'hash', 'Day 1':'file','Day 2':'file','Day 3':'file', Lab:'beaker', Flashcards:'layers'};
    const k = m[sec] || (sec.toLowerCase().includes('command')?'terminal': sec.toLowerCase().includes('guide')?'book':'search');
    return ICONS[k]||ICONS.search;
  };
  box.innerHTML = results.map((r,i)=>`
    <button class="spotlight-item ${i===_spotlightIndex?'is-active':''}" role="option" aria-selected="${i===_spotlightIndex?'true':'false'}" data-idx="${i}" data-action="spotlight-pick" data-idxpick="${i}">
      <span class="spotlight-item-badge"><span class="icon-xs" aria-hidden="true" style="display:inline-flex;vertical-align:-2px;margin-right:4px">${badgeIcon(r.section)}</span>${escapeHtml(r.section)}</span>
      <span class="spotlight-item-title">${highlightMatch(escapeHtml(r.title), term)}</span>
      <span class="spotlight-item-desc">${highlightMatch(escapeHtml(r.desc||''), term)}</span>
    </button>
  `).join('');
  updateSpotlightActive();
}
function updateSpotlightActive(){
  const items = document.querySelectorAll('.spotlight-item');
  items.forEach((el, i)=>{
    const active = i===_spotlightIndex;
    el.classList.toggle('is-active', active);
    el.setAttribute('aria-selected', active?'true':'false');
    if(active) el.scrollIntoView({block:'nearest'});
  });
}
function spotlightMove(dir){
  if(!_spotlightResults.length) return;
  _spotlightIndex = (_spotlightIndex + dir + _spotlightResults.length) % _spotlightResults.length;
  updateSpotlightActive();
}
function spotlightPick(idx){
  const r = _spotlightResults[idx];
  if(!r) return;
  closeSpotlight();
  // navigate
  if(r.tab && r.view) setView(r.tab, r.view);
  else if(r.view) goToView(r.view);
  // if extra is url, open external
  if(r.extra && r.extra.startsWith('http')){
    window.open(r.extra, '_blank', 'noopener');
  }
  // if it's a command, copy hint
  if(r.section==='Commands' && r.extra){
    // optional copy
  }
}

// ===== COOL CURSOR =====
function initCoolCursor(){
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if(!dot || !ring) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if(reduce || isTouch || window.innerWidth <= 860){
    dot.style.display = 'none';
    ring.style.display = 'none';
    return;
  }
  let mx = 0, my = 0, rx = 0, ry = 0;
  let raf = null;
  const lerp = (a,b,n)=> (1-n)*a + n*b;
  function onMove(e){
    mx = e.clientX;
    my = e.clientY;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    if(!raf) raf = requestAnimationFrame(tick);
  }
  function tick(){
    rx = lerp(rx, mx, 0.14);
    ry = lerp(ry, my, 0.14);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    if(Math.abs(rx-mx) > 0.1 || Math.abs(ry-my) > 0.1) raf = requestAnimationFrame(tick);
    else raf = null;
  }
  window.addEventListener('mousemove', onMove, {passive:true});
  const hoverables = 'a, button, [data-action], .tab, .subnav-item, .cmd-card, .ext-link-card, .topic-pill';
  document.addEventListener('mouseover', (e)=>{
    if(e.target.closest(hoverables)){
      document.body.classList.add('cursor-hover');
    } else {
      document.body.classList.remove('cursor-hover');
    }
  });
  document.addEventListener('mouseleave', ()=> {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', ()=> {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
  // hide when over spotlight or modal
  const obs = new MutationObserver(()=>{
    const spot = document.getElementById('spotlight');
    const isOpen = spot && spot.classList.contains('open');
    dot.style.display = isOpen ? 'none' : '';
    ring.style.display = isOpen ? 'none' : '';
  });
  const sp = document.getElementById('spotlight');
  if(sp) obs.observe(sp, {attributes:true, attributeFilter:['class']});
}

// ===== FIXED TOGGLE FUNCTIONS =====
function toggleCategory(id) {
  state.collapsedCategories[id] = state.collapsedCategories[id] === false ? true : false;
  render(); saveState();
}
function toggleBankCategory(id) {
  state.collapsedBank[id] = state.collapsedBank[id] === false ? true : false;
  render(); saveState();
}
function toggleExercise(id) {
  state.collapsedExercises[id] = state.collapsedExercises[id] === false ? true : false;
  render(); saveState();
}
function toggleDeepDive(id) {
  state.collapsedDeepDives[id] = state.collapsedDeepDives[id] === true ? false : true;
  render(); saveState();
}
function toggleRH124(id) {
  state.collapsedRH124[id] = state.collapsedRH124[id] === false ? true : false;
  render(); saveState();
}
function toggleModule(num) {
  state.expandedModules[num] = !state.expandedModules[num];
  render(); saveState();
}
function toggleComplete(num) {
  state.completedModules[num] = !state.completedModules[num];
  render(); saveState();
}

// ===== MERGED CHEAT SHEET + COMMAND BANK =====
function deriveFlags(example, notes, brief) {
  const text = ((example || '') + ' ' + (notes || '') + ' ' + (brief || ''));
  const flags = [];
  const re = /(?:^|\s)(-{1,2}[A-Za-z][\w-]*)/g;
  let m;
  while ((m = re.exec(text))) { if (!flags.includes(m[1])) flags.push(m[1]); }
  return flags.slice(0, 6);
}

let _cmdIndex = null;
function buildCommandIndex() {
  if (_cmdIndex) return _cmdIndex;
  const map = {};
  const add = (cmd) => {
    const key = String(cmd.command).trim();
    if (!map[key]) {
      map[key] = {
        command: key,
        category: cmd.category || 'Other',
        briefDescription: cmd.briefDescription || cmd.description || '',
        example: cmd.example || cmd.command,
        notes: cmd.notes || '',
        keywords: cmd.keywords ? [...cmd.keywords] : [],
        flags: cmd.flags ? [...cmd.flags] : [],
        examples: cmd.examples ? [...cmd.examples] : null,
        pitfall: cmd.pitfall || '',
        related: cmd.related ? [...cmd.related] : [],
        difficulty: cmd.difficulty || 'beginner'
      };
    } else {
      const m = map[key];
      if (cmd.briefDescription && m.briefDescription.length < cmd.briefDescription.length) m.briefDescription = cmd.briefDescription;
      if (cmd.description && m.briefDescription.length < cmd.description.length) m.briefDescription = cmd.description;
      if (cmd.notes && (!m.notes || m.notes.length < cmd.notes.length)) m.notes = cmd.notes;
      if (cmd.keywords) m.keywords = Array.from(new Set([...m.keywords, ...cmd.keywords]));
      if (cmd.flags && cmd.flags.length) m.flags = cmd.flags;
      if (cmd.examples && cmd.examples.length) m.examples = cmd.examples;
      if (cmd.pitfall) m.pitfall = cmd.pitfall;
      if (cmd.related) m.related = cmd.related;
      if (cmd.difficulty) m.difficulty = cmd.difficulty;
      if (cmd.example && cmd.example.length > (m.example||'').length) m.example = cmd.example;
    }
  };
  (DATA.categories || []).forEach(cat => cat.commands.forEach(c => add({ command: c.command, category: cat.title, briefDescription: c.description, example: c.example, notes: c.notes || '', keywords: [] })));
  (DATA.commandsBank || []).forEach(c => add(c));
  Object.values(map).forEach(c => {
    if (!c.flags || !c.flags.length) c.flags = deriveFlags(c.example, c.notes, c.briefDescription).map(f=>({flag:f, desc:''}));
    else c.flags = c.flags.map(f => typeof f==='string' ? {flag:f, desc:''} : f);
    if (!c.examples) {
      c.examples = c.example ? [{code:c.example, desc:c.briefDescription}] : [];
    }
    if (!['beginner','intermediate','advanced'].includes(c.difficulty)) c.difficulty = 'beginner';
  });
  _cmdIndex = Object.values(map);
  return _cmdIndex;
}

function getCmds() {
  const term = state.cmdTerm.toLowerCase().trim();
  let cmds = buildCommandIndex();
  if (state.cmdCats.length) cmds = cmds.filter(c => state.cmdCats.includes(c.category));
  if (state.cmdDifficulty.length) cmds = cmds.filter(c => state.cmdDifficulty.includes(c.difficulty));
  if (state.cmdFavOnly) cmds = cmds.filter(c => state.cmdFav.includes(c.command));
  if (term) {
    cmds = cmds.filter(c => {
      const hay = `${c.command} ${c.category} ${c.briefDescription} ${c.notes} ${c.keywords.join(' ')} ${(c.pitfall||'')} ${(c.related||[]).join(' ')} ${(c.flags||[]).map(f=>f.flag+' '+(f.desc||'')).join(' ')} ${(c.examples||[]).map(e=>e.code+' '+(e.desc||'')).join(' ')}`.toLowerCase();
      return hay.includes(term);
    });
  }
  const sort = state.cmdSort || 'name';
  cmds = [...cmds].sort((a,b)=>{
    if (sort==='category') return a.category.localeCompare(b.category) || a.command.localeCompare(b.command);
    if (sort==='difficulty') {
      const order = {beginner:0, intermediate:1, advanced:2};
      return (order[a.difficulty]??0)-(order[b.difficulty]??0) || a.command.localeCompare(b.command);
    }
    if (sort==='examples') return (b.examples?.length||0)-(a.examples?.length||0) || a.command.localeCompare(b.command);
    return a.command.localeCompare(b.command);
  });
  return cmds;
}

function difficultyBadge(d){
  const map = {beginner:'bg', intermediate:'im', advanced:'ad'};
  const label = {beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced'}[d] || 'Beginner';
  const cls = 'diff-' + (d||'beginner');
  return `<span class="diff-badge ${cls}" title="${label}"><span class="diff-dot"></span>${label}</span>`;
}
function isFav(cmd){ return state.cmdFav.includes(cmd); }
function toggleFav(cmd, e){
  if(e) e.stopPropagation();
  const idx = state.cmdFav.indexOf(cmd);
  if(idx>=0) state.cmdFav.splice(idx,1); else state.cmdFav.push(cmd);
  saveState();
  // update UI without full re-render for snappy
  document.querySelectorAll(`.cmd-card[data-cmd="${CSS.escape(cmd)}"] .fav-btn`).forEach(b=>{
    const fav = state.cmdFav.includes(cmd);
    b.classList.toggle('is-fav', fav);
    b.setAttribute('aria-pressed', fav?'true':'false');
    b.innerHTML = fav ? '★' : '☆';
  });
  updateCmdMeta();
  if(state.cmdFavOnly) renderCmdResults();
  showToast(idx>=0 ? 'Removed from favorites' : 'Added to favorites');
}
async function openCmdDrawer(cmd){
  const all = buildCommandIndex();
  const c = all.find(x=>x.command===cmd);
  if(!c) return;
  const drawer = document.getElementById('cmdDrawer');
  const panel = document.getElementById('cmdDrawerPanel');
  if(!drawer || !panel) return;
  // try to get guides for this command (async cache)
  let guideList = [];
  try {
    const map = await getCmdGuides();
    guideList = (map && map[String(cmd).toLowerCase()]) ? map[String(cmd).toLowerCase()] : [];
  } catch(_e){ guideList = []; }
  // also try sync cache as fallback if fetch not yet done
  if (!guideList.length) {
    const sync = getGuidesForCommandSync(cmd);
    if (sync && sync.length) guideList = sync;
  }
  const guidesHtml = guideList.length ? guideList.map(g=>`<button class="chip chip--sm guide-chip" data-action="open-content-section" data-section="${escapeHtml(g.id)}" title="${escapeHtml(g.title)}">${escapeHtml(g.title)}</button>`).join('') : '<span style="color:var(--text-dim)">No guides yet</span>';
  const guidesSection = `<!-- drawer-guides-start --><div class="drawer-section" id="drawer-guides"><h4>Guides</h4><div class="guide-chip-group">${guidesHtml}</div></div><!-- drawer-guides-end -->`;
  const flagsHtml = (c.flags||[]).length ? `<div class="drawer-section"><h4>Flags</h4><div class="table-wrap"><table class="comparison-table"><thead><tr><th>Flag</th><th>Description</th></tr></thead><tbody>${c.flags.map(f=>`<tr><td><code>${f.flag}</code></td><td>${f.desc||'—'}</td></tr>`).join('')}</tbody></table></div></div>` : '';
  const examplesHtml = (c.examples||[]).map((ex,i)=>`<div class="drawer-example"><div class="drawer-example-head"><span class="drawer-example-num">#${i+1}</span><span class="drawer-example-desc">${escapeHtml(ex.desc||'Example')}</span><button class="copy-btn" data-action="explain-cmd" data-cmd="${escapeCopyAttr(ex.code)}" title="Explain with explainshell.com" aria-label="Explain this command with explainshell">${EXTLINK_SVG}</button><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(ex.code)}" aria-label="Copy">${ICONS.copy}</button></div><div class="cmd-example"><span class="code-label">bash</span><code>${highlightCode(ex.code)}</code></div></div>`).join('');
  const relatedHtml = (c.related||[]).length ? `<div class="drawer-related">${c.related.map(r=>`<button class="chip chip--sm" data-action="open-cmd" data-cmd="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join('')}</div>` : '<span style="color:var(--text-dim)">No related</span>';
  panel.innerHTML = `
    <div class="drawer-header">
      <div class="drawer-title-row">
        <code class="drawer-cmd">${escapeHtml(c.command)}</code>
        <button class="icon-btn icon-btn--sm" data-action="man-page" data-cmd="${escapeAttrHtml(c.command)}" title="Official man page (man7.org)" aria-label="Open official man page for ${escapeHtml(c.command)}">${ICONS.book}</button>
        <button class="fav-btn ${isFav(c.command)?'is-fav':''}" data-action="toggle-fav" data-cmd="${escapeHtml(c.command)}" aria-pressed="${isFav(c.command)?'true':'false'}" title="Favorite">${isFav(c.command)?'★':'☆'}</button>
        <button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(c.command)}" title="Copy command">${ICONS.copy}</button>
      </div>
      <div class="drawer-meta">
        <span class="source-badge">${escapeHtml(c.category)}</span>
        ${difficultyBadge(c.difficulty)}
        <span class="drawer-count">${(c.examples||[]).length} examples · ${(c.flags||[]).length} flags</span>
      </div>
      <p class="drawer-desc">${escapeHtml(c.briefDescription)}</p>
      ${c.pitfall ? `<div class="callout callout--warning"><span aria-hidden="true">${ICONS.alert}</span><p><strong>Pitfall:</strong> ${escapeHtml(c.pitfall)}</p></div>` : ''}
      ${c.notes ? `<div class="callout callout--info"><p>${escapeHtml(c.notes)}</p></div>` : ''}
    </div>
    <div class="drawer-body">
      <div class="drawer-section"><h4>Examples</h4>${examplesHtml || '<p style="color:var(--text-dim)">No examples yet</p>'}</div>
      ${flagsHtml}
      ${guidesSection}
      <div class="drawer-section"><h4>Related</h4>${relatedHtml}</div>
      <div class="drawer-section"><h4>Keywords</h4><div class="drawer-keywords">${(c.keywords||[]).map(k=>`<span class="flag-chip">${escapeHtml(k)}</span>`).join(' ')||'<span style="color:var(--text-dim)">—</span>'}</div></div>
    </div>
    <div class="drawer-footer">
      <button class="toggle-complete" data-action="copy" data-copy="${escapeCopyAttr(c.command)}">${ICONS.copy} Copy command</button>
      <button class="chip" data-action="close-drawer">Close</button>
    </div>
  `;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  // if guides were not yet loaded, try to refresh once loaded
  if (!guideList.length && !_cmdGuidesCache) {
    try {
      const map2 = await getCmdGuides();
      const list2 = (map2 && map2[String(cmd).toLowerCase()]) ? map2[String(cmd).toLowerCase()] : [];
      if (list2.length) {
        const box = document.getElementById('drawer-guides');
        if (box) {
          const inner = box.querySelector('.guide-chip-group');
          if (inner) inner.innerHTML = list2.map(g=>`<button class="chip chip--sm guide-chip" data-action="open-content-section" data-section="${escapeHtml(g.id)}" title="${escapeHtml(g.title)}">${escapeHtml(g.title)}</button>`).join('');
        }
      }
    } catch(_e){}
  }
}
function closeCmdDrawer(){
  const d=document.getElementById('cmdDrawer');
  if(d){ d.classList.remove('open'); d.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
}
function cmdCard(c) {
  const catClass = 'cat-' + (c.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fav = isFav(c.command);
  const diff = c.difficulty||'beginner';
  const flagChips = (c.flags||[]).slice(0,4).map(f=>`<span class="flag-chip" title="${escapeHtml(f.desc||f.flag)}">${escapeHtml(f.flag)}</span>`).join('');
  const moreFlags = (c.flags||[]).length>4 ? `<span class="flag-chip flag-chip--more">+${c.flags.length-4}</span>` : '';
  const firstEx = (c.examples && c.examples[0]) ? c.examples[0] : (c.example ? {code:c.example, desc:''} : null);
  const pit = c.pitfall ? `<div class="cmd-card-pit">${ICONS.alert}<span>${escapeHtml(c.pitfall.slice(0,90))}${c.pitfall.length>90?'…':''}</span></div>` : '';
  const rel = (c.related||[]).length ? `<div class="cmd-card-related"><span class="cmd-card-related-label">Related:</span> ${(c.related||[]).slice(0,2).map(r=>`<span class="related-chip">${escapeHtml(r)}</span>`).join('')}${c.related.length>2?`<span class="related-more">+${c.related.length-2}</span>`:''}</div>` : '';
  // guide chip: 📖 badge if this command appears in any guide
  const guides = getGuidesForCommandSync(c.command) || [];
  const guideCount = guides.length;
  let guideChip = '';
  if (guideCount) {
    if (guideCount === 1) {
      guideChip = `<button class="chip chip--sm guide-chip" data-action="open-content-section" data-section="${escapeHtml(guides[0].id)}" title="Open guide: ${escapeHtml(guides[0].title)}" onclick="event.stopPropagation()">📖 ${escapeHtml(guides[0].title.slice(0,16))}</button>`;
    } else {
      // show count + first guide as representative
      guideChip = `<span class="cmd-guide-chip" onclick="event.stopPropagation()"><button class="chip chip--sm guide-chip" data-action="open-content-section" data-section="${escapeHtml(guides[0].id)}" title="${escapeHtml(guides.map(g=>g.title).join(', '))}">📖 ${guideCount}</button><span class="guide-chip-label">${escapeHtml(guides[0].title.slice(0,12))} +${guideCount-1}</span></span>`;
    }
  }
  return `
    <div class="cmd-card ${catClass} ${fav?'is-fav':''}" data-cmd="${escapeHtml(c.command)}" data-action="open-cmd" data-cmd="${escapeHtml(c.command)}" role="button" tabindex="0" aria-label="Open ${escapeHtml(c.command)} details">
      <div class="cmd-card-head">
        <div class="cmd-card-name">${escapeHtml(c.command)}</div>
        <button class="fav-btn ${fav?'is-fav':''}" data-action="toggle-fav" data-cmd="${escapeHtml(c.command)}" aria-pressed="${fav?'true':'false'}" title="${fav?'Unfavorite':'Favorite'}" aria-label="${fav?'Remove favorite':'Add favorite'}">${fav?'★':'☆'}</button>
      </div>
      <div class="cmd-card-meta">
        <span class="source-badge source-badge--sm">${escapeHtml(c.category)}</span>
        ${difficultyBadge(diff)}
        <span class="cmd-card-count">${(c.examples||[]).length} ex · ${(c.flags||[]).length} flags</span>
      </div>
      <div class="cmd-card-desc">${escapeHtml(c.briefDescription)}</div>
      ${firstEx ? `<div class="cmd-card-example" onclick="if(event.target.closest('[data-action]'))return;event.stopPropagation()"><span class="code-label">bash</span><code>${highlightCode(firstEx.code)}</code><button class="copy-btn" data-action="explain-cmd" data-cmd="${escapeCopyAttr(firstEx.code)}" title="Explain with explainshell.com" aria-label="Explain this command with explainshell">${EXTLINK_SVG}</button><button class="copy-btn" data-action="copy" data-copy="${escapeCopyAttr(firstEx.code)}" title="Copy" aria-label="Copy ${escapeHtml(c.command)}">${ICONS.copy}</button></div>` : ''}
      ${(c.flags||[]).length ? `<div class="cmd-card-flags">${flagChips}${moreFlags}</div>` : ''}
      ${pit}
      ${rel}
      ${guideCount ? `<div class="cmd-card-guides">${guideChip}</div>` : ''}
      <div class="cmd-card-foot"><span class="cmd-card-more">Details →</span><span class="cmd-card-kbd" aria-hidden="true">↵</span></div>
    </div>`;
}

function renderMergedCheatSheet() {
  const all = buildCommandIndex();
  const cats = Array.from(new Set(all.map(c => c.category))).sort();
  const diffs = ['beginner','intermediate','advanced'];
  const cmds = getCmds();
  const term = state.cmdTerm.trim();
  const favCount = state.cmdFav.length;
  // stats
  const totalFlags = all.reduce((a,c)=>a+(c.flags?.length||0),0);
  const totalExamples = all.reduce((a,c)=>a+(c.examples?.length||0),0);
  const grid = cmds.length
    ? `<div id="cmdResults" class="cmd-grid ${state.cmdView==='list'?'is-list':''}">${cmds.map(cmdCard).join('')}</div>`
    : `<div class="no-results">${ICONS.search}<h3>No commands match</h3><p>Try clearing filters or search term.</p><div style="margin-top:12px"><button class="toggle-complete" data-action="clear-cmd-filters">Clear all filters</button></div></div>`;
  return `
    ${breadcrumbs([{label:'Linux101', tab:'linux101'}, {label:'Commands'}])}
    <div class="bank-hero">
      <div class="bank-hero-head">
        <h1 class="view-title" style="margin:0">Linux101 — Commands</h1>
        <div class="bank-hero-actions">
          <button class="icon-btn" data-action="clear-cmd-filters" title="Clear filters">${ICONS.search} Clear</button>
        </div>
      </div>
      <p class="view-subtitle" style="margin:6px 0 14px">${all.length} commands · ${cats.length} categories · ${totalFlags} flags · ${totalExamples} examples <span style="color:var(--text-dim)">· Press <kbd style="font-family:var(--font-mono);font-size:11px;border:1px solid var(--border);padding:1px 5px;border-radius:3px;background:var(--bg-tertiary)">⌘K</kbd> for global search</span></p>
      <div class="bank-stats">
        <div class="bank-stat"><span class="bank-stat-num">${all.length}</span><span class="bank-stat-label">Commands</span></div>
        <div class="bank-stat"><span class="bank-stat-num">${cats.length}</span><span class="bank-stat-label">Categories</span></div>
        <div class="bank-stat"><span class="bank-stat-num">${totalFlags}</span><span class="bank-stat-label">Flags</span></div>
        <div class="bank-stat"><span class="bank-stat-num">${totalExamples}</span><span class="bank-stat-label">Examples</span></div>
        <div class="bank-stat bank-stat--fav ${state.cmdFavOnly?'is-active':''}" data-action="toggle-fav-filter" role="button" tabindex="0"><span class="bank-stat-num">★ ${favCount}</span><span class="bank-stat-label">Favorites</span></div>
      </div>
    </div>
    <div class="cmd-filterbar cmd-filterbar--v2">
      <div class="cmd-search-box">
        <span class="cmd-search-icon">${ICONS.search}</span>
        <input id="cmdSearch" class="cmd-search-input" type="text" placeholder="Filter by name, flag, use case… try 'network', '-r', 'permission'" value="${escapeHtml(state.cmdTerm)}" aria-label="Filter commands">
        ${term ? `<button class="cmd-clear" data-action="clear-cmd-term" aria-label="Clear search">✕</button>` : ''}
      </div>
      <div class="cmd-controls">
        <div class="cmd-chips" role="toolbar" aria-label="Filter by category">
          ${cats.map(cat => {
            const count = all.filter(x=>x.category===cat).length;
            const lc = cat.toLowerCase();
            const iconKey = lc.includes('file')||lc.includes('filesystem')?'folder' : lc.includes('network')?'network' : lc.includes('perm')||lc.includes('security')||lc.includes('user')?'shield' : lc.includes('process')||lc.includes('monitor')?'activity' : lc.includes('storage')||lc.includes('disk')?'hardDrive' : lc.includes('container')||lc.includes('docker')?'container' : lc.includes('automation')||lc.includes('ansible')?'workflow' : lc.includes('shell')||lc.includes('bash')?'terminal' : 'folder';
            const ic = ICONS[iconKey]||ICONS.folder;
            return `<button class="chip ${state.cmdCats.includes(cat) ? 'active' : ''}" data-cat="${escapeHtml(cat)}" data-action="toggle-cmd-cat" data-catval="${escapeHtml(cat)}" aria-pressed="${state.cmdCats.includes(cat) ? 'true' : 'false'}"><span class="icon-xs" aria-hidden="true">${ic}</span> ${escapeHtml(cat)} <span class="chip-count">${count}</span></button>`
          }).join('')}
        </div>
        <div class="cmd-secondary">
          <div class="cmd-difficulty" role="toolbar" aria-label="Filter by difficulty">
            ${diffs.map(d=>`<button class="chip chip--sm ${state.cmdDifficulty.includes(d)?'active':''}" data-action="toggle-cmd-diff" data-diff="${d}" aria-pressed="${state.cmdDifficulty.includes(d)?'true':'false'}">${d==='beginner'?'● Beginner': d==='intermediate'?'◐ Intermediate':'▲ Advanced'}</button>`).join('')}
          </div>
          <div class="cmd-sort">
            <label class="cmd-sort-label" for="cmdSort">Sort</label>
            <select id="cmdSort" class="cmd-sort-select" data-action="change-sort" aria-label="Sort commands">
              <option value="name" ${state.cmdSort==='name'?'selected':''}>A → Z</option>
              <option value="category" ${state.cmdSort==='category'?'selected':''}>Category</option>
              <option value="difficulty" ${state.cmdSort==='difficulty'?'selected':''}>Difficulty</option>
              <option value="examples" ${state.cmdSort==='examples'?'selected':''}>Most examples</option>
            </select>
          </div>
          <div class="view-toggle" role="toolbar" aria-label="View">
            <button class="icon-btn ${state.cmdView==='grid'?'is-active':''}" data-action="set-cmd-view" data-view="grid" aria-pressed="${state.cmdView==='grid'?'true':'false'}" title="Grid">${ICONS.layers}</button>
            <button class="icon-btn ${state.cmdView==='list'?'is-active':''}" data-action="set-cmd-view" data-view="list" aria-pressed="${state.cmdView==='list'?'true':'false'}" title="List"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
          </div>
          <button class="chip ${state.cmdFavOnly?'active':''}" data-action="toggle-fav-filter" aria-pressed="${state.cmdFavOnly?'true':'false'}">★ Favorites only</button>
        </div>
      </div>
    </div>
    <div class="cmd-results-meta" role="status" aria-live="polite">
      <span>${cmds.length} of ${all.length} shown${term?` for “${escapeHtml(term)}”`:''}${state.cmdCats.length?` · ${state.cmdCats.length} categories`:''}${state.cmdDifficulty.length?` · ${state.cmdDifficulty.join(', ')}`:''}${state.cmdFavOnly?' · favorites':''}</span>
      ${(state.cmdCats.length||state.cmdDifficulty.length||state.cmdFavOnly||term)?`<button class="chip chip--sm" data-action="clear-cmd-filters">Clear all</button>`:''}
    </div>
    ${grid}
    <div id="cmdDrawer" class="cmd-drawer" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Command details">
      <div class="cmd-drawer-backdrop" data-action="close-drawer"></div>
      <div class="cmd-drawer-panel" id="cmdDrawerPanel" role="document"></div>
    </div>
  `;
}

function updateCmdMeta() {
  const meta = document.querySelector('.cmd-results-meta');
  if (!meta) return;
  const cmds = getCmds();
  const all = buildCommandIndex();
  const term = state.cmdTerm.trim();
  meta.innerHTML = `<span>${cmds.length} of ${all.length} shown${term?` for “${escapeHtml(term)}”`:''}${state.cmdCats.length?` · ${state.cmdCats.length} categories`:''}${state.cmdDifficulty.length?` · ${state.cmdDifficulty.join(', ')}`:''}${state.cmdFavOnly?' · favorites':''}</span>${(state.cmdCats.length||state.cmdDifficulty.length||state.cmdFavOnly||term)?`<button class="chip chip--sm" data-action="clear-cmd-filters">Clear all</button>`:''}`;
}
function renderCmdResults() {
  const wrap = document.getElementById('cmdResults');
  if (!wrap) return;
  const cmds = getCmds();
  const isList = state.cmdView==='list';
  const newHtml = cmds.length
    ? `<div id="cmdResults" class="cmd-grid ${isList?'is-list':''}">${cmds.map(cmdCard).join('')}</div>`
    : `<div id="cmdResults"><div class="no-results">${ICONS.search}<h3>No commands match</h3><p>Try clearing filters or search term.</p><button class="toggle-complete" data-action="clear-cmd-filters">Clear filters</button></div></div>`;
  wrap.outerHTML = newHtml;
  updateCmdMeta();
}
function clearCmdFilters() {
  state.cmdTerm = '';
  state.cmdCats = [];
  state.cmdDifficulty = [];
  state.cmdFavOnly = false;
  saveState();
  const inp = document.getElementById('cmdSearch');
  if (inp) inp.value = '';
  document.querySelectorAll('.chip[data-cat]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.chip[data-diff]').forEach(b=>b.classList.remove('active'));
  render();
}
function toggleCmdCat(cat) {
  const i = state.cmdCats.indexOf(cat);
  if (i >= 0) state.cmdCats.splice(i, 1); else state.cmdCats.push(cat);
  saveState();
  document.querySelectorAll('.chip[data-cat]').forEach(b => {
    const active = state.cmdCats.includes(b.dataset.cat);
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  renderCmdResults();
}
function toggleCmdDiff(diff){
  const i = state.cmdDifficulty.indexOf(diff);
  if(i>=0) state.cmdDifficulty.splice(i,1); else state.cmdDifficulty.push(diff);
  saveState();
  document.querySelectorAll('.chip[data-diff]').forEach(b=>{
    const active = state.cmdDifficulty.includes(b.dataset.diff);
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active?'true':'false');
  });
  renderCmdResults();
}
function setCmdView(view){
  state.cmdView = view;
  saveState();
  document.querySelectorAll('.view-toggle .icon-btn').forEach(b=>{
    const active = b.dataset.view===view;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', active?'true':'false');
  });
  renderCmdResults();
}
function toggleFavFilter(){
  state.cmdFavOnly = !state.cmdFavOnly;
  saveState();
  renderCmdResults();
}
function clearCmdTerm(){
  state.cmdTerm = '';
  saveState();
  const inp = document.getElementById('cmdSearch');
  if(inp) inp.value='';
  renderCmdResults();
}

function setupCmdSearch() {
  enableChipScroll();
  const input = document.getElementById('cmdSearch');
  if (!input) return;
  input.value = state.cmdTerm;
  input.setAttribute('aria-label','Filter commands');
  input.addEventListener('input', (e) => {
    state.cmdTerm = e.target.value;
    saveState();
    renderCmdResults();
  });
  const sortSel = document.getElementById('cmdSort');
  if(sortSel){
    sortSel.value = state.cmdSort;
    sortSel.addEventListener('change', (e)=>{
      state.cmdSort = e.target.value;
      saveState();
      renderCmdResults();
    });
  }
  // close drawer on backdrop
  const drawer = document.getElementById('cmdDrawer');
  if(drawer){
    drawer.addEventListener('click', (e)=>{
      if(e.target.classList.contains('cmd-drawer') || e.target.classList.contains('cmd-drawer-backdrop')) closeCmdDrawer();
    });
  }
  // keyboard for cards
  const grid = document.getElementById('cmdResults');
  if(grid){
    grid.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){
        const card = e.target.closest('.cmd-card');
        if(card && card.dataset.cmd){
          e.preventDefault();
          openCmdDrawer(card.dataset.cmd);
        }
      }
    });
  }
  // clear on Escape inside this field is handled globally
}
function enableChipScroll(){
  const scrollers = document.querySelectorAll('.cmd-chips, .tabs');
  scrollers.forEach(el=>{
    if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
    if(!el.hasAttribute('role')) el.setAttribute('role','region');
    if(!el.hasAttribute('aria-label')){
      el.setAttribute('aria-label', el.classList.contains('tabs') ? 'Scrollable tabs' : 'Scrollable filters');
    }
    if(el._chipScrollBound) return;
    el._chipScrollBound = true;
    // wheel: vertical wheel -> horizontal scroll
    el.addEventListener('wheel', (e)=>{
      if(Math.abs(e.deltaX) < Math.abs(e.deltaY) && el.scrollWidth > el.clientWidth){
        // if can scroll horizontally, convert
        if((e.deltaY < 0 && el.scrollLeft > 0) || (e.deltaY > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth)){
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    }, {passive:false});
    // drag to scroll (mouse)
    let isDown=false, startX, scrollLeft, isDragging=false;
    el.addEventListener('mousedown', (e)=>{
      if(e.button!==0) return;
      isDown=true;
      isDragging=false;
      el.classList.add('dragging');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });
    el.addEventListener('mouseleave', ()=>{ isDown=false; el.classList.remove('dragging'); });
    el.addEventListener('mouseup', (e)=>{
      if(isDragging){
        // prevent chip click after drag
        e.preventDefault();
        e.stopPropagation();
      }
      isDown=false;
      setTimeout(()=>{ isDragging=false; el.classList.remove('dragging'); }, 50);
    });
    el.addEventListener('mousemove', (e)=>{
      if(!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX);
      if(Math.abs(walk) > 5) isDragging=true;
      el.scrollLeft = scrollLeft - walk;
    });
    el.addEventListener('click', (e)=>{
      if(isDragging){
        e.preventDefault();
        e.stopPropagation();
        isDragging=false;
      }
    }, true);
    // keyboard: arrow keys when focused
    el.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowRight'){ e.preventDefault(); el.scrollBy({left: 120, behavior:'smooth'}); }
      if(e.key==='ArrowLeft'){ e.preventDefault(); el.scrollBy({left: -120, behavior:'smooth'}); }
    });
  });
}

// ===== Course =====
function renderNTIRoadmap() {
  const days = DATA.course.days || [];
  const readySet = new Set(['day1','day2']);
  let html = `
    ${breadcrumbs([{label:'Course', tab:'course'}, {label:'Roadmap'}])}
    <h1 class="view-title">Course — Roadmap</h1>
    <p class="view-subtitle">${days.length}-day Red Hat (RH124-style) outline — Day 1 & Day 2 live, Day 3 coming soon — plus the 7-module practical track.</p>
    <h2 class="day-part-title">${days.length}-Day Course Outline</h2>
    <div class="roadmap-grid">
  `;
  const dayIcons = {day1: ICONS.terminal, day2: ICONS.folder, day3: ICONS.network, day4: ICONS.shield, day5: ICONS.activity};
  // learning path visual — vertical line with nodes
  html += `<div class="roadmap-path" aria-hidden="true"><div class="roadmap-line"></div>`;
  days.forEach((d,i)=>{
    const isReady = readySet.has(d.id);
    const icon = dayIcons[d.id]||ICONS.book;
    html += `<div class="roadmap-node ${isReady?'is-ready':'is-soon'}"><span class="roadmap-dot">${icon}</span><span class="roadmap-node-label">Day ${d.id.replace('day','')}</span></div>`;
    if(i < days.length-1) html += `<div class="roadmap-connector ${isReady?'is-done':''}"></div>`;
  });
  html += `</div>`;
  days.forEach(d => {
    const label = d.id.replace('day', 'Day ');
    const isReady = readySet.has(d.id);
    const icon = dayIcons[d.id]||ICONS.book;
    html += `
      <div class="roadmap-card ${isReady ? '' : 'roadmap-card--soon'}">
        <div class="roadmap-card-head"><span class="card-icon icon-sm" aria-hidden="true">${icon}</span><div><div class="roadmap-day">${escapeHtml(label)}</div><div class="roadmap-title">${escapeHtml(d.title)}</div></div><span class="roadmap-status" aria-hidden="true">${isReady?'✓':'○'}</span></div>
        <ul class="roadmap-list">${d.topics.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
        <button class="roadmap-go" data-action="set-view" data-tab="course" data-view="${escapeHtml(d.id+'-content')}">Open ${escapeHtml(label)} →</button>
      </div>`;
  });
  html += `</div>`;
  html += `
    <h2 class="day-part-title">7-Module Practical Track</h2>
    ${renderCourse()}
  `;
  return html;
}

function renderDayPlaceholder(view) {
  const dayNum = view.replace('day', '');
  const day = (DATA.course.days || []).find(d => d.id === view.replace('-content','').replace('-lab',''));
  const topics = day ? day.topics : [];
  return `
    ${breadcrumbs([{label:'Course', tab:'course'}, {label:'Roadmap', tab:'course', view:'roadmap'}, {label:'Day ' + dayNum}])}
    <h1 class="view-title">Course — Day ${dayNum}</h1>
    ${day ? `<p class="view-subtitle">${escapeHtml(day.title)}</p>` : ''}
    <div class="no-results">
      ${ICONS.file}
      <h3>Day ${dayNum} content coming soon</h3>
      <p>Day 1 is fully populated. Day ${dayNum} will cover:</p>
      ${topics.length ? `<ul class="topic-list" style="text-align:left;max-width:480px;margin:12px auto">${topics.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
        <button class="toggle-complete" data-action="set-view" data-tab="course" data-view="day1-content">${ICONS.chevron} Go to Day 1</button>
        <button class="chip" data-action="set-view" data-tab="course" data-view="roadmap">Back to Roadmap</button>
      </div>
        <p style="font-size:12px;color:var(--text-dim);margin-top:14px">Want this sooner? Check the 7-module track in Linux101 · Roadmap.</p>
    </div>`;
}

function renderDay1Content() {
  return `
    ${breadcrumbs([{label:'Course', tab:'course'}, {label:'Roadmap', tab:'course', view:'roadmap'}, {label:'Day 1'}])}
    <h1 class="view-title">Course — Day 1</h1>
    <p class="view-subtitle">RH124 summary and the soft vs hard links guide.</p>
    <div class="day-part">
      <h2 class="day-part-title">RH124 — Day 1 Summary</h2>
      ${renderRH124Body()}
    </div>
    <div class="day-part">
      <h2 class="day-part-title">Soft vs Hard Links</h2>
      ${renderLinksBody()}
    </div>
  `;
}

function renderCourseDayContent(dayId) {
  const day = (DATA.course.days || []).find(d => d.id === dayId);
  if (!day) return renderDayPlaceholder(dayId);
  const num = dayId.replace('day', '');
  let html = breadcrumbs([{label:'Course', tab:'course'}, {label:'Roadmap', tab:'course', view:'roadmap'}, {label:'Day ' + num}]);
  html += `<h1 class="view-title">Course — Day ${num}</h1>`;
  html += `<p class="view-subtitle">${escapeHtml(day.title)}</p>`;
  (day.content || []).forEach(sec => {
    html += `<div class="day-part"><h2 class="day-part-title">${escapeHtml(sec.title)}</h2>`;
    if (sec.points && sec.points.length) {
      html += '<ul class="topic-list">';
      sec.points.forEach(p => html += `<li>${escapeHtml(p)}</li>`);
      html += '</ul>';
    }
    if (sec.note) html += `<p class="section-note">${escapeHtml(sec.note)}</p>`;
    html += '</div>';
  });
  html += `<div class="day-nav-foot"><button class="toggle-complete" data-action="set-view" data-tab="course" data-view="${dayId}-lab">${ICONS.chevron} Go to Lab Task</button></div>`;
  return html;
}

function renderCourseDayLab(dayId) {
  const day = (DATA.course.days || []).find(d => d.id === dayId);
  const num = dayId.replace('day', '');
  let html = breadcrumbs([{label:'Course', tab:'course'}, {label:'Day ' + num, tab:'course', view: dayId + '-content'}, {label:'Lab Task'}]);
  html += `<h1 class="view-title">Lab · Day ${num}</h1>`;
  html += `<p class="view-subtitle">${escapeHtml(day ? day.title : 'Practice tasks')}</p>`;
  html += `<div class="task-card"><div class="task-header"><span class="task-tag">Practice</span><span class="task-title">${escapeHtml('Hands-on tasks for ' + (day ? day.title : ('Day ' + num)))}</span></div>`;
  if (day && day.topics) {
    html += '<ul class="task-steps">';
    day.topics.forEach(t => html += `<li class="task-step">${escapeHtml(t)}</li>`);
    html += '</ul>';
  }
  html += `<p class="task-objective">Detailed step-by-step lab instructions will be added here.</p></div>`;
  html += `<div class="day-nav-foot"><button class="toggle-complete" data-action="set-view" data-tab="course" data-view="${dayId}-content">${ICONS.chevron} Back to Content</button></div>`;
  return html;
}

// ===== HELPFUL LINKS (now inside Linux101) =====
function renderHelpfulLinks() {
  const links = DATA.helpfulLinks || [];
  let html = `
    ${breadcrumbs([{label:'Linux101', tab:'linux101'}, {label:'Resources'}])}
    <h1 class="view-title">Resources</h1>
    <p class="view-subtitle">Curated external resources to support Linux101 &amp; Course.</p>
    ${!links.length ? `<div class="no-results">${ICONS.link}<h3>No links yet</h3><p>Add resources to DATA.helpfulLinks.</p></div>` : ''}
    <div class="link-card-grid">
  `;
  links.forEach(l => {
    html += `
      <a class="ext-link-card" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
        <div class="ext-link-icon">${ICONS.link}</div>
        <div class="ext-link-body">
          <div class="ext-link-title">${escapeHtml(l.title)}</div>
          <div class="ext-link-desc">${escapeHtml(l.desc)}</div>
          <div class="ext-link-url">${escapeHtml(l.url)}</div>
        </div>
        <div class="ext-link-go">${ICONS.chevron}</div>
      </a>`;
  });
  html += `</div>`;
  return html;
}

// ===== RENDER DISPATCHER =====
async function render() {
  const content = document.getElementById('content');
  let html;

  // Lazy-load Course data only when needed (saves 225KB for cheat-sheet-only users)
  const needsNti = state.tab === 'course' || state.tab === 'quiz' || !!state.searchTerm.trim();
  if (needsNti && (typeof DATA === 'undefined' || !DATA.nti || !DATA.nti.days)) {
    content.innerHTML = `<div class="no-results"><p>Loading…</p></div>`;
    try { await ensureNtiReady(); } catch(_e) {}
  }

  // Global search: any non-empty term searches across ALL sections.
  if (state.searchTerm.trim()) {
    html = renderSearchResults();
  } else if (state.tab === 'home' && state.view==='home') {
    html = renderHome();
  } else if (state.tab === 'linux101') {
    if (state.view === 'cheatsheet') html = renderMergedCheatSheet();
    else if (state.view === 'topicindex') html = renderTopicIndex();
    else if (state.view === 'exercises') html = renderExercises();
    else if (state.view === 'roadmap7') html = renderCourse();
    else if (state.view === 'resources') html = renderHelpfulLinks();
    else if (state.view === 'content-library') html = renderContentLibrary();
    else html = renderMergedCheatSheet();
  } else if (state.tab === 'course') {
    const fn = COURSE_RENDER[state.view];
    html = fn ? fn() : renderNTIRoadmap();
  } else if (state.tab === 'content') {
    html = (state.view && state.view !== 'library')
      ? await renderContentSection(state.view)
      : renderContentLibrary();
  } else if (state.tab === 'quiz') {
    html = renderQuiz();
  }
  if (html == null) html = `<div class="no-results"><h3>Nothing to show</h3><p>This view has no content yet.</p></div>`;

  content.innerHTML = html;
  content.classList.remove('fade-in');
  void content.offsetWidth;
  content.classList.add('fade-in');

  const appEl = document.querySelector('.app');
  if (appEl) appEl.classList.toggle('searching', !!state.searchTerm.trim());

  postRender();

  const sw = document.getElementById('searchWrapper');
  // Always show global search; merged sheet has its own local filter as secondary
  if (sw) sw.style.display = 'block';
  // keep title in sync on every render (e.g. back/forward via hash)
  try { document.title = titleForView(state.tab, state.view); } catch(_e) {}
}

function postRender() {
  setupCmdSearch();
  // note reading progress
  (function setupNoteProgress(){
    const fill = document.getElementById('noteProgressFill');
    const page = document.querySelector('.note-page--enhanced');
    if(!fill || !page) return;
    if(window._noteProgressHandler) window.removeEventListener('scroll', window._noteProgressHandler);
    const onScroll = () => {
      const top = page.offsetTop;
      const height = page.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY - top + 120;
      const pct = height > 0 ? Math.max(0, Math.min(100, (scrolled / height) * 100)) : 0;
      fill.style.width = pct + '%';
      const bar = fill.parentElement;
      if(bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
    };
    window._noteProgressHandler = onScroll;
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  })();
  const toc = document.querySelector('.note-toc');
  if (!toc || !('IntersectionObserver' in window)) return;
  const links = Array.from(toc.querySelectorAll('a'));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = toc.querySelector('a[href="#' + e.target.id + '"]');
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.note-section').forEach(s => obs.observe(s));
}

// ===== EVENT LISTENERS =====
(function initTabs(){
  const tabs = Array.from(document.querySelectorAll('.tab'));
  tabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const idx = tabs.indexOf(btn);
      let nextIdx = idx;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') nextIdx = 0;
      if (e.key === 'End') nextIdx = tabs.length - 1;
      tabs[nextIdx].focus();
      switchTab(tabs[nextIdx].dataset.tab);
    });
  });
})();

document.getElementById('themeToggle').addEventListener('click', () => {
  const next = cycleTheme(state.theme);
  state.theme = next;
  document.documentElement.dataset.theme = next;
  const btn = document.getElementById('themeToggle');
  document.getElementById('themeIcon').outerHTML = themeIconSvg(next);
  if(btn){
    btn.setAttribute('title', THEME_LABELS[next] + ' — click to switch');
    btn.setAttribute('aria-label', 'Theme: ' + THEME_LABELS[next] + ' (click to change)');
  }
  showToast('Theme: ' + THEME_LABELS[next]);
  saveState();
});
// also support right-click to open picker (optional) — cycle on click is primary
document.getElementById('themeToggle').addEventListener('contextmenu', (e)=>{
  e.preventDefault();
  // quick cycle backwards on right-click
  const idx = THEMES.indexOf(state.theme);
  const prev = THEMES[(idx - 1 + THEMES.length) % THEMES.length];
  state.theme = prev;
  document.documentElement.dataset.theme = prev;
  document.getElementById('themeIcon').outerHTML = themeIconSvg(prev);
  const btn = document.getElementById('themeToggle');
  if(btn){
    btn.setAttribute('title', THEME_LABELS[prev] + ' — click to switch');
    btn.setAttribute('aria-label', 'Theme: ' + THEME_LABELS[prev] + ' (click to change)');
  }
  showToast('Theme: ' + THEME_LABELS[prev]);
  saveState();
});

try{ document.getElementById('exportBtn')?.addEventListener('click', () => { window.print(); }); }catch(e){}
try{ document.getElementById('searchInput')?.addEventListener('input', (e) => { state.searchTerm = e.target.value; render(); }); }catch(e){}

// Guides hub: live filter (delegated — the input re-renders with the view)
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'clFilterInput') setClTerm(e.target.value);
});

// Mobile: tap the minimized search icon to expand it; collapse when empty and blurred.
(function setupMobileSearch() {
  const box = document.querySelector('.search-box');
  const input = document.getElementById('searchInput');
  const wrap = document.getElementById('searchWrapper');
  if (!box || !input || !wrap) return;
  // Ensure tap target is at least 48px (the box + button area)
  box.style.minHeight = '48px';
  box.style.display = 'flex';
  box.style.alignItems = 'center';
  box.style.justifyContent = 'center';
  box.addEventListener('click', (e) => {
    if (wrap.classList.contains('search-expanded')) return;
    if (e.target === input) return;
    wrap.classList.add('search-expanded');
    setTimeout(() => input.focus(), 60);
  });
  input.addEventListener('blur', () => {
    if (!input.value.trim()) wrap.classList.remove('search-expanded');
  });
})();

// Ensure search-trigger has accessible tap target on mobile
(function setupMobileSearchTrigger() {
  const trig = document.getElementById('searchTrigger');
  if (!trig) return;
  // Make the whole button a 48px tap target
  trig.style.minHeight = '48px';
  trig.style.minWidth = '48px';
  // Announce search opening for screen readers
  trig.setAttribute('aria-pressed', 'false');
  trig.addEventListener('click', (e) => {
    e.stopPropagation();
    // Toggle aria-pressed state
    const newState = trig.getAttribute('aria-pressed') === 'true';
    trig.setAttribute('aria-pressed', String(!newState));
  });
})();

document.addEventListener('keydown', (e) => {
  // Spotlight shortcuts: Cmd+K / Ctrl+K and /
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    if(_spotlightOpen) closeSpotlight();
    else openSpotlight();
    return;
  }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    if (document.activeElement.isContentEditable) return;
    if(_spotlightOpen) return;
    e.preventDefault();
    openSpotlight();
    return;
  }
  if (_spotlightOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closeSpotlight(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); spotlightMove(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); spotlightMove(-1); return; }
    if (e.key === 'Enter') {
      const active = _spotlightResults[_spotlightIndex];
      if(active){ e.preventDefault(); spotlightPick(_spotlightIndex); }
      return;
    }
    return;
  }
  if (e.key === 'Escape') {
    const ext = document.getElementById('extModal');
    if (ext && ext.classList.contains('open')) { closeExtModal(); return; }
    const drawer = document.getElementById('cmdDrawer');
    if (drawer && drawer.classList.contains('open')) {
      closeCmdDrawer();
      return;
    }
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
      document.getElementById('menuBtn')?.focus();
      return;
    }
    // close topic popover if open
    const pop = document.getElementById('topicPopover');
    if (pop && pop.dataset.open) { pop.innerHTML=''; pop.dataset.open=''; document.querySelectorAll('.topic-pill').forEach(p=>p.classList.remove('active')); return; }
    const gi = document.getElementById('searchInput');
    const ci = document.getElementById('cmdSearch');
    if (document.activeElement === gi) {
      gi.value = '';
      state.searchTerm = '';
      render();
      gi.blur();
    } else if (document.activeElement === ci) {
      ci.value = '';
      state.cmdTerm = '';
      ci.blur();
      renderCmdResults(); updateCmdMeta();
    } else if (state.searchTerm.trim()) {
      state.searchTerm = '';
      if (gi) gi.value='';
      render();
    }
  }
});

function openSidebar() {}
function closeSidebar() {}
// legacy menuBtn/overlay listeners guarded
try{ const mb=document.getElementById('menuBtn'); if(mb) mb.addEventListener('click', openSidebar); }catch(e){}
try{ const ov=document.getElementById('overlay'); if(ov) ov.addEventListener('click', closeSidebar); }catch(e){}
// Close on ESC
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    const sd = document.getElementById('sidebar');
    if(sd && sd.classList.contains('open')) closeSidebar();
  }
});
// Spotlight trigger & input wiring
const _searchTrig = document.getElementById('searchTrigger');
if(_searchTrig) _searchTrig.addEventListener('click', openSpotlight);
const _spotIn = document.getElementById('spotlightInput');
if(_spotIn){
  _spotIn.addEventListener('input', (e)=> renderSpotlight(e.target.value));
  _spotIn.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowDown' || e.key==='ArrowUp'){
      // handled globally, but prevent cursor move
      e.preventDefault();
    }
  });
}

// ===== External resources: man7.org man pages + explainshell.com =====
// Lazy, on-demand only. No network calls at startup. See EXT modal shell below.
const MAN_SECTIONS = { useradd:8, usermod:8, userdel:8, groupadd:8, groupmod:8, groupdel:8,
  mount:8, umount:8, fdisk:8, lsblk:8, ip:8, ifconfig:8, systemctl:1, service:8,
  crontab:5, fstab:5, passwd:5, shadow:5, hosts:5 };
function manFirstToken(cmd){
  const t = (cmd||'').trim().split(/\s+/)[0] || '';
  return t.split('/').pop().replace(/[^A-Za-z0-9_.+-]/g,'') ;
}
function manPageUrl(cmd){
  const name = manFirstToken(cmd);
  if(!name) return 'https://man7.org/linux/man-pages/';
  const sec = MAN_SECTIONS[name.toLowerCase()] || 1;
  return `https://man7.org/linux/man-pages/man${sec}/${encodeURIComponent(name)}.${sec}.html`;
}
function explainShellUrl(cmd){
  return 'https://explainshell.com/explain?cmd=' + encodeURIComponent((cmd||'').trim());
}
const EXTLINK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
const _extModalState = { node:null, trigger:null, prevOverflow:null };
function ensureExtModal(){
  if(_extModalState.node) return _extModalState.node;
  const m = document.createElement('div');
  m.id = 'extModal'; m.className = 'ext-modal';
  m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-labelledby','extModalTitle');
  m.innerHTML = `
    <div class="ext-modal-backdrop" data-action="close-ext-modal"></div>
    <div class="ext-modal-panel" role="document">
      <div class="ext-modal-header">
        <h3 class="ext-modal-title" id="extModalTitle"></h3>
        <button class="spotlight-close ext-modal-close" data-action="close-ext-modal" aria-label="Close dialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="ext-modal-body" id="extModalBody"></div>
    </div>`;
  document.body.appendChild(m);
  _extModalState.node = m;
  return m;
}
function openExtModal(titleText, titleMono, bodyHtml, triggerEl){
  const m = ensureExtModal();
  _extModalState.trigger = triggerEl || null;
  _extModalState.prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  m.querySelector('#extModalTitle').innerHTML =
    (titleMono ? `<code>${escapeHtml(titleText)}</code>` : escapeHtml(titleText));
  m.querySelector('#extModalBody').innerHTML = bodyHtml;
  m.classList.add('open'); m.setAttribute('aria-hidden','false');
  const closeBtn = m.querySelector('.ext-modal-close');
  if(closeBtn) try{ closeBtn.focus(); }catch(e){}
}
function closeExtModal(){
  const m = _extModalState.node;
  if(!m || !m.classList.contains('open')) return;
  m.classList.remove('open'); m.setAttribute('aria-hidden','true');
  m.querySelector('#extModalBody').innerHTML = ''; // drop iframe/fetch content
  const drawerOpen = (()=>{ const d=document.getElementById('cmdDrawer'); return !!(d && d.classList.contains('open')); })();
  document.body.style.overflow = drawerOpen ? 'hidden' : (_extModalState.prevOverflow || '');
  if(_extModalState.trigger){ try{ _extModalState.trigger.focus(); }catch(e){} }
  _extModalState.trigger = null;
}
// --- man7.org: CORS-blocked for fetch; try ONCE per session, else styled fallback ---
let _man7FetchBlocked = false;
async function fetchManPageHtml(url){
  const ctrl = ('AbortController' in window) ? new AbortController() : null;
  const timer = ctrl ? setTimeout(()=>ctrl.abort(), 7000) : null;
  try {
    const r = await fetch(url, ctrl ? {signal: ctrl.signal} : {});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return await r.text();
  } finally { if(timer) clearTimeout(timer); }
}
function manFallbackBody(cmd, url){
  return `
    <div class="ext-modal-note">${ICONS.alert}<span>Direct in-site reading is blocked by man7.org's cross-origin policy (CORS).</span></div>
    <p class="ext-modal-text">The official Linux manual page for <code>${escapeHtml(manFirstToken(cmd))}</code> lives at:</p>
    <div class="ext-modal-url"><code>${escapeHtml(url)}</code></div>
    <a class="toggle-complete ext-modal-cta" href="${escapeAttrHtml(url)}" target="_blank" rel="noopener">${EXTLINK_SVG} Read Official Man Page ↗</a>
    <p class="ext-modal-hint">Opens in a new tab · official man-pages project rendering</p>`;
}
async function openManPage(cmd, triggerEl){
  const url = manPageUrl(cmd);
  openExtModal('Man Page', true, `
    <div class="ext-modal-loading"><span class="ext-spinner"></span> Fetching manual page…</div>
    <div class="ext-modal-alt"><a href="${escapeAttrHtml(url)}" target="_blank" rel="noopener">${EXTLINK_SVG} Open in new tab instead</a></div>
  `, triggerEl);
  if(_man7FetchBlocked){ // known blocked this session — go straight to fallback, no retry
    _extModalState.node.querySelector('#extModalBody').innerHTML = manFallbackBody(cmd, url);
    return;
  }
  try {
    const html = await fetchManPageHtml(url);
    // If the modal was closed/replaced meanwhile, bail out.
    const body = _extModalState.node && _extModalState.node.querySelector('#extModalBody');
    if(!body || !body.querySelector('.ext-spinner')) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let text = (doc.body ? doc.body.innerText : '').trim();
    if(!text) throw new Error('empty');
    text = text.replace(/top\s*\n/g, '').slice(0, 60000);
    body.innerHTML = `<pre class="ext-modal-pre">${escapeHtml(text)}</pre>
      <div class="ext-modal-footnote"><a href="${escapeAttrHtml(url)}" target="_blank" rel="noopener">${EXTLINK_SVG} Source: man7.org</a></div>`;
  } catch(e) {
    _man7FetchBlocked = true; // never silently retry this session
    const body = _extModalState.node && _extModalState.node.querySelector('#extModalBody');
    if(body) body.innerHTML = manFallbackBody(cmd, url);
  }
}
// --- explainshell.com: allows framing today; iframe-first + permanent escape hatch ---
function openExplainShell(cmd, triggerEl){
  const raw = (cmd || '').trim();
  if(!raw){ showToast('Nothing to explain — select a command first'); return; }
  const url = explainShellUrl(raw);
  openExtModal(raw, true, `
    <div class="ext-modal-frame-wrap">
      <div class="ext-modal-loading ext-frame-loading"><span class="ext-spinner"></span> Loading explanation…</div>
      <iframe class="ext-modal-frame" src="${escapeAttrHtml(url)}"
        title="explainshell.com breakdown of the command"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerpolicy="no-referrer"></iframe>
    </div>
    <div class="ext-modal-altbar">
      <span class="ext-modal-hint">Not loading? Some browsers/extensions block third-party frames.</span>
      <a class="toggle-complete" href="${escapeAttrHtml(url)}" target="_blank" rel="noopener">${EXTLINK_SVG} Open Interactive Explanation in New Tab ↗</a>
    </div>
  `, triggerEl);
  const wrap = _extModalState.node;
  const frame = wrap.querySelector('.ext-modal-frame');
  const loading = wrap.querySelector('.ext-frame-loading');
  frame.addEventListener('load', () => { if(loading) loading.style.display = 'none'; });
}

// ===== DELEGATED ACTIONS (central, replaces inline onclick/escapeAttr) =====
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const a = btn.dataset.action;
  // copy
  if (a === 'copy') {
    const raw = btn.getAttribute('data-copy') || btn.dataset.copy || '';
    // browser decodes entities in data-*; ensure we get raw text
    // dataset already decoded from &quot; etc, so use it
    const text = btn.dataset.copy != null ? btn.dataset.copy : raw;
    copyText(text, btn);
    e.preventDefault();
    return;
  }
  if (a === 'toggle-category') { toggleCategory(btn.dataset.id); return; }
  if (a === 'toggle-bank') { toggleBankCategory(btn.dataset.id); return; }
  if (a === 'toggle-exercise') { toggleExercise(btn.dataset.id); return; }
  if (a === 'toggle-deepdive') { toggleDeepDive(btn.dataset.id); return; }
  if (a === 'toggle-rh124') { toggleRH124(btn.dataset.id); return; }
  if (a === 'toggle-module') { toggleModule(btn.dataset.num); return; }
  if (a === 'toggle-complete') { toggleComplete(btn.dataset.num); return; }
  if (a === 'toggle-cmd-cat') {
    const cat = btn.dataset.catval || btn.dataset.cat;
    toggleCmdCat(cat);
    return;
  }
  if (a === 'toggle-cmd-diff') { toggleCmdDiff(btn.dataset.diff); return; }
  if (a === 'set-cmd-view') { setCmdView(btn.dataset.view); return; }
  if (a === 'toggle-fav') { toggleFav(btn.dataset.cmd, event); return; }
  if (a === 'open-cmd') { openCmdDrawer(btn.dataset.cmd); return; }
  if (a === 'explain-cmd') { openExplainShell(btn.dataset.cmd || '', btn); return; }
  if (a === 'man-page') { openManPage(btn.dataset.cmd || '', btn); return; }
  if (a === 'close-ext-modal') { closeExtModal(); return; }
  if (a === 'close-drawer') { closeCmdDrawer(); return; }
  if (a === 'toggle-fav-filter') { toggleFavFilter(); return; }
  if (a === 'clear-cmd-term') { clearCmdTerm(); return; }
  if (a === 'clear-cmd-filters') { clearCmdFilters(); return; }
  if (a === 'clear-search') {
    const gi = document.getElementById('searchInput');
    if (gi) gi.value = '';
    state.searchTerm = '';
    syncHash();
    render();
    return;
  }
  if (a === 'go-home') { goHome(); return; }
  if (a === 'open-spotlight') { openSpotlight(); return; }
  if (a === 'set-view') { setView(btn.dataset.tab, btn.dataset.view); return; }
  if (a === 'go-view') { goToView(btn.dataset.view); return; }
  if (a === 'open-content-section') { openContentSection(btn.dataset.section); return; }
  if (a === 'jump-to-cmd') {
    const cmd = btn.dataset.cmd;
    if (!cmd) return;
    e.preventDefault();
    // switch to bank view then open drawer for that command
    // close any existing drawer first
    try { closeCmdDrawer(); } catch(_e){}
    await setView('linux101', 'cheatsheet');
    // micro-task to ensure DOM ready
    setTimeout(()=> { openCmdDrawer(cmd); }, 90);
    return;
  }
  if (a === 'cl-set-level') { setClLevel(btn.dataset.level); return; }
  if (a === 'toggle-guide-read') { toggleGuideRead(btn.dataset.id); return; }
  if (a === 'toggle-guide-group') {
    const grp = btn.closest('.nav-group-guides');
    if (grp) {
      grp.classList.toggle('collapsed');
      const key = btn.dataset.track ? '__track__' + btn.dataset.track : '__guides__';
      state.collapsedGroups[key] = grp.classList.contains('collapsed');
      saveState();
    }
    return;
  }
  if (a === 'breadcrumb') { setView(btn.dataset.tab, btn.dataset.view); return; }
  if (a === 'switch-tab') { switchTab(btn.dataset.tab); return; }
  if (a === 'toggle-topic') {
    const idx = parseInt(btn.dataset.index, 10);
    toggleTopicPopover(idx, btn);
    e.stopPropagation();
    return;
  }
  if (a === 'toggle-search-group') { toggleSearchGroup(btn.dataset.sec); return; }
  if (a === 'toggle-quiz-acc') { toggleQuizAcc(parseInt(btn.dataset.i,10)); return; }
  if (a === 'answer-quiz') {
    const i = parseInt(btn.dataset.i,10);
    const opt = btn.dataset.opt;
    answerQuiz(i, opt, btn);
    return;
  }
  if (a === 'start-quiz') { startQuiz(); return; }
  if (a === 'retry-missed') { startQuiz(_lastMissed); return; }
  if (a === 'flip-flashcard') {
    btn.classList.toggle('flipped');
    const flipped = btn.classList.contains('flipped');
    btn.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    return;
  }
  if (a === 'print-note') { window.print(); return; }
  if (a === 'close-spotlight') { closeSpotlight(); return; }
  if (a === 'spotlight-hint') {
    const term = btn.dataset.term || '';
    const inp = document.getElementById('spotlightInput');
    if(inp){ inp.value = term; renderSpotlight(term); inp.focus(); }
    return;
  }
  if (a === 'spotlight-pick') {
    const idx = parseInt(btn.dataset.idxpick ?? btn.dataset.idx, 10);
    spotlightPick(idx);
    return;
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-action="jump-lib-part"]')) {
    const val = el.value;
    if (val) {
      const target = document.getElementById('lib-' + state.view + '-' + val);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  } else if (el.matches('[data-action=\"toggle-lab-task\"]')) {
    toggleLabTask(el.dataset.id, el);
  } else if (el.matches('[data-action=\"jump-note\"]')) {
    const val = el.value;
    if (val) goToNoteSection(el.dataset.author, val);
  } else if (el.matches('[data-action=\"jump-nti\"]')) {
    const val = el.value;
    if (val) {
      const target = document.getElementById('nti-sec-' + el.dataset.day + '-' + val);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }
});

// keyboard activation for role=button headers
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const hdr = e.target.closest('[data-action=\"toggle-category\"],[data-action=\"toggle-bank\"],[data-action=\"toggle-exercise\"],[data-action=\"toggle-deepdive\"],[data-action=\"toggle-rh124\"],[data-action=\"toggle-module\"],[data-action=\"toggle-quiz-acc\"]');
  if (!hdr) return;
  // avoid double handling for native buttons (they already handle)
  if (hdr.tagName === 'BUTTON') return;
  e.preventDefault();
  hdr.click();
});

// also support delegated jump-note-link (TOC) without inline
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-action=\"jump-note-link\"]');
  if (!a) return;
  e.preventDefault();
  const author = a.dataset.author;
  const sec = a.dataset.sec;
  if (author && sec) {
    // decide if it's Course or note
    if (author === '__lib__') {
      const target = document.getElementById('lib-' + state.view + '-' + sec);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    } else if (author === 'day1' || author === 'day2' || author === 'day3') {
      const target = document.getElementById('nti-sec-' + author + '-' + sec) || document.getElementById('note-sec-' + author + '-' + sec);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    } else {
      goToNoteSection(author, sec);
    }
  }
});

// ===== INIT =====
(function init() {
  // hash routing overrides savedState (shareable links)
  try {
    const parsed = parseHash();
    if (parsed) { state.tab = parsed.tab; state.view = parsed.view; }
  } catch(_e) {}
  document.documentElement.dataset.theme = state.theme;
  document.getElementById('themeIcon').outerHTML = themeIconSvg(state.theme);
  const tbtn = document.getElementById('themeToggle');
  if(tbtn){
    tbtn.setAttribute('title', THEME_LABELS[state.theme] + ' — click to switch (right-click previous)');
    tbtn.setAttribute('aria-label', 'Theme: ' + THEME_LABELS[state.theme] + ' (click to change, right-click previous)');
  }
  try { document.title = titleForView(state.tab, state.view); } catch(_e) {}
  // prune stale collapsed keys from v1 migration / old categories
  try {
    if (typeof DATA !== 'undefined') {
      const validCats = (DATA.categories||[]).map(c=>c.id);
      state.collapsedCategories = pruneCollapsed(state.collapsedCategories, validCats);
      const validBanks = Array.from(new Set((DATA.commandsBank||[]).map(c=>c.category)));
      state.collapsedBank = pruneCollapsed(state.collapsedBank, validBanks);
    }
  } catch(_e) {}
  document.querySelectorAll('.tab').forEach(t => {
    const isActive = t.dataset.tab === state.tab;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.tabIndex = isActive ? 0 : -1;
  });
  renderSubNav();
  render();
  // Home-first: ensure default route is #home/home if no hash
  if(!location.hash){
    state.tab='home'; state.view='home';
    try{ syncHash(); }catch(e){}
  } else {
    try { const p = parseHash(); if (!p || p.tab !== state.tab || p.view !== state.view) syncHash(); } catch(_e) {}
  }
  document.body.classList.toggle('is-home', state.tab==='home' && state.view==='home');
  // hashchange listener for back/forward & direct links
  window.addEventListener('hashchange', async () => {
    if (_ignoreHash) return;
    const p = parseHash();
    if (!p) return;
    if (p.tab === state.tab && p.view === state.view) return;
    state.tab = p.tab; state.view = p.view;
    state.searchTerm = '';
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    document.querySelectorAll('.tab').forEach(t => {
      const isActive = t.dataset.tab === state.tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.tabIndex = isActive ? 0 : -1;
    });
    scrollActiveTabIntoView();
    renderSubNav();
    await render(); saveState(); closeSidebar();
    try { document.title = titleForView(state.tab, state.view); } catch(_e) {}
  });
  // close popover on outside click
  document.addEventListener('click', (e) => {
    const pop = document.getElementById('topicPopover');
    if (!pop || !pop.dataset.open) return;
    if (e.target.closest('.topic-pill') || e.target.closest('#topicPopover')) return;
    pop.innerHTML=''; pop.dataset.open=''; document.querySelectorAll('.topic-pill').forEach(p=>p.classList.remove('active'));
  });
  // dynamic sticky heights for correct stacking (fixes 25% peek & half search)
  function updateStickyHeights(){
    const tb = document.querySelector('.topbar');
    if(tb){
      const h = Math.ceil(tb.getBoundingClientRect().height);
      if(h>0) document.documentElement.style.setProperty('--topbar-h', h + 'px');
    }
    const sw = document.getElementById('searchWrapper');
    const sh = (sw && sw.offsetParent !== null && getComputedStyle(sw).display !== 'none') ? Math.ceil(sw.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--search-h', sh + 'px');
  }
  window.updateTopbarHeight = updateStickyHeights;
  window.updateStickyHeights = updateStickyHeights;
  updateStickyHeights();
  window.addEventListener('resize', updateStickyHeights);
  if(window.ResizeObserver){
    const tb = document.querySelector('.topbar');
    if(tb) new ResizeObserver(updateStickyHeights).observe(tb);
    const sw = document.getElementById('searchWrapper');
    if(sw) new ResizeObserver(updateStickyHeights).observe(sw);
  }
  // Auto-switch command view between grid and list based on viewport
  function updateCmdView(){
    const isMobile = window.innerWidth <= 860;
    const grid = document.querySelector('.cmd-grid');
    if(!grid) return;
    if(isMobile){
      // force list view on mobile for responsive wrapping
      state.cmdView = 'list';
      grid.classList.add('is-list');
    } else {
      // restore saved preference on desktop
      if(state.cmdView !== 'list'){
        grid.classList.remove('is-list');
      }
    }
    // update button states
    const btns = document.querySelectorAll('.cmd-view-btn');
    btns.forEach(b=> b.classList.toggle('is-active', state.cmdView===b.dataset.view));
    updateStickyHeights();
  }
  updateCmdView();
  window.addEventListener('resize', updateCmdView);
  const _oldSetView = setView;
  setView = function(tab, view){
    const res = _oldSetView.apply(this, arguments);
    setTimeout(updateStickyHeights, 60);
    setTimeout(updateStickyHeights, 300);
    return res;
  };
  // mobile: hide sticky bars (search + miniheader) on scroll down, show on scroll up
  let lastScrollY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (window.innerWidth > 860) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const cur = window.scrollY;
      const hdr = document.querySelector('.note-miniheader');
      const sw = document.getElementById('searchWrapper');
      const goingDown = cur > lastScrollY && cur > 120;
      const goingUp = cur < lastScrollY;
      if (hdr) {
        if (goingDown) hdr.classList.add('miniheader-hidden');
        else if (goingUp) hdr.classList.remove('miniheader-hidden');
        if (cur <= 10) hdr.classList.remove('miniheader-hidden');
      }
      if (sw && sw.offsetParent !== null) {
        if (goingDown) sw.classList.add('search-hidden');
        else if (goingUp) sw.classList.remove('search-hidden');
        if (cur <= 10) sw.classList.remove('search-hidden');
      }
      lastScrollY = cur;
      ticking = false;
    });
  }, {passive:true});

  // resize: auto-close sidebar on desktop + recalc sticky heights
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeSidebar();
    updateStickyHeights();
  });
  // init cool cursor + spotlight + sidebar extras
  try{ initCoolCursor(); }catch(_e){}
  // sidebar collapse (desktop)
  const collapseBtn = document.getElementById('sidebarCollapse');
  const layoutEl = document.querySelector('.layout');
  if(collapseBtn && layoutEl){
    const savedCollapsed = (()=>{ try{ return localStorage.getItem('linuxcs_sidebar_collapsed')==='1'; }catch(_e){ return false; }})();
    if(savedCollapsed && window.innerWidth>860) layoutEl.classList.add('sidebar-collapsed');
    collapseBtn.addEventListener('click', ()=>{
      layoutEl.classList.toggle('sidebar-collapsed');
      const isC = layoutEl.classList.contains('sidebar-collapsed');
      try{ localStorage.setItem('linuxcs_sidebar_collapsed', isC?'1':'0'); }catch(_e){}
      updateStickyHeights();
      collapseBtn.setAttribute('aria-label', isC?'Expand sidebar':'Collapse sidebar');
    });
  }
  // logo keyboard activation
  const logoEl = document.querySelector('.logo');
  if(logoEl){
    logoEl.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); switchTab('linux101'); }
    });
  }
  // spotlight backdrop click already via data-action; also close on overlay
  const spot = document.getElementById('spotlight');
  if(spot){
    spot.addEventListener('click', (e)=>{
      if(e.target===spot || e.target.classList.contains('spotlight-backdrop')) closeSpotlight();
    });
  }
  // expose for debugging
  window.openSpotlight = openSpotlight;
  window.closeSpotlight = closeSpotlight;
})();
