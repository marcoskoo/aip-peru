(() => {
  const sel = document.querySelector('[role=listbox]');
  if (!sel) return 'no listbox';
  const items = sel.querySelectorAll('[role=option]');
  const target = Array.from(items).find(o => /^SPJC/.test(o.textContent));
  if (!target) return 'no SPJC option, total items: ' + items.length;
  target.scrollIntoView({block: 'center'});
  target.dispatchEvent(new PointerEvent('pointerup', {bubbles: true}));
  target.dispatchEvent(new MouseEvent('click', {bubbles: true}));
  return 'clicked SPJC; trigger text after: ' + (document.querySelectorAll('[role=combobox]')[0]?.textContent || '').trim();
})();
