/* Business profile data, assigned to a global so the page works over file://
 * (no server). Images = local paths or URLs.
 *
 * DEMO MODE: window.PROFILE_DEMOS holds 3 sample businesses (menu / product /
 * service); a top-right switcher flips between them (selection kept in URL hash).
 * FOR A REAL BUSINESS: delete PROFILE_DEMOS + the picker block at the bottom and
 * assign window.PROFILE = { ... } directly — the switcher then never renders.
 *
 * modules: { posts, catalog, reviews } — which sections render.
 * catalog.layout: 'product' (card grid) | 'menu' (rows) | 'service' (rows).
 * catalog item: { id*, name*, price | priceText, oldPrice, desc, media:[],
 *   collection, badge, duration, variants:[{ label, options:[] }] }. */

/* ============================ DEMO 1: MENU (café) ============================ */
var DEMO_MENU = {
  name: 'Lavanta Kahve',
  username: 'lavantakahve',
  category: 'Kahve Dükkânı · Fırın',
  verified: true,
  logo: 'https://picsum.photos/seed/lavanta-logo/240/240',
  bio: 'Üçüncü nesil kahve ve her sabah taze fırın. ☕🥐\nModa\'nın kalbinde, 2014\'ten beri.',

  modules: { posts: true, catalog: true, reviews: true },

  contact: {
    address: 'Caferağa Mah. Moda Cad. No:12, Kadıköy / İstanbul',
    phone: '+902165550123',
    phoneLabel: '+90 216 555 01 23',
    email: 'merhaba@lavantakahve.com',
    hours: { mon: ['07:00', '22:00'], tue: ['07:00', '22:00'], wed: ['07:00', '22:00'], thu: ['07:00', '22:00'], fri: ['07:00', '22:00'], sat: ['07:00', '22:00'], sun: ['07:00', '22:00'] },
    maps: 'https://www.google.com/maps/search/?api=1&query=Moda+Caddesi+Kadikoy'
  },
  social: {
    instagram: 'https://instagram.com/lavantakahve',
    whatsapp: 'https://wa.me/902165550123'
  },

  order: { intro: 'Merhaba, aşağıdaki siparişi vermek istiyorum:' },

  catalog: {
    layout: 'menu',
    title: 'Menü',
    currency: '₺',
    cartVerb: 'Sepete Ekle',
    collections: [
      { id: 'coffee',  name: 'Kahveler' },
      { id: 'bakery',  name: 'Fırın' },
      { id: 'cold',    name: 'Soğuk İçecekler' },
      { id: 'dessert', name: 'Tatlılar' }
    ],
    items: [
      { id: 'c1', collection: 'coffee', name: 'Filtre Kahve',     price: 75,  desc: 'Günlük taze çekirdek, V60 ile elden demleme. Etiyopya ve Kolombiya menşeli çekirdekleri haftalık kavuruyoruz; çiçeksi aromalar ve dengeli bir asiditeyle servis edilir. Sütlü veya sade tercih edebilir, dilerseniz çekirdeğini öğütülmüş olarak eve götürebilirsiniz. Demleme yöntemini damak zevkinize göre baristamızla birlikte seçebilirsiniz.', media: ['https://picsum.photos/seed/mk-c1/800/1000'] },
      { id: 'c2', collection: 'coffee', name: 'Flat White',       price: 95,  desc: 'Çift shot espresso, kadifemsi süt.',         media: ['https://picsum.photos/seed/mk-c2/800/1000'] },
      { id: 'c3', collection: 'coffee', name: 'Türk Kahvesi',     price: 60,  desc: 'Közde, orta şekerli servis edilir.',         media: ['https://picsum.photos/seed/mk-c3/800/1000'] },
      { id: 'b1', collection: 'bakery', name: 'Tereyağlı Kruvasan', price: 70, badge: 'Popüler', desc: 'Her sabah taze, katmer katmer.', media: ['https://picsum.photos/seed/mk-b1/800/1000'] },
      { id: 'b2', collection: 'bakery', name: 'Pain au Chocolat', price: 80,  desc: 'Belçika çikolatası ile.',                    media: ['https://picsum.photos/seed/mk-b2/800/1000'] },
      { id: 'k1', collection: 'cold',   name: 'Cold Brew',        price: 90,  desc: '18 saat soğuk demleme.',                     media: ['https://picsum.photos/seed/mk-k1/800/1000'] },
      { id: 'k2', collection: 'cold',   name: 'Buzlu Latte',      price: 95,  desc: 'Bol buz, ev yapımı vanilya.',                media: ['https://picsum.photos/seed/mk-k2/800/1000'] },
      { id: 'd1', collection: 'dessert', name: 'Limonlu Cheesecake', price: 120, oldPrice: 140, badge: 'İndirim', desc: 'New York usulü, taze limon.', media: ['https://picsum.photos/seed/mk-d1/800/1000'] },
      { id: 'd2', collection: 'dessert', name: 'Tarçınlı Rulo',   price: 85,  desc: 'El yapımı, sınırlı sayıda.',                 media: ['https://picsum.photos/seed/mk-d2/800/1000'] }
    ]
  },

  reviews: {
    rating: 4.8,
    count: 213,
    items: [
      { author: 'Elif Y.',   rating: 5, date: '2026-05-30', text: 'Moda\'nın en iyi filtre kahvesi. Kruvasanlar inanılmaz taze, sabah ilk işim buraya uğramak.' },
      { author: 'Can D.',    rating: 5, date: '2026-05-27', text: 'Sabah kahvaltısı için harika bir mekan, personel çok ilgili. Flat white favorim.' },
      { author: 'Selin K.',  rating: 4, date: '2026-05-19', text: 'Cold brew favorim oldu. Hafta sonu biraz kalabalık olabiliyor ama beklemeye değer.' },
      { author: 'Murat A.',  rating: 5, date: '2026-05-11', text: 'Cheesecake bir harika, espresso da tam kıvamında. Kesinlikle tavsiye ederim.' },
      { author: 'Zeynep B.', rating: 5, date: '2026-05-03', text: 'Tarçınlı rulosu için özel geliyorum. Atmosfer çok huzurlu, çalışmak için bile ideal.' },
      { author: 'Ahmet T.',  rating: 3, date: '2026-04-22', text: 'Kahve güzel ama hafta sonu servis biraz yavaştı. Yine de lezzetliydi.' },
      { author: 'Deniz Ö.',  rating: 5, date: '2026-04-05', text: 'Üçüncü nesil kahve farkını hissediyorsunuz. Çekirdekleri paket olarak da alabiliyorsunuz.' },
      { author: 'Burcu S.',  rating: 4, date: '2026-03-26', text: 'Şirin bir Moda mekanı. Pain au chocolat tam Fransız usulü olmuş.' }
    ]
  },

  faq: [
    { q: 'Rezervasyon alıyor musunuz?', a: 'Hafta sonu brunch için rezervasyon öneririz; telefon veya WhatsApp\'tan ulaşabilirsiniz.' },
    { q: 'Paket servis var mı?', a: 'Evet, menünün tamamı paket olarak hazırlanır. Sipariş için arayabilir ya da WhatsApp\'tan yazabilirsiniz.' },
    { q: 'Çekirdek satıyor musunuz?', a: 'Tek köken çekirdeklerimizi tane veya öğütülmüş olarak satın alabilirsiniz.' },
    { q: 'Vegan / glutensiz seçenek var mı?', a: 'Bitki bazlı süt alternatiflerimiz ve birkaç glutensiz tatlı seçeneğimiz mevcut.' },
    { q: 'Wi-Fi ve çalışma alanı var mı?', a: 'Ücretsiz Wi-Fi ve prizli masalarımız var; sabah saatleri çalışmak için daha sakindir.' }
  ],

  posts: [
    { id: 'p1',  type: 'image',   media: ['https://picsum.photos/seed/lk1/800/1000'],  caption: 'Günün kahvesi: Etiyopya Yirgacheffe. Çiçeksi ve narin. ☕', location: 'Lavanta Kahve · Moda', date: '2026-05-29' },
    { id: 'p2',  type: 'gallery', media: ['https://picsum.photos/seed/lk2a/800/1000','https://picsum.photos/seed/lk2b/800/1000','https://picsum.photos/seed/lk2c/800/1000'], caption: 'Fırından yeni çıktı: kruvasan, pain au chocolat ve poğaça. 🥐', date: '2026-05-28' },
    { id: 'p3',  type: 'image',   media: ['https://picsum.photos/seed/lk3/800/1000'],  caption: 'Sabahın ilk ışığı ve sıcak bir filtre kahve. 🌅', location: 'Moda Sahili', date: '2026-05-27' },
    { id: 'p4',  type: 'video',   media: ['https://picsum.photos/seed/lk4/800/1000'], video: ['https://download.samplelib.com/mp4/sample-5s.mp4', 'https://media.w3.org/2010/05/sintel/trailer.mp4'], caption: 'Baristamızdan kısa bir video (test). ☕✨', date: '2026-05-26' },
    { id: 'p5',  type: 'image',   media: ['https://picsum.photos/seed/lk5/800/1000'],  caption: 'Soğuk demleme (cold brew) sezonu başladı. ❄️', date: '2026-05-25' },
    { id: 'p6',  type: 'gallery', media: ['https://picsum.photos/seed/lk6a/800/1000','https://picsum.photos/seed/lk6b/800/1000'], caption: 'Hafta sonu brunch keyfi. Rezervasyon önerilir. 🍳🥑', location: 'Lavanta Kahve', date: '2026-05-24' },
    { id: 'p7',  type: 'image',   media: ['https://picsum.photos/seed/lk7/800/1000'],  caption: 'Mükemmel espresso çekimi. ⏱️', date: '2026-05-23' },
    { id: 'p8',  type: 'image',   media: ['https://picsum.photos/seed/lk8/800/1000'],  caption: 'El yapımı tarçınlı rulo, sınırlı sayıda. 🌀', date: '2026-05-22' },
    { id: 'p9',  type: 'gallery', media: ['https://picsum.photos/seed/lk9a/800/1000','https://picsum.photos/seed/lk9b/800/1000','https://picsum.photos/seed/lk9c/800/1000','https://picsum.photos/seed/lk9d/800/1000'], caption: 'Tek köken çekirdeklerimiz. Kavurma günümüz salı. 🔥', date: '2026-05-21' },
    { id: 'p10', type: 'image',   media: ['https://picsum.photos/seed/lk10/800/1000'], caption: 'Kitap, kahve ve sohbet için sevdiğimiz köşe. 📚', date: '2026-05-20' },
    { id: 'p11', type: 'image',   media: ['https://picsum.photos/seed/lk11/800/1000'], caption: 'Taze demlenmiş V60. ☕', date: '2026-05-19' },
    { id: 'p12', type: 'image',   media: ['https://picsum.photos/seed/lk12/800/1000'], caption: 'Taze öğütülmüş çekirdeğin kokusu. ', date: '2026-05-18' },
    { id: 'p13', type: 'image',   media: ['https://picsum.photos/seed/lk13/800/1000'], caption: 'Limonlu cheesecake bugün vitrinte. 🍰', date: '2026-05-17' },
    { id: 'p14', type: 'gallery', media: ['https://picsum.photos/seed/lk14a/800/1000','https://picsum.photos/seed/lk14b/800/1000','https://picsum.photos/seed/lk14c/800/1000'], caption: 'Yeni sezon menümüz hazır. ', location: 'Lavanta Kahve', date: '2026-05-16' },
    { id: 'p15', type: 'image',   media: ['https://picsum.photos/seed/lk15/800/1000'], caption: 'Sabah telaşı başladı. ', location: 'Kadıköy', date: '2026-05-15' },
    { id: 'p16', type: 'image',   media: ['https://picsum.photos/seed/lk16/800/1000'], caption: 'Kadifemsi bir flat white. ', date: '2026-05-14' },
    { id: 'p17', type: 'image',   media: ['https://picsum.photos/seed/lk17/800/1000'], caption: 'Süt köpürtme sanatı. ', date: '2026-05-13' },
    { id: 'p18', type: 'image',   media: ['https://picsum.photos/seed/lk18/800/1000'], caption: 'Bahçe katımız bahara açıldı. 🌿', date: '2026-05-12' },
    { id: 'p19', type: 'gallery', media: ['https://picsum.photos/seed/lk19a/800/1000','https://picsum.photos/seed/lk19b/800/1000'], caption: 'Kavurma günü: dükkân mis gibi. ', date: '2026-05-11' },
    { id: 'p20', type: 'image',   media: ['https://picsum.photos/seed/lk20/800/1000'], caption: 'Akşamüstü huzuru. ', date: '2026-05-10' },
    { id: 'p21', type: 'image',   media: ['https://picsum.photos/seed/lk21/800/1000'], caption: 'Yeni el yapımı fincanlarımız geldi. ', date: '2026-05-09' },
    { id: 'p22', type: 'image',   media: ['https://picsum.photos/seed/lk22/800/1000'], caption: 'Pour over: sabırla, yavaşça. ', date: '2026-05-08' },
    { id: 'p23', type: 'image',   media: ['https://picsum.photos/seed/lk23/800/1000'], caption: 'Çift çikolatalı kurabiye. 🍪', date: '2026-05-07' },
    { id: 'p24', type: 'image',   media: ['https://picsum.photos/seed/lk24/800/1000'], caption: 'Bizi tercih ettiğiniz için teşekkürler! 🙏', date: '2026-05-06' }
  ]
};

