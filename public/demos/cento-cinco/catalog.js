// Cardápio transcrito da imagem enviada pela empresa em 04/10/2026. Preços em centavos.
window.SHOP = {
  whatsapp: '5554999991530',
  deliveryFee: 1200, // Taxa de exemplo solicitada; substituir pelo valor oficial.
  deliveryFeeIsExample: true,
  video: 'assets/burger-film.mp4?v=20261004',
  // Vídeo do topo da página inicial: montagem com trechos dos reels da casa.
  heroVideo: 'assets/hero-reel.mp4?v=20261008',
  instagram: 'https://www.instagram.com/burgercentoecinco/',
  // Horário de funcionamento (America/Sao_Paulo): todos os dias, das 18h às 23h.
  hours: {open: 18, close: 23},
  // icon: símbolo do sprite · image: foto da categoria (opcional).
  categories: [
    {id:'burgers',name:'Burgers',icon:'i-burger',image:'assets/menu/duplo-melt.jpg',blurb:'Todos com maionese da casa. Monte do seu jeito com carne extra, bacon, cebola caramelizada e queijos.'},
    {id:'porcoes',name:'Porções',icon:'i-fries',image:'assets/menu/porcoes.jpg',blurb:'Para dividir na mesa (ou não): batatas, onion rings, batata smile e queijo gouda empanado.'},
    {id:'bebidas',name:'Sem álcool',icon:'i-cup',blurb:'Refrigerantes, águas e drinks sem álcool como Green Apple, Pink Lemonade e Mojito Zero.'},
    {id:'cervejas',name:'Cervejas',icon:'i-beer',blurb:'Long necks e garrafas de 600 ml para acompanhar o seu burger.'},
    {id:'drinks',name:'Drinks',icon:'i-cocktail',blurb:'Caipirinhas, spritz, gin tônica, Negroni, Moscow Mule e outros clássicos.'},
    {id:'doces',name:'Doces & shakes',icon:'i-shake',image:'assets/milkshake.jpg',blurb:'Milk shakes de Ovomaltine, morango e caramelo, e cookies para fechar a noite.'}
  ],
  // Sugestões rápidas exibidas no carrinho.
  suggestions: ['batata-p','onion-p','shake-ovomaltine','cookies'],
  extras: [
    {id:'carne-queijo',name:'180 g de carne + queijo',price:1800},
    {id:'bacon',name:'Tiras de bacon',price:900},
    {id:'cebola',name:'Cebola caramelizada',price:400},
    {id:'mussarela',name:'Queijo mussarela',price:400},
    {id:'cheddar',name:'Queijo cheddar',price:400},
    {id:'gorgonzola',name:'Queijo gorgonzola',price:800}
  ],
  sauces: [],
  // image: foto do Instagram da casa (só quando a foto é do próprio item) · badge: selo opcional no card.
  products: [
    {id:'pcq',category:'burgers',name:'PCQ',description:'Pão, 180 g de carne, queijo mussarela e maionese da casa.',price:3800,custom:true},
    {id:'salada',category:'burgers',name:'Salada',description:'Pão, 180 g de carne, queijo cheddar, alface, cebola roxa, tomate, picles e maionese da casa.',price:4400,custom:true,image:'assets/menu/salada.jpg'},
    {id:'bacon',category:'burgers',name:'Bacon',description:'Pão, 180 g de carne, queijo cheddar, tiras de bacon, cebola roxa, picles e maionese da casa.',price:5500,custom:true,image:'assets/menu/bacon.jpg'},
    {id:'gorgonzola',category:'burgers',name:'Gorgonzola',description:'Pão, 180 g de carne, gorgonzola, cebola caramelizada, tiras de bacon, tomate, rúcula e maionese da casa.',price:5500,custom:true,image:'assets/menu/gorgonzola.jpg'},
    {id:'tomate-seco',category:'burgers',name:'Tomate Seco',description:'Pão, 180 g de carne, queijo mussarela, rúcula, tomate seco, presunto parma e maionese da casa.',price:5200,custom:true,image:'assets/menu/tomate-seco.jpg'},
    {id:'frango',category:'burgers',name:'Frango',description:'Pão, peito de frango grelhado com ervas finas, queijo mussarela, alface, tomate, cebola roxa, molho de mostarda e mel e maionese da casa.',price:4000,custom:true,image:'assets/menu/frango.jpg'},
    {id:'vegetariano',category:'burgers',name:'Vegetariano',description:'Pão, bife de lentilha, queijo cheddar, alface, tomate, cebola roxa e maionese da casa.',price:5000,custom:true,image:'assets/menu/vegetariano.jpg'},
    {id:'kids',category:'burgers',name:'Kids',description:'Pão, 90 g de carne e queijo cheddar. Acompanha batata smile.',price:3500,custom:true,image:'assets/menu/kids.jpg'},
    {id:'quatro-queijos',category:'burgers',name:'4 Queijos com Bacon',description:'Pão, 180 g de carne, picles, quatro queijos, tiras de bacon e maionese da casa.',price:5000,custom:true,image:'assets/menu/quatro-queijos.jpg'},
    {id:'farroupilha',category:'burgers',name:'Farroupilha',description:'Pão, 2 smashes de 90 g, 2 fatias de queijo cheddar, costela desfiada, cheiro-verde e maionese da casa.',price:5000,custom:true,image:'assets/menu/farroupilha.jpg'},
    {id:'duplo-melt',category:'burgers',name:'Duplo Melt',description:'Pão, 2 smashes de 90 g, 4 fatias de queijo cheddar, bacon, cebola caramelizada e maionese da casa.',price:5000,custom:true,image:'assets/menu/duplo-melt.jpg',badge:'Um dos mais pedidos'},
    {id:'gouda',category:'burgers',name:'Burger Queijo Gouda',description:'Pão, 180 g de carne, queijo cheddar, bacon, 4 dadinhos de queijo gouda empanado, geleia de pimenta e maionese da casa.',price:5600,custom:true,image:'assets/menu/gouda.jpg'},
    {id:'file-premium',category:'burgers',name:'Burger Filé Premium',description:'Pão, filé grelhado na chapa com queijo mussarela, alface, tomate e maionese da casa.',price:6000,custom:true,image:'assets/menu/file-premium.jpg'},
    {id:'batata-p',category:'porcoes',name:'Batata P',description:'Porção pequena de batatas fritas.',price:1600,image:'assets/menu/porcoes.jpg'},
    {id:'batata-g',category:'porcoes',name:'Batata G',description:'Porção grande de batatas fritas.',price:4200,image:'assets/menu/porcoes.jpg'},
    {id:'onion-p',category:'porcoes',name:'Onion Rings P',description:'Porção pequena de anéis de cebola.',price:1800},
    {id:'onion-g',category:'porcoes',name:'Onion Rings G',description:'Porção grande de anéis de cebola.',price:5000},
    {id:'gouda-p',category:'porcoes',name:'Queijo Gouda Empanado P',description:'Porção pequena de queijo gouda empanado.',price:3000,image:'assets/menu/gouda-empanado.jpg'},
    {id:'smile-p',category:'porcoes',name:'Batata Smile P',description:'Porção pequena de batata smile.',price:1600},
    {id:'refrigerante',category:'bebidas',name:'Refrigerante Lata',description:'Informe o sabor desejado. A equipe confirmará a disponibilidade.',price:990,flavor:true},
    {id:'agua-sem-gas',category:'bebidas',name:'Água sem Gás',description:'Água mineral sem gás.',price:600},
    {id:'agua-com-gas',category:'bebidas',name:'Água com Gás',description:'Água mineral com gás.',price:600},
    {id:'green-apple',category:'bebidas',name:'Green Apple',description:'Drink não alcoólico.',price:2500},
    {id:'pink-lemonade',category:'bebidas',name:'Pink Lemonade',description:'Drink não alcoólico.',price:1800},
    {id:'mojito-zero',category:'bebidas',name:'Mojito Zero',description:'Drink não alcoólico.',price:2000},
    {id:'spaten',category:'cervejas',name:'Spaten Long Neck',description:'Cerveja long neck.',price:1500},
    {id:'stella-long',category:'cervejas',name:'Stella Long Neck',description:'Cerveja long neck.',price:1500},
    {id:'corona',category:'cervejas',name:'Corona Long Neck',description:'Cerveja long neck.',price:2000},
    {id:'original',category:'cervejas',name:'Original 600 ml',description:'Cerveja em garrafa de 600 ml.',price:2000},
    {id:'serra-malte',category:'cervejas',name:'Serra Malte 600 ml',description:'Cerveja em garrafa de 600 ml.',price:2000},
    {id:'stella-600',category:'cervejas',name:'Stella 600 ml',description:'Cerveja em garrafa de 600 ml.',price:2500},
    {id:'caipirinha-limao',category:'drinks',name:'Caipirinha de Limão',description:'Drink com álcool.',price:2200},
    {id:'caipirinha-morango',category:'drinks',name:'Caipirinha de Morango',description:'Drink com álcool.',price:2500},
    {id:'gin-tonica',category:'drinks',name:'Gin Tônica',description:'Drink com álcool.',price:3000},
    {id:'aperol',category:'drinks',name:'Aperol Spritz',description:'Drink com álcool.',price:3500},
    {id:'limoncello',category:'drinks',name:'Limoncello Spritz',description:'Drink com álcool.',price:4200},
    {id:'mojito',category:'drinks',name:'Mojito',description:'Drink com álcool.',price:3000},
    {id:'moscow-mule',category:'drinks',name:'Moscow Mule',description:'Drink com álcool.',price:3500},
    {id:'negroni',category:'drinks',name:'Negroni',description:'Drink com álcool.',price:3500},
    {id:'jack-coke',category:'drinks',name:'Jack & Coke',description:'Drink com álcool.',price:3200},
    {id:'cookies',category:'doces',name:'Cookies',description:'Para completar seu pedido.',price:1600},
    {id:'shake-ovomaltine',category:'doces',name:'Milk Shake Ovomaltine',description:'Milk shake sabor Ovomaltine.',price:2500},
    {id:'shake-morango',category:'doces',name:'Milk Shake Morango',description:'Milk shake sabor morango.',price:2500},
    {id:'shake-caramelo',category:'doces',name:'Milk Shake Caramelo',description:'Milk shake sabor caramelo.',price:2500}
  ]
};
