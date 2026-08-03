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
  // A escrita NUNCA depende de .finished. As animacoes Web param em
  // separadores escondidos e o promise nunca resolve: bastava carregar no
  // PT/EN e mudar de aba para a pagina ficar com o botao numa lingua e o
  // texto na outra. O temporizador corre na mesma; a animacao e so o visual.
  function apply(lang) {
    if (first || REDUCE || !document.body.animate) {
      write(lang);
      first = false;
      return;
    }
    var main = document.querySelector("main") || document.body;
    main.animate([{ opacity: 1 }, { opacity: .25 }], { duration: 110, easing: "ease-in" });
    setTimeout(function () {
      write(lang);
      main.animate([{ opacity: .25 }, { opacity: 1 }],
        { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" });
    }, 110);
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

// Cortina de abertura. So arma se a pagina estiver mesmo visivel: num
// separador de fundo as animacoes CSS ficam pausadas e um clip-path parado
// a 0% deixaria o hero invisivel. Sem esta classe, nao ha animacao nenhuma
// e o hero fica simplesmente la.
if (!REDUCE && !document.hidden) {
  document.documentElement.classList.add("pode-abrir");
}

// Accao flutuante em pastilha. Aparece depois de 35% da pagina e duplica um
// botao que ja existe, por isso e melhoria progressiva: sem JS nao aparece
// e nao se perde nada.
(function () {
  var origem = document.querySelector("[data-pill]");
  if (!origem) return;

  var pill = document.createElement("a");
  pill.className = "cta-pill";
  pill.href = origem.getAttribute("href") || "#";
  pill.setAttribute("aria-hidden", "true");   // duplicado: fora da ordem de leitura
  pill.tabIndex = -1;                          // e fora da ordem de tabulacao

  var texto = document.createElement("span");
  texto.textContent = origem.textContent.trim();
  // Segue a lingua sem codigo extra: reutiliza os data-pt/data-en da origem.
  if (origem.dataset.pt) texto.dataset.pt = origem.dataset.pt;
  if (origem.dataset.en) texto.dataset.en = origem.dataset.en;

  // O icone diz o que vai acontecer: seta para baixo leva a uma seccao,
  // auscultador liga, envelope abre o email. Uma seta para baixo num
  // link tel: prometia scroll e fazia uma chamada.
  var destino = pill.getAttribute("href") || "";
  var caminho = /^tel:/.test(destino)
    ? '<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 7.2 2 2 0 0 1 6.5 3Z"/>'
    : /^mailto:/.test(destino)
    ? '<path d="M3 6.5h18v11H3zM3 7l9 6 9-6"/>'
    : '<path d="M12 5v14M5 12l7 7 7-7"/>';

  var seta = document.createElement("span");
  seta.className = "cta-pill__seta";
  seta.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + caminho + '</svg>';

  pill.appendChild(texto);
  pill.appendChild(seta);

  // Herda as cores do elemento que duplica, seja qual for a paleta da pagina.
  // Se essa origem for um link de texto sem fundo (o telefone da clinica, por
  // exemplo), a pastilha sairia transparente. Nesse caso vai buscar as cores
  // ao primeiro .btn da pagina, que e o botao primario por definicao.
  function transparente(c) {
    return !c || c === "transparent" || /rgba\([^)]*,\s*0\s*\)$/.test(c);
  }
  var cs = getComputedStyle(origem);
  if (transparente(cs.backgroundColor)) {
    var alt = document.querySelector(".btn");
    if (alt) cs = getComputedStyle(alt);
  }
  pill.style.background = cs.backgroundColor;
  pill.style.color = cs.color;

  document.body.appendChild(pill);

  var agendado = false;
  function ver() {
    agendado = false;
    var altura = document.documentElement.scrollHeight - window.innerHeight;
    var passou = altura > 0 && window.scrollY / altura > .35;
    // Esconde-se ao chegar ao fim: nessa altura o CTA a serio ja esta no ecra.
    var noFim = altura > 0 && window.scrollY / altura > .92;
    pill.classList.toggle("esta-visivel", passou && !noFim);
  }
  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(ver);
  }
  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
  // rAF nao corre em separadores escondidos. Se alguem abrir a pagina numa
  // aba de fundo, rolar, e so depois olhar, o estado estaria atrasado.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) ver();
  });
  ver();
})();

// Palavra que roda. Diz varios nichos no espaco de um.
// Para de vez ao fim de 3 voltas: conteudo em movimento indefinido acima de
// 5s obriga a um controlo de pausa (WCAG 2.2.2), e um controlo de pausa numa
// palavra de tres silabas seria mais ruido do que a propria animacao.
(function () {
  var alvo = document.querySelector("[data-roda]");
  if (!alvo || REDUCE) return;

  // A lista e relida a cada troca, por isso segue a lingua sem codigo extra.
  function lista() {
    var bruto = document.documentElement.lang === "en" && alvo.dataset.rodaEn
      ? alvo.dataset.rodaEn : alvo.dataset.roda;
    try {
      var a = JSON.parse(bruto);
      return Array.isArray(a) && a.length > 1 ? a : null;
    } catch (e) { return null; }
  }

  var vivo = alvo.querySelector(".roda__vivo");
  if (!vivo || !lista()) return;

  var i = 0, voltas = 0;
  var timer = setInterval(function () {
    if (document.hidden) return;              // nao gasta voltas sem ninguem a ver
    var itens = lista();
    if (!itens) return;
    alvo.classList.add("a-trocar");
    setTimeout(function () {
      i = (i + 1) % itens.length;
      vivo.textContent = itens[i];
      alvo.classList.remove("a-trocar");
      if (i === 0 && ++voltas >= 3) clearInterval(timer);
    }, 220);
  }, 2600);
})();
