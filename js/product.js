document.addEventListener('DOMContentLoaded', function() {
  console.debug('product.js loaded');
  const mainImg = document.getElementById('img_main');
  const thumbImgs = document.querySelectorAll('.product-thumbs img');
  let current = 0;
  const images = Array.from(thumbImgs).map(img => img.src);

  function show(index) {
    if (!images.length) return;
    current = (index + images.length) % images.length;
    mainImg.src = images[current];
    setActiveThumb(current);
  }

  function setActiveThumb(index) {
    thumbImgs.forEach((t, i) => {
      if (i === index) t.classList.add('ring-2', 'ring-blue-500');
      else t.classList.remove('ring-2', 'ring-blue-500');
    });
  }

  window.toExchangeImage = function(el) {
    const idx = images.indexOf(el.src);
    if (idx >= 0) show(idx);
    else {
      mainImg.src = el.src;
      setActiveThumb(-1);
    }
  }

  window.viewImage = function(src) {
    // Lightbox simple
    let lb = document.getElementById('lightbox-modal');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightbox-modal';
      lb.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
      lb.innerHTML = `<div class="max-w-[90%] max-h-[90%] p-4"><img src="${src}" class="w-full h-full object-contain rounded"/></div>`;
      lb.addEventListener('click', () => lb.remove());
      document.body.appendChild(lb);
    } else {
      lb.querySelector('img').src = src;
      lb.classList.remove('hidden');
    }
  }

  // Thumbs click handlers
  thumbImgs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
  });

  // Auto-play
  let auto = setInterval(() => show(current + 1), 5000);

  // Pause on hover
  mainImg.addEventListener('mouseover', () => clearInterval(auto));
  mainImg.addEventListener('mouseleave', () => auto = setInterval(() => show(current + 1), 5000));

  // Init
  if (images.length) show(0);

  // Animaciones y microinteracciones
  // Añadir la clase 'show' a elementos con 'fade-up' para animación de aparición
  const fadeEls = Array.from(document.querySelectorAll('.fade-up'));
  fadeEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('show'), 100 + i * 60);
  });
  // Fallback: si no se encontraron elementos o siguen invisibles después de 600ms, forzamos la clase
  setTimeout(() => {
    if (!fadeEls.length) {
      document.querySelectorAll('.fade-up').forEach(el => el.classList.add('show'));
      console.debug('product.js fallback: forced .show on .fade-up elements');
    }
  }, 600);

  // Efecto pulsar en botón de compra
  const buyBtn = document.querySelector('.buy-full-mobile');
  if (buyBtn) {
    buyBtn.addEventListener('mousedown', () => buyBtn.classList.add('button-pressed'));
    buyBtn.addEventListener('mouseup', () => buyBtn.classList.remove('button-pressed'));
    buyBtn.addEventListener('mouseleave', () => buyBtn.classList.remove('button-pressed'));
  }

  // Toggle mobile price list
  const togglePricesBtn = document.getElementById('toggle-prices');
  const mobilePrices = document.getElementById('mobile-prices');
  if (togglePricesBtn && mobilePrices) {
    togglePricesBtn.addEventListener('click', () => {
      mobilePrices.classList.toggle('hidden');
      const icon = togglePricesBtn.querySelector('i');
      if (icon) icon.classList.toggle('fa-rotate-180');
    });
  }

  // Carousel controls & autoplay
  const carousel = document.getElementById('carousel');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  if (carousel) {
    let autoScroll = null;
    const step = () => {
      carousel.scrollBy({ left: carousel.offsetWidth * 0.6, behavior: 'smooth' });
    };
    const startAuto = () => { clearInterval(autoScroll); autoScroll = setInterval(step, 4000); };
    const stopAuto = () => clearInterval(autoScroll);
    if (prevBtn) prevBtn.addEventListener('click', () => { carousel.scrollBy({ left: -carousel.offsetWidth * 0.6, behavior: 'smooth' }); stopAuto(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { carousel.scrollBy({ left: carousel.offsetWidth * 0.6, behavior: 'smooth' }); stopAuto(); startAuto(); });
    carousel.addEventListener('mouseover', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    startAuto();
  }

  // Función para crear carrusel infinito suave (pixel scroll) a partir de un contenedor
  function makeInfiniteCarousel(selector, pxPerSecond = 30) {
    const c = document.querySelector(selector);
    if (!c) return;
    // Duplicar contenido para loop
    if (!c.dataset.looped) {
      c.innerHTML = c.innerHTML + c.innerHTML;
      c.dataset.looped = '1';
      // accesibilidad: marcar lista y ocultar duplicados a lectores de pantalla
      c.setAttribute('role','list');
      c.setAttribute('aria-label','Marcas');
      const children = Array.from(c.children);
      const half = children.length / 2;
      children.forEach((ch, i) => {
        ch.setAttribute('role', 'listitem');
        if (i >= half) ch.setAttribute('aria-hidden', 'true');
      });
    }

    let rafId = null;
    let lastTime = null;
    let paused = false;

    function step(ts) {
      if (paused) { lastTime = ts; rafId = requestAnimationFrame(step); return; }
      if (!lastTime) lastTime = ts;
      const delta = ts - lastTime;
      lastTime = ts;
      const px = (pxPerSecond * delta) / 1000;
      c.scrollLeft += px;
      // Reset when we've scrolled half (original width)
      const half = c.scrollWidth / 2;
      if (c.scrollLeft >= half) c.scrollLeft = c.scrollLeft - half;
      rafId = requestAnimationFrame(step);
    }

    c.addEventListener('mouseover', () => { paused = true; });
    c.addEventListener('mouseleave', () => { paused = false; });

    // small debounce to start
    setTimeout(() => { rafId = requestAnimationFrame(step); }, 200);

    // expose stop/start if needed
    return {
      stop() { canceled = true; if (rafId) cancelAnimationFrame(rafId); },
    };
  }

  // Inicializar carruseles infinitos (ajustado velocidad)
  makeInfiniteCarousel('#carousel', 50);
  makeInfiniteCarousel('#amp-carousel', 30);

  // Contact modal (FAB)
  const contactFab = document.getElementById('open-contact-modal');
  const contactModal = document.getElementById('contact-modal');
  const contactModalClose = document.getElementById('close-contact-modal');
  if (contactFab && contactModal) {
    contactFab.addEventListener('click', () => {
      contactModal.classList.remove('hidden');
      contactModal.classList.add('flex');
    });
    contactModalClose && contactModalClose.addEventListener('click', () => {
      contactModal.classList.add('hidden');
      contactModal.classList.remove('flex');
    });
    // close on overlay click
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        contactModal.classList.add('hidden');
        contactModal.classList.remove('flex');
      }
    });
    // esc to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        contactModal.classList.add('hidden');
        contactModal.classList.remove('flex');
      }
    });

    // Toast helper
    const toastEl = document.getElementById('toast');
    function showToast(msg = 'Listo', ms = 1300) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      setTimeout(() => { toastEl.classList.remove('show'); }, ms);
    }

    // Show toast when opening WhatsApp
    const waContact = document.getElementById('wa-contact');
    if (waContact) {
      waContact.addEventListener('click', () => {
        showToast('Abriendo WhatsApp...');
        // let link open normally after showing toast
      });
    }
  }

});