import { gsap } from 'gsap';

/** Mural de projetos: três colunas inclinadas, cada uma rolando numa velocidade, puxadas pelo scroll.
 *  Os cartões em vídeo só tocam enquanto estão na tela. */
export function initMural({ reduceMotion = false } = {}) {
  const stage = document.getElementById('mural');
  if (!stage) return;
  if (!reduceMotion) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }),
      { threshold: 0.2 }
    );
    stage.querySelectorAll('video').forEach((v) => io.observe(v));
  }
  // no celular o mural vira um carrossel que desliza com o dedo, sem paralaxe
  if (reduceMotion || window.matchMedia('(max-width: 900px)').matches) return;
  stage.querySelectorAll('.mural__col').forEach((col) => {
    const speed = parseFloat(col.dataset.speed || '1');
    gsap.fromTo(
      col,
      { y: 140 * speed },
      { y: -240 * speed, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } }
    );
  });
}