/* ======================== DEMO 2: PRODUCT (jewelry) ======================== */
var DEMO_PRODUCT = {
  name: 'Mira Mücevher',
  username: 'miramucevher',
  category: 'Takı & Mücevher',
  verified: true,
  logo: 'https://picsum.photos/seed/mira-logo/240/240',
  bio: 'El işçiliği gümüş ve altın takılar. ✨\nİstanbul tasarımı, dünyaya kargo.',

  modules: { posts: true, catalog: true, reviews: true },

  contact: {
    address: 'Serdar-ı Ekrem Sok. No:8, Galata / İstanbul',
    phone: '+902125550456',
    phoneLabel: '+90 212 555 04 56',
    email: 'siparis@miramucevher.com',
    hours: { mon: ['10:00', '19:00'], tue: ['10:00', '19:00'], wed: ['10:00', '19:00'], thu: ['10:00', '19:00'], fri: ['10:00', '19:00'], sat: ['10:00', '19:00'], sun: null },
    maps: 'https://www.google.com/maps/search/?api=1&query=Galata+Serdari+Ekrem'
  },
  social: {
    instagram: 'https://instagram.com/miramucevher',
    whatsapp: 'https://wa.me/902125550456'
  },

  order: { intro: 'Merhaba, aşağıdaki ürünleri sipariş etmek istiyorum:' },

  catalog: {
    layout: 'product',
    title: 'Ürünler',
    currency: '₺',
    cartVerb: 'Sepete Ekle',
    collections: [
      { id: 'rings',     name: 'Yüzükler' },
      { id: 'necklaces', name: 'Kolyeler' },
      { id: 'earrings',  name: 'Küpeler' },
      { id: 'bracelets', name: 'Bileklikler' }
    ],
    items: [
      { id: 'r1', collection: 'rings', name: 'Ay Işığı Yüzük', price: 1450, badge: 'Yeni',
        desc: '925 ayar gümüş üzerine el işçiliğiyle yerleştirilmiş doğal aytaşı. Her taş benzersiz olduğundan tonlar hafif farklılık gösterebilir. Hipoalerjenik, günlük kullanıma uygundur; suyla teması sonrası yumuşak bir bezle kurulamak ömrünü uzatır. Beden konusunda emin değilseniz mesajdan ölçünüzü iletin, ücretsiz ayarlıyoruz. Özel kadife kutusunda, hediyeye hazır şekilde gönderilir.',
        media: ['https://picsum.photos/seed/mr-r1a/800/1000','https://picsum.photos/seed/mr-r1b/800/1000'],
        variants: [ { label: 'Beden', options: ['10', '12', '14', '16'] }, { label: 'Renk', options: ['Gümüş', 'Altın Kaplama'] } ] },
      { id: 'r2', collection: 'rings', name: 'Sonsuzluk Yüzük', price: 980,
        desc: 'İnce sonsuzluk detaylı, günlük kullanıma uygun.',
        media: ['https://picsum.photos/seed/mr-r2/800/1000'],
        variants: [ { label: 'Beden', options: ['10', '12', '14'] } ] },
      { id: 'n1', collection: 'necklaces', name: 'Zeytin Dalı Kolye', price: 1690, oldPrice: 1990, badge: 'İndirim',
        desc: '14 ayar altın kaplama, 45 cm zincir.',
        media: ['https://picsum.photos/seed/mr-n1a/800/1000','https://picsum.photos/seed/mr-n1b/800/1000','https://picsum.photos/seed/mr-n1c/800/1000'],
        variants: [ { label: 'Zincir', options: ['40 cm', '45 cm', '50 cm'] } ] },
      { id: 'n2', collection: 'necklaces', name: 'İsme Özel Kolye', priceText: 'Tasarıma göre fiyat',
        desc: 'İstediğiniz ismi gümüş üzerine işliyoruz. Mesajla iletin.',
        media: ['https://picsum.photos/seed/mr-n2/800/1000'] },
      { id: 'e1', collection: 'earrings', name: 'Damla Küpe', price: 760,
        desc: 'Hafif, hipoalerjenik. Günlük şıklık.',
        media: ['https://picsum.photos/seed/mr-e1/800/1000'],
        variants: [ { label: 'Renk', options: ['Gümüş', 'Rose'] } ] },
      { id: 'e2', collection: 'earrings', name: 'Halka Küpe Seti', price: 540, badge: 'Çok Satan',
        desc: '3\'lü farklı boy halka seti.',
        media: ['https://picsum.photos/seed/mr-e2/800/1000'] },
      { id: 'b1', collection: 'bracelets', name: 'Düğüm Bileklik', price: 690,
        desc: 'Ayarlanabilir, su geçirmez ip + gümüş detay.',
        media: ['https://picsum.photos/seed/mr-b1/800/1000'],
        variants: [ { label: 'Renk', options: ['Siyah', 'Bej', 'Lacivert'] } ] },
      { id: 'b2', collection: 'bracelets', name: 'İnci Bileklik', price: 820,
        desc: 'Tatlısu incisi, gümüş kapama.',
        media: ['https://picsum.photos/seed/mr-b2/800/1000'] }
    ]
  },

  reviews: {
    rating: 4.9,
    count: 158,
    items: [
      { author: 'Zeynep T.', rating: 5, date: '2026-05-29', text: 'Ay ışığı yüzük fotoğraftakinden çok daha güzel geldi. Kutusu bile özel, teşekkürler!' },
      { author: 'Ayşe M.',   rating: 5, date: '2026-05-22', text: 'İsme özel kolye sipariş ettim, hediye olarak mükemmeldi. Kargo da çok hızlıydı.' },
      { author: 'Deniz S.',  rating: 4, date: '2026-05-10', text: 'Kargo biraz geç geldi ama ürün kalitesi çok iyi, gümüş gerçekten sağlam.' },
      { author: 'Selin A.',  rating: 5, date: '2026-05-02', text: 'El işçiliği belli oluyor. Damla küpeleri her gün takıyorum, hiç kararmadı.' },
      { author: 'Merve K.',  rating: 5, date: '2026-04-20', text: 'İnci bileklik beklediğimden çok daha şık. Paketleme de çok özenliydi.' },
      { author: 'Gül B.',    rating: 5, date: '2026-04-08', text: 'Sonsuzluk yüzüğünü eşime aldım, bayıldı. Beden değişimi de sorunsuz oldu.' },
      { author: 'Ece Y.',    rating: 4, date: '2026-03-30', text: 'Tasarımlar çok zarif. Tek eksik, biraz daha fazla renk seçeneği olabilir.' },
      { author: 'Naz D.',    rating: 5, date: '2026-03-22', text: 'Galata\'daki atölyeyi de ziyaret ettim, çok sıcak karşıladılar.' }
    ]
  },

  faq: [
    { q: 'Kargo ne kadar sürer?', a: 'Siparişler 1-3 iş günü içinde hazırlanır; kargo Türkiye geneli 1-2 günde teslim edilir.' },
    { q: 'İade ve değişim mümkün mü?', a: 'Kullanılmamış ürünlerde 14 gün içinde iade/değişim yapabilirsiniz. İsme özel ürünler bunun dışındadır.' },
    { q: 'Ürünler gerçek gümüş mü?', a: 'Tüm ürünlerimiz 925 ayar gümüştür; altın kaplama seçenekleri ürün açıklamasında belirtilir.' },
    { q: 'Beden değişimi yapıyor musunuz?', a: 'Yüzüklerde beden değişimini ücretsiz yapıyoruz; ölçünüzü WhatsApp\'tan iletmeniz yeterli.' },
    { q: 'Hediye paketi var mı?', a: 'Tüm siparişler özel kutusunda gönderilir; not eklemek isterseniz sipariş mesajında belirtin.' }
  ],

  posts: [
    { id: 'mp1', type: 'gallery', media: ['https://picsum.photos/seed/mira1a/800/1000','https://picsum.photos/seed/mira1b/800/1000'], caption: 'Yeni koleksiyon: Ay Işığı serisi. ✨', date: '2026-05-28' },
    { id: 'mp2', type: 'image',   media: ['https://picsum.photos/seed/mira2/800/1000'], caption: 'Atölyemizden bir kare. El işçiliği. 🔨', location: 'Galata', date: '2026-05-24' },
    { id: 'mp3', type: 'image',   media: ['https://picsum.photos/seed/mira3/800/1000'], caption: 'İsme özel kolyeler en sevdiğimiz hediye. 💝', date: '2026-05-20' },
    { id: 'mp4', type: 'gallery', media: ['https://picsum.photos/seed/mira4a/800/1000','https://picsum.photos/seed/mira4b/800/1000','https://picsum.photos/seed/mira4c/800/1000'], caption: 'Küpe detayları. Hangisi favoriniz?', date: '2026-05-15' },
    { id: 'mp5', type: 'image',   media: ['https://picsum.photos/seed/mira5/800/1000'], caption: 'Paketleme aşaması. Her sipariş özenle hazırlanır. 🎁', date: '2026-05-11' },
    { id: 'mp6', type: 'image',   media: ['https://picsum.photos/seed/mira6/800/1000'], caption: 'Bahar koleksiyonu vitrinde. 🌸', date: '2026-05-06' }
  ]
};

