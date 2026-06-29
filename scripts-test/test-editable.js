(() => {
  const f = document.querySelector('iframe');
  if (!f || !f.contentDocument) return 'no iframe';
  const doc = f.contentDocument;
  const eet = doc.getElementById('eet');
  const end = doc.getElementById('endurance');
  const rte = doc.getElementById('route');
  if (!eet || !end || !rte) return 'missing field';
  const before = {
    eet: eet.value, eetClass: eet.className,
    end: end.value, endClass: end.className,
    rte: rte.value, rteClass: rte.className
  };
  // Simulate user typing (trusted input event)
  eet.focus();
  eet.value = '0230';
  // Dispatch a trusted-style input event
  const ev = new InputEvent('input', {bubbles: true, inputType: 'insertFromPaste', data: '0230'});
  eet.dispatchEvent(ev);
  end.focus();
  end.value = '0300';
  const ev2 = new InputEvent('input', {bubbles: true, inputType: 'insertFromPaste', data: '0300'});
  end.dispatchEvent(ev2);
  rte.focus();
  rte.value = 'DCT LIM DCT';
  const ev3 = new InputEvent('input', {bubbles: true, inputType: 'insertFromPaste', data: 'DCT LIM DCT'});
  rte.dispatchEvent(ev3);
  return {
    before,
    after: {
      eet: eet.value, eetClass: eet.className,
      end: end.value, endClass: end.className,
      rte: rte.value, rteClass: rte.className
    }
  };
})();
