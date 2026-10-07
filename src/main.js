import './styles.css';

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function showTool() {
  const selected = location.hash === '#track-splits' ? 'track-splits' : 'weekly-mileage';
  for (const tab of tabs) {
    const active = tab.dataset.tool === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  for (const panel of panels) panel.hidden = panel.id !== selected;
  document.title = `${selected === 'track-splits' ? 'Track Split Calculator' : 'Weekly Mileage Planner'} — Running Utilities`;
}

function selectTab(tab) {
  const hash = `#${tab.dataset.tool}`;
  if (location.hash !== hash) history.pushState(null, '', hash);
  showTool();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs.at(-1);
    if (!next) return;
    event.preventDefault();
    selectTab(next);
    next.focus();
  });
});

// The original footers predate the portfolio domain and assume a top-level page. Retarget
// their links from here so the archived files stay byte-for-byte unchanged.
function retargetFooterLinks(frame) {
  for (const link of frame.contentDocument?.querySelectorAll('footer a') ?? []) {
    if (link.hostname === 'github.com') {
      link.target = '_blank';
      link.rel = 'noopener';
    } else {
      link.href = 'https://pierceseigne.com/';
      link.target = '_top';
    }
  }
}

for (const frame of document.querySelectorAll('iframe')) {
  frame.addEventListener('load', () => retargetFooterLinks(frame));
  if (frame.contentDocument?.readyState === 'complete') retargetFooterLinks(frame);
}

window.addEventListener('popstate', showTool);
window.addEventListener('hashchange', showTool);
showTool();
