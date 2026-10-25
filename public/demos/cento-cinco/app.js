(() => {
  'use strict';
  // Site publicado fora do servidor: espera o cardápio do painel (site-config.js) antes de montar.
  (window.CC_READY || Promise.resolve()).then(start);
  function start() {
  const shop = window.SHOP;
  if (!shop) return;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const money = value => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(value / 100);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const products = new Map(shop.products.map(p => [p.id, p]));
  const options = new Map([...shop.extras, ...shop.sauces].map(p => [p.id, p]));
  const categories = new Map(shop.categories.map(c => [c.id, c]));
  const cartKey = 'cento-cinco-menu-cart-v3';
  // O cardápio fica numa página própria; a página inicial leva até ela.
  const MENU_URL = 'cardapio.html';
  const menuList = $('#menu-list');
  let search = '', selectedProduct = null, selectedQuantity = 1, toastTimer, clearTimer, checkout = null;
  let cart = [];
  const validOptions = (ids, product) => product.custom && Array.isArray(ids) ? [...new Set(ids)].filter(id => options.has(id)).sort() : [];
  try {
    const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
    if (Array.isArray(saved)) cart = saved.slice(0, 50).flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const p = products.get(item.productId);
      if (!p || !Number.isInteger(item.quantity) || item.quantity < 1) return [];
      return [{productId:p.id,quantity:Math.min(item.quantity,20),options:validOptions(item.options,p),flavor:p.flavor && typeof item.flavor === 'string' ? item.flavor.trim().slice(0,60) : '',note:typeof item.note === 'string' ? item.note.slice(0,200) : ''}];
    });
  } catch { cart = []; }
  function saveCart() { checkout?.cartChanged(); try { localStorage.setItem(cartKey,JSON.stringify(cart)); } catch { /* The cart remains usable when browser storage is unavailable. */ } }
  const unitPrice = line => products.get(line.productId).price + line.options.reduce((total,id) => total + options.get(id).price,0);
  const subtotal = () => cart.reduce((total,line) => total + unitPrice(line) * line.quantity,0);
  const itemCount = () => cart.reduce((total,line) => total + line.quantity,0);
  const quantityInCart = id => cart.reduce((total,line) => total + (line.productId === id ? line.quantity : 0),0);
  // Disponibilidade definida no painel (esgotado).
  const isAvailable = p => !!p && p.available !== false;
  const availableExtras = () => shop.extras.filter(o => o.available !== false);
  function lineIssue(line) {
    const p = products.get(line.productId);
    if (!isAvailable(p)) return `${p ? p.name : 'Um item'} está esgotado no momento.`;
    const extra = line.options.map(id => options.get(id)).find(o => o && o.available === false);
    return extra ? `O adicional ${extra.name} (${p.name}) está esgotado no momento.` : '';
  }

  function toast(text, withAction = false) {
    $('#toast-text').textContent = text;
    $('#toast-action').hidden = !withAction;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'),3500);
  }
  function openDialog(id) { const dialog = document.getElementById(id); $$('dialog[open]').forEach(d=>d.close()); if (!dialog.open) dialog.showModal(); }
  $$('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
  $$('dialog').forEach(dialog => dialog.addEventListener('click',event => { if(event.target === dialog) { const b=dialog.getBoundingClientRect(); if(event.clientX<b.left || event.clientX>b.right || event.clientY<b.top || event.clientY>b.bottom) dialog.close(); } }));
  // Rolagem: usa a rolagem suave da página quando houver (ex.: Lenis na versão experiência).
  const scrollToY = y => (window.siteScrollTo ? window.siteScrollTo(y) : window.scrollTo({top: y, behavior: 'smooth'}));
  // "Explorar cardápio": rola até o cardápio quando ele está na página; senão abre a página do cardápio.
  $$('[data-go-menu]').forEach(button => button.addEventListener('click', () => {
    if (menuList) scrollToY($('#cardapio').getBoundingClientRect().top + window.scrollY - 20);
    else window.location.href = MENU_URL;
  }));

  // Header: transparente no topo, sólido ao rolar; link ativo conforme a seção visível.
  const header = $('.header'), categoryBar = $('#categories');
  const syncHeader = () => {
    header?.classList.toggle('scrolled', window.scrollY > 30);
    if (!categoryBar) return;
    const stickyTop = parseFloat(getComputedStyle(categoryBar).top) || 0;
    categoryBar.classList.toggle('stuck', categoryBar.getBoundingClientRect().top <= stickyTop + 1);
  };
  window.addEventListener('scroll', syncHeader, {passive:true}); syncHeader();
  const navLinks = $$('.header-nav a[href^="#"]');
  const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
  }), {rootMargin:'-45% 0px -50% 0px'});
  navLinks.forEach(link => { const target = $(link.getAttribute('href')); if (target) sectionObserver.observe(target); });

  // Menu do celular.
  const nav = $('#mobile-nav'), toggle = $('.menu-toggle');
  if (nav && toggle) {
    const setMenu = open => { nav.hidden = !open; document.body.classList.toggle('nav-open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); header?.classList.toggle('scrolled', open || window.scrollY > 30); };
    toggle.addEventListener('click', () => setMenu(nav.hidden));
    $$('a', nav).forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !nav.hidden) { setMenu(false); toggle.focus(); } });
    window.matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  }
  if ($('#year')) $('#year').textContent = new Date().getFullYear();
  // Horário configurado no painel (no site estático fica o texto da página).
  const renderHoursText = () => { if (shop.hoursText) $$('[data-hours-text]').forEach(el => { el.textContent = shop.hoursText; }); };
  renderHoursText();

  // Aberto agora / fechado, no fuso de Canela.
  function renderOpenStatus() {
    if (shop.status) {
      const live = shop.status;
      $$('[data-open-status]').forEach(el => { el.classList.toggle('is-open', !!live.open); el.innerHTML = `<span class="status-dot" aria-hidden="true"></span>${escape(live.label)}`; });
      return;
    }
    const parts = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', hour:'numeric', hourCycle:'h23'}).formatToParts(new Date());
    const hour = Number(parts.find(p => p.type === 'hour').value);
    const {open, close} = shop.hours;
    const isOpen = hour >= open && hour < close;
    const text = isOpen ? `Aberto agora · até ${close}h` : hour < open ? `Fechado · abre hoje às ${open}h` : `Fechado · abre amanhã às ${open}h`;
    $$('[data-open-status]').forEach(el => { el.classList.toggle('is-open', isOpen); el.innerHTML = `<span class="status-dot" aria-hidden="true"></span>${text}`; });
  }
  // Com o servidor, o status (aberto, pausado, fechado) vem do painel e é atualizado a cada minuto.
  async function refreshStatus() {
    try {
      const res = await fetch(`${shop.apiBase || ''}/api/store/status`, {cache:'no-store'});
      if (res.ok) { shop.status = await res.json(); renderOpenStatus(); checkout?.update(); }
    } catch { /* mantém o último status */ }
  }
  renderOpenStatus(); setInterval(() => (shop.api ? refreshStatus() : renderOpenStatus()), 60000);

  // Foto do item (só fotos reais da casa); sem foto, um selo com o ícone da categoria.
  // Fotos enviadas pelo painel ficam no servidor: no site estático, buscam lá (apiBase).
  const imageUrl = src => (src && src.startsWith('/uploads/') && shop.apiBase ? shop.apiBase + src : src);
  const photo = (p, size = '') => p.image
    ? `<img src="${imageUrl(p.image)}" alt="${escape(p.name)}" loading="lazy" decoding="async" width="640" height="640">`
    : `<span class="photo-fallback${size}" aria-hidden="true">${icon(categories.get(p.category).icon)}<b>105</b></span>`;
  const inCartTag = id => { const q = quantityInCart(id); return q ? `<span class="in-cart-tag">${icon('i-check')}${q} no carrinho</span>` : ''; };

  // Página do cardápio: todas as seções numa rolagem só, com atalhos por categoria e busca.
  const soldOutTag = '<span class="sold-out-tag">Esgotado</span>';
  function foodCard(p) {
    const ok = isAvailable(p);
    return `<article class="food-card${quantityInCart(p.id) ? ' in-cart' : ''}${ok ? '' : ' sold-out'}">
      <div class="food-photo">${photo(p)}${p.badge && ok ? `<span class="food-badge">${escape(p.badge)}</span>` : ''}${ok ? inCartTag(p.id) : soldOutTag}</div>
      <div class="food-body"><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p>
      <div class="food-foot"><strong class="food-price">${money(p.price)}</strong>${ok
        ? `<button type="button" class="food-add" data-product="${p.id}" aria-label="${p.custom ? 'Escolher' : 'Adicionar'} ${escape(p.name)} — ${money(p.price)}">${icon('i-plus')}<span>${p.custom ? 'Escolher' : 'Adicionar'}</span></button>`
        : `<button type="button" class="food-add" disabled aria-label="${escape(p.name)} esgotado"><span>Esgotado</span></button>`}</div></div>
    </article>`;
  }
  function dishRow(p) {
    const ok = isAvailable(p);
    return `<article class="dish-row${quantityInCart(p.id) ? ' in-cart' : ''}${ok ? '' : ' sold-out'}">
      <div class="dish-thumb">${photo(p, ' small')}</div>
      <div class="dish-info"><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p>${ok ? inCartTag(p.id) : soldOutTag}</div>
      <strong class="dish-price">${money(p.price)}</strong>
      ${ok ? `<button type="button" class="dish-add" data-product="${p.id}" aria-label="Adicionar ${escape(p.name)} — ${money(p.price)}">${icon('i-plus')}</button>` : `<button type="button" class="dish-add" disabled aria-label="${escape(p.name)} esgotado">${icon('i-close')}</button>`}
    </article>`;
  }
  const matches = p => !search || normalize(p.name + ' ' + p.description + ' ' + categories.get(p.category).name).includes(normalize(search));
  function renderCategories() {
    if (!categoryBar) return;
    categoryBar.innerHTML = shop.categories.map(c => `<a class="category" href="#cat-${c.id}" data-category="${c.id}"><span class="cat-icon">${icon(c.icon)}</span><span>${escape(c.name)}</span><small>${shop.products.filter(p => p.category === c.id).length}</small></a>`).join('');
  }
  function renderMenuItems() {
    if (!menuList) return;
    let total = 0;
    menuList.innerHTML = shop.categories.map(c => {
      const items = shop.products.filter(p => p.category === c.id && matches(p));
      total += items.length;
      if (!items.length) return '';
      const burgers = c.id === 'burgers';
      const extras = burgers && !search ? `<p class="menu-cat-extras"><b>Adicionais:</b> ${availableExtras().map(o => `${escape(o.name)} <span>+${money(o.price).replace(/\s/g,' ')}</span>`).join(' · ')}</p>` : '';
      return `<section class="menu-cat" id="cat-${c.id}" aria-labelledby="h-${c.id}">
        <header class="menu-cat-head"><span class="menu-cat-icon">${icon(c.icon)}</span><div><h2 id="h-${c.id}">${escape(c.name)}</h2><p>${escape(c.blurb)}</p></div><span class="menu-cat-count">${items.length} ${items.length === 1 ? 'opção' : 'opções'}</span></header>
        ${extras}<div class="${burgers ? 'food-grid' : 'dish-grid'}">${items.map(burgers ? foodCard : dishRow).join('')}</div>
      </section>`;
    }).join('');
    $('#result-count').textContent = search ? `${total} ${total === 1 ? 'opção encontrada' : 'opções encontradas'} para “${search}”` : '';
    $('#result-count').hidden = !search;
    $('#empty-search').hidden = total > 0;
    observeSections();
  }
  // Destaca no atalho a categoria que está na tela.
  let spy;
  function observeSections() {
    if (!categoryBar) return;
    spy?.disconnect();
    spy = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id.replace('cat-', '');
      $$('[data-category]', categoryBar).forEach(a => a.toggleAttribute('aria-current', a.dataset.category === id));
      const active = $(`[data-category="${id}"]`, categoryBar);
      if (active && categoryBar.scrollWidth > categoryBar.clientWidth) categoryBar.scrollTo({left: active.offsetLeft - categoryBar.clientWidth / 2 + active.offsetWidth / 2, behavior: 'smooth'});
    }), {rootMargin:'-40% 0px -55% 0px'});
    $$('.menu-cat', menuList).forEach(section => spy.observe(section));
  }
  const menuOffset = () => (categoryBar ? categoryBar.offsetHeight : 0) + 80;
  function goToCategory(id, smooth = true) {
    const section = document.getElementById('cat-' + id); if (!section) return;
    const y = section.getBoundingClientRect().top + window.scrollY - menuOffset();
    if (smooth) scrollToY(y); else window.scrollTo({top: y, behavior: 'instant'});
  }
  if (menuList) {
    categoryBar?.addEventListener('click', event => {
      const link = event.target.closest('[data-category]'); if (!link) return;
      event.preventDefault();
      if (search) { search = ''; $('#menu-search').value = ''; renderMenuItems(); }
      goToCategory(link.dataset.category);
      history.replaceState(null, '', '#' + link.dataset.category);
    });
    $('#menu-search').addEventListener('input', event => { search = event.target.value.trim(); renderMenuItems(); });
    $('#clear-search').addEventListener('click', () => { search = ''; $('#menu-search').value = ''; renderMenuItems(); $('#menu-search').focus(); });
    menuList.addEventListener('click', event => { const button = event.target.closest('[data-product]'); if (button) openProduct(button.dataset.product); });
  }
  const refreshMenu = () => { if (menuList) renderMenuItems(); renderFavorites(); };

  // Página inicial: os favoritos da casa levam direto ao item no cardápio.
  function renderFavorites() {
    const box = $('#home-favorites'); if (!box) return;
    box.innerHTML = box.dataset.ids.split(',').map(id => products.get(id)).filter(Boolean).map(p => `<a class="fav-card" href="${MENU_URL}?pedir=${p.id}">
      <span class="fav-photo">${photo(p)}${p.badge ? `<span class="food-badge">${escape(p.badge)}</span>` : ''}</span>
      <span class="fav-body"><b>${escape(p.name)}</b><small>${escape(p.description)}</small><span class="fav-foot"><strong>${money(p.price)}</strong><span class="fav-cta">Pedir este ${icon('i-arrow')}</span></span></span>
    </a>`).join('');
  }

  function openProduct(id) {
    selectedProduct = products.get(id); if (!selectedProduct) return;
    if (!isAvailable(selectedProduct)) { toast(`${selectedProduct.name} está esgotado no momento.`); return; }
    selectedQuantity = 1;
    $('#product-form').reset();
    $('#product-title').textContent = selectedProduct.name;
    $('#product-category').textContent = categories.get(selectedProduct.category).name;
    $('#product-description').textContent = selectedProduct.description;
    $('#product-price').textContent = money(selectedProduct.price);
    const media = $('#product-media');
    if (media) { media.hidden = !selectedProduct.image; media.innerHTML = selectedProduct.image ? `<img src="${imageUrl(selectedProduct.image)}" alt="${escape(selectedProduct.name)}" width="640" height="640">` : ''; }
    $('#product-dialog').classList.toggle('has-media', !!selectedProduct.image);
    $('#customization').innerHTML = selectedProduct.custom ? `<fieldset><legend>Deixe do seu jeito<small>Adicionais opcionais · valor por burger</small></legend><div class="option-grid">${availableExtras().map(o => `<label class="option-label"><input type="checkbox" name="extra" value="${o.id}"><span>${escape(o.name)}</span><span>+ ${money(o.price)}</span></label>`).join('')}</div></fieldset>` : '';
    $('#item-note').placeholder = selectedProduct.custom ? 'Ex.: sem cebola (confirmaremos a possibilidade)' : ['bebidas','cervejas','drinks'].includes(selectedProduct.category) ? 'Ex.: com pouco gelo, bem gelada…' : 'Alguma preferência para este item?';
    $('#flavor-field').hidden = !selectedProduct.flavor;
    $('#item-flavor').disabled = !selectedProduct.flavor;
    $('#item-flavor').required = !!selectedProduct.flavor;
    updateProductPrice(); openDialog('product-dialog');
  }
  // Permite que outras páginas (ex.: /experiencia/) abram um produto pelos próprios botões.
  window.CC = Object.assign(window.CC || {}, { openProduct, products });
  const selectedOptions = () => $$('input[name=extra]:checked', $('#product-form')).map(e => e.value).sort();
  function updateProductPrice() {
    $('#product-quantity').textContent = selectedQuantity;
    $('#product-minus').disabled = selectedQuantity <= 1; $('#product-plus').disabled = selectedQuantity >= 20;
    $('#product-total').textContent = money((selectedProduct.price + selectedOptions().reduce((sum,id) => sum + options.get(id).price,0)) * selectedQuantity);
  }
  $('#product-minus').addEventListener('click', () => { selectedQuantity = Math.max(1, selectedQuantity - 1); updateProductPrice(); });
  $('#product-plus').addEventListener('click', () => { selectedQuantity = Math.min(20, selectedQuantity + 1); updateProductPrice(); });
  $('#customization').addEventListener('change', updateProductPrice);

  function addLine(line) {
    const existing = cart.find(item => item.productId === line.productId && item.flavor === line.flavor && item.note === line.note && JSON.stringify(item.options) === JSON.stringify(line.options));
    if (existing && existing.quantity + line.quantity > 20) { toast('Limite de 20 unidades por combinação.'); return false; }
    if (!existing && cart.length >= 50) { toast('Seu carrinho atingiu o limite de 50 combinações.'); return false; }
    if (existing) existing.quantity += line.quantity; else cart.push(line);
    saveCart(); renderCart(); refreshMenu();
    const bag = $('.floating-bag'); bag.classList.remove('bump'); void bag.offsetWidth; bag.classList.add('bump');
    return true;
  }
  $('#product-form').addEventListener('submit', event => {
    event.preventDefault();
    const line = {productId:selectedProduct.id,quantity:selectedQuantity,options:selectedOptions(),flavor:selectedProduct.flavor ? $('#item-flavor').value.trim() : '',note:$('#item-note').value.trim().slice(0,200)};
    if (selectedProduct.flavor && !line.flavor) { $('#item-flavor').focus(); toast('Informe o sabor desejado.'); return; }
    if (!addLine(line)) return;
    $('#product-dialog').close(); toast(`${selectedProduct.name} adicionado ao carrinho.`, true);
  });

  // Carrinho.
  function renderSuggestions() {
    const picks = shop.suggestions.filter(id => isAvailable(products.get(id)) && !quantityInCart(id)).slice(0, 3);
    const box = $('#cart-suggestions');
    box.hidden = !cart.length || !picks.length;
    box.innerHTML = `<h3>Combina com seu pedido</h3><div class="suggestion-row">${picks.map(id => { const p = products.get(id); return `<button type="button" class="suggestion" data-suggest="${p.id}" aria-label="Adicionar ${escape(p.name)} — ${money(p.price)}"><span><b>${escape(p.name)}</b><small>${money(p.price)}</small></span>${icon('i-plus')}</button>`; }).join('')}</div>`;
  }
  // Resumo lateral do pedido (cardápio no computador).
  function renderSummary() {
    const box = $('#order-summary'); if (!box) return;
    const count = itemCount();
    $('#summary-items').innerHTML = count ? cart.map(line => { const p = products.get(line.productId); return `<li><span><b>${line.quantity}x</b> ${escape(p.name)}${line.options.length ? `<small>+ ${line.options.map(id => escape(options.get(id).name)).join(', ')}</small>` : ''}</span><strong>${money(unitPrice(line) * line.quantity)}</strong></li>`; }).join('') : '';
    box.classList.toggle('is-empty', !count);
  }
  function renderCart() {
    const count = itemCount(), sum = subtotal();
    $$('.cart-count').forEach(el => el.textContent = count);
    $$('.cart-subtotal').forEach(el => el.textContent = money(sum));
    $('#drawer-count').textContent = count ? count + (count === 1 ? ' item' : ' itens') : '';
    $('.floating-bag').classList.toggle('is-empty', !count);
    document.body.classList.toggle('has-cart', !!count);
    $('.floating-label').textContent = 'Ver meu carrinho';
    $('#empty-cart').hidden = !!count; $('#cart-footer').hidden = !count; $('#checkout-form').hidden = !count;
    $('#cart-items').innerHTML = cart.map((line,index) => {
      const p = products.get(line.productId);
      const issue = lineIssue(line);
      return `<article class="cart-item${issue ? ' has-issue' : ''}">${issue ? `<p class="cart-issue">${icon('i-close')}${escape(issue)}</p>` : ''}<div class="cart-item-header"><div><h3>${escape(p.name)}</h3><p>${money(unitPrice(line))} por unidade</p></div><strong>${money(unitPrice(line) * line.quantity)}</strong></div>${line.flavor ? `<div class="chips"><span>Sabor: ${escape(line.flavor)}</span></div>` : ''}${line.options.length ? `<div class="chips">${line.options.map(id => `<span>+ ${escape(options.get(id).name)}</span>`).join('')}</div>` : ''}${p.custom ? `<details class="cart-recipe"><summary>Ingredientes da receita</summary><p>${escape(p.description)}</p></details>` : ''}${line.note ? `<p class="item-note">Obs.: ${escape(line.note)}</p>` : ''}<div class="cart-item-bottom"><div class="quantity"><button type="button" data-cart-action="minus" data-index="${index}" aria-label="Diminuir ${escape(p.name)}">${icon('i-minus')}</button><output aria-label="Quantidade de ${escape(p.name)}">${line.quantity}</output><button type="button" data-cart-action="plus" data-index="${index}" aria-label="Aumentar ${escape(p.name)}" ${line.quantity >= 20 ? 'disabled' : ''}>${icon('i-plus')}</button></div><button class="remove-item" type="button" data-cart-action="remove" data-index="${index}" aria-label="Remover ${escape(p.name)}">${icon('i-trash')}</button></div></article>`;
    }).join('');
    renderSuggestions();
    renderSummary();
    checkout?.update();
  }
  $$('[data-open-cart]').forEach(button => button.addEventListener('click', () => { renderCart(); openDialog('cart-dialog'); $('#toast').classList.remove('show'); }));
  $('#cart-items').addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]'); if (!button) return;
    const index = Number(button.dataset.index), line = cart[index], action = button.dataset.cartAction; if (!line) return;
    if (action === 'remove' || (action === 'minus' && line.quantity === 1)) cart.splice(index,1);
    else if (action === 'minus') line.quantity--;
    else if (action === 'plus') line.quantity = Math.min(20, line.quantity + 1);
    saveCart(); renderCart(); refreshMenu();
    const replacement = $(`[data-cart-action="${action}"][data-index="${Math.min(index, cart.length - 1)}"]`); if (replacement) replacement.focus();
    if (!cart.length) $('#empty-cart button').focus();
  });
  $('#cart-suggestions').addEventListener('click', event => {
    const button = event.target.closest('[data-suggest]'); if (!button) return;
    const p = products.get(button.dataset.suggest);
    if (p.custom || p.flavor) { openProduct(p.id); return; }
    if (addLine({productId:p.id,quantity:1,options:[],flavor:'',note:''})) toast(`${p.name} adicionado ao carrinho.`);
  });
  const clearButton = $('#clear-cart');
  function resetClear() { clearButton.classList.remove('confirm'); $('span', clearButton).textContent = 'Esvaziar carrinho'; }
  clearButton.addEventListener('click', () => {
    if (!clearButton.classList.contains('confirm')) {
      clearButton.classList.add('confirm'); $('span', clearButton).textContent = 'Toque de novo para esvaziar';
      clearTimeout(clearTimer); clearTimer = setTimeout(resetClear, 4000); return;
    }
    clearTimeout(clearTimer); resetClear();
    cart = []; saveCart(); renderCart(); refreshMenu(); $('#empty-cart button').focus(); toast('Carrinho esvaziado.');
  });

  // Atualiza cardápio e carrinho com a versão mais recente do servidor (preço mudou, item esgotou).
  function reloadCatalog(next) {
    Object.keys(shop).forEach(key => { if (!(key in next)) delete shop[key]; });
    Object.assign(shop, next);
    products.clear(); shop.products.forEach(p => products.set(p.id, p));
    options.clear(); [...shop.extras, ...shop.sauces].forEach(o => options.set(o.id, o));
    categories.clear(); shop.categories.forEach(c => categories.set(c.id, c));
    cart = cart.filter(line => products.has(line.productId)).map(line => ({...line, options: line.options.filter(id => options.has(id))}));
    saveCart(); renderCategories(); renderMenuItems(); renderFavorites(); renderCart(); renderOpenStatus(); renderHoursText();
  }

  // Finalização do pedido (checkout.js): servidor + painel, ou WhatsApp no site estático.
  checkout = window.CCCheckout ? window.CCCheckout.init({
    $, $$, money, escape, icon, products, options, categories, toast, lineIssue, reloadCatalog,
    getCart: () => cart, unitPrice, subtotal, itemCount,
    clearCart: () => { cart = []; saveCart(); renderCart(); refreshMenu(); }
  }) : null;

  // Mapa: estilizado e fixo; "Explorar o mapa" libera o arraste.
  const map = $('#visit-map'), explore = $('#map-explore');
  if (map && explore) explore.addEventListener('click', () => {
    const live = map.classList.toggle('is-live');
    explore.textContent = live ? 'Concluir' : 'Explorar o mapa';
    $('iframe', map).tabIndex = live ? 0 : -1;
  });

  // Vídeos: só tocam visíveis, sem áudio, respeitando movimento reduzido e economia de dados.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const allowMotion = () => !reduce.matches && !navigator.connection?.saveData;
  function autoplay(video, src) {
    let inView = false;
    const sync = () => { if (allowMotion() && inView && !document.hidden) { if (!video.src) video.src = src; video.play().catch(() => {}); } else video.pause(); };
    video.muted = true;
    video.addEventListener('playing', () => video.classList.add('ready'));
    video.addEventListener('error', () => video.classList.remove('ready'));
    reduce.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, {threshold:0}).observe(video);
  }
  if (shop.video) $$('video[data-autoplay]').forEach(video => autoplay(video, shop.video));
  // Topo da página inicial: o reel da casa toca no computador e no celular.
  if ($('#hero-video')) autoplay($('#hero-video'), shop.heroVideo || shop.video);

  renderCategories(); renderMenuItems(); renderFavorites(); renderCart();

  // Chegando de outra página: ?pedir=item abre o item; #categoria leva até a seção.
  if (menuList) {
    const params = new URLSearchParams(location.search), wanted = params.get('pedir'), hash = location.hash.slice(1);
    if (wanted && products.has(wanted)) {
      goToCategory(products.get(wanted).category, false);
      openProduct(wanted);
      history.replaceState(null, '', location.pathname + '#' + products.get(wanted).category);
    } else if (categories.has(hash)) {
      // Depois que a página termina de carregar (fontes e fotos mudam a altura das seções).
      goToCategory(hash, false);
      if (document.readyState !== 'complete') window.addEventListener('load', () => goToCategory(hash, false), {once: true});
    }
  }
  }
})();
