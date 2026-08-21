/* ============================================================
   FIT AND FIGHT CLUB — site behaviour
   Four small jobs: the mobile menu, the centres dropdown, a
   scroll reveal, and turning the enquiry form into a WhatsApp
   message. No dependencies, no build step.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- centres dropdown ---------- */
  document.querySelectorAll(".has-menu > button").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var parent = btn.parentElement;
      var open = parent.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".has-menu.open").forEach(function (m) {
      if (!m.contains(e.target)) {
        m.classList.remove("open");
        var b = m.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".has-menu.open").forEach(function (m) { m.classList.remove("open"); });
    if (nav) nav.classList.remove("open");
  });

  /* ---------- reveal on scroll ---------- */
  var targets = document.querySelectorAll(".reveal");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (t) { t.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- enquiry form → WhatsApp ----------
     A static site has nowhere to POST to, and this is a business
     that runs on WhatsApp anyway. The form composes a message and
     hands it to the chosen centre's number. The mailto link below
     the form is the fallback for anyone without WhatsApp. */
  var form = document.querySelector("[data-enquiry]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var centre = form.querySelector("[name=centre]");
      var phone = centre ? centre.selectedOptions[0].dataset.phone : "";
      var centreName = centre ? centre.selectedOptions[0].dataset.name : "";
      if (!phone) return;

      var lines = [
        "Hello Fit and Fight Club (" + centreName + "),",
        "",
        "I would like to book a free trial.",
        "",
        "Name: " + (data.get("name") || "—"),
        "Phone: " + (data.get("phone") || "—"),
        "Interested in: " + (data.get("interest") || "—"),
        "Experience: " + (data.get("experience") || "—")
      ];
      var msg = String(data.get("message") || "").trim();
      if (msg) lines.push("", msg);

      window.open(
        "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n")),
        "_blank",
        "noopener"
      );

      var note = form.querySelector("[data-sent]");
      if (note) {
        note.hidden = false;
        note.textContent = "Opening WhatsApp to " + centreName + ". If nothing happened, call the centre directly — the number is just below.";
      }
    });
  }

  /* ---------- current year in the footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
