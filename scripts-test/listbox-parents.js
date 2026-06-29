(() => {
  const sel = document.querySelector('[role=listbox]');
  if (!sel) return 'no listbox';
  let p = sel;
  const chain = [];
  while (p && p.tagName !== 'BODY') {
    chain.push({
      tag: p.tagName,
      id: p.id,
      cls: (typeof p.className === 'string' ? p.className : '').slice(0, 60),
      zIndex: getComputedStyle(p).zIndex
    });
    p = p.parentElement;
  }
  return chain.slice(0, 7);
})();
