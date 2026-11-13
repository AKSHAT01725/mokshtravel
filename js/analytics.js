/* Moksh Travel – Google Analytics 4
   >>> Replace the placeholder below with your GA4 Measurement ID (Admin > Data streams > Web). <<< */
(function () {
  var GA_ID = 'G-XXXXXXXXXX';
  if (!/^G-[A-Z0-9]{8,12}$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID);

  // Lead tracking: phone-call and WhatsApp clicks (mark these as Key events in GA4)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var method = h.indexOf('tel:') === 0 ? 'call' : (h.indexOf('wa.me') > -1 || h.indexOf('whatsapp') > -1) ? 'whatsapp' : '';
    if (method) gtag('event', 'generate_lead', { method: method, page_path: location.pathname });
  }, true);
})();
