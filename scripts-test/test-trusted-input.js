(() => {
  const f = document.querySelector('iframe');
  const doc = f.contentDocument;
  const eet = doc.getElementById('eet');
  eet.focus();
  eet.select();
  try {
    doc.execCommand('insertText', false, '99');
  } catch (e) {
    return 'execCommand error: ' + e.message;
  }
  return {value: eet.value, className: eet.className};
})();
