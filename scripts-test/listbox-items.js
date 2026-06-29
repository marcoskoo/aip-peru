(() => {
  const sel = document.querySelector('[role=listbox]');
  if (!sel) return 'no listbox';
  // Check selectContent viewport
  const selectContent = sel.closest('[role=listbox]');
  // Print children layout
  const items = sel.querySelectorAll('[role=option]');
  // Sample items: positions
  const samples = [];
  for (const idx of [0, 1, 50, 100, 200, 300, 359]) {
    const it = items[idx];
    if (!it) continue;
    const r = it.getBoundingClientRect();
    samples.push({idx, text: it.textContent.trim().slice(0, 30), top: Math.round(r.top), visible: r.top > 0 && r.bottom < window.innerHeight});
  }
  return {containerCount: sel.children.length, samples};
})();
