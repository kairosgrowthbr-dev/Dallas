// Carrinho e finalização do pedido.
// Com o servidor (window.SHOP.api), o pedido é gravado no painel da casa e o cliente acompanha o
// status em /pedido/<código>. Sem servidor (hospedagem só estática), o pedido segue pelo WhatsApp.
(() => {
  'use strict';
  // Site publicado fora do servidor: espera o cardápio do painel (site-config.js) antes de montar.
  (window.CC_READY || Promise.resolve()).then(start);
  function start() {
  const shop = window.SHOP;
  if (!shop) return;
  const api = !!shop.api;
  // Endereço do servidor: vazio no próprio servidor; o domínio do painel no site estático.
  const apiUrl = path => `${shop.apiBase || ''}${path}`;
  const PICKUP_ADDRESS = 'Av. Osvaldo Aranha, 181 · Canela, RS';

  // Configuração do checkout: vem do painel; sem servidor, usa o padrão do site estático.
  const cfg = () => shop.checkout || {
    pickupEnabled: true, deliveryEnabled: true, pickupAddress: PICKUP_ADDRESS, pickupEta: null, deliveryEta: null,
    delivery: { mode: 'flat', flatFee: shop.deliveryFee, feeNeedsConfirmation: !!shop.deliveryFeeIsExample, allowOther: true, otherFee: shop.deliveryFee, minOrder: 0, freeAbove: 0, cities: [], cepLookup: false, requireCep: false, requireReference: false },
    zones: [],
    payments: [
      { id: 'pix', kind: 'pix', label: 'Pix', icon: 'i-pix', fulfillment: 'both' },
      { id: 'cartao', kind: 'card', label: 'Cartão', icon: 'i-card', fulfillment: 'both', credit: true, debit: true, legacyLabel: 'Cartão (crédito ou débito)' },
      { id: 'dinheiro', kind: 'cash', label: 'Dinheiro', icon: 'i-cash', fulfillment: 'both', askChange: false }
    ],
    whatsappFallback: true
  };

  const CUSTOMER_KEY = 'cento-cinco-customer-v1';
  const ORDERS_KEY = 'cento-cinco-orders-v1';
  const store = {
    get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* armazenamento indisponível */ } }
  };

  // ---------- Marcação do carrinho (a mesma nas páginas início e cardápio) ----------
  const dialog = document.getElementById('cart-dialog');
  if (!dialog) return;
  dialog.innerHTML = `
<div class="drawer-header"><div><p class="eyebrow">Seu pedido, do seu jeito</p><h2 id="cart-title">Meu carrinho <span class="drawer-count" id="drawer-count"></span></h2></div><button class="close-dialog" type="button" data-close="cart-dialog" aria-label="Fechar carrinho"><svg aria-hidden="true"><use href="#i-close"/></svg></button></div>
<div class="drawer-body">
<div id="cart-items"></div>
<div id="cart-suggestions" class="cart-suggestions" hidden></div>
<div id="empty-cart"><span class="empty-icon"><svg aria-hidden="true"><use href="#i-bag"/></svg></span><h3>Tem espaço para coisa boa.</h3><p>Escolha seu burger e comece por aqui.</p><button class="button gold" type="button" data-close="cart-dialog" data-go-menu>Explorar cardápio</button></div>
<form id="checkout-form" class="cart-details" novalidate hidden autocomplete="on">
<div class="hp-field" aria-hidden="true"><label>Não preencha este campo<input name="website" tabindex="-1" autocomplete="off"></label></div>
<h3><span class="step-number">1</span>Seus dados</h3>
<div class="field-grid customer-grid">
<label class="field">Nome para o pedido<input name="customer" autocomplete="name" required maxlength="80" placeholder="Como podemos chamar você?"></label>
<label class="field" id="phone-field">WhatsApp<input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="16" placeholder="(54) 99999-9999"></label>
</div>
<h3><span class="step-number">2</span><span id="fulfillment-title">Retirada ou delivery?</span></h3>
<fieldset class="choice-set" id="delivery-set"><legend class="sr-only">Retirada ou delivery</legend><div class="choice-grid delivery-options" id="delivery-options"></div><p class="field-error" id="delivery-error" hidden>Escolha se vai retirar no local ou receber por delivery.</p></fieldset>
<p id="pickup-address" class="pickup-address" hidden><svg aria-hidden="true"><use href="#i-pin"/></svg><span></span></p>
<div id="address-fields" hidden>
<div class="cep-row" id="cep-row" hidden><label class="field">CEP<input name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000"></label><p class="cep-status" id="cep-status" aria-live="polite"></p></div>
<div class="address-street"><label class="field">Rua<input name="street" autocomplete="address-line1" maxlength="120" placeholder="Nome da rua"></label><label class="field">Número<input name="number" maxlength="20" placeholder="123 ou s/n"></label></div>
<div class="field-grid"><label class="field" id="zone-field" hidden>Bairro<select name="zone"></select></label><label class="field" id="neighborhood-field">Bairro<input name="neighborhood" autocomplete="address-level3" maxlength="80" placeholder="Seu bairro"></label><label class="field" id="city-field">Cidade<input name="city" autocomplete="address-level2" maxlength="80"></label></div>
<label class="field">Complemento (opcional)<input name="complement" autocomplete="address-line2" maxlength="100" placeholder="Apartamento, bloco, casa dos fundos…"></label>
<label class="field" id="reference-field">Ponto de referência (opcional)<input name="reference" maxlength="120" placeholder="Ex.: em frente à padaria"></label>
<p class="fine-print" id="fee-explanation"></p>
<p class="delivery-hint" id="delivery-hint" hidden></p>
</div>
<h3><span class="step-number">3</span>Como você vai pagar?</h3>
<fieldset class="choice-set" id="payment-set"><legend class="sr-only">Forma de pagamento</legend><div class="choice-grid payment-options" id="payment-options"></div><p class="field-error" id="payment-error" hidden>Escolha a forma de pagamento.</p></fieldset>
<fieldset class="choice-set sub-choice" id="card-type-set" hidden><legend>Crédito ou débito?</legend><div class="segmented"><label><input type="radio" name="cardType" value="credito"><span>Crédito</span></label><label><input type="radio" name="cardType" value="debito"><span>Débito</span></label></div><p class="field-error" id="card-type-error" hidden>Escolha crédito ou débito.</p></fieldset>
<div class="sub-choice" id="change-box" hidden><label class="check-line"><input type="checkbox" name="needChange"> Preciso de troco</label><label class="field" id="change-field" hidden>Troco para quanto?<input name="changeFor" inputmode="decimal" maxlength="12" placeholder="R$ 100,00"></label></div>
<p class="payment-info" id="payment-info" hidden></p>
<p class="payment-note" id="payment-note"></p>
<label class="field">Observações gerais (opcional)<textarea name="order-note" maxlength="300" rows="2" placeholder="Ex.: interfone 12, deixar na portaria…"></textarea></label>
<div class="remember-row" id="remember-row" hidden><label class="check-line"><input type="checkbox" name="remember" checked> Lembrar meus dados neste aparelho</label><button type="button" class="text-button" id="forget-me">Esquecer meus dados</button></div>
<details class="order-message" id="order-message"><summary>Ver a mensagem que a casa vai receber</summary><div class="wa-chat"><div id="message-preview" class="wa-bubble"></div></div></details>
<p class="fine-print" id="privacy-note"></p>
<button id="clear-cart" class="text-button danger" type="button"><svg aria-hidden="true"><use href="#i-trash"/></svg><span>Esvaziar carrinho</span></button>
</form></div>
<div class="drawer-footer" id="cart-footer" hidden>
<div id="checkout-totals">
<div class="total-row secondary"><span id="items-label">Itens</span><span class="cart-subtotal"></span></div>
<div class="total-row secondary"><span id="delivery-cost-label">Entrega</span><span id="delivery-cost">—</span></div>
<div class="total-row grand-total" aria-live="polite"><span id="order-total-label">Total do pedido</span><strong id="order-total"></strong></div>
<p class="fine-print" id="order-confirmation">Disponibilidade e prazo confirmados pela equipe.</p>
<p class="store-closed" id="store-closed" hidden role="status"></p>
<p class="field-error checkout-error" id="checkout-error" role="alert" hidden></p>
<button type="submit" form="checkout-form" id="start-checkout" class="button full"></button>
<p class="whatsapp-hint" id="checkout-hint"></p>
<a id="fallback-whatsapp" class="button whatsapp-button full fallback-whatsapp" target="_blank" rel="noopener" hidden><svg aria-hidden="true"><use href="#i-wa"/></svg>Enviar pelo WhatsApp</a>
</div>
<div id="sent-panel" class="sent-panel" hidden role="status">
<span class="sent-icon"><svg aria-hidden="true"><use href="#i-check"/></svg></span>
<h3>Pedido pronto no WhatsApp!</h3>
<p>Confira a mensagem e toque em <b>enviar</b> na conversa. A equipe confirma o pedido e finaliza o pagamento com você por lá.</p>
<a id="whatsapp-checkout" class="button whatsapp-button full" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Abrir o WhatsApp de novo</a>
<div class="sent-actions"><button type="button" class="text-button" id="edit-order">Voltar e editar</button><button type="button" class="text-button" id="new-order">Já enviei · novo pedido</button></div>
</div>
</div>`;

  // Textos da página que mudam quando os pedidos vão para o painel.
  if (api) document.querySelectorAll('[data-api-html]').forEach(el => { el.innerHTML = el.dataset.apiHtml; });

  let ctx = null;
  window.CCCheckout = {
    init(context) { ctx = context; return setup(); }
  };

  function setup() {
    const { $, $$, money, escape, icon } = ctx;
    const form = $('#checkout-form');
    const submit = $('#start-checkout');
    let orderSent = false, sending = false, idemKey = null, cepTimer = null, cepAbort = null, autoFilled = {};

    // ---------- Montagem das opções configuradas no painel ----------
    function buildOptions() {
      const c = cfg();
      const opts = [];
      if (c.pickupEnabled) opts.push(`<label class="choice"><input type="radio" name="delivery" value="retirada"><span>${icon('i-store')}<b>Retirar no local</b><small>${c.pickupEta ? `Sem taxa · ${c.pickupEta[0]}–${c.pickupEta[1]} min` : 'Sem taxa'}</small></span></label>`);
      if (c.deliveryEnabled) opts.push(`<label class="choice"><input type="radio" name="delivery" value="entrega"><span>${icon('i-moto')}<b>Delivery</b><small id="delivery-option-price"></small></span></label>`);
      const previous = deliveryChoice();
      $('#delivery-options').innerHTML = opts.join('');
      $('#delivery-options').classList.toggle('single', opts.length === 1);
      $('#fulfillment-title').textContent = c.pickupEnabled && c.deliveryEnabled ? 'Retirada ou delivery?' : c.deliveryEnabled ? 'Entrega' : 'Retirada no local';
      const only = !c.pickupEnabled ? 'entrega' : !c.deliveryEnabled ? 'retirada' : '';
      const restore = only || previous;
      if (restore) { const input = $(`input[name=delivery][value="${restore}"]`); if (input) input.checked = true; }
      $('#pickup-address span').textContent = `Retirada na ${c.pickupAddress || PICKUP_ADDRESS}.`;

      const d = c.delivery;
      $('#cep-row').hidden = !d.cepLookup && !d.requireCep;
      $('#cep-row .field').firstChild.textContent = d.requireCep ? 'CEP' : 'CEP (opcional)';
      $('#reference-field').firstChild.textContent = d.requireReference ? 'Ponto de referência' : 'Ponto de referência (opcional)';
      const zones = d.mode === 'zones' && c.zones.length;
      $('#zone-field').hidden = !zones;
      const zoneSelect = form.zone, zoneValue = zoneSelect.value;
      zoneSelect.innerHTML = zones ? `<option value="">Escolha seu bairro</option>${c.zones.map(z => `<option value="${z.id}">${escape(z.name)} · ${z.fee ? money(z.fee) : 'grátis'}</option>`).join('')}${d.allowOther ? `<option value="outro">Outro bairro${d.otherFee ? ` · ${money(d.otherFee)} a confirmar` : ''}</option>` : ''}` : '';
      if (zones && [...zoneSelect.options].some(o => o.value === zoneValue)) zoneSelect.value = zoneValue;
      const cityField = $('#city-field input');
      if (d.cities?.length === 1) { cityField.value = d.cities[0]; cityField.readOnly = true; }
      else { cityField.readOnly = false; if (!cityField.value) cityField.value = d.cities?.[0] || 'Canela'; }
      cityField.closest('.field').classList.toggle('is-locked', cityField.readOnly);

      const previousPay = form.querySelector('input[name=payment]:checked')?.value;
      $('#payment-options').innerHTML = c.payments.map(m => `<label class="choice compact" data-fulfillment="${m.fulfillment}"><input type="radio" name="payment" value="${escape(m.id)}"><span>${icon(m.icon || 'i-card')}<b>${escape(m.label)}</b></span></label>`).join('');
      $('#payment-options').style.setProperty('--cols', String(Math.min(3, Math.max(1, c.payments.length))));
      if (previousPay) { const input = form.querySelector(`input[name=payment][value="${CSS.escape(previousPay)}"]`); if (input) input.checked = true; }
      $('#payment-note').innerHTML = api
        ? `${icon('i-check')}<span>Nada é cobrado no site. Você paga na entrega ou no balcão${c.payments.some(m => m.kind === 'pix') ? ' — no Pix, o QR Code aparece na tela do pedido' : ''}.</span>`
        : `${icon('i-wa')}<span>Nada é cobrado no site. O atendente finaliza o pagamento com você pelo WhatsApp, depois de confirmar o pedido.</span>`;
      syncDelivery(false); syncPayment(false);
    }

    // ---------- Estado do formulário ----------
    const deliveryChoice = () => form.querySelector('input[name=delivery]:checked')?.value || '';
    const isDelivery = () => deliveryChoice() === 'entrega';
    const method = () => cfg().payments.find(m => m.id === form.querySelector('input[name=payment]:checked')?.value) || null;
    const zone = () => { const v = form.zone.value; return v && v !== 'outro' ? cfg().zones.find(z => String(z.id) === v) : null; };
    const usesZones = () => cfg().delivery.mode === 'zones' && cfg().zones.length > 0;
    const digits = v => String(v || '').replace(/\D/g, '');
    const parseMoney = v => { const s = String(v || '').replace(/[^\d,.]/g, ''); if (!s) return null; const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s); return Number.isFinite(n) ? Math.round(n * 100) : null; };

    // Taxa calculada do mesmo jeito que o servidor (ele confere de novo ao receber).
    function feeInfo() {
      if (!isDelivery()) return { fee: 0, pending: false, known: true, min: 0 };
      const d = cfg().delivery, sub = ctx.subtotal();
      let fee = d.flatFee, pending = !!d.feeNeedsConfirmation, known = true, z = null;
      if (usesZones()) {
        z = zone();
        if (z) { fee = z.fee; pending = false; }
        else if (form.zone.value === 'outro') { fee = d.otherFee; pending = true; }
        else { fee = 0; known = false; pending = false; }
      }
      if (d.freeAbove > 0 && sub >= d.freeAbove) { fee = 0; pending = false; }
      return { fee, pending, known, zone: z, min: (z && z.minOrder != null) ? z.minOrder : (d.minOrder || 0) };
    }
    const total = () => ctx.subtotal() + feeInfo().fee;

    // ---------- Mensagem para o WhatsApp (modo sem servidor ou reserva) ----------
    const clean = text => String(text || '').replace(/[\u{10000}-\u{10FFFF}\u{FE0F}\u{200D}\u{2600}-\u{27BF}]/gu, '').replace(/[*_~`]/g, '').replace(/\s*\n+\s*/g, ' / ').replace(/\s{2,}/g, ' ').trim();
    const price = value => money(value).replace(/\s/g, ' ');
    function nowInCanela() {
      const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      const get = type => parts.find(p => p.type === type).value;
      return { day: get('day'), month: get('month'), year: get('year'), hour: get('hour'), minute: get('minute') };
    }
    const divider = '------------------------------';
    function orderMessage() {
      const data = new FormData(form), value = key => clean(data.get(key));
      const cart = ctx.getCart();
      const choice = deliveryChoice(), delivery = choice === 'entrega', units = ctx.itemCount(), t = nowInCanela();
      const fee = feeInfo();
      const lines = [
        'Olá, Cento&Cinco! Quero fazer um pedido pelo site.', '',
        `*PEDIDO #${t.day}${t.month}-${t.hour}${t.minute}*`,
        `*Data:* ${t.day}/${t.month}/${t.year} às ${t.hour}:${t.minute}`,
        `*Nome:* ${value('customer') || '[informe seu nome]'}`,
        `*Recebimento:* ${choice ? (delivery ? 'DELIVERY' : 'RETIRADA NO LOCAL') : '[escolha retirada ou delivery]'}`,
        '', divider, `*ITENS DO PEDIDO* (${units} ${units === 1 ? 'unidade' : 'unidades'})`, divider
      ];
      let number = 0;
      shop.categories.forEach(c => {
        const group = cart.filter(line => ctx.products.get(line.productId).category === c.id);
        if (!group.length) return;
        lines.push('', `*${c.name.toUpperCase()}*`);
        group.forEach(line => {
          const p = ctx.products.get(line.productId), unit = ctx.unitPrice(line), extras = unit - p.price;
          lines.push(`*${++number}) ${line.quantity}x ${p.name}* = ${price(unit * line.quantity)}`);
          if (line.flavor) lines.push(`   Sabor: ${clean(line.flavor)}`);
          line.options.forEach(id => { const o = ctx.options.get(id); lines.push(`   + ${o.name} (${price(o.price)})`); });
          if (p.custom && !line.options.length) lines.push('   Sem adicionais');
          if (line.note) lines.push(`   Obs.: ${clean(line.note)}`);
          if (extras) lines.push(`   _${price(unit)} cada (${price(p.price)} + ${price(extras)} de adicionais)_`);
          else if (line.quantity > 1) lines.push(`   _${price(unit)} cada_`);
        });
      });
      lines.push('', divider);
      if (delivery) {
        const z = zone();
        lines.push('*ENDEREÇO DE ENTREGA*', `${value('street') || '[rua]'}, ${value('number') || '[número]'}`, `Bairro: ${z ? z.name : value('neighborhood') || '[bairro]'}`, `Cidade: ${value('city') || '[cidade]'}`);
        if (value('cep')) lines.push(`CEP: ${value('cep')}`);
        if (value('complement')) lines.push(`Complemento: ${value('complement')}`);
        if (value('reference')) lines.push(`Referência: ${value('reference')}`);
      } else if (choice) lines.push('*RETIRADA NO LOCAL*', (cfg().pickupAddress || PICKUP_ADDRESS).replace(' · ', ' - '));
      else lines.push('[escolha retirada ou delivery]');
      lines.push(divider, '');
      const m = method();
      const detail = paymentDetail();
      lines.push(`*FORMA DE PAGAMENTO:* ${m ? (m.legacyLabel || m.label).toUpperCase() + (detail ? ` (${detail})` : '') : '[escolha a forma de pagamento]'}`, '_Pagamento a finalizar com o atendente aqui no WhatsApp._');
      if (value('order-note')) lines.push('', `*OBSERVAÇÕES:* ${value('order-note')}`);
      lines.push('', '*RESUMO*', `Itens: ${price(ctx.subtotal())}`);
      if (delivery) lines.push(`Entrega: ${price(fee.fee)}${fee.pending ? ' (a confirmar)' : ''}`);
      else if (choice) lines.push('Retirada: sem taxa');
      lines.push(`*${fee.pending ? 'TOTAL ESTIMADO' : 'TOTAL'}: ${price(total())}*`);
      lines.push('', `Podem confirmar o pedido, ${delivery ? 'o tempo de entrega' : 'o horário para retirada'} e me passar as informações para o pagamento? Obrigado!`);
      return lines.join('\n');
    }
    const formatPreview = text => escape(text).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>').replace(/(^|\s)_([^_\n]+)_/g, '$1<em>$2</em>');
    const whatsappLink = () => 'https://api.whatsapp.com/send?phone=' + shop.whatsapp + '&text=' + encodeURIComponent(orderMessage());

    function paymentDetail() {
      const m = method(); if (!m) return '';
      if (m.kind === 'card' && m.credit && m.debit) { const t = form.querySelector('input[name=cardType]:checked')?.value; return t === 'credito' ? 'Crédito' : t === 'debito' ? 'Débito' : ''; }
      if (m.kind === 'cash' && m.askChange && form.needChange.checked) { const v = parseMoney(form.changeFor.value); return v ? `Troco para ${price(v)}` : ''; }
      return '';
    }

    // Sem o servidor, o horário vem do cardápio estático (todos os dias, horas cheias).
    function staticClosed() {
      if (api || !shop.hours) return '';
      const hour = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
      const { open, close } = shop.hours;
      if (hour >= open && hour < close) return '';
      return `Fechado agora · abrimos ${hour < open ? 'hoje' : 'amanhã'} às ${open}h`;
    }

    // ---------- Resumo e botões ----------
    function update() {
      const c = cfg(), d = c.delivery, fee = feeInfo(), delivery = isDelivery(), choice = deliveryChoice();
      const option = $('#delivery-option-price');
      if (option) option.textContent = usesZones() ? 'Taxa conforme o bairro' : d.flatFee ? `+ ${money(d.flatFee)}${d.feeNeedsConfirmation ? ' · a confirmar' : ''}` : 'Sem taxa';
      $('#fee-explanation').textContent = usesZones()
        ? (fee.zone ? `Entrega em ${fee.zone.name}: ${fee.zone.fee ? money(fee.zone.fee) : 'grátis'} · ${fee.zone.etaMin}–${fee.zone.etaMax} min.` : form.zone.value === 'outro' ? `Bairro fora da lista: taxa de ${money(d.otherFee)} a confirmar pela equipe.` : 'Escolha o bairro para ver a taxa e o tempo de entrega.')
        : d.feeNeedsConfirmation ? `Motoboy: ${money(d.flatFee)} como valor de referência. A hamburgueria confirma a taxa real para seu endereço.` : `Taxa de entrega: ${money(d.flatFee)}${c.deliveryEta ? ` · ${c.deliveryEta[0]}–${c.deliveryEta[1]} min` : ''}.`;
      const hints = [];
      if (delivery && fee.min > ctx.subtotal()) hints.push(`Pedido mínimo para delivery${fee.zone ? ` em ${fee.zone.name}` : ''}: ${money(fee.min)}. Faltam ${money(fee.min - ctx.subtotal())}.`);
      if (delivery && d.freeAbove > 0) hints.push(ctx.subtotal() >= d.freeAbove ? 'Entrega grátis neste pedido!' : `Entrega grátis a partir de ${money(d.freeAbove)}.`);
      $('#delivery-hint').hidden = !hints.length; $('#delivery-hint').textContent = hints.join(' ');

      $('#items-label').textContent = `Itens (${ctx.itemCount()})`;
      $('#delivery-cost-label').textContent = delivery ? 'Entrega' + (fee.pending ? ' · a confirmar' : '') : choice ? 'Retirada no local' : 'Entrega';
      $('#delivery-cost').textContent = delivery ? (fee.known ? (fee.fee ? money(fee.fee) : 'Grátis') : 'escolha o bairro') : choice ? 'Sem taxa' : 'escolha acima';
      $('#order-total-label').textContent = fee.pending ? 'Total estimado' : 'Total do pedido';
      $('#order-total').textContent = money(total());
      const eta = delivery ? (fee.zone ? [fee.zone.etaMin, fee.zone.etaMax] : c.deliveryEta) : choice ? c.pickupEta : null;
      $('#order-confirmation').textContent = fee.pending ? `Inclui ${money(fee.fee)} de taxa a confirmar pela equipe.` : eta ? `Tempo estimado: ${eta[0]}–${eta[1]} min depois da confirmação.` : 'Disponibilidade e prazo confirmados pela equipe.';

      const closed = api && shop.status && !shop.status.accepting;
      const offHours = staticClosed();
      $('#store-closed').hidden = !closed && !offHours;
      if (closed) $('#store-closed').innerHTML = `${icon('i-clock')}<span><b>${escape(shop.status.label)}</b>${shop.status.message ? ' · ' + escape(shop.status.message) : ''}<br>Você pode montar o carrinho agora e enviar quando abrirmos.</span>`;
      else if (offHours) $('#store-closed').innerHTML = `${icon('i-clock')}<span><b>${escape(offHours)}</b><br>Pode enviar o pedido pelo WhatsApp agora: a casa responde assim que abrir.</span>`;
      if (api) {
        submit.className = 'button gold full checkout-submit';
        submit.innerHTML = sending ? '<span class="spinner" aria-hidden="true"></span>Enviando pedido…' : `${icon('i-check')}<span>Confirmar pedido</span><b>${money(total())}</b>`;
        submit.disabled = sending || closed;
        $('#checkout-hint').textContent = 'Seu pedido vai direto para a cozinha. Você acompanha cada etapa em tempo real.';
      } else {
        submit.className = 'button whatsapp-button full';
        submit.innerHTML = `${icon('i-wa')}Enviar pedido pelo WhatsApp`;
        $('#checkout-hint').textContent = 'Abre o WhatsApp da casa com o pedido completo. É só tocar em enviar.';
        $('#message-preview').innerHTML = formatPreview(orderMessage());
      }
      $('#order-message').hidden = api;
      $('#phone-field').hidden = !api;
      $('#remember-row').hidden = !api;
      $('#privacy-note').innerHTML = api
        ? 'Seus dados são usados só para preparar e entregar o pedido. Veja os <a href="legal/termos.html" target="_blank" rel="noopener">termos de uso</a> e a <a href="legal/privacidade.html" target="_blank" rel="noopener">política de privacidade</a>.'
        : 'Seu nome e endereço são usados só para montar a mensagem e não ficam salvos no site. Confira os <a href="legal/termos.html" target="_blank" rel="noopener">termos de uso</a> e a <a href="legal/privacidade.html" target="_blank" rel="noopener">política de privacidade</a>.';
      const fallback = $('#fallback-whatsapp');
      if (!fallback.hidden) fallback.href = whatsappLink();
    }

    function cartChanged() {
      idemKey = null;
      if (orderSent) showSent(false);
      $('#fallback-whatsapp').hidden = true;
    }

    function showSent(sent) {
      orderSent = sent; $('#sent-panel').hidden = !sent; $('#checkout-totals').hidden = sent;
      // O botão que tinha o foco some: leva o foco para a confirmação.
      if (sent) { const h = $('#sent-panel h3'); h.tabIndex = -1; h.focus({ preventScroll: true }); }
    }
    function clearErrors() {
      $$('.invalid', form).forEach(el => el.classList.remove('invalid'));
      $$('[aria-invalid]', form).forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
      $$('.field-error', dialog).forEach(el => { el.hidden = true; });
    }
    function syncDelivery(refresh = true) {
      const choice = deliveryChoice(), delivery = choice === 'entrega';
      $('#address-fields').hidden = !delivery; $('#pickup-address').hidden = choice !== 'retirada';
      const zones = usesZones();
      $('#neighborhood-field').hidden = zones && form.zone.value !== 'outro';
      $('#neighborhood-field').firstChild.textContent = zones ? 'Qual bairro?' : 'Bairro';
      $$('input, select', $('#address-fields')).forEach(field => { field.disabled = !delivery; });
      $$('.choice', $('#payment-options')).forEach(label => {
        const f = label.dataset.fulfillment, ok = !choice || f === 'both' || f === choice;
        label.hidden = !ok;
        if (!ok) label.querySelector('input').checked = false;
      });
      $('#delivery-set').classList.remove('invalid'); $('#delivery-error').hidden = true;
      if (refresh) { syncPayment(false); update(); }
    }
    function syncPayment(refresh = true) {
      const m = method();
      $('#card-type-set').hidden = !(m && m.kind === 'card' && m.credit && m.debit);
      $('#change-box').hidden = !(m && m.kind === 'cash' && m.askChange);
      $('#change-field').hidden = !form.needChange.checked || $('#change-box').hidden;
      const info = m && (m.kind === 'pix' ? (api ? 'O QR Code e o código Pix copia e cola aparecem na tela do pedido, com o valor certinho.' : '') : m.kind === 'custom' ? m.instructions : m.kind === 'card' && m.brands ? `Bandeiras aceitas: ${m.brands}.` : m.description || '');
      $('#payment-info').hidden = !info; $('#payment-info').textContent = info || '';
      $('#payment-set').classList.remove('invalid'); $('#payment-error').hidden = true;
      if (refresh) update();
    }

    form.addEventListener('change', event => {
      if (event.target.name === 'delivery') syncDelivery();
      else if (event.target.name === 'zone') { syncDelivery(); if (form.zone.value === 'outro') form.neighborhood.focus(); }
      else if (['payment', 'cardType', 'needChange'].includes(event.target.name)) { syncPayment(); if (event.target.name === 'needChange' && form.needChange.checked) form.changeFor.focus(); }
    });
    form.addEventListener('input', event => {
      event.target.closest('.field')?.classList.remove('invalid');
      event.target.closest('.choice-set')?.classList.remove('invalid');
      $('#checkout-error').hidden = true;
      if (event.target.name === 'phone') event.target.value = maskPhone(event.target.value);
      if (event.target.name === 'cep') { event.target.value = maskCep(event.target.value); scheduleCep(); }
      if (['street', 'neighborhood', 'city'].includes(event.target.name)) autoFilled[event.target.name] = false;
      cartChanged();
      update();
    });

    // ---------- Máscaras e CEP ----------
    function maskPhone(v) {
      let d = digits(v); if (d.startsWith('55') && d.length > 11) d = d.slice(2); d = d.slice(0, 11);
      if (d.length <= 2) return d.length ? `(${d}` : '';
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    const maskCep = v => { const d = digits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
    const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    function scheduleCep() {
      clearTimeout(cepTimer);
      const cep = digits(form.cep.value);
      $('#cep-status').textContent = '';
      if (cep.length !== 8 || !cfg().delivery.cepLookup) return;
      cepTimer = setTimeout(() => lookupCep(cep), 250);
    }
    async function lookupCep(cep) {
      cepAbort?.abort(); cepAbort = new AbortController();
      const status = $('#cep-status');
      status.textContent = 'Buscando endereço…'; status.className = 'cep-status';
      const timer = setTimeout(() => cepAbort.abort(), 6000);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: cepAbort.signal });
        const data = await res.json();
        if (!res.ok || data.erro) throw new Error('not found');
        const fill = (name, value) => { if (value && (!form[name].value || autoFilled[name])) { form[name].value = value; autoFilled[name] = true; form[name].closest('.field')?.classList.remove('invalid'); } };
        fill('street', data.logradouro);
        if (!form.city.readOnly) fill('city', data.localidade);
        if (usesZones() && data.bairro) {
          const match = cfg().zones.find(z => fold(z.name) === fold(data.bairro));
          if (match) form.zone.value = String(match.id);
          else if (cfg().delivery.allowOther) { form.zone.value = 'outro'; fill('neighborhood', data.bairro); }
          syncDelivery();
        } else fill('neighborhood', data.bairro);
        const cities = cfg().delivery.cities || [];
        const outside = cities.length && data.localidade && !cities.some(c => fold(c) === fold(data.localidade));
        status.textContent = outside ? `Atenção: entregamos em ${cities.join(', ')}.` : 'Endereço encontrado. Confira e informe o número.';
        status.className = 'cep-status ' + (outside ? 'warn' : 'ok');
        if (!form.number.value) form.number.focus();
        update();
      } catch (error) {
        if (error.name === 'AbortError' && digits(form.cep.value) !== cep) return;
        status.textContent = 'Não encontramos esse CEP. Preencha o endereço manualmente.'; status.className = 'cep-status warn';
      } finally { clearTimeout(timer); }
    }

    // ---------- Dados lembrados neste aparelho ----------
    function restoreCustomer() {
      if (!api) return;
      const saved = store.get(CUSTOMER_KEY, null); if (!saved) return;
      const set = (name, value) => { if (value && form[name] && !form[name].value) form[name].value = value; };
      set('customer', saved.name); set('phone', saved.phone ? maskPhone(saved.phone) : '');
      if (saved.fulfillment) { const input = form.querySelector(`input[name=delivery][value="${saved.fulfillment}"]`); if (input) input.checked = true; }
      const a = saved.address || {};
      set('cep', a.cep); set('street', a.street); set('number', a.number); set('complement', a.complement); set('reference', a.reference);
      if (!form.city.readOnly) set('city', a.city);
      if (a.zoneId && [...form.zone.options].some(o => o.value === String(a.zoneId))) form.zone.value = String(a.zoneId);
      else if (a.neighborhood) { set('neighborhood', a.neighborhood); if (usesZones() && cfg().delivery.allowOther) form.zone.value = 'outro'; }
      if (saved.paymentId) { const input = form.querySelector(`input[name=payment][value="${CSS.escape(saved.paymentId)}"]`); if (input) input.checked = true; }
      syncDelivery(false); syncPayment(false);
    }
    function rememberCustomer(payload) {
      if (!form.remember.checked) { store.remove(CUSTOMER_KEY); return; }
      store.set(CUSTOMER_KEY, { name: payload.customer.name, phone: digits(payload.customer.phone), fulfillment: payload.fulfillment, address: payload.address ? { ...payload.address, zoneId: payload.address.zoneId ?? null } : null, paymentId: payload.payment.methodId });
    }
    $('#forget-me').addEventListener('click', () => {
      store.remove(CUSTOMER_KEY);
      ['customer', 'phone', 'cep', 'street', 'number', 'neighborhood', 'complement', 'reference'].forEach(n => { form[n].value = ''; });
      form.zone.value = '';
      ctx.toast('Pronto: seus dados foram apagados deste aparelho.');
      syncDelivery();
    });

    // ---------- Validação ----------
    function fail(container, focusTarget, message) {
      container.classList.add('invalid');
      if (container.classList.contains('field')) container.dataset.error = message;
      $('#checkout-error').textContent = message; $('#checkout-error').hidden = false;
      // Leitores de tela anunciam o campo como inválido e leem a mensagem junto.
      if (focusTarget) { focusTarget.setAttribute('aria-invalid', 'true'); focusTarget.setAttribute('aria-describedby', 'checkout-error'); }
      const body = $('.drawer-body', dialog), offset = container.getBoundingClientRect().top - body.getBoundingClientRect().top;
      body.scrollTo({ top: Math.max(0, body.scrollTop + offset - body.clientHeight / 3), behavior: 'smooth' });
      focusTarget?.focus({ preventScroll: true });
      return false;
    }
    const fieldFail = (input, message) => fail(input.closest('.field'), input, message);
    function validate() {
      clearErrors();
      const issues = ctx.getCart().map(ctx.lineIssue).filter(Boolean);
      if (issues.length) { $('#checkout-error').textContent = `${issues[0]} Remova o item do carrinho para continuar.`; $('#checkout-error').hidden = false; $('#cart-items .cart-item.has-issue')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; }
      if (clean(form.customer.value).length < 2) return fieldFail(form.customer, 'Informe seu nome para o pedido.');
      if (api) {
        const d = digits(form.phone.value).replace(/^55(?=\d{10,11}$)/, '');
        if (d.length < 10 || d.length > 11 || (d.length === 11 && d[2] !== '9')) return fieldFail(form.phone, 'Informe seu WhatsApp com DDD para a casa falar com você.');
      }
      if (!deliveryChoice()) { $('#delivery-error').hidden = false; return fail($('#delivery-set'), form.querySelector('input[name=delivery]'), 'Escolha se vai retirar no local ou receber por delivery.'); }
      if (isDelivery()) {
        const d = cfg().delivery;
        const cep = digits(form.cep.value);
        if ((d.requireCep && cep.length !== 8) || (cep && cep.length !== 8)) return fieldFail(form.cep, 'Informe um CEP válido (8 números).');
        if (!clean(form.street.value)) return fieldFail(form.street, 'Informe a rua.');
        if (!clean(form.number.value)) return fieldFail(form.number, 'Informe o número (ou s/n).');
        if (usesZones() && !form.zone.value) return fieldFail(form.zone, 'Escolha o bairro.');
        if ((!usesZones() || form.zone.value === 'outro') && !clean(form.neighborhood.value)) return fieldFail(form.neighborhood, 'Informe o bairro.');
        if (!clean(form.city.value)) return fieldFail(form.city, 'Informe a cidade.');
        if (d.requireReference && !clean(form.reference.value)) return fieldFail(form.reference, 'Informe um ponto de referência.');
        const fee = feeInfo();
        if (api && fee.min > ctx.subtotal()) { $('#checkout-error').textContent = `O pedido mínimo para delivery é ${money(fee.min)}.`; $('#checkout-error').hidden = false; return false; }
      }
      const m = method();
      if (!m) { $('#payment-error').hidden = false; return fail($('#payment-set'), form.querySelector('#payment-options input:not([disabled])'), 'Escolha a forma de pagamento.'); }
      if (!$('#card-type-set').hidden && !form.querySelector('input[name=cardType]:checked')) { $('#card-type-error').hidden = false; return fail($('#card-type-set'), form.querySelector('input[name=cardType]'), 'Escolha crédito ou débito.'); }
      if (!$('#change-field').hidden) {
        const v = parseMoney(form.changeFor.value);
        if (!v || v <= total()) return fieldFail(form.changeFor, `Informe um valor maior que ${money(total())} para o troco.`);
      }
      return true;
    }

    // ---------- Envio ----------
    function payload() {
      const delivery = isDelivery(), m = method();
      const z = zone();
      return {
        idempotencyKey: idemKey,
        customer: { name: clean(form.customer.value).slice(0, 80), phone: digits(form.phone.value) },
        fulfillment: deliveryChoice(),
        address: delivery ? {
          cep: digits(form.cep.value), street: clean(form.street.value), number: clean(form.number.value),
          neighborhood: z ? z.name : clean(form.neighborhood.value), city: clean(form.city.value),
          complement: clean(form.complement.value), reference: clean(form.reference.value),
          zoneId: z ? z.id : null
        } : null,
        payment: {
          methodId: m.id,
          cardType: m.kind === 'card' ? (m.credit && m.debit ? form.querySelector('input[name=cardType]:checked')?.value || '' : m.credit ? 'credito' : 'debito') : '',
          changeFor: m.kind === 'cash' && !$('#change-field').hidden ? parseMoney(form.changeFor.value) : null
        },
        note: clean(form['order-note'].value).slice(0, 300),
        items: ctx.getCart().map(l => ({ productId: l.productId, quantity: l.quantity, options: l.options, flavor: l.flavor || '', note: l.note || '' })),
        clientTotal: total(),
        website: form.website.value
      };
    }
    const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''));
    const fieldMap = { 'customer.name': 'customer', 'customer.phone': 'phone', 'address.cep': 'cep', 'address.street': 'street', 'address.number': 'number', 'address.neighborhood': 'neighborhood', 'address.zoneId': 'zone', 'address.city': 'city', 'address.reference': 'reference', 'address.complement': 'complement', 'payment.changeFor': 'changeFor', note: 'order-note' };

    // Erros de regra ou de preenchimento: o cliente corrige e envia de novo (sem oferecer o WhatsApp).
    const FIXABLE = new Set(['VALIDATION', 'PRICE_CHANGED', 'ITEM_UNAVAILABLE', 'FULFILLMENT_UNAVAILABLE', 'STORE_CLOSED', 'TOO_MANY_OPEN', 'IDEMPOTENCY_MISMATCH', 'MIN_ORDER']);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function sendToServer() {
      if (!idemKey) idemKey = newKey();
      const body = payload();
      sending = true; update();
      $('#checkout-error').hidden = true; $('#fallback-whatsapp').hidden = true;
      try {
        // Até 3 tentativas com a mesma chave: se a primeira chegou e só a resposta se perdeu,
        // o servidor devolve o mesmo pedido em vez de criar outro.
        let res = null, data = {};
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt) await wait(attempt * 1500);
          try {
            res = await fetch(apiUrl('/api/orders'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
            data = await res.json().catch(() => ({}));
          } catch { res = null; data = {}; }
          if (res && res.status < 500) break;
        }
        if (res && res.ok) {
          rememberCustomer(body);
          const orders = store.get(ORDERS_KEY, []).filter(o => o && o.token !== data.token);
          orders.unshift({ number: data.number, token: data.token, at: Date.now() });
          store.set(ORDERS_KEY, orders.slice(0, 5));
          ctx.clearCart();
          window.location.href = `${data.trackingUrl}?novo=1`;
          return;
        }
        if (!res) handleError(0, { message: 'Sem conexão com a hamburgueria. Confira sua internet e tente de novo, ou envie pelo WhatsApp.' });
        else handleError(res.status, data.error || {});
      } finally {
        sending = false; update();
      }
    }

    async function handleError(status, error) {
      const code = error.code;
      if (code === 'VALIDATION' && error.fields) {
        const [field, message] = Object.entries(error.fields)[0];
        const name = fieldMap[field];
        if (name && form[name] && form[name].closest?.('.field')) { fieldFail(form[name], message); return; }
        if (field.startsWith('payment')) { $('#payment-error').hidden = false; fail($('#payment-set'), form.querySelector('input[name=payment]'), message); return; }
        $('#checkout-error').textContent = message; $('#checkout-error').hidden = false; return;
      }
      if (code === 'PRICE_CHANGED' || code === 'ITEM_UNAVAILABLE' || code === 'FULFILLMENT_UNAVAILABLE' || code === 'STORE_CLOSED') {
        await refreshCatalog();
        idemKey = null;
      }
      const fixable = FIXABLE.has(code);
      $('#checkout-error').textContent = fixable ? (error.message || 'Confira o pedido e tente de novo.')
        : `${error.message && status && status < 500 ? error.message + ' ' : 'Não conseguimos registrar o pedido agora. '}Envie pelo WhatsApp que a casa recebe do mesmo jeito.`;
      $('#checkout-error').hidden = false;
      // Qualquer falha que não seja de preenchimento ou de regra: oferece o WhatsApp sem perder o carrinho.
      if (!fixable && cfg().whatsappFallback !== false) {
        const fallback = $('#fallback-whatsapp');
        fallback.hidden = false; fallback.href = whatsappLink();
        fallback.focus();
      }
    }

    async function refreshCatalog() {
      try {
        const res = await fetch(apiUrl('/api/catalog'), { cache: 'no-store' });
        if (res.ok) { ctx.reloadCatalog({ ...(await res.json()), ...(shop.apiBase ? { apiBase: shop.apiBase } : {}) }); buildOptions(); restoreCustomer(); update(); }
      } catch { /* mantém o cardápio atual */ }
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!ctx.getCart().length || sending || !validate()) return;
      if (api) { sendToServer(); return; }
      const url = whatsappLink();
      $('#whatsapp-checkout').href = url;
      showSent(true);
      // No celular (e no navegador do Instagram) abrir nova aba costuma ser bloqueado: vai direto ao WhatsApp.
      if (window.matchMedia('(pointer: coarse)').matches) window.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    });
    $('#edit-order').addEventListener('click', () => { showSent(false); form.customer.focus(); });
    $('#new-order').addEventListener('click', () => {
      ctx.clearCart(); form.reset(); clearErrors(); buildOptions(); showSent(false);
      dialog.close(); ctx.toast('Obrigado pelo pedido! Bom apetite.');
    });

    // ---------- Pedido em andamento (atalho para acompanhar) ----------
    async function activeOrderChip() {
      if (!api) return;
      const orders = store.get(ORDERS_KEY, []).filter(o => o && o.token && Date.now() - o.at < 36 * 3600 * 1000);
      store.set(ORDERS_KEY, orders);
      const latest = orders[0]; if (!latest) return;
      try {
        const res = await fetch(apiUrl(`/api/public/orders/${encodeURIComponent(latest.token)}`), { cache: 'no-store' });
        if (!res.ok) { if (res.status === 404) store.set(ORDERS_KEY, orders.slice(1)); return; }
        const order = await res.json();
        if (order.final && Date.now() - (order.updatedAt || 0) > 2 * 3600 * 1000) return;
        const chip = document.createElement('a');
        chip.className = 'active-order-chip' + (order.final ? ' is-final' : '');
        chip.href = apiUrl(`/pedido/${latest.token}`);
        chip.innerHTML = `<span class="pulse-dot" aria-hidden="true"></span><span><small>Pedido #${order.number}</small><b>${escape(order.label)}</b></span>${icon('i-arrow')}`;
        document.body.appendChild(chip);
        document.body.classList.add('has-active-order');
      } catch { /* sem conexão: sem atalho */ }
    }

    buildOptions();
    restoreCustomer();
    if (!form.city.value) form.city.value = 'Canela';
    activeOrderChip();
    update();
    return { update, cartChanged, refreshCatalog, rebuild: () => { buildOptions(); update(); } };
  }
  }
})();
