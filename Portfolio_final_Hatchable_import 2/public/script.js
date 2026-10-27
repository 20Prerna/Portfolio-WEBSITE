(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? '✕' : '☰';
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '☰';
  }));

  const reviewTrack = document.getElementById('review-track');
  const reviewSlides = [...document.querySelectorAll('.review-panel')];
  const reviewDots = [...document.querySelectorAll('.review-dots button')];
  const reviewCount = document.getElementById('review-count');
  let activeReview = 0;
  function showReview(index) {
    activeReview = (index + reviewSlides.length) % reviewSlides.length;
    reviewTrack.style.transform = `translateX(-${activeReview * 100}%)`;
    reviewSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeReview;
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.inert = !isActive;
    });
    reviewDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeReview;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-pressed', String(isActive));
    });
    reviewCount.textContent = `${String(activeReview + 1).padStart(2, '0')} / ${String(reviewSlides.length).padStart(2, '0')}`;
  }
  document.getElementById('prev-review')?.addEventListener('click', () => showReview(activeReview - 1));
  document.getElementById('next-review')?.addEventListener('click', () => showReview(activeReview + 1));
  reviewDots.forEach((dot, index) => dot.addEventListener('click', () => showReview(index)));

  const introVideo = document.getElementById('intro-video');
  const soundButton = document.getElementById('intro-sound-button');
  function syncSoundButton() {
    if (!introVideo || !soundButton) return;
    const soundEnabled = !introVideo.muted;
    soundButton.textContent = soundEnabled ? 'Mute sound' : 'Enable sound';
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', soundEnabled ? 'Mute video sound' : 'Enable video sound');
  }
  if (introVideo && soundButton) {
    introVideo.muted = false;
    introVideo.volume = 1;
    soundButton.hidden = false;
    introVideo.addEventListener('volumechange', syncSoundButton);
    syncSoundButton();
  }
  soundButton?.addEventListener('click', async () => {
    if (!introVideo) return;
    if (introVideo.muted) {
      introVideo.muted = false;
      introVideo.volume = 1;
      if (introVideo.paused) {
        try {
          await introVideo.play();
        } catch {
          syncSoundButton();
          return;
        }
      }
    } else {
      introVideo.muted = true;
    }
    syncSoundButton();
  });

  // Store genuine website enquiries in the project database for the authorised admin portal.
  document.getElementById('contact-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const status = document.getElementById('form-status');
    const submit = form.querySelector('button[type="submit"]');
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      goal: String(data.get('goal') || '').trim(),
      message: String(data.get('message') || '').trim(),
      website: String(data.get('website') || '').trim()
    };
    submit.disabled = true;
    status.textContent = 'Sending your enquiry securely…';
    try {
      const response = await fetch('/api/enquiries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'We could not send your enquiry. Please try again.');
      form.reset();
      status.textContent = result.message || 'Thank you — your enquiry has been received.';
    } catch (error) {
      status.textContent = error.message || 'Connection issue. Please try again or contact us through WhatsApp.';
    } finally {
      submit.disabled = false;
    }
  });

  document.getElementById('year').textContent = String(new Date().getFullYear());

  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    items.forEach(item => observer.observe(item));
  } else {
    items.forEach(item => item.classList.add('visible'));
  }
})();
