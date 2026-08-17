/* ------------------------------------------------------------------ *
 * Inline SVG icon set (single source).
 * Usage: element.innerHTML = window.ICONS['phone'];
 * Outline icons use "currentColor" so color comes from CSS.
 * ------------------------------------------------------------------ */
window.ICONS = (function () {
  var line = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return {
    verified:
      '<svg viewBox="0 0 24 24"><path fill="#0095F6" d="m23 12-2.44-2.78.34-3.68-3.6-.82L15.4 1.6 12 3.06 8.6 1.6 6.7 4.72l-3.6.82.34 3.68L1 12l2.44 2.78-.34 3.68 3.6.82L8.6 22.4 12 20.94l3.4 1.46 1.9-3.12 3.6-.82-.34-3.68z"/><path fill="#fff" d="M10.1 16.2 6.2 12.3l1.55-1.55 2.35 2.35 5-5 1.55 1.55z"/></svg>',

    location:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M12 21c4.5-4.6 7-8 7-11a7 7 0 1 0-14 0c0 3 2.5 6.4 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',

    phone:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M5 4h3l2 5-2.4 1.5a11 11 0 0 0 5 5L17 13.6l5 2V19a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 1-2z"/></svg>',

    mail:
      '<svg viewBox="0 0 24 24" ' + line + '><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 5.5L20 7"/></svg>',

    clock:
      '<svg viewBox="0 0 24 24" ' + line + '><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.5 2"/></svg>',

    directions:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M21 3 3 10.5l7.6 2.9L13.5 21 21 3z"/></svg>',

    instagram:
      '<svg viewBox="0 0 24 24" ' + line + '><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none"/></svg>',

    whatsapp:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.7-6.1c-.26-.13-1.5-.74-1.74-.82s-.4-.13-.57.13-.65.82-.8 1-.3.2-.55.06a6.7 6.7 0 0 1-2-1.22 7.5 7.5 0 0 1-1.37-1.71c-.14-.25 0-.38.11-.5l.4-.46c.13-.16.17-.26.26-.43a.48.48 0 0 0-.02-.46c-.07-.13-.57-1.37-.78-1.88-.2-.49-.42-.42-.57-.43h-.49a.94.94 0 0 0-.68.32 2.85 2.85 0 0 0-.9 2.12c0 1.25.92 2.46 1.05 2.63s1.8 2.74 4.35 3.85c.6.26 1.07.41 1.44.53.6.2 1.15.17 1.58.1.48-.07 1.5-.61 1.7-1.2s.21-1.1.15-1.2-.24-.18-.5-.31z"/></svg>',

    grid:
      '<svg viewBox="0 0 24 24" ' + line + '><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',

    gallery:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="7.5" y="3.5" width="13" height="13" rx="3" opacity=".55"/><rect x="3.5" y="7.5" width="13" height="13" rx="3"/></svg>',

    play:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4.5v15l12-7.5z"/></svg>',

    close:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M6 6 18 18M18 6 6 18"/></svg>',

    prev:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',

    next:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',

    volume:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12"/></svg>',

    volume_off:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m16 9 5 5M21 9l-5 5"/></svg>',

    /* catalog / shop tab */
    tag:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M3 12V4a1 1 0 0 1 1-1h8l8 8a2 2 0 0 1 0 2.8l-6.2 6.2a2 2 0 0 1-2.8 0L3 12z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></svg>',

    /* shopping bag (cart) */
    bag:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',

    chevron:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',

    plus:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M12 5v14M5 12h14"/></svg>',

    minus:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M5 12h14"/></svg>',

    trash:
      '<svg viewBox="0 0 24 24" ' + line + '><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13h8l1-13"/></svg>',

    star:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m12 2.6 2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.97 6.1 21.07l1.1-6.47L2.5 10.02l6.5-.95L12 2.6z"/></svg>',

    help:
      '<svg viewBox="0 0 24 24" ' + line + '><circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.3 1.3c0 1.8-2.6 2-2.6 3.7"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor" stroke="none"/></svg>',

    sun:
      '<svg viewBox="0 0 24 24" ' + line + '><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>',

    moon:
      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 12.9A8.5 8.5 0 1 1 11.1 3a6.7 6.7 0 0 0 9.9 9.9z"/></svg>'
  };
})();
