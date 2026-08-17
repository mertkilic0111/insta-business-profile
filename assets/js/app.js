/* Business profile page — application logic (Instagram-styled).
   XSS-safe output via esc(); idempotent guard; no native popups. */
if (typeof window.__BUSINESS_PROFILE_APP === 'undefined') {
  window.__BUSINESS_PROFILE_APP = true;

  (function () {
    'use strict';

    var data = window.PROFILE;
    var icons = window.ICONS || {};
    var layers = null;

    var PAGE_SIZE = 6;        // gonderi / sonsuz-kaydirma sayfasi
    var shownCount = 0;
    var loadingMore = false;
    var observer = null;

    var catalogIndex = {};    // katalog: id -> item (tiklamada hizli erisim)
    var currentCatalogList = []; // o an gosterilen (filtreli) katalog listesi -> detayda urunler arasi gecis
    var postsStarted = false; // gonderi akisi yalnizca sekmesi ilk acildiginda yuklenir
    var activeTab = null;

    /* ----------------------- helpers ----------------------- */
    function icon(name) { return icons[name] || ''; }

    function esc(text) {
      return String(text == null ? '' : text).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
    }

    /* #hashtag / @mention -> colored spans (matched on raw text, then escaped) */
    function processText(text) {
      var raw = String(text == null ? '' : text);
      var pattern = /[#@][0-9A-Za-zçğıöşüÇĞİÖŞÜ_.]+/g;
      var out = '', last = 0, match;
      while ((match = pattern.exec(raw)) !== null) {
        out += esc(raw.slice(last, match.index));
        out += '<span class="tag">' + esc(match[0]) + '</span>';
        last = match.index + match[0].length;
      }
      return out + esc(raw.slice(last));
    }

    var months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    function formatDate(value) {
      var d = new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }
    function summary(text) {
      var t = String(text || '').replace(/\s+/g, ' ').trim();
      return t.length > 60 ? t.slice(0, 60) + '…' : t;
    }

    function bindImage(img, url) {
      if (!img) return;
      var holder = img.parentElement;
      img.addEventListener('load', function () {
        img.classList.add('loaded');
        if (holder) holder.classList.remove('loading');
      });
      img.addEventListener('error', function () {
        img.classList.add('loaded');
        if (holder) { holder.classList.remove('loading'); holder.classList.add('media-error'); }
        img.removeAttribute('src');
      });
      img.src = url;
    }
    function bindImages(root) {
      root.querySelectorAll('img[data-src]').forEach(function (img) {
        var url = img.getAttribute('data-src');
        img.removeAttribute('data-src');
        bindImage(img, url);
      });
    }

    function fillIcons(root) {
      (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
        var name = el.getAttribute('data-icon');
        if (icons[name]) el.innerHTML = icons[name];
      });
    }

    // Arka-plan scroll kilidi — iOS-guvenli: body'yi mevcut scroll konumunda `position:fixed`
    // ile DONDURUR (mobil Safari `overflow:hidden`'i dinlemez, yine kayardi). Referans-sayimli:
    // ic ice overlay'de (detay -> sepet sheet) ic kapanis erken cozmez; son overlay kapaninca
    // scroll konumu geri yuklenir.
    var lockCount = 0;
    var savedScrollY = 0;
    function lockScroll(on) {
      if (on) {
        if (lockCount === 0) {
          savedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
          document.documentElement.classList.add('locked');
          document.body.classList.add('locked');
          document.body.style.top = (-savedScrollY) + 'px';
        }
        lockCount++;
      } else if (lockCount > 0) {
        lockCount--;
        if (lockCount === 0) {
          document.documentElement.classList.remove('locked');
          document.body.classList.remove('locked');
          document.body.style.top = '';
          window.scrollTo(0, savedScrollY);
        }
      }
    }

    // Cihazin GERI hareketi/tusu en USTteki overlay'i kapatir (yigin). Manuel kapatma
    // (X/Esc/disari) overlay'i kapatir + pushlanan history kaydini geri alir; bu geri
    // alisin tetikledigi popstate bir alttaki overlay'i KAPATMASIN diye tek seferlik
    // bastirilir -> ic ice guvenli (detay -> sepet sheet). file://'da pushState calismazsa
    // (pushed=false) history'ye dokunmayiz; overlay yine butonlarla kapanir (regresyon yok).
    var overlayStack = [];
    var suppressPop = 0;
    window.addEventListener('popstate', function () {
      if (suppressPop > 0) { suppressPop--; return; }
      var entry = overlayStack.pop();
      if (entry && entry.active) { entry.active = false; entry.close(); }
    });
    function backDismissable(closeOverlay) {
      var entry = { close: closeOverlay, active: true, pushed: false };
      try { history.pushState({ ovr: 1 }, ''); entry.pushed = true; } catch (e) {}
      overlayStack.push(entry);
      return function dismiss() {
        if (!entry.active) return;
        entry.active = false;
        var i = overlayStack.lastIndexOf(entry);
        if (i >= 0) overlayStack.splice(i, 1);
        closeOverlay();
        if (entry.pushed) { suppressPop++; try { history.back(); } catch (e) {} }
      };
    }

    function isExternal(href) { return /^https?:/i.test(href); }
    function isTouchLayout() { return window.matchMedia('(max-width: 1023px)').matches; }
    function verifiedHtml() {
      return data.verified
        ? '<span class="verified icon" title="Doğrulanmış" aria-label="Doğrulanmış">' + icon('verified') + '</span>'
        : '';
    }
    function userHandle() { return data.username || data.name; }
    function moduleOn(name) { var m = data.modules; return !m || m[name] !== false; }

    /* "1.450 ₺" — yerel binlik ayraci + para birimi */
    function money(value, cat) {
      var cur = (cat && cat.currency) ? ' ' + cat.currency : '';
      var n;
      try { n = Number(value).toLocaleString('tr-TR'); } catch (e) { n = String(value); }
      return n + cur;
    }
    function priceHtml(item, cat) {
      if (item.price != null) {
        return '<span class="price">' + esc(money(item.price, cat)) + '</span>' +
          (item.oldPrice != null ? '<span class="price-old">' + esc(money(item.oldPrice, cat)) + '</span>' : '');
      }
      if (item.priceText) return '<span class="price-text">' + esc(item.priceText) + '</span>';
      return '';
    }

    function reviewsEnabled() { return moduleOn('reviews') && !!data.reviews && typeof data.reviews.rating === 'number'; }
    // Iki katman: gri 5-yildiz zemin + uzerine yuzdeyle kirpilmis altin katman.
    // Ozdes ikonlar ust uste -> hizalama kaymasi olmaz, her kesirli puan tam gosterilir.
    function starsHtml(rating, cls) {
      var pct = Math.max(0, Math.min(100, (Number(rating) || 0) / 5 * 100));
      var five = '';
      for (var i = 0; i < 5; i++) five += icon('star');
      return '<span class="stars' + (cls ? ' ' + cls : '') + '" role="img" aria-label="5 üzerinden ' + esc(String(rating).replace('.', ',')) + '">' +
        '<span class="stars-bg">' + five + '</span>' +
        '<span class="stars-fg" style="width:' + pct + '%">' + five + '</span>' +
      '</span>';
    }
    function relativeTime(value) {
      var then = new Date(value);
      if (isNaN(then.getTime())) return '';
      var days = Math.floor((Date.now() - then.getTime()) / 86400000);
      if (days <= 0) return 'bugün';
      if (days === 1) return 'dün';
      if (days < 7) return days + ' gün önce';
      if (days < 14) return 'geçen hafta';
      if (days < 30) return Math.floor(days / 7) + ' hafta önce';
      if (days < 60) return 'geçen ay';
      if (days < 365) return Math.floor(days / 30) + ' ay önce';
      var years = Math.floor(days / 365);
      return years === 1 ? 'geçen yıl' : years + ' yıl önce';
    }
    function reviewInitials(name) {
      var parts = String(name || '').trim().split(/\s+/);
      return (((parts[0] || '')[0] || '?') + ((parts[1] || '')[0] || '')).toUpperCase();
    }
    var AVATAR_PALETTE = ['#1e88e5', '#8e24aa', '#00897b', '#e91e63', '#3949ab', '#43a047', '#5e35b1', '#00acc1', '#d81b60', '#7cb342'];
    function avatarColor(name) {
      var sum = 0, str = String(name || 'x');
      for (var i = 0; i < str.length; i++) sum += str.charCodeAt(i);
      return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
    }

    /* ----------------------- opening hours (yapilandirilmis saat -> canli durum) ----------------------- */
    var HOURS_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var HOURS_DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    function isStructuredHours(h) { return !!h && typeof h === 'object' && !Array.isArray(h); }
    function hhmmToMin(s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1]); }
    function dayRange(h, dayIndex) { var r = h[HOURS_DAY_KEYS[dayIndex]]; return (r && r.length === 2) ? r : null; }
    // { open, detail } veya yapilandirilmamis saatte null. (Ayni gun araligi; gece-asiri yok.)
    function openStatus(h) {
      if (!isStructuredHours(h)) return null;
      var now = new Date(), dow = now.getDay(), nowMin = now.getHours() * 60 + now.getMinutes();
      var today = dayRange(h, dow);
      if (today) {
        if (nowMin >= hhmmToMin(today[0]) && nowMin < hhmmToMin(today[1])) return { open: true, detail: 'Kapanış ' + today[1] };
        if (nowMin < hhmmToMin(today[0])) return { open: false, detail: 'Açılış bugün ' + today[0] };
      }
      for (var i = 1; i <= 7; i++) {
        var d = (dow + i) % 7, r = dayRange(h, d);
        if (r) return { open: false, detail: 'Açılış ' + (i === 1 ? 'yarın' : HOURS_DAY_NAMES[d]) + ' ' + r[0] };
      }
      return { open: false, detail: '' };
    }
    function weeklyHoursHtml(h) {
      var todayIndex = new Date().getDay();
      return '<div class="hours-table">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) {
        var r = dayRange(h, d);
        return '<div class="hours-day' + (d === todayIndex ? ' today' : '') + '">' +
          '<span class="hd-name">' + HOURS_DAY_NAMES[d] + '</span>' +
          '<span class="hd-val">' + (r ? esc(r[0] + ' – ' + r[1]) : 'Kapalı') + '</span></div>';
      }).join('') + '</div>';
    }

    /* ----------------------- header ----------------------- */
    function renderHeader() {
      var header = document.getElementById('header');
      var rv = data.reviews;
      var status = openStatus((data.contact || {}).hours);
      header.innerHTML =
        '<span class="logo-ring"><img class="logo" data-src="' + esc(data.logo) + '" data-key="logo" alt="' + esc(data.name) + ' logosu"></span>' +
        '<h1 class="business-name">' + esc(data.name) + verifiedHtml() + '</h1>' +
        (data.category ? '<div class="category">' + esc(data.category) + '</div>' : '') +
        (data.bio ? '<p class="bio">' + processText(data.bio) + '</p>' : '') +
        (reviewsEnabled()
          ? '<button class="rating-chip" id="ratingChip" type="button">' + icon('star') +
              '<span class="rating-val">' + esc(String(rv.rating).replace('.', ',')) + '</span>' +
              (rv.count ? '<span class="rating-count">· ' + esc(rv.count) + ' yorum</span>' : '') +
            '</button>'
          : '') +
        (status
          ? '<button class="open-status' + (status.open ? ' is-open' : '') + '" id="hoursStatus" type="button">' +
              '<span class="dot"></span><span class="os-text">' + (status.open ? 'Şu an Açık' : 'Kapalı') + '</span>' +
              (status.detail ? '<span class="os-detail">· ' + esc(status.detail) + '</span>' : '') +
            '</button>'
          : '');
      bindImages(header);
      var chip = document.getElementById('ratingChip');
      if (chip) chip.onclick = openReviewsSheet;
      var hoursBtn = document.getElementById('hoursStatus');
      if (hoursBtn) hoursBtn.onclick = openSheet;   // saat rozeti -> iletisim sheet'i (haftalik tablo)
    }

    /* ----------------------- contact ----------------------- */
    function actionButton(kind, href, iconName, label) {
      var ext = isExternal(href);
      return '<a class="btn btn-' + kind + '" href="' + esc(href) + '"' +
        (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        icon(iconName) + '<span>' + esc(label) + '</span></a>';
    }
    function infoRow(iconName, label, value, href) {
      var inner = '<span class="info-icon">' + icon(iconName) + '</span>' +
        '<span class="info-text"><span class="label">' + esc(label) + '</span>' +
        '<span class="value">' + esc(value) + '</span></span>';
      if (href) {
        var ext = isExternal(href);
        return '<a class="info-row" href="' + esc(href) + '"' +
          (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + inner + '</a>';
      }
      return '<div class="info-row">' + inner + '</div>';
    }

    function renderContact() {
      var c = data.contact || {}, s = data.social || {};
      var actions = [];
      if (c.phone) actions.push(actionButton('primary', 'tel:' + c.phone, 'phone', 'Ara'));
      if (c.maps) actions.push(actionButton('secondary', c.maps, 'directions', 'Yol Tarifi'));
      if (s.whatsapp) actions.push(actionButton('secondary', s.whatsapp, 'whatsapp', 'WhatsApp'));
      if (s.instagram) actions.push(actionButton('secondary', s.instagram, 'instagram', 'Instagram'));
      // Not: "Web Sitesi" butonu yok — sayfanin kendisi zaten web sitesi.

      // Adres/saat/e-posta detaylari icin diger butonlarla AYNI stilde bir pill;
      // ayri bir bar degil, ayni sirada -> sirimaz. Tiklayinca bottom-sheet acar.
      if (c.address || c.hours || c.email) {
        actions.push('<button class="btn btn-secondary" id="infoTrigger" type="button">' +
          icon('location') + '<span>Adres &amp; saatler</span></button>');
      }
      document.getElementById('contact').innerHTML =
        actions.length ? '<div class="actions">' + actions.join('') + '</div>' : '';

      var trigger = document.getElementById('infoTrigger');
      if (trigger) trigger.onclick = openSheet;
    }

    // Ortak alttan-yukari sheet iskeleti (iletisim / sepet / yorumlar paylasir).
    // Doner: { overlay, content, dismiss }. content'e govdeyi yaz, gerisini halleder.
    function openSheetShell(opts) {
      var overlay = document.createElement('div');
      overlay.className = 'sheet-overlay';
      overlay.innerHTML =
        '<div class="sheet ' + (opts.className || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || opts.title) + '">' +
          '<div class="sheet-handle"></div>' +
          '<div class="sheet-head"><span class="sheet-title">' + esc(opts.title) + '</span>' +
            '<span class="sheet-head-right">' + (opts.headActions || '') +
              '<button class="sheet-close" aria-label="Kapat">' + icon('close') + '</button></span>' +
          '</div>' +
          '<div class="sheet-content"></div>' +
        '</div>';
      layers.appendChild(overlay);
      lockScroll(true);
      requestAnimationFrame(function () { overlay.classList.add('open'); });

      function close() {
        overlay.classList.remove('open');
        document.removeEventListener('keydown', onKey);
        setTimeout(function () { overlay.remove(); lockScroll(false); }, 300);
      }
      var dismiss = backDismissable(close);
      function onKey(e) { if (e.key === 'Escape') dismiss(); }
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) dismiss(); });
      overlay.querySelector('.sheet-close').onclick = dismiss;
      document.addEventListener('keydown', onKey);

      return { overlay: overlay, content: overlay.querySelector('.sheet-content'), dismiss: dismiss };
    }

    /* Alttan yukari acilan iletisim modali */
    function openSheet() {
      var c = data.contact || {};
      var rows = [];
      if (c.address) rows.push(infoRow('location', 'Adres', c.address, c.maps || null));
      if (c.hours) {
        if (isStructuredHours(c.hours)) {
          rows.push('<div class="info-row"><span class="info-icon">' + icon('clock') + '</span>' +
            '<span class="info-text"><span class="label">Çalışma Saatleri</span>' + weeklyHoursHtml(c.hours) + '</span></div>');
        } else {
          rows.push(infoRow('clock', 'Çalışma Saatleri', c.hours, null));
        }
      }
      if (c.phone) rows.push(infoRow('phone', 'Telefon', c.phoneLabel || c.phone, 'tel:' + c.phone));
      if (c.email) rows.push(infoRow('mail', 'E-posta', c.email, 'mailto:' + c.email));
      var sheet = openSheetShell({ title: 'İletişim', label: 'İletişim bilgileri' });
      sheet.content.innerHTML = '<div class="info-list">' + rows.join('') + '</div>';
    }

    /* ----------------------- grid + infinite scroll ----------------------- */
    function cellHtml(post, index) {
      var first = (post.media && post.media[0]) || '';
      var badge = post.type === 'gallery' ? '<span class="cell-badge">' + icon('gallery') + '</span>'
                : post.type === 'video' ? '<span class="cell-badge">' + icon('play') + '</span>' : '';
      return '<button class="cell loading" data-index="' + index + '" type="button">' +
        '<img data-src="' + esc(first) + '" data-key="' + esc(post.id) + '" alt="' + esc(summary(post.caption)) + '" loading="lazy">' +
        badge + '<span class="cell-overlay"></span>' +
      '</button>';
    }
    function skeletonHtml(count) {
      var out = '';
      for (var i = 0; i < count; i++) out += '<div class="cell skeleton" aria-hidden="true"></div>';
      return out;
    }

    function loadNextPage() {
      var all = data.posts || [];
      if (loadingMore || shownCount >= all.length) return;
      loadingMore = true;

      var grid = document.getElementById('grid');
      var count = Math.min(PAGE_SIZE, all.length - shownCount);

      grid.insertAdjacentHTML('beforeend', skeletonHtml(count));

      // kasitli kisa gecikme (skeleton fark edilsin), sonra gercek hucrelerle degis
      setTimeout(function () {
        grid.querySelectorAll('.cell.skeleton').forEach(function (s) { s.remove(); });
        var html = '';
        for (var i = 0; i < count; i++) html += cellHtml(all[shownCount + i], shownCount + i);
        grid.insertAdjacentHTML('beforeend', html);
        bindImages(grid);
        shownCount += count;
        loadingMore = false;

        var sentinel = document.getElementById('sentinel');
        if (shownCount >= all.length) {
          if (observer) observer.disconnect();
          if (sentinel) sentinel.hidden = true;
        } else if (observer && sentinel) {
          observer.unobserve(sentinel);
          observer.observe(sentinel);
        }
      }, 450);
    }

    function setupInfiniteScroll() {
      var sentinel = document.getElementById('sentinel');
      if (!sentinel || !('IntersectionObserver' in window)) {
        var all = data.posts || [], grid = document.getElementById('grid'), html = '';
        for (var i = shownCount; i < all.length; i++) html += cellHtml(all[i], i);
        grid.insertAdjacentHTML('beforeend', html);
        bindImages(grid);
        shownCount = all.length;
        return;
      }
      observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) loadNextPage();
      }, { rootMargin: '600px 0px' });
      observer.observe(sentinel);
    }

    /* ----------------------- media (carousel / video) ----------------------- */
    function setupCarousel(container, post) {
      var media = post.media || [];
      var multi = media.length > 1;

      container.innerHTML =
        '<div class="media-wrap">' +
          '<div class="carousel-track">' +
            media.map(function (url, i) {
              return '<div class="slide loading"><img data-src="' + esc(url) + '" data-key="' + esc(post.id + '-' + i) + '" alt=""></div>';
            }).join('') +
          '</div>' +
          (multi
            ? '<button class="carousel-arrow prev" aria-label="Önceki">' + icon('prev') + '</button>' +
              '<button class="carousel-arrow next" aria-label="Sonraki">' + icon('next') + '</button>' +
              '<div class="carousel-counter">1/' + media.length + '</div>' +
              '<div class="carousel-dots">' +
                media.map(function (_, i) { return '<span class="dot' + (i === 0 ? ' active' : '') + '"></span>'; }).join('') +
              '</div>'
            : '') +
        '</div>';

      var wrap = container.querySelector('.media-wrap');
      bindImages(wrap);
      if (!multi) return;

      var track = wrap.querySelector('.carousel-track');
      var i = 0;
      function update() {
        track.style.transform = 'translateX(-' + (i * 100) + '%)';
        wrap.querySelector('.carousel-counter').textContent = (i + 1) + '/' + media.length;
        wrap.querySelectorAll('.dot').forEach(function (d, j) { d.classList.toggle('active', j === i); });
        wrap.querySelector('.carousel-arrow.prev').hidden = i <= 0;
        wrap.querySelector('.carousel-arrow.next').hidden = i >= media.length - 1;
      }
      function go(step) { var n = i + step; if (n >= 0 && n < media.length) { i = n; update(); } }
      wrap.querySelector('.carousel-arrow.prev').onclick = function (e) { e.stopPropagation(); go(-1); };
      wrap.querySelector('.carousel-arrow.next').onclick = function (e) { e.stopPropagation(); go(1); };

      // touch swipe (Instagram-style on mobile)
      var startX = null;
      wrap.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      wrap.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX; startX = null;
        if (Math.abs(dx) < 40) return;
        go(dx < 0 ? 1 : -1);
      }, { passive: true });

      update();
    }

    /* Play the video only while it is in view (Instagram behavior) */
    function playOnView(video) {
      if (!('IntersectionObserver' in window)) { video.play().catch(function () {}); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && en.intersectionRatio >= 0.5) video.play().catch(function () {});
          else video.pause();
        });
      }, { threshold: [0, 0.5, 1] });
      video.__io = io;            // kapanista disconnect edebilmek icin sakla
      io.observe(video);
    }

    // Overlay kapanirken videolarin oynatmasini durdur + IntersectionObserver'larini
    // birak. Yoksa her post acilis/kapanisinda gozlemci & video birikir -> jank/sizinti.
    function durdurVideolar(kok) {
      kok.querySelectorAll('video').forEach(function (vid) {
        try { vid.pause(); } catch (e) {}
        if (vid.__io) { vid.__io.disconnect(); vid.__io = null; }
      });
    }

    function mediaInto(container, post) {
      if (post.type === 'video' && post.video) {
        var poster = (post.media && post.media[0]) || '';
        var sources = (Array.isArray(post.video) ? post.video : [post.video])
          .map(function (u) { return '<source src="' + esc(u) + '" type="video/mp4">'; }).join('');
        container.innerHTML =
          '<div class="media-wrap">' +
            '<video class="post-video" poster="' + esc(poster) + '" autoplay muted loop playsinline preload="auto">' + sources + '</video>' +
            '<button class="mute-btn" aria-label="Sesi aç">' + icon('volume_off') + '</button>' +
          '</div>';
        var wrap = container.querySelector('.media-wrap');
        var video = wrap.querySelector('video');
        video.muted = true;   // dinamik <video>'da autoplay garantisi (attribute her zaman yetmez)
        var muteBtn = wrap.querySelector('.mute-btn');
        muteBtn.onclick = function (e) {
          e.stopPropagation();
          video.muted = !video.muted;
          muteBtn.innerHTML = icon(video.muted ? 'volume_off' : 'volume');
          muteBtn.setAttribute('aria-label', video.muted ? 'Sesi aç' : 'Sesi kapat');
          if (!video.muted) video.play().catch(function () {});
        };
        // tap to play/pause (autoplay engellenirse yedek + IG tarzi)
        video.addEventListener('click', function () {
          if (video.paused) video.play().catch(function () {}); else video.pause();
        });
        playOnView(video);
        return;
      }
      setupCarousel(container, post);
    }

    /* ----------------------- post view: desktop modal ----------------------- */
    function infoHtml(post) {
      return '<div class="lb-head">' +
          '<span class="avatar-ring"><img class="mini-logo" data-src="' + esc(data.logo) + '" data-key="logo" alt=""></span>' +
          '<div class="lb-head-text"><div class="lb-name">' + esc(userHandle()) + verifiedHtml() + '</div>' +
            (post.location ? '<div class="lb-loc">' + icon('location') + esc(post.location) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="lb-body">' +
          '<div class="lb-caption"><span class="lb-author">' + esc(userHandle()) + '</span>' + processText(post.caption || '') + '</div>' +
          (post.date ? '<div class="lb-date">' + formatDate(post.date) + '</div>' : '') +
        '</div>';
    }

    function openModal(index) {
      var posts = data.posts || [];
      if (!posts[index]) return;
      var current = index;

      var overlay = document.createElement('div');
      overlay.className = 'overlay';
      overlay.innerHTML =
        '<button class="overlay-close" aria-label="Kapat">' + icon('close') + '</button>' +
        '<button class="overlay-nav prev" aria-label="Önceki gönderi">' + icon('prev') + '</button>' +
        '<button class="overlay-nav next" aria-label="Sonraki gönderi">' + icon('next') + '</button>' +
        '<div class="lightbox" role="dialog" aria-modal="true" aria-label="Gönderi">' +
          '<div class="lightbox-media"></div>' +
          '<div class="lightbox-info"></div>' +
        '</div>';
      layers.appendChild(overlay);
      lockScroll(true);

      var prevBtn = overlay.querySelector('.overlay-nav.prev');
      var nextBtn = overlay.querySelector('.overlay-nav.next');

      function close() {
        durdurVideolar(overlay);
        overlay.remove(); lockScroll(false); document.removeEventListener('keydown', onKey);
      }
      function go(step) { var n = current + step; if (n < 0 || n >= posts.length) return; current = n; fill(); }
      function onKey(e) {
        if (e.key === 'Escape') dismiss();
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'ArrowRight') go(1);
      }
      function fill() {
        var post = posts[current];
        prevBtn.hidden = current <= 0;
        nextBtn.hidden = current >= posts.length - 1;
        mediaInto(overlay.querySelector('.lightbox-media'), post);
        var info = overlay.querySelector('.lightbox-info');
        info.innerHTML = infoHtml(post);
        bindImages(info);
      }

      var dismiss = backDismissable(close);
      overlay.querySelector('.overlay-close').onclick = dismiss;
      prevBtn.onclick = function () { go(-1); };
      nextBtn.onclick = function () { go(1); };
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) dismiss(); });
      document.addEventListener('keydown', onKey);
      fill();
    }

    /* ----------------------- post view: mobile feed ----------------------- */
    function feedCardHtml(post) {
      return '<article class="feed-card">' +
        '<div class="fc-head">' +
          '<span class="avatar-ring"><img class="mini-logo" data-src="' + esc(data.logo) + '" data-key="logo" alt=""></span>' +
          '<div class="fc-head-text">' +
            '<div class="fc-name">' + esc(userHandle()) + verifiedHtml() + '</div>' +
            (post.location ? '<div class="fc-loc">' + esc(post.location) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="fc-media"></div>' +
        '<div class="fc-body">' +
          '<div class="fc-caption"><span class="fc-author">' + esc(userHandle()) + '</span>' + processText(post.caption || '') + '</div>' +
          (post.date ? '<div class="fc-date">' + formatDate(post.date) + '</div>' : '') +
        '</div>' +
      '</article>';
    }

    function openFeed(index) {
      // TUM gonderiler render edilir; dokunulan gonderi tam en uste konumlandirilir
      // ama YUKARI (daha yeni) ve ASAGI (daha eski) kaydirilabilir (gercek IG gibi).
      var posts = data.posts || [];
      var overlay = document.createElement('div');
      overlay.className = 'feed-overlay';
      overlay.innerHTML =
        '<div class="feed-top">' +
          '<button class="feed-back" aria-label="Geri">' + icon('prev') + '</button>' +
          '<div class="feed-title"><div class="feed-title-main">Gönderi</div><div class="feed-title-sub">' + esc(userHandle()) + '</div></div>' +
          '<span></span>' +
        '</div>' +
        '<div class="feed-scroll"></div>';
      var scroll = overlay.querySelector('.feed-scroll');
      scroll.innerHTML = posts.map(feedCardHtml).join('');
      layers.appendChild(overlay);
      lockScroll(true);

      var cards = scroll.querySelectorAll('.feed-card');

      // LAZY: her kartin medyasi yalnizca gorunume yaklasinca yuklenir (o ana kadar
      // .fc-loading skeleton). 4:5 kutu bastan rezerve -> offsetTop kararli, dokunulan
      // posta tam konumlanir; 1500. postta sadece civardaki medya iner (hepsi degil).
      var medyaGozlemci = new IntersectionObserver(function (girisler) {
        girisler.forEach(function (giris) {
          if (!giris.isIntersecting) return;
          var kart = giris.target;
          medyaGozlemci.unobserve(kart);
          mediaInto(kart.querySelector('.fc-media'), posts[Number(kart.getAttribute('data-feed-index'))]);
          bindImages(kart);                 // baslik avatari
          kart.classList.remove('fc-loading');
        });
      }, { root: scroll, rootMargin: '1000px 0px' });

      cards.forEach(function (kart, i) {
        kart.setAttribute('data-feed-index', i);
        kart.classList.add('fc-loading');
        medyaGozlemci.observe(kart);
      });

      // Dokunulan gonderiyi en uste hizala: scrollIntoView degil kesin scrollTop
      // ("ust post yarim" olmasin); rAF ile yerlesimden sonra tekrar sabitle.
      var hedef = cards[index];
      if (hedef) {
        scroll.scrollTop = hedef.offsetTop;
        requestAnimationFrame(function () { scroll.scrollTop = hedef.offsetTop; });
      }

      function close() {
        medyaGozlemci.disconnect(); durdurVideolar(overlay);
        overlay.remove(); lockScroll(false); document.removeEventListener('keydown', onKey);
      }
      var dismiss = backDismissable(close);
      function onKey(e) { if (e.key === 'Escape') dismiss(); }
      overlay.querySelector('.feed-back').onclick = dismiss;
      document.addEventListener('keydown', onKey);
    }

    function openPost(index) {
      if (isTouchLayout()) openFeed(index);
      else openModal(index);
    }

    /* ----------------------- cart (WhatsApp order) ----------------------- */
    var cart = [];   // [{ id, qty, variant }]  variant: {label:opt,...} | null
    var detailCartRefresh = null;   // acik katalog detayinin alt sepet-ozetini tazeleyen kapanis

    // Siparis yalnizca bir WhatsApp numarasi + katalog varken acik (yoksa "Sepete Ekle"
    // / sepet cubugu hic gosterilmez -> olu kontrol olmaz).
    function orderEnabled() {
      return !!(data.social && data.social.whatsapp) &&
        moduleOn('catalog') && !!data.catalog && (data.catalog.items || []).length > 0;
    }
    function cartStorageKey() { return 'cart:' + (data.username || data.name || 'biz'); }

    function loadCart() {
      cart = [];
      try {
        var raw = localStorage.getItem(cartStorageKey());
        var parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) cart = parsed;
      } catch (e) {}
    }
    function saveCart() { try { localStorage.setItem(cartStorageKey(), JSON.stringify(cart)); } catch (e) {} }
    function pruneCart() {   // veride artik olmayan kalemleri at
      var before = cart.length;
      cart = cart.filter(function (l) { return !!catalogIndex[l.id]; });
      if (cart.length !== before) saveCart();
    }

    function variantText(variant) {
      if (!variant) return '';
      return Object.keys(variant).map(function (k) { return variant[k]; }).join(' · ');
    }
    function lineKey(id, variant) { return id + '|' + (variant ? JSON.stringify(variant) : ''); }
    function findLine(key) {
      var found = null;
      cart.some(function (l) { if (lineKey(l.id, l.variant) === key) { found = l; return true; } return false; });
      return found;
    }
    function selectedVariant(scope, item) {
      if (!(item.variants && item.variants.length)) return null;
      var v = {};
      scope.querySelectorAll('.variant').forEach(function (group) {
        var label = group.getAttribute('data-label');
        var active = group.querySelector('.variant-chip.active');
        if (label && active) v[label] = active.getAttribute('data-opt');
      });
      return Object.keys(v).length ? v : null;
    }

    function cartAdd(item, variant) {
      var line = findLine(lineKey(item.id, variant));
      if (line) line.qty += 1;
      else cart.push({ id: item.id, qty: 1, variant: variant || null });
      saveCart(); renderCartBar();
    }
    function cartSetQty(key, qty) {
      for (var i = 0; i < cart.length; i++) {
        if (lineKey(cart[i].id, cart[i].variant) === key) {
          if (qty <= 0) cart.splice(i, 1); else cart[i].qty = qty;
          break;
        }
      }
      saveCart(); renderCartBar();
    }
    function cartCount() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
    function cartTotal() {
      return cart.reduce(function (sum, l) {
        var it = catalogIndex[l.id];
        return sum + ((it && typeof it.price === 'number') ? it.price * l.qty : 0);
      }, 0);
    }
    function cartHasUnpriced() {
      return cart.some(function (l) { var it = catalogIndex[l.id]; return it && typeof it.price !== 'number'; });
    }

    // Alt sepet cubugu — yalniz siparis acik + sepette kalem varken gorunur.
    function renderCartBar() {
      if (detailCartRefresh) detailCartRefresh();   // acik detayin sepet ozeti de tazelensin
      var shown = orderEnabled() && cartCount() > 0;
      document.body.classList.toggle('has-cart-bar', shown);
      var bar = document.getElementById('cartBar');
      if (!shown) { if (bar) bar.remove(); return; }

      var totalStr = money(cartTotal(), data.catalog) + (cartHasUnpriced() ? '+' : '');
      if (!bar) {
        bar = document.createElement('button');
        bar.id = 'cartBar'; bar.className = 'cart-bar'; bar.type = 'button';
        bar.addEventListener('click', openCartSheet);
        document.body.appendChild(bar);
      }
      bar.innerHTML = '<span class="cart-bar-inner">' +
        '<span class="cart-bar-ic">' + icon('bag') + '</span>' +
        '<span class="cart-bar-label">Sepetim · ' + cartCount() + ' ürün</span>' +
        '<span class="cart-bar-total">' + esc(totalStr) + '</span>' +
        '<span class="cart-bar-ic chev">' + icon('chevron') + '</span>' +
      '</span>';
    }

    function sendWhatsAppOrder() {
      if (cartCount() === 0) return;
      var cat = data.catalog || {};
      var intro = (data.order && data.order.intro) || 'Merhaba, sipariş vermek istiyorum:';
      var lines = cart.map(function (l) {
        var it = catalogIndex[l.id];
        if (!it) return '';
        var vt = variantText(l.variant);
        var name = it.name + (vt ? ' (' + vt + ')' : '');
        var price = (typeof it.price === 'number') ? ' — ' + money(it.price * l.qty, cat)
                  : (it.priceText ? ' — ' + it.priceText : ' — fiyat görüşülecek');
        return '• ' + l.qty + 'x ' + name + price;
      }).filter(Boolean);
      var msg = intro + '\n\n' + lines.join('\n');
      var total = cartTotal();
      if (total > 0) msg += '\n\nToplam: ' + money(total, cat) + (cartHasUnpriced() ? ' (+ fiyatı görüşülecek kalemler)' : '');
      var base = data.social.whatsapp;
      var url = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'noopener');
    }

    // Sepet bottom-sheet'i: her kalemin onizlemesi + adet/sil + toplam + WhatsApp gonder.
    // Siparis tek tikla gitmez: once bu onizleme, sonra kullanicinin onayi.
    function openCartSheet() {
      if (cartCount() === 0) return;
      var sheet = openSheetShell({
        title: 'Sepetim', className: 'cart-sheet',
        headActions: '<button class="cart-clear" type="button">Sepeti Temizle</button>'
      });
      var overlay = sheet.overlay, dismiss = sheet.dismiss;
      sheet.content.innerHTML = '<div class="cart-list"></div><div class="cart-foot"></div>';

      function renderList() {
        var list = overlay.querySelector('.cart-list');
        var foot = overlay.querySelector('.cart-foot');
        list.innerHTML = cart.map(function (l) {
          var it = catalogIndex[l.id];
          if (!it) return '';
          var vt = variantText(l.variant);
          var img = (it.media && it.media[0]) || '';
          var linePrice = (typeof it.price === 'number') ? money(it.price * l.qty, data.catalog)
                        : (it.priceText || 'Fiyat görüşülecek');
          return '<div class="cart-line" data-key="' + esc(lineKey(l.id, l.variant)) + '">' +
            '<span class="cart-thumb"><img src="' + esc(img) + '" alt=""></span>' +
            '<div class="cart-line-text">' +
              '<div class="cart-line-name">' + esc(it.name) + '</div>' +
              (vt ? '<div class="cart-line-variant">' + esc(vt) + '</div>' : '') +
              '<div class="cart-line-price">' + esc(linePrice) + '</div>' +
            '</div>' +
            '<span class="cart-qty">' +
              '<button class="qty-btn" data-act="dec" type="button" aria-label="Azalt">' + icon('minus') + '</button>' +
              '<span class="qty-n">' + l.qty + '</span>' +
              '<button class="qty-btn" data-act="inc" type="button" aria-label="Arttır">' + icon('plus') + '</button>' +
            '</span>' +
            '<button class="cart-remove" data-act="rm" type="button" aria-label="Kaldır">' + icon('trash') + '</button>' +
          '</div>';
        }).join('');
        var note = cartHasUnpriced() ? ' <span class="cart-total-note">+ fiyatı görüşülecek kalemler</span>' : '';
        foot.innerHTML =
          '<div class="cart-total-row"><span>Toplam</span>' +
            '<span class="cart-total">' + esc(money(cartTotal(), data.catalog)) + note + '</span></div>' +
          '<button class="btn btn-primary cart-send" type="button">' + icon('whatsapp') +
            '<span>WhatsApp ile Sipariş Ver</span></button>';
      }
      renderList();

      overlay.querySelector('.cart-list').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var key = e.target.closest('.cart-line').getAttribute('data-key');
        var line = findLine(key);
        if (!line) return;
        var act = btn.getAttribute('data-act');
        cartSetQty(key, act === 'inc' ? line.qty + 1 : act === 'dec' ? line.qty - 1 : 0);
        if (cartCount() === 0) dismiss(); else renderList();
      });
      overlay.querySelector('.cart-foot').addEventListener('click', function (e) {
        if (e.target.closest('.cart-send')) sendWhatsAppOrder();
      });

      // Sepeti temizle — native confirm() yerine inline iki-adim onay.
      var clearBtn = overlay.querySelector('.cart-clear');
      var armed = false, armTimer = null;
      clearBtn.onclick = function () {
        if (!armed) {
          armed = true;
          clearBtn.textContent = 'Emin misiniz?';
          clearBtn.classList.add('arm');
          armTimer = setTimeout(function () { armed = false; clearBtn.textContent = 'Sepeti Temizle'; clearBtn.classList.remove('arm'); }, 3000);
          return;
        }
        clearTimeout(armTimer);
        cart = []; saveCart(); renderCartBar(); dismiss();
      };
    }

    /* ----------------------- reviews (rating chip -> sheet) ----------------------- */
    function reviewsSkeleton(n) {
      var rows = '';
      for (var i = 0; i < n; i++) rows += '<div class="rv-item"><span class="rv-avatar skel-box"></span>' +
        '<div class="rv-body">' + skelLine('short') + skelLine() + skelLine() + '</div></div>';
      return '<div class="rv-summary"><span class="skel-box rv-skel-score"></span>' +
        '<div class="rv-bars">' + skelLine() + skelLine() + skelLine() + '</div></div>' +
        '<div class="rv-list">' + rows + '</div>';
    }
    function openReviewsSheet() {
      var rv = data.reviews;
      if (!rv) return;
      var items = rv.items || [];
      var sheet = openSheetShell({ title: 'Değerlendirmeler', className: 'reviews-sheet' });

      // Puan dagilimi (gosterilen yorumlardan) -> 5..1 cubuklari
      var dist = [0, 0, 0, 0, 0];
      items.forEach(function (r) { var s = Math.round(r.rating || 0); if (s >= 1 && s <= 5) dist[s - 1]++; });
      var maxd = Math.max(1, dist[0], dist[1], dist[2], dist[3], dist[4]);
      var bars = '';
      for (var s = 5; s >= 1; s--) {
        bars += '<div class="rv-bar"><span class="rv-bar-n">' + s + '</span>' +
          '<span class="rv-bar-track"><span class="rv-bar-fill" style="width:' + Math.round(dist[s - 1] / maxd * 100) + '%"></span></span></div>';
      }

      var summary = (typeof rv.rating === 'number')
        ? '<div class="rv-summary">' +
            '<div class="rv-score-block"><div class="rv-score">' + esc(String(rv.rating).replace('.', ',')) + '</div>' +
              starsHtml(rv.rating) +
              (rv.count ? '<div class="rv-count">' + esc(rv.count) + ' değerlendirme</div>' : '') +
            '</div>' +
            '<div class="rv-bars">' + bars + '</div>' +
          '</div>'
        : '';

      var list = items.map(function (r) {
        var name = r.author || '';
        return '<div class="rv-item">' +
          '<span class="rv-avatar" style="background:' + avatarColor(name) + '">' + esc(reviewInitials(name)) + '</span>' +
          '<div class="rv-body">' +
            '<div class="rv-author">' + esc(name) + '</div>' +
            '<div class="rv-meta">' + starsHtml(r.rating, 'sm') +
              (r.date ? '<span class="rv-when">' + esc(relativeTime(r.date)) + '</span>' : '') +
            '</div>' +
            '<p class="rv-text">' + esc(r.text) + '</p>' +
          '</div>' +
        '</div>';
      }).join('');

      sheet.content.innerHTML = reviewsSkeleton(Math.min(5, items.length || 5));
      setTimeout(function () {
        sheet.content.innerHTML = summary + '<div class="rv-list">' + list + '</div>';
      }, 450);
    }

    /* ----------------------- FAQ (S.S.S.) ----------------------- */
    function faqEnabled() { return moduleOn('faq') && Array.isArray(data.faq) && data.faq.length > 0; }
    function renderFaq() {
      var host = document.getElementById('faq');
      if (!host) return;
      if (!faqEnabled()) { host.hidden = true; return; }
      host.innerHTML = '<div class="faq-list">' + data.faq.map(function (item) {
        return '<div class="faq-item">' +
          '<button class="faq-q" type="button" aria-expanded="false"><span>' + esc(item.q) + '</span>' + icon('chevron') + '</button>' +
          '<div class="faq-a"><p>' + esc(item.a) + '</p></div>' +
        '</div>';
      }).join('') + '</div>';
      host.addEventListener('click', function (e) {
        var q = e.target.closest('.faq-q');
        if (!q) return;
        var open = q.parentElement.classList.toggle('open');
        q.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    /* ----------------------- catalog (product / menu / service) ----------------------- */
    function galleryBadge(item) {
      return (item.media && item.media.length > 1)
        ? '<span class="cell-badge">' + icon('gallery') + '</span>' : '';
    }

    /* product layout: 4:5 kart + ad + fiyat */
    function productCardHtml(item, cat) {
      var img = (item.media && item.media[0]) || '';
      var badge = item.badge ? '<span class="cat-badge">' + esc(item.badge) + '</span>' : '';
      return '<button class="prod-card" data-id="' + esc(item.id) + '" type="button">' +
        '<div class="prod-media loading"><img data-src="' + esc(img) + '" data-key="' + esc(item.id) + '" alt="' + esc(item.name) + '" loading="lazy">' +
          badge + galleryBadge(item) + '</div>' +
        '<div class="prod-text"><div class="prod-name">' + esc(item.name) + '</div>' +
          '<div class="prod-price">' + priceHtml(item, cat) + '</div></div>' +
      '</button>';
    }

    /* menu / service layout: satir = (gorsel) + ad/sure/aciklama + fiyat */
    function listRowHtml(item, cat, layout) {
      var img = (item.media && item.media[0]) || '';
      var thumb = img ? '<span class="row-thumb loading"><img data-src="' + esc(img) + '" data-key="' + esc(item.id) + '" alt=""></span>' : '';
      var meta = (layout === 'service' && item.duration)
        ? '<span class="row-meta">' + icon('clock') + '<span>' + esc(item.duration) + '</span></span>' : '';
      return '<button class="list-row" data-id="' + esc(item.id) + '" type="button">' +
        thumb +
        '<span class="row-text">' +
          '<span class="row-name">' + esc(item.name) + '</span>' +
          meta +
          (item.desc ? '<span class="row-desc">' + esc(item.desc) + '</span>' : '') +
        '</span>' +
        '<span class="row-price">' + priceHtml(item, cat) + '</span>' +
      '</button>';
    }

    function renderCatalogItems(col) {
      var cat = data.catalog || {};
      var layout = cat.layout || 'product';
      var items = (cat.items || []).filter(function (it) { return !col || it.collection === col; });
      currentCatalogList = items;   // detayda urunler arasi gecis bu listeyi kullanir
      var box = document.getElementById('catItems');
      if (!box) return;
      if (!items.length) { box.innerHTML = '<p class="empty">Bu kategoride kayıt yok.</p>'; return; }
      box.innerHTML = layout === 'product'
        ? '<div class="prod-grid">' + items.map(function (it) { return productCardHtml(it, cat); }).join('') + '</div>'
        : '<div class="list">' + items.map(function (it) { return listRowHtml(it, cat, layout); }).join('') + '</div>';
      bindImages(box);
    }

    function skelLine(cls) { return '<span class="skel-line' + (cls ? ' ' + cls : '') + '"></span>'; }
    function catalogSkeleton(layout, n) {
      var cells = '', i;
      if (layout === 'product') {
        for (i = 0; i < n; i++) cells += '<div class="prod-card"><div class="prod-media skel-box"></div><div class="prod-text">' + skelLine() + skelLine('short') + '</div></div>';
        return '<div class="prod-grid">' + cells + '</div>';
      }
      for (i = 0; i < n; i++) cells += '<div class="list-row"><span class="row-thumb skel-box"></span><span class="row-text">' + skelLine() + skelLine('short') + '</span></div>';
      return '<div class="list">' + cells + '</div>';
    }

    function renderCatalog() {
      var host = document.getElementById('catalog');
      if (!host) return;
      var cat = data.catalog;
      if (!moduleOn('catalog') || !cat || !(cat.items && cat.items.length)) { host.hidden = true; return; }

      catalogIndex = {};
      cat.items.forEach(function (it) { catalogIndex[it.id] = it; });

      var collections = cat.collections || [];
      var chips = collections.length
        ? '<div class="chips" id="catChips"><button class="chip active" data-col="" type="button">Tümü</button>' +
            collections.map(function (c) { return '<button class="chip" data-col="' + esc(c.id) + '" type="button">' + esc(c.name) + '</button>'; }).join('') +
          '</div>'
        : '';
      host.innerHTML = chips + '<div class="catalog-items" id="catItems"></div>';
      // Ilk yuklemede skeleton goster, sonra gercek kalemlerle degis (kategori
      // filtreleri sonradan renderCatalogItems'i dogrudan cagirir -> aninda).
      host.querySelector('#catItems').innerHTML = catalogSkeleton(cat.layout || 'product', 6);
      setTimeout(function () { renderCatalogItems(''); }, 450);

      var chipBar = host.querySelector('#catChips');
      if (chipBar) chipBar.addEventListener('click', function (e) {
        var b = e.target.closest('.chip');
        if (!b) return;
        chipBar.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderCatalogItems(b.getAttribute('data-col') || '');
      });
    }

    // Katalog kalemi govdesi (IG-post-stili: baslik + ad/fiyat/aciklama/varyant). Foot AYRI tutulur
    // (kaydirma alaninin DISINDA) -> gorsel+aciklama birlikte kayar, foot dipte sabit kalir.
    function catalogInfoHtml(item, cat, canOrder) {
      var colName = '';
      (cat.collections || []).some(function (c) { if (c.id === item.collection) { colName = c.name; return true; } return false; });
      var variants = (item.variants || []).map(function (v) {
        var opts = (v.options || []).map(function (o, i) {
          return canOrder
            ? '<button type="button" class="variant-chip' + (i === 0 ? ' active' : '') + '" data-opt="' + esc(o) + '">' + esc(o) + '</button>'
            : '<span class="variant-chip">' + esc(o) + '</span>';
        }).join('');
        return '<div class="variant" data-label="' + esc(v.label) + '"><span class="variant-label">' + esc(v.label) + '</span>' +
          '<span class="variant-opts">' + opts + '</span></div>';
      }).join('');
      return '<div class="lb-head">' +
          '<span class="avatar-ring"><img class="mini-logo" data-src="' + esc(data.logo) + '" alt=""></span>' +
          '<div class="lb-head-text"><div class="lb-name">' + esc(userHandle()) + verifiedHtml() + '</div>' +
            (colName ? '<div class="lb-loc">' + esc(colName) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="detail-body">' +
          '<div class="detail-name">' + esc(item.name) + '</div>' +
          (item.duration ? '<div class="detail-meta">' + icon('clock') + '<span>' + esc(item.duration) + '</span></div>' : '') +
          '<div class="detail-price">' + priceHtml(item, cat) + '</div>' +
          (item.desc ? '<p class="detail-desc">' + esc(item.desc) + '</p>' : '') +
          (variants ? '<div class="detail-variants">' + variants + '</div>' : '') +
        '</div>';
    }
    function catalogFootHtml(item, cat) {
      return '<button class="btn btn-primary detail-add" type="button">' + icon('bag') +
          '<span>' + esc(cat.cartVerb || 'Sepete Ekle') + '</span></button>' +
        '<button class="detail-cart" type="button" hidden aria-label="Sepeti gör">' +
          '<span class="cart-bar-ic">' + icon('bag') + '</span>' +
          '<span class="dc-count"></span>' +
          '<span class="dc-total"></span>' +
          '<span class="cart-bar-ic chev">' + icon('chevron') + '</span>' +
        '</button>';
    }

    /* Katalog detayi: tek urun ODAKTA, ama urunler arasi gecilebilir (ok/klavye; tek
       gorselli urunde mobil yatay kaydirma -> galeride swipe karusele ait). Alt SABIT
       "Sepete Ekle" o anki urunu ekler. masaustu yan-yana / mobil tam ekran (CSS). */
    function openCatalogDetail(list, startIndex) {
      var cat = data.catalog || {};
      var canOrder = orderEnabled();
      if (!list || !list.length) return;
      var current = Math.max(0, Math.min(startIndex | 0, list.length - 1));

      var overlay = document.createElement('div');
      overlay.className = 'detail-overlay';
      overlay.innerHTML =
        '<button class="detail-close" aria-label="Kapat">' + icon('close') + '</button>' +
        '<button class="overlay-nav prev" aria-label="Önceki ürün">' + icon('prev') + '</button>' +
        '<button class="overlay-nav next" aria-label="Sonraki ürün">' + icon('next') + '</button>' +
        '<div class="detail" role="dialog" aria-modal="true">' +
          '<div class="detail-scroll">' +       // gorsel + bilgi BIRLIKTE kayar (gorsel tam 4:5, kirpilmaz)
            '<div class="detail-media"></div>' +
            '<div class="detail-info"></div>' +
          '</div>' +
          '<div class="detail-foot"></div>' +    // kaydirma DISINDA -> dipte sabit, icerige binmez
        '</div>';
      layers.appendChild(overlay);
      lockScroll(true);

      var mediaBox = overlay.querySelector('.detail-media');
      var infoBox = overlay.querySelector('.detail-info');
      var footBox = overlay.querySelector('.detail-foot');
      var scrollBox = overlay.querySelector('.detail-scroll');
      var detailEl = overlay.querySelector('.detail');
      var prevBtn = overlay.querySelector('.overlay-nav.prev');
      var nextBtn = overlay.querySelector('.overlay-nav.next');
      var swipeStartX = null, swipeStartY = null;

      // Alt sabit barda sepet ozeti (sepet-cubugu gibi): adet + tutar, eklemede canli.
      function refreshDetailCart() {
        var dc = overlay.querySelector('.detail-cart');
        if (!dc) return;
        var n = cartCount();
        if (!canOrder || n === 0) { dc.hidden = true; }
        else {
          dc.hidden = false;
          dc.querySelector('.dc-count').textContent = 'Sepette ' + n + ' ürün';
          dc.querySelector('.dc-total').textContent = money(cartTotal(), cat) + (cartHasUnpriced() ? '+' : '');
        }
      }
      detailCartRefresh = refreshDetailCart;   // sepet her yerden degisince bu detay ozeti de tazelensin

      function fill() {
        var item = list[current];
        durdurVideolar(overlay);            // onceki urunun videosunu/gozlemcisini birak
        mediaInto(mediaBox, item);
        infoBox.innerHTML = catalogInfoHtml(item, cat, canOrder);
        bindImages(infoBox);                // story-ring avatar
        if (canOrder) { footBox.hidden = false; footBox.innerHTML = catalogFootHtml(item, cat); }
        else { footBox.hidden = true; footBox.innerHTML = ''; }
        if (detailEl) detailEl.setAttribute('aria-label', item.name);
        prevBtn.hidden = current <= 0;
        nextBtn.hidden = current >= list.length - 1;
        if (scrollBox) scrollBox.scrollTop = 0;   // yeni urun: kaydirma bastan

        infoBox.querySelectorAll('.variant').forEach(function (group) {
          group.addEventListener('click', function (e) {
            var chip = e.target.closest('button.variant-chip');
            if (!chip) return;
            group.querySelectorAll('.variant-chip').forEach(function (c) { c.classList.toggle('active', c === chip); });
          });
        });

        var addBtn = footBox.querySelector('.detail-add');
        if (addBtn) addBtn.addEventListener('click', function () {
          cartAdd(item, selectedVariant(infoBox, item));
          var span = addBtn.querySelector('span');
          var original = span.getAttribute('data-original') || span.textContent;
          span.setAttribute('data-original', original);
          addBtn.classList.add('added');
          span.textContent = (cat.cartVerb || 'Sepete Ekle').replace(/Ekle$/i, 'Eklendi') + ' ✓';
          setTimeout(function () { addBtn.classList.remove('added'); span.textContent = original; }, 1300);
        });

        // Tek gorselli urunde YATAY kaydirma -> urun gec (galeride swipe karusele ait). Dikey
        // kaydirma (sayfa) tetiklemesin diye yatay-baskinlik sarti.
        var single = !(item.media && item.media.length > 1) && !(item.type === 'video' && item.video);
        var wrap = mediaBox.querySelector('.media-wrap');
        if (single && wrap) {
          wrap.addEventListener('touchstart', function (e) { swipeStartX = e.touches[0].clientX; swipeStartY = e.touches[0].clientY; }, { passive: true });
          wrap.addEventListener('touchend', function (e) {
            if (swipeStartX === null) return;
            var dx = e.changedTouches[0].clientX - swipeStartX, dy = e.changedTouches[0].clientY - swipeStartY;
            swipeStartX = swipeStartY = null;
            if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;   // yatay baskin degilse birak (dikey scroll)
            go(dx < 0 ? 1 : -1);
          }, { passive: true });
        }

        var dcBtn = footBox.querySelector('.detail-cart');
        if (dcBtn) dcBtn.addEventListener('click', openCartSheet);   // ozet -> sepet sheet'i
        refreshDetailCart();
      }

      function go(step) {
        var n = current + step;
        if (n < 0 || n >= list.length) return;
        current = n;
        fill();
      }

      function close() {
        detailCartRefresh = null;
        durdurVideolar(overlay);
        overlay.remove(); lockScroll(false); document.removeEventListener('keydown', onKey);
      }
      var dismiss = backDismissable(close);
      function onKey(e) {
        if (e.key === 'Escape') dismiss();
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'ArrowRight') go(1);
      }
      overlay.querySelector('.detail-close').onclick = dismiss;
      prevBtn.onclick = function () { go(-1); };
      nextBtn.onclick = function () { go(1); };
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) dismiss(); });
      document.addEventListener('keydown', onKey);

      fill();
    }

    /* ----------------------- tabs (catalog <-> posts) ----------------------- */
    function initPosts() {
      if (postsStarted) return;
      postsStarted = true;
      loadNextPage();
      setupInfiniteScroll();
    }

    function showTab(key) {
      activeTab = key;
      var nav = document.getElementById('tabs');
      if (nav) nav.querySelectorAll('.tab[data-tab]').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === key);
      });
      var catalog = document.getElementById('catalog');
      var grid = document.getElementById('grid');
      var sentinel = document.getElementById('sentinel');
      var faq = document.getElementById('faq');
      if (catalog) catalog.hidden = key !== 'catalog';
      if (grid) grid.hidden = key !== 'posts';
      if (sentinel) sentinel.hidden = key !== 'posts';
      if (faq) faq.hidden = key !== 'faq';
      if (key === 'posts') initPosts();
    }

    function renderTabs() {
      var nav = document.getElementById('tabs');
      if (!nav) return;
      var hasCatalog = moduleOn('catalog') && data.catalog && (data.catalog.items || []).length > 0;
      var hasPosts = moduleOn('posts') && (data.posts || []).length > 0;

      var tabs = [];
      if (hasCatalog) tabs.push({ key: 'catalog', icon: 'tag', label: (data.catalog.title || 'Ürünler') });
      if (hasPosts) tabs.push({ key: 'posts', icon: 'grid', label: 'Gönderiler' });
      if (faqEnabled()) tabs.push({ key: 'faq', icon: 'help', label: 'S.S.S.' });

      if (!tabs.length) { nav.hidden = true; return; }

      // Tek bolum: tiklanamaz tek baslik (IG'deki grid basligi gibi), sekme degil.
      if (tabs.length === 1) {
        nav.className = 'tabs single';
        nav.innerHTML = '<div class="tab active" aria-label="' + esc(tabs[0].label) + '"><span class="icon">' + icon(tabs[0].icon) + '</span></div>';
        showTab(tabs[0].key);
        return;
      }

      nav.className = 'tabs';
      nav.innerHTML = tabs.map(function (t) {
        return '<button class="tab" data-tab="' + t.key + '" type="button" aria-label="' + esc(t.label) + '"><span class="icon">' + icon(t.icon) + '</span></button>';
      }).join('');
      nav.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]');
        if (b) showTab(b.getAttribute('data-tab'));
      });
      showTab(tabs[0].key);
    }

    /* ----------------------- demo switcher (yalniz demo modunda) ----------------------- */
    function renderDemoSwitcher() {
      var demos = window.PROFILE_DEMOS;
      if (!demos) return;
      var keys = Object.keys(demos);
      if (keys.length < 2) return;       // tek isletme = gercek dagitim -> secici cikmaz
      var labels = window.PROFILE_DEMO_LABELS || {};
      var cur = window.PROFILE_DEMO_KEY;

      var el = document.createElement('div');
      el.className = 'demo-switch';
      el.innerHTML = '<span class="demo-switch-label">DEMO</span>' +
        keys.map(function (k) {
          return '<button type="button" class="demo-opt' + (k === cur ? ' active' : '') + '" data-demo="' + esc(k) + '">' + esc(labels[k] || k) + '</button>';
        }).join('');
      document.body.appendChild(el);

      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-demo]');
        if (!b) return;
        var k = b.getAttribute('data-demo');
        if (k === cur) return;
        window.location.hash = k;        // secim hash'te saklanir (file:// reload guvenli)
        window.location.reload();
      });
    }

    /* ----------------------- theme toggle (koyu/acik) ----------------------- */
    // data-theme yoksa sistem temasi; secimde localStorage + <html data-theme> ile override.
    function currentTheme() {
      var t = null;
      try { t = localStorage.getItem('theme'); } catch (e) {}
      if (t === 'dark' || t === 'light') return t;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    function renderThemeToggle() {
      var btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.id = 'themeToggle';
      btn.type = 'button';
      function paint() {
        var eff = currentTheme();
        btn.innerHTML = eff === 'dark' ? icon('sun') : icon('moon');   // gidilecek modun ikonu
        btn.setAttribute('aria-label', eff === 'dark' ? 'Açık moda geç' : 'Koyu moda geç');
        btn.title = btn.getAttribute('aria-label');
      }
      paint();
      btn.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('theme', next); } catch (e) {}
        document.documentElement.setAttribute('data-theme', next);
        paint();
      });
      document.body.appendChild(btn);
    }

    /* ----------------------- start ----------------------- */
    function start() {
      layers = document.getElementById('layers');

      if (!data) {
        document.getElementById('grid').innerHTML =
          '<p class="empty">Veri yüklenemedi. “data/profile.js” dosyasını kontrol et.</p>';
        return;
      }

      document.title = data.name + (data.category ? ' · ' + data.category : '');

      fillIcons(document);
      renderHeader();
      renderContact();

      var footerName = document.getElementById('footerName');
      if (footerName) footerName.textContent = data.name;

      document.getElementById('grid').addEventListener('click', function (e) {
        var cell = e.target.closest('.cell[data-index]');
        if (cell) openPost(Number(cell.getAttribute('data-index')));
      });

      document.getElementById('catalog').addEventListener('click', function (e) {
        var t = e.target.closest('[data-id]');
        if (!t) return;
        var id = t.getAttribute('data-id');
        var idx = -1;
        for (var i = 0; i < currentCatalogList.length; i++) { if (currentCatalogList[i].id === id) { idx = i; break; } }
        if (idx >= 0) openCatalogDetail(currentCatalogList, idx);
        else if (catalogIndex[id]) openCatalogDetail([catalogIndex[id]], 0);
      });

      renderCatalog();           // katalog bolumunu kur (sekme acilana kadar gizli)
      renderFaq();               // S.S.S. bolumu (sekme acilana kadar gizli)
      loadCart(); pruneCart(); renderCartBar();   // kayitli sepeti getir + alt cubuk
      renderTabs();              // sekmeler + ilk gosterim (gerekirse gonderileri baslatir)
      renderDemoSwitcher();      // yalniz demo modunda gorunur
      renderThemeToggle();       // koyu/acik tema gecisi (sol ust)
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  })();
}
