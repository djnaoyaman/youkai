(() => {
 const buttons = document.querySelectorAll('[data-size]');
 if (!buttons.length) return;
 const apply = size => {
   document.body.classList.toggle('tono-large', size === 'large');
   buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
 };
 try { apply(localStorage.getItem('shin-tono-size') || 'normal'); } catch {}
 buttons.forEach(b => b.addEventListener('click', () => {
   apply(b.dataset.size);
   try { localStorage.setItem('shin-tono-size', b.dataset.size); } catch {}
 }));
})();
