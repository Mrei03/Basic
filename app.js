window.dataLayer = window.dataLayer || [];

const TRACKING = {
  ga4MeasurementId: "G-XXXXXXXXXX",
  metaPixelId: "000000000000000",
  linkedInPartnerId: "0000000",
  calendlyUrl: "https://calendly.com/lpipartners/strategy-call",
  webhookUrl: "/api/applications",
};

function trackEvent(eventName, payload = {}) {
  window.dataLayer.push({ event: eventName, ...payload, ts: Date.now() });
}

function initAnalyticsPlaceholders() {
  // GA4 placeholder loader
  if (TRACKING.ga4MeasurementId && TRACKING.ga4MeasurementId !== "G-XXXXXXXXXX") {
    const ga = document.createElement("script");
    ga.async = true;
    ga.src = `https://www.googletagmanager.com/gtag/js?id=${TRACKING.ga4MeasurementId}`;
    document.head.appendChild(ga);
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", TRACKING.ga4MeasurementId, { anonymize_ip: true });
  }

  // Meta/LinkedIn placeholders intentionally not injected until IDs are real.
}

function initCtaTracking() {
  document.querySelectorAll(".track-cta").forEach((node) => {
    node.addEventListener("click", () => {
      trackEvent("cta_click", {
        cta_location: node.dataset.cta || "unknown",
        cta_text: (node.textContent || "").trim(),
      });
    });
  });
}

function loadCalendly() {
  const wrap = document.getElementById("calendly-inline-widget");
  if (!wrap || !TRACKING.calendlyUrl) return;

  const script = document.createElement("script");
  script.src = "https://assets.calendly.com/assets/external/widget.js";
  script.async = true;
  script.onload = () => {
    if (window.Calendly) {
      window.Calendly.initInlineWidget({
        url: TRACKING.calendlyUrl,
        parentElement: wrap,
      });
      trackEvent("calendly_loaded", { widget: "inline" });
    }
  };
  document.head.appendChild(script);
}

async function handleApplicationSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.getElementById("form-status");
  const data = Object.fromEntries(new FormData(form).entries());

  trackEvent("application_submit_attempt", {
    transactions_per_year: data.transactionsPerYear || "unknown",
    response_sla: data.responseSLA || "unknown",
  });

  try {
    const response = await fetch(TRACKING.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Webhook endpoint unavailable");

    trackEvent("application_submit_success", {
      transactions_per_year: data.transactionsPerYear,
    });
    status.textContent = "Application received. Please choose your call time in the calendar below.";
    form.reset();
  } catch (error) {
    trackEvent("application_submit_fallback", { reason: "webhook_error" });
    status.textContent = "Application captured locally. Please email operations@lpipartners.com if scheduling does not load.";
  }
}

function initApplicationForm() {
  const form = document.getElementById("strategy-form");
  if (!form) return;
  form.addEventListener("submit", handleApplicationSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
  initAnalyticsPlaceholders();
  initCtaTracking();
  initApplicationForm();
  loadCalendly();
});
