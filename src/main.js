import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { siteConfig } from './config.js';
import { initContact } from './modules/contact.js';
import { runIntro } from './modules/intro.js';
import { initNav } from './modules/nav.js';
import { initHeroOrbit } from './modules/hero-orbit.js';
import { initReveals } from './modules/reveals.js';
import { initServices } from './modules/services.js';
import { initMural } from './modules/mural.js';
import { initFunnel } from './modules/funnel.js';
import { initCrmLive } from './modules/crm-live.js';
import { initMethod } from './modules/method.js';
import { initFaq } from './modules/faq.js';
import { initFinal } from './modules/final.js';
import { initFloating } from './modules/floating.js';
import { initDiag } from './modules/diag.js';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 900px)').matches;
const lowPower = mobile || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const opts = { reduceMotion, lowPower };

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash || location.hash === '#diagnostico') window.scrollTo(0, 0);

initContact(siteConfig);
initNav();
initDiag(siteConfig, opts);
initFloating(opts);

// foto que ainda não está no site: fica o monograma
document.querySelectorAll('.team__photo img').forEach((img) => {
  const hide = () => {
    img.style.display = 'none';
  };
  if (img.complete && !img.naturalWidth) hide();
  img.addEventListener('error', hide);
});

initHeroOrbit(opts);
runIntro(opts);

document.fonts.ready.then(() => {
  initReveals(opts);
  initServices(opts);
  initMural(opts);
  initFunnel(opts);
  initCrmLive(opts);
  initMethod(opts);
  initFaq(opts);
  initFinal(opts);
  ScrollTrigger.refresh();
});
window.addEventListener('load', () => ScrollTrigger.refresh());
