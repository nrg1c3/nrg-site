// NRG — قايمة الموبايل + ظهور ناعم + فورم التواصل. الموقع بيشتغل من غيره (ما عدا إرسال الفورم).
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var ar = doc.lang === 'ar';

  // قايمة الموبايل
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    var close = function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // ظهور ناعم (CSS بيلغيه مع prefers-reduced-motion)
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // فورم التواصل → api.nrg-egypt.com (docs/BRIEF.md §4)
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var submit = form.querySelector('button[type="submit"]');
  var T = ar ? {
    sending: 'جارٍ الإرسال…',
    ok: 'تم استلام رسالتك، شكرًا لك. سنتواصل معك.',
    name: 'من فضلك اكتب اسمك (حرفان على الأقل).',
    phone: 'من فضلك اكتب رقم موبايل صحيح.',
    type: 'من فضلك اختر نوع الطلب.',
    consent: 'من فضلك وافق على استخدام اسمك ورقمك للرد عليك.',
    too_many: 'أرسلت طلبات كثيرة. حاول بعد قليل أو راسلنا على واتساب.',
    fail: 'لم تصل رسالتك. حاول مرة أخرى أو راسلنا على واتساب.'
  } : {
    sending: 'Sending…',
    ok: 'Thanks — we received your message and will get back to you.',
    name: 'Please enter your name (at least 2 letters).',
    phone: 'Please enter a valid mobile number.',
    type: 'Please choose a request type.',
    consent: 'Please agree to us using your name and number to reply.',
    too_many: 'Too many requests. Please try again shortly or message us on WhatsApp.',
    fail: 'Your message did not arrive. Try again or message us on WhatsApp.'
  };
  var say = function (msg, cls, wa) {
    status.textContent = msg;
    status.className = 'form-status ' + (cls || '');
    if (wa) { // الخطأ = جملة واحدة + خطوة تعملها دلوقتي
      var a = document.createElement('a');
      a.href = 'https://wa.me/201508917780'; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = ar ? 'افتح واتساب' : 'Open WhatsApp';
      status.appendChild(document.createTextNode(' ')); status.appendChild(a);
    }
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    if (f.name.value.trim().length < 2) { say(T.name, 'err'); f.name.focus(); return; }
    if (!f.phone.checkValidity()) { say(T.phone, 'err'); f.phone.focus(); return; }
    if (!f.type.value) { say(T.type, 'err'); f.type.focus(); return; }
    if (!f.consent.checked) { say(T.consent, 'err'); f.consent.focus(); return; }

    var data = {
      site: 'nrg',
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      type: f.type.value,
      message: f.message.value.trim(),
      page: location.pathname,
      lang: ar ? 'ar' : 'en',
      website: f.website.value
    };
    submit.disabled = true;
    say(T.sending);
    // timeout عشان النت الضعيف: بعد 15 ثانية نلغي ونقول للمستخدم
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
    fetch(form.getAttribute('data-endpoint'), {
      method: 'POST',
      signal: ctrl ? ctrl.signal : undefined,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.ok) { form.reset(); say(T.ok, 'ok'); }
      else {
        var k = res && res.error;
        say(T[k] || T.fail, 'err', !T[k] || k === 'too_many');
      }
    }).catch(function () { say(T.fail, 'err', true); })
      .then(function () { clearTimeout(timer); submit.disabled = false; });
  });
})();
