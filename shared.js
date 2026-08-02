// Troca de lingua. Cada elemento traduzivel traz data-pt / data-en.
// Atributos (placeholder, aria-label) usam data-pt-attr / data-en-attr no
// formato "nome:valor".
//
// ponytail: nao ha ficheiros de traducao nem framework i18n. Sao paginas de
// duas linguas com ~40 strings cada. Passar a JSON so quando forem 3 linguas.

var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  if (!REDUCE) {
    box.animate(
      [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }],
      { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" }
    );
  }
}

(function () {
  var KEY = "gs-lang";
  var first = true;

  function write(lang) {
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

  // A troca de lingua e o argumento de venda destas paginas, por isso tem de
  // se ver a acontecer. Anima-se o <main> uma vez em vez de ~50 elementos:
  // 50 animacoes simultaneas com blur engasgam, uma so opacidade nao.
  function apply(lang) {
    if (first || REDUCE || !document.body.animate) {
      write(lang);
      first = false;
      return;
    }
    var main = document.querySelector("main") || document.body;
    main.animate([{ opacity: 1 }, { opacity: .25 }], { duration: 110, easing: "ease-in" })
      .finished.then(function () {
        write(lang);
        main.animate([{ opacity: .25 }, { opacity: 1 }],
          { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" });
      });
  }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang-btn]");
    if (btn) {
      document.documentElement.dataset.langPinned = "1";  // para a auto-demo
      apply(btn.dataset.langBtn);
    }
  });

  var prefers = (navigator.language || "pt").slice(0, 2) === "en" ? "en" : "pt";
  apply(stored() || prefers);

  window.__setLang = apply;
})();

// Revelacao dos grupos marcados com data-reveal.
//
// Sem IntersectionObserver de proposito. O observador so dispara em MUDANCAS
// de interseccao, por isso um scroll rapido (tecla End, uma ancora, um
// telemovel com inercia) salta elementos que nunca mais recebem callback e
// ficam invisiveis para sempre. Aqui le-se a posicao absoluta, que nao tem
// como ser saltada.
//
// O estado escondido e adicionado por JS, nunca no HTML: sem JS fica visivel.
(function () {
  var alvos = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if (!alvos.length || REDUCE) return;

  var agendado = false;

  function verificar() {
    agendado = false;
    var limite = window.innerHeight * .92;
    alvos = alvos.filter(function (el) {
      if (el.getBoundingClientRect().top >= limite) return true;
      el.classList.add("is-in");
      return false;
    });
    if (!alvos.length) {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
    }
  }

  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(verificar);
  }

  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
  verificar();
})();
