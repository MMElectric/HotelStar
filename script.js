/* ===== Booking – poruka u formi ===== */
const form = document.querySelector('.booking-form');
if (form) {
  const messageBox = document.createElement('div');
  messageBox.className = 'booking-message';
  form.appendChild(messageBox);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const checkin  = form.querySelector('#checkin').value;
    const checkout = form.querySelector('#checkout').value;
    const nights = (new Date(checkout) - new Date(checkin)) / 86400000;

    if (!nights || nights < 1) {
      messageBox.textContent = '⚠️ Odaberi ispravne datume.';
      messageBox.style.color = 'red';
      return;
    }
    messageBox.textContent = `✅ Dostupno • ${nights} noćenje/a`;
    messageBox.style.color = 'green';
  });
}

/* ===== Mobile drawer nav ===== */
(function(){
  const toggle  = document.querySelector('.nav-toggle');
  const menu    = document.getElementById('nav-menu');
  let overlay   = document.querySelector('.nav-overlay');

  // kreiraj overlay ako ne postoji
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }
  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.add('open');
    overlay.classList.add('active');
    toggle.setAttribute('aria-expanded','true');
    document.body.classList.add('no-scroll');
    overlay.removeAttribute('hidden');
  };
  const close = () => {
    menu.classList.remove('open');
    overlay.classList.remove('active');
    toggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('no-scroll');
    overlay.setAttribute('hidden','');
  };

  toggle.addEventListener('click', () =>
    menu.classList.contains('open') ? close() : open()
  );
  overlay.addEventListener('click', close);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  window.addEventListener('resize', () => { if (window.innerWidth > 860) close(); });
})();


