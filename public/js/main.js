/* ═══════════════════════════════════════════════════════════════
   ShopZone — main.js
   Navbar · Scroll Reveal · Flash Messages · Scroll To Top
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Navbar scroll shadow ──────────────────────────────── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 2. Mobile navbar drawer ──────────────────────────────── */
  const toggle = document.querySelector('.navbar-toggle');
  const drawer = document.querySelector('.navbar-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── 3. Scroll reveal ─────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  }

  /* ── 4. Scroll to top ─────────────────────────────────────── */
  const scrollBtn = document.querySelector('.scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── 5. Flash auto-dismiss ────────────────────────────────── */
  document.querySelectorAll('.flash-message').forEach((msg, i) => {
    const dismiss = () => {
      msg.style.transition = 'all .3s ease';
      msg.style.opacity = '0';
      msg.style.transform = 'translateX(110%)';
      setTimeout(() => msg.remove(), 320);
    };
    const closeBtn = msg.querySelector('.flash-close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 4500 + i * 600);
  });

  /* ── 6. Cart badge ────────────────────────────────────────── */
  updateCartBadge();

  /* ── 7. Hero particles ────────────────────────────────────── */
  const pc = document.querySelector('.hero-particles');
  if (pc) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*14+7}s;animation-delay:${Math.random()*8}s;`;
      pc.appendChild(p);
    }
  }
});

function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem('shopzone_cart') || '[]');
    const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  } catch(e) {}
}

function showToast(msg, icon='✓') {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className='toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 1300);
}

window.updateCartBadge = updateCartBadge;
window.showToast = showToast;
