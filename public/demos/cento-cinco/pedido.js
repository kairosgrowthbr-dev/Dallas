// Acompanhamento do pedido pelo cliente: status ao vivo (SSE, com consulta periódica de reserva),
// itens, valores, Pix (QR Code e copia e cola) e atalho para o WhatsApp da casa.
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const clock = ms => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
  const token = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
  const base = `/api/public/orders/${encodeURIComponent(token)}`;
  let order = null, source = null, pollTimer = null, toastTimer = null, lastStatus = null;

  function toast(text) {
    $('#toast-text').textContent = text;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
  }

  // Recém-criado: mostra a confirmação e limpa o ?novo=1 da barra de endereço.
  if (new URLSearchParams(location.search).has('novo')) {
    $('#track-new').hidden = false;
    history.replaceState(null, '', location.pathname);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const area = document.createElement('textarea'); area.value = text; area.setAttribute('readonly', ''); area.className = 'hp-field';
      document.body.appendChild(area); area.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
      area.remove(); return ok;
    }
  }
  $('#share-link').addEventListener('click', async () => {
    const url = location.origin + location.pathname;
    if (navigator.share && matchMedia('(pointer: coarse)').matches) { try { await navigator.share({ title: `Pedido #${order?.number || ''}`, url }); return; } catch { /* cancelado */ } }
    toast(await copy(url) ? 'Link copiado.' : 'Não foi possível copiar. Copie o endereço da página.');
  });
  $('#pix-copy').addEventListener('click', async () => {
    const ok = await copy($('#pix-code').value);
    toast(ok ? 'Código Pix copiado. Cole no app do seu banco.' : 'Selecione o código e copie manualmente.');
    if (!ok) $('#pix-code').select();
  });

  function etaText(o) {
    if (!o.eta || o.final) return '';
    const from = o.steps.find(s => s.key === 'confirmado')?.at;
    if (!from) return `Previsão: ${o.eta.min}–${o.eta.max} min após a confirmação`;
    return `Previsão: ${clock(from + o.eta.min * 60000)}–${clock(from + o.eta.max * 60000)}`;
  }

  function render(o) {
    order = o;
    document.title = `Pedido #${o.number} · ${o.label} | Cento&Cinco`;
    const track = $('#track');
    track.setAttribute('aria-busy', 'false');
    track.dataset.status = o.status;
    $('#track-number').textContent = `Pedido #${o.number}${o.customerName ? ` · ${o.customerName}` : ''}`;
    $('#track-title').textContent = o.label;
    $('#track-detail').textContent = o.detail;
    const meta = [`${icon('i-clock')}Feito às ${clock(o.createdAt)}`, o.fulfillment === 'entrega' ? `${icon('i-moto')}Delivery` : `${icon('i-store')}Retirada no local`];
    const eta = etaText(o); if (eta) meta.push(`${icon('i-flame')}${escape(eta)}`);
    if (!o.final) meta.push('<span class="live-dot" aria-hidden="true"></span>Atualiza sozinho');
    $('#track-meta').innerHTML = meta.map(m => `<li>${m}</li>`).join('');
    $('#track-steps').innerHTML = o.steps.map(s => `<li class="${s.done ? 'done' : ''}${s.current ? ' current' : ''}"${s.current ? ' aria-current="step"' : ''}><span class="step-dot">${s.done ? icon('i-check') : ''}</span><b>${escape(s.label)}</b><small>${s.at ? clock(s.at) : ''}</small></li>`).join('');
    $('#track-steps').hidden = !o.steps.length;

    // Itens e totais
    $('#track-items').innerHTML = o.items.map(i => `<li><div><b>${i.quantity}x ${escape(i.name)}</b>${i.flavor ? `<small>Sabor: ${escape(i.flavor)}</small>` : ''}${i.options.length ? `<small>+ ${i.options.map(x => escape(x.name)).join(', ')}</small>` : ''}${i.note ? `<small class="note">Obs.: ${escape(i.note)}</small>` : ''}</div><strong>${money(i.lineTotal)}</strong></li>`).join('');
    $('#track-totals').innerHTML = `<div><span>Itens</span><span>${money(o.subtotal)}</span></div>${o.fulfillment === 'entrega' ? `<div><span>Entrega${o.feePending ? ' · a confirmar' : ''}</span><span>${o.deliveryFee ? money(o.deliveryFee) : 'Grátis'}</span></div>` : ''}<div class="grand"><span>${o.feePending ? 'Total estimado' : 'Total'}</span><strong>${money(o.total)}</strong></div>${o.note ? `<p class="track-note">Obs.: ${escape(o.note)}</p>` : ''}`;

    // Entrega ou retirada
    $('#where-title').textContent = o.fulfillment === 'entrega' ? 'Entrega' : 'Retirada';
    if (o.fulfillment === 'entrega') {
      const a = o.address;
      $('#track-where').innerHTML = a ? `<p class="track-address">${icon('i-pin')}<span><b>${escape(a.street)}, ${escape(a.number)}</b>${escape(a.neighborhood)} · ${escape(a.city)}${a.complement ? `<br>${escape(a.complement)}` : ''}${a.reference ? `<br>Ref.: ${escape(a.reference)}` : ''}</span></p>` : '<p class="fine-print">Endereço oculto por privacidade.</p>';
    } else {
      $('#track-where').innerHTML = `<p class="track-address">${icon('i-store')}<span><b>Retire no balcão</b>${escape(o.pickupAddress || '')}<br>Informe o número <b>#${o.number}</b>.</span></p>`;
    }

    // Pagamento
    const paid = o.payment.status === 'pago';
    $('#track-payment').innerHTML = `<p class="track-pay"><span><b>${escape(o.payment.label)}</b>${o.payment.detail ? `<small>${escape(o.payment.detail)}</small>` : ''}</span><span class="pay-badge ${paid ? 'paid' : ''}">${paid ? 'Pago' : o.status === 'cancelado' ? '—' : 'A pagar'}</span></p>${!paid && o.payment.kind !== 'pix' && o.status !== 'cancelado' ? `<p class="fine-print">Pagamento ${o.fulfillment === 'entrega' ? 'na entrega' : 'no balcão'}.</p>` : ''}`;

    // Pix
    const pix = o.pix;
    $('#pix-card').hidden = !pix;
    if (pix) {
      $('#pix-amount').textContent = money(pix.amount);
      $('#pix-code').value = pix.copyPaste;
      const qr = $('#pix-qr');
      qr.hidden = !pix.showQr;
      if (pix.showQr) qr.src = `${base}/pix.svg?v=${o.version}`;
      const keyLabel = { phone: 'Telefone', email: 'E-mail', cpf: 'CPF', cnpj: 'CNPJ', evp: 'Chave aleatória' }[pix.keyType] || 'Chave';
      $('#pix-key').textContent = `${keyLabel}: ${pix.key} · ${pix.merchantName}`;
    }

    const wa = $('#track-whatsapp');
    wa.hidden = !o.whatsappUrl;
    if (o.whatsappUrl) wa.href = o.whatsappUrl;
    $('.track-help p').textContent = o.whatsappUrl ? 'Fale com a equipe sobre o seu pedido pelo WhatsApp.' : 'Qualquer dúvida, é só chamar a casa.';

    if (lastStatus && lastStatus !== o.status) {
      toast(`Atualização: ${o.label}`);
      navigator.vibrate?.(180);
    }
    lastStatus = o.status;
    if (o.final) stopLive();
  }

  async function load() {
    try {
      const res = await fetch(base, { cache: 'no-store' });
      if (res.status === 404 || res.status === 422) { showMissing(); return false; }
      if (!res.ok) throw new Error(String(res.status));
      render(await res.json());
      return true;
    } catch {
      if (!order) { $('#track-title').textContent = 'Sem conexão'; $('#track-detail').textContent = 'Tentando de novo em instantes…'; }
      return false;
    }
  }
  function showMissing() { $('#track').hidden = true; $('#track-missing').hidden = false; stopLive(); }

  function stopLive() {
    source?.close(); source = null;
    clearInterval(pollTimer); pollTimer = null;
  }
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(() => { if (!document.hidden) load(); }, 20000);
  }
  function startLive() {
    if (!('EventSource' in window)) { startPolling(); return; }
    source = new EventSource(`${base}/stream`);
    let failures = 0;
    source.addEventListener('order.updated', event => { failures = 0; const data = JSON.parse(event.data); if (data.gone) { showMissing(); return; } render(data); });
    source.addEventListener('resync', () => load());
    source.addEventListener('open', () => { failures = 0; });
    source.addEventListener('error', () => {
      failures++;
      // Redes móveis às vezes cortam o SSE: depois de algumas falhas, consulta a cada 20 s.
      if (failures >= 3 && !pollTimer) { source.close(); startPolling(); }
    });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && order && !order.final) load(); });

  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) { showMissing(); return; }
  load().then(ok => { if (ok && !order.final) startLive(); else if (!ok && !$('#track').hidden) startPolling(); });
})();