///
/* ===== Booking wizard (modal) ===== */
(() => {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  const body = document.body;
  const steps = Array.from(modal.querySelectorAll('.book-step'));
  const stepDots = Array.from(modal.querySelectorAll('.book-steps li'));

  const btnPrev = () => modal.querySelector('[data-prev]');
  const btnNext = () => modal.querySelector('[data-next]');
  const btnPay  = modal.querySelector('#pay-btn');

  // Summary elements
  const sumDates  = modal.querySelector('[data-sum-dates]');
  const sumGuests = modal.querySelector('[data-sum-guests]');
  const sumNights = modal.querySelector('[data-sum-nights]');
  const sumNights2= modal.querySelector('[data-sum-nights2]');
  const sumRoom   = modal.querySelector('[data-sum-room]');
  const sumPrice  = modal.querySelector('[data-sum-price]');
  const sumTotal  = modal.querySelector('[data-sum-total]');
  const sumTotal3 = modal.querySelector('[data-sum-total3]');

  // Step 1 fields
  const inEl  = modal.querySelector('#bk-checkin');
  const outEl = modal.querySelector('#bk-checkout');
  const adEl  = modal.querySelector('#bk-adults');
  const chEl  = modal.querySelector('#bk-children');
  const msg1  = modal.querySelector('[data-msg-1]');

  // Step 2 rooms
  const roomGrid = modal.querySelector('#room-grid');
  const roomNext = modal.querySelector('#room-next');

  // Step 4 message
  const msg4  = modal.querySelector('[data-msg-4]');

  // Demo rooms
  const ROOMS = [
    { id:'sea-suite',  name:'Seaview Suite',    beds:'1 King • 38 m² • Balcony', img:'room1.jpg', price:120 },
    { id:'coastal',    name:'Coastal Haven',    beds:'1 Queen • 24 m²',          img:'room2.jpg', price:80  },
    { id:'jacuzzi',    name:'Jacuzzi Hideaway', beds:'1 King • 42 m² • Jacuzzi', img:'jazuzzi.jpg', price:190 },
    { id:'family',     name:'Family Room',      beds:'2 Twin + Sofa • 40 m²',    img:'familyroom.jpg', price:130 }
  ];

  let current = 1;
  let pickedRoom = null;
  let nights = 0;

  // Open / close modal
  function openModal() {
    modal.classList.add('is-open');
    lockScroll();
  }
  function closeModal() {
    modal.classList.remove('is-open');
    unlockScroll();
    resetWizard();
  }

  // Close triggers
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Hook na postojeću booking formu: umjesto alert -> otvori wizard
  const outsideForm = document.querySelector('.booking-form');
  if (outsideForm){
    outsideForm.addEventListener('submit', e => {
      e.preventDefault();
      // pokušaj preuzeti datume izvana (ako postoje 2x input[type="date"])
      const dates = outsideForm.querySelectorAll('input[type="date"]');
      if (dates.length === 2) {
        inEl.value  = dates[0].value;
        outEl.value = dates[1].value;
      }
      openModal();
      go(1);
    });
  }

  // Stepper
  function go(n){
    current = n;
    steps.forEach(s => s.classList.remove('is-active'));
    stepDots.forEach(d => d.classList.remove('is-active'));
    steps[n-1]?.classList.add('is-active');
    stepDots[n-1]?.classList.add('is-active');
  }

  // Next / Prev handlers (delegacija)
  modal.addEventListener('click', e => {
    if (e.target.matches('[data-next]')) onNext();
    if (e.target.matches('[data-prev]')) onPrev();
  });

  function onPrev(){
    if (current > 1) go(current - 1);
  }

  function formatDates(ci, co){
    if (!ci || !co) return '--/-- – --/--';
    const toStr = d => new Date(d).toLocaleDateString(undefined, { day:'2-digit', month:'short' });
    return `${toStr(ci)} – ${toStr(co)}`;
  }

  function calcNights(ci, co){
    const diff = (new Date(co) - new Date(ci)) / 86400000;
    return isFinite(diff) && diff > 0 ? diff : 0;
  }

  function updateSummary(){
    nights = calcNights(inEl.value, outEl.value);
    sumDates.textContent  = formatDates(inEl.value, outEl.value);
    sumGuests.textContent = `${adEl.value} Adults, ${chEl.value} Children`;
    sumNights.textContent = nights;
    sumNights2.textContent= nights;
    if (pickedRoom){
      sumRoom.textContent  = pickedRoom.name;
      sumPrice.textContent = pickedRoom.price.toFixed(0);
      const total = nights * pickedRoom.price;
      sumTotal.textContent = total.toFixed(0);
      sumTotal3.textContent= total.toFixed(0);
    }
  }

  function renderRooms(){
    roomGrid.innerHTML = '';
    ROOMS.forEach(r => {
      const card = document.createElement('article');
      card.className = 'room-card';
      card.innerHTML = `
        <img src="${r.img}" alt="${r.name}">
        <div class="room-body">
          <h5 class="room-title">${r.name}</h5>
          <div class="room-meta">${r.beds}</div>
          <div class="room-select">
            <div class="room-price">€${r.price}/night</div>
            <button type="button" data-pick="${r.id}">Select</button>
          </div>
        </div>`;
      roomGrid.appendChild(card);
    });
  }

  roomGrid.addEventListener('click', e => {
    const btn = e.target.closest('button[data-pick]');
    if (!btn) return;
    const id = btn.getAttribute('data-pick');
    pickedRoom = ROOMS.find(x => x.id === id) || null;
    roomGrid.querySelectorAll('button[data-pick]').forEach(b => b.classList.remove('picked'));
    btn.classList.add('picked');
    roomNext.disabled = !pickedRoom;
    updateSummary();
  });

  function onNext(){
    if (current === 1){
      msg1.textContent = '';
      nights = calcNights(inEl.value, outEl.value);
      if (!nights){
        msg1.textContent = '⚠️ Please choose valid dates.';
        msg1.style.color = 'red';
        return;
      }
      updateSummary();
      renderRooms();
      roomNext.disabled = !pickedRoom;
      go(2);
      return;
    }
    if (current === 2){
      if (!pickedRoom){ return; }
      updateSummary();
      go(3);
      return;
    }
    if (current === 3){
      // osnovna provjera
      const name = modal.querySelector('#guest-name').value.trim();
      const email= modal.querySelector('#guest-email').value.trim();
      const phone= modal.querySelector('#guest-phone').value.trim();
      if (!name || !email || !phone) return alert('Please fill guest details.');
      updateSummary();
      go(4);
      return;
    }
  }

  // Demo “plaćanje”
  btnPay?.addEventListener('click', e => {
    e.preventDefault();
    msg4.textContent = '';

    const card = modal.querySelector('#card-number').value.replace(/\s+/g,'');
    const exp  = modal.querySelector('#card-exp').value;
    const cvc  = modal.querySelector('#card-cvc').value;
    const cn   = modal.querySelector('#card-name').value.trim();

    if (card.length < 12 || !/^\d+$/.test(card)) { msg4.textContent = 'Invalid card number (demo).'; msg4.style.color='red'; return; }
    if (!/^\d{2}\/\d{2}$/.test(exp))            { msg4.textContent = 'Invalid expiry (MM/YY).';      msg4.style.color='red'; return; }
    if (cvc.length < 3)                         { msg4.textContent = 'Invalid CVC.';                 msg4.style.color='red'; return; }
    if (!cn)                                    { msg4.textContent = 'Name on card is required.';    msg4.style.color='red'; return; }

    // demo "naplata"
    msg4.textContent = 'Processing…';
    msg4.style.color = '#1b2230';
    setTimeout(() => {
      msg4.textContent = '✅ Payment successful (demo).';
      msg4.style.color = 'green';
      // Redirect na thanks.html (možeš promijeniti)
      setTimeout(() => { window.location.href = 'thanks.html'; }, 800);
    }, 900);
  });

  // Scroll lock (stabilno i na iOS)
  let scrollY = 0;
  function lockScroll(){
    scrollY = window.scrollY || document.documentElement.scrollTop;
    body.classList.add('no-scroll');
    body.style.top = `-${scrollY}px`;
    body.style.position = 'fixed';
    body.style.width = '100%';
  }
  function unlockScroll(){
    body.classList.remove('no-scroll');
    body.style.top = '';
    body.style.position = '';
    body.style.width = '';
    window.scrollTo(0, scrollY);
  }

  // Otvaranje modala i izvan forme (npr. klik na “Book a Room” u nav-u)
  document.querySelectorAll('a[href="#book"], a.btn[href="#book"]').forEach(a => {
    a.addEventListener('click', (e) => {
      // ako želiš iz nav-a direktno wizard (bez vanjske forme), otvori i idi na step 1
      if (window.innerWidth <= 860) { /* optional */ }
    });
  });

})();