/* ======================= DEMO 3: SERVICE (tattoo & nails) ======================= */
var DEMO_SERVICE = {
  name: 'Ink & Soul Studio',
  username: 'inkandsoul',
  category: 'Dövme & Tırnak Stüdyosu',
  verified: true,
  logo: 'https://picsum.photos/seed/inksoul-logo/240/240',
  bio: 'Dövme · tırnak · piercing. 🖤\nRandevu ile çalışıyoruz. Hijyen sertifikalı.',

  modules: { posts: true, catalog: true, reviews: true },

  contact: {
    address: 'İstiklal Cad. No:121, Beyoğlu / İstanbul',
    phone: '+902125550789',
    phoneLabel: '+90 212 555 07 89',
    email: 'randevu@inkandsoul.com',
    hours: { mon: null, tue: ['12:00', '21:00'], wed: ['12:00', '21:00'], thu: ['12:00', '21:00'], fri: ['12:00', '21:00'], sat: ['12:00', '21:00'], sun: ['12:00', '21:00'] },
    maps: 'https://www.google.com/maps/search/?api=1&query=Istiklal+Caddesi+Beyoglu'
  },
  social: {
    instagram: 'https://instagram.com/inkandsoul',
    whatsapp: 'https://wa.me/902125550789'
  },

  order: { intro: 'Merhaba, aşağıdaki hizmetler için randevu almak istiyorum:' },

  catalog: {
    layout: 'service',
    title: 'Hizmetler',
    currency: '₺',
    cartVerb: 'Randevu Listesine Ekle',
    collections: [
      { id: 'tattoo',   name: 'Dövme' },
      { id: 'nail',     name: 'Tırnak' },
      { id: 'piercing', name: 'Piercing' }
    ],
    items: [
      { id: 't1', collection: 'tattoo', name: 'Minimal Dövme', duration: '1 saat', price: 1200,
        desc: 'İnce çizgili, sade tasarımlar için idealdir (yaklaşık 5 cm). Ön görüşmede tasarımı birlikte netleştirir, şablonu cildinize uygulamadan önce onayınızı alırız. Tek kullanımlık steril iğne ve sertifikalı malzeme kullanılır. İşlem sonrası bakım kitini ve detaylı talimatları sizinle paylaşırız; ilk hafta nemlendirme ve güneşten korunma önemlidir. Süre, tasarımın detayına göre değişebilir.',
        media: ['https://picsum.photos/seed/is-t1/800/1000'] },
      { id: 't2', collection: 'tattoo', name: 'Orta Boy Dövme', duration: '2-3 saat', priceText: 'Tasarıma göre',
        desc: 'Kol / bacak çalışmaları. Ön görüşme ile fiyatlandırılır.',
        media: ['https://picsum.photos/seed/is-t2a/800/1000','https://picsum.photos/seed/is-t2b/800/1000'] },
      { id: 't3', collection: 'tattoo', name: 'Kapatma / Düzeltme', duration: 'Görüşmeli', priceText: 'Tasarıma göre',
        desc: 'Eski dövme üzerine kapatma çalışması.',
        media: ['https://picsum.photos/seed/is-t3/800/1000'] },
      { id: 'n1', collection: 'nail', name: 'Kalıcı Oje', duration: '45 dk', price: 450, badge: 'Popüler',
        desc: 'Jel ojeli manikür, 3 hafta dayanır.',
        media: ['https://picsum.photos/seed/is-n1/800/1000'] },
      { id: 'n2', collection: 'nail', name: 'Protez Tırnak', duration: '90 dk', price: 750,
        desc: 'Şekillendirme + tasarım dahil.',
        media: ['https://picsum.photos/seed/is-n2a/800/1000','https://picsum.photos/seed/is-n2b/800/1000'] },
      { id: 'n3', collection: 'nail', name: 'Nail Art', duration: '+30 dk', price: 200,
        desc: 'El çizimi tasarımlar (mevcut işleme ek).',
        media: ['https://picsum.photos/seed/is-n3/800/1000'] },
      { id: 'p1', collection: 'piercing', name: 'Kulak Piercing', duration: '20 dk', price: 350,
        desc: 'Steril, tek kullanımlık iğne. Küpe dahil.',
        media: ['https://picsum.photos/seed/is-p1/800/1000'] },
      { id: 'p2', collection: 'piercing', name: 'Burun Piercing', duration: '20 dk', price: 400,
        desc: 'Hijyen sertifikalı uygulama.',
        media: ['https://picsum.photos/seed/is-p2/800/1000'] }
    ]
  },

  reviews: {
    rating: 5.0,
    count: 96,
    items: [
      { author: 'Berk A.',   rating: 5, date: '2026-05-30', text: 'İlk dövmem buradaydı, çok rahat hissettirdiler. Sonuç beklediğimden harika oldu.' },
      { author: 'Ece N.',    rating: 5, date: '2026-05-24', text: 'Kalıcı oje gerçekten 3 hafta dayandı, tertemiz ve titiz çalışıyorlar.' },
      { author: 'Kaan Y.',   rating: 5, date: '2026-05-15', text: 'Hijyen konusunda çok dikkatliler. Gönül rahatlığıyla tavsiye ederim.' },
      { author: 'Sıla M.',   rating: 5, date: '2026-05-04', text: 'Fine line çalışması tam istediğim gibi oldu. Sanatçı gerçekten yetenekli.' },
      { author: 'Onur T.',   rating: 5, date: '2026-04-21', text: 'Kapatma dövmesi yaptırdım, eski dövmeyi mükemmel gizlediler.' },
      { author: 'İrem K.',   rating: 4, date: '2026-04-09', text: 'Protez tırnağım çok güzel oldu, randevuya tam vaktinde aldılar. Biraz pahalı ama kaliteli.' },
      { author: 'Mert D.',   rating: 5, date: '2026-03-29', text: 'Burun piercingim sorunsuz iyileşti, bakım önerileri çok yardımcı oldu.' },
      { author: 'Pelin S.',  rating: 5, date: '2026-03-20', text: 'Nail art tasarımları bir harika. Instagram\'daki işleri birebir aynı çıkıyor.' }
    ]
  },

  faq: [
    { q: 'Randevu nasıl alınır?', a: 'WhatsApp\'tan istediğiniz hizmeti ve uygun gününüzü yazmanız yeterli; en kısa sürede dönüyoruz.' },
    { q: 'Hijyen koşullarınız nedir?', a: 'Tek kullanımlık steril iğneler ve sertifikalı sterilizasyon cihazları kullanıyoruz.' },
    { q: 'Dövme fiyatı nasıl belirlenir?', a: 'Tasarımın boyutu, detayı ve süresine göre değişir; ön görüşmede net fiyat veriyoruz.' },
    { q: 'İlk dövme için tavsiyeniz var mı?', a: 'Tok karnına gelin, rahat kıyafet giyin; tasarımı birlikte netleştiriyoruz.' },
    { q: 'Kalıcı oje ne kadar dayanır?', a: 'Doğru bakımla 2-3 hafta dayanır; dolgu için yeniden randevu alabilirsiniz.' }
  ],

  posts: [
    { id: 'sp1', type: 'image',   media: ['https://picsum.photos/seed/ink1/800/1000'], caption: 'Bugünün çalışması: minimal dağ silüeti. 🏔️🖤', location: 'Beyoğlu', date: '2026-05-27' },
    { id: 'sp2', type: 'gallery', media: ['https://picsum.photos/seed/ink2a/800/1000','https://picsum.photos/seed/ink2b/800/1000'], caption: 'Protez tırnak + nail art kombinasyonu. 💅', date: '2026-05-23' },
    { id: 'sp3', type: 'image',   media: ['https://picsum.photos/seed/ink3/800/1000'], caption: 'İnce çizgi (fine line) çalışması. ✨', date: '2026-05-19' },
    { id: 'sp4', type: 'image',   media: ['https://picsum.photos/seed/ink4/800/1000'], caption: 'Stüdyomuzdan bir köşe. Steril ve ferah ortam. 🧼', date: '2026-05-14' },
    { id: 'sp5', type: 'gallery', media: ['https://picsum.photos/seed/ink5a/800/1000','https://picsum.photos/seed/ink5b/800/1000','https://picsum.photos/seed/ink5c/800/1000'], caption: 'Bu haftanın nail art seçkisi. Favoriniz?', date: '2026-05-08' },
    { id: 'sp6', type: 'image',   media: ['https://picsum.photos/seed/ink6/800/1000'], caption: 'Kulak piercing kombinasyonları. 👂', date: '2026-05-03' }
  ]
};

/* ---------------------------------------------------------------- *
 * DEMO PICKER — selects which business to show.
 * Choice is stored in the URL hash (#menu / #product / #service) so it
 * survives a reload on file:// without needing localStorage. The
 * switcher (in app.js) sets the hash and reloads.
 *
 * Remove this whole block for a real single-business deployment and
 * assign window.PROFILE directly.
 * ---------------------------------------------------------------- */
window.PROFILE_DEMOS = { menu: DEMO_MENU, product: DEMO_PRODUCT, service: DEMO_SERVICE };
window.PROFILE_DEMO_LABELS = { menu: 'Kafe', product: 'Mağaza', service: 'Hizmet' };

(function () {
  var key = (window.location.hash || '').replace(/^#/, '');
  if (!window.PROFILE_DEMOS[key]) key = 'menu';
  window.PROFILE_DEMO_KEY = key;
  window.PROFILE = window.PROFILE_DEMOS[key];
})();
