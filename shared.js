// Troca de lingua. Cada elemento traduzivel traz data-pt / data-en.
// Atributos (placeholder, aria-label) usam data-pt-attr / data-en-attr no
// formato "nome:valor".
//
// ponytail: nao ha ficheiros de traducao nem framework i18n. Sao paginas de
// duas linguas com ~40 strings cada. Passar a JSON so quando forem 3 linguas.

// Aviso de demonstracao. Escreve numa regiao aria-live em vez de trocar o
// texto do botao: o texto do botao e retraduzido ao mudar de lingua, o que
// fazia o aviso desaparecer e a pagina parecer que enviava mesmo.
function showDemoNotice(form) {
  var box = form.querySelector(".formstatus");
  if (!box) return;
  var en = document.documentElement.lang === "en";
  box.textContent = en
    ? "Demo page. Nothing was sent and no data was stored."
    : "Página de demonstração. Nada foi enviado nem guardado.";
  box.dataset.pt = "Página de demonstração. Nada foi enviado nem guardado.";
  box.dataset.en = "Demo page. Nothing was sent and no data was stored.";
}

(function () {
  var KEY = "gs-lang";

  function apply(lang) {
    document.documentElement.lang = lang === "en" ? "en" : "pt";

    document.querySelectorAll("[data-pt]").forEach(function (el) {
      var val = el.dataset[lang];
      if (val != null) el.textContent = val;
    });

    document.querySelectorAll("[data-pt-attr]").forEach(function (el) {
      var raw = el.dataset[lang + "Attr"];
      if (!raw) return;
      var i = raw.indexOf(":");
      if (i > 0) el.setAttribute(raw.slice(0, i), raw.slice(i + 1));
    });

    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.langBtn === lang));
    });

    try { localStorage.setItem(KEY, lang); } catch (e) { /* modo privado */ }
  }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang-btn]");
    if (btn) apply(btn.dataset.langBtn);
  });

  var prefers = (navigator.language || "pt").slice(0, 2) === "en" ? "en" : "pt";
  apply(stored() || prefers);
})();
