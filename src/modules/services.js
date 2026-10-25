import { gsap } from 'gsap';

/** Serviços: os quatro cartões entram um atrás do outro; as ilustrações só animam na tela. */
export function initServices({ reduceMotion = false } = {}) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  if (!reduceMotion) {
    gsap.from(grid.querySelectorAll('.svc'), {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: grid, start: 'top 82%', once: true },
    });
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)),
    { threshold: 0.05 }
  );
  grid.querySelectorAll('.svc__art').forEach((art) => io.observe(art));
}
