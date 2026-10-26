import { gsap } from 'gsap';

/** Mural de projetos: três colunas inclinadas, cada uma rolando numa velocidade, puxadas pelo scroll. */
export function initMural({ reduceMotion = false } = {}) {
  const stage = document.getElementById('mural');
  // no celular o mural vira um carrossel que desliza com o dedo, sem paralaxe
  if (!stage || reduceMotion || window.matchMedia('(max-width: 900px)').matches) return;
  stage.querySelectorAll('.mural__col').forEach((col) => {
    const speed = parseFloat(col.dataset.speed || '1');
    gsap.fromTo(
      col,
      { y: 140 * speed },
      { y: -240 * speed, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } }
    );
  });
}
