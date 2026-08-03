// Barra de afinação. Só aparece com ?tweaks=1 no URL.
//
// Existe porque pedir "mais premium" ao terminal não é uma instrução, é
// esperança. Isto mexe nas variáveis CSS em tempo real e no fim cospe o
// bloco :root pronto a colar.
//
// Não é código de produção: sai da página com um F5 sem o parâmetro.
// Também serve numa chamada com cliente, para mostrar a cor a mudar em vez
// de a descrever.
//
// ponytail: sem framework, sem build, sem dependências. São 6 sliders.

(function () {
  if (!/[?&]tweaks=1/.test(location.search)) return;

  var raiz = document.documentElement;

  // Lê o valor actual do token para o slider começar onde a página está,
  // em vez de saltar para um valor arbitrário ao primeiro toque.
  function lerNum(nome, omissao) {
    var v = parseFloat(getComputedStyle(raiz).getPropertyValue(nome));
    return isNaN(v) ? omissao : v;
  }

  // Extrai L C H de uma cor oklch() já resolvida no token.
  function lerOklch(nome) {
    var v = getComputedStyle(raiz).getPropertyValue(nome).trim();
    var m = v.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
    return m ? { l: +m[1], c: +m[2], h: +m[3] } : null;
  }

  // Os tokens de cor variam de página para página (cada demo tem a sua
  // paleta). Descobre-se qual existe em vez de assumir.
  var TOKENS_COR = ["--terra", "--gold", "--cork", "--accent"];
  var tokenCor = TOKENS_COR.filter(function (t) {
    return getComputedStyle(raiz).getPropertyValue(t).trim();
  })[0];
  var corBase = tokenCor ? lerOklch(tokenCor) : null;

  var controlos = [
    { id: "escala", rotulo: "Escala tipográfica", min: .85, max: 1.35, passo: .01, valor: 1,
      aplicar: function (v) {
        // Reescala os degraus todos a partir do token, não do px.
        [["--text-xs", .78], ["--text-sm", .875], ["--text-body", 1],
         ["--text-lead", 1.25], ["--text-h3", 1.25]].forEach(function (par) {
          raiz.style.setProperty(par[0], (par[1] * v).toFixed(3) + "rem");
        });
        raiz.style.setProperty("--text-h2", "clamp(" + (1.6 * v).toFixed(2) + "rem, 1.2rem + 1.6vw, " + (2.4 * v).toFixed(2) + "rem)");
        raiz.style.setProperty("--text-h1", "clamp(" + (2.2 * v).toFixed(2) + "rem, 1.4rem + 3.6vw, " + (3.8 * v).toFixed(2) + "rem)");
      } },
    { id: "raio", rotulo: "Raio dos cantos", min: 0, max: 24, passo: 1, valor: lerNum("--radius", 8),
      aplicar: function (v) {
        raiz.style.setProperty("--radius-sm", (v / 2) + "px");
        raiz.style.setProperty("--radius", v + "px");
        raiz.style.setProperty("--radius-lg", (v * 1.5) + "px");
      } },
    { id: "dur", rotulo: "Velocidade do movimento", min: 0, max: 500, passo: 10, valor: lerNum("--dur", 180),
      aplicar: function (v) { raiz.style.setProperty("--dur", v + "ms"); } }
  ];

  if (corBase) {
    controlos.push(
      { id: "matiz", rotulo: "Matiz do acento", min: 0, max: 360, passo: 1, valor: corBase.h,
        aplicar: function (v) { corBase.h = v; pintar(); } },
      { id: "croma", rotulo: "Croma do acento", min: 0, max: .3, passo: .005, valor: corBase.c,
        aplicar: function (v) { corBase.c = v; pintar(); } },
      { id: "lum", rotulo: "Luminosidade do acento", min: 20, max: 90, passo: 1, valor: corBase.l,
        aplicar: function (v) { corBase.l = v; pintar(); } }
    );
  }

  function pintar() {
    raiz.style.setProperty(tokenCor,
      "oklch(" + corBase.l + "% " + corBase.c + " " + corBase.h + ")");
  }

  // --- Interface ---------------------------------------------------------
  var estilo = document.createElement("style");
  estilo.textContent = [
    ".tw{position:fixed;right:1rem;bottom:1rem;z-index:9000;width:17rem;",
    "background:#14161b;color:#eceef2;border:1px solid #333;border-radius:10px;",
    "padding:.9rem;font:13px/1.4 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.5)}",
    ".tw h2{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.6;margin-bottom:.7rem}",
    ".tw label{display:block;margin-bottom:.65rem}",
    ".tw label span{display:flex;justify-content:space-between;margin-bottom:.15rem;opacity:.85}",
    ".tw label b{font-weight:600;font-variant-numeric:tabular-nums;opacity:.7}",
    ".tw input{width:100%;accent-color:#7d9bff}",
    ".tw button{width:100%;margin-top:.4rem;padding:.55rem;border:0;border-radius:6px;",
    "background:#7d9bff;color:#0d1117;font:inherit;font-weight:700;cursor:pointer}",
    ".tw button.sec{background:transparent;color:#eceef2;border:1px solid #333;font-weight:400}",
    ".tw pre{margin-top:.6rem;max-height:9rem;overflow:auto;background:#0b0d10;",
    "border-radius:6px;padding:.5rem;font-size:11px;white-space:pre-wrap}"
  ].join("");
  document.head.appendChild(estilo);

  var caixa = document.createElement("div");
  caixa.className = "tw";
  caixa.innerHTML = "<h2>Afinação · ?tweaks=1</h2>";

  controlos.forEach(function (c) {
    var l = document.createElement("label");
    l.innerHTML = "<span>" + c.rotulo + "<b>" + c.valor + "</b></span>";
    var i = document.createElement("input");
    i.type = "range"; i.min = c.min; i.max = c.max; i.step = c.passo; i.value = c.valor;
    i.addEventListener("input", function () {
      l.querySelector("b").textContent = i.value;
      c.aplicar(parseFloat(i.value));
    });
    l.appendChild(i);
    caixa.appendChild(l);
  });

  var saida = document.createElement("pre");
  saida.hidden = true;

  var copiar = document.createElement("button");
  copiar.textContent = "Copiar CSS";
  copiar.addEventListener("click", function () {
    var linhas = [];
    for (var i = 0; i < raiz.style.length; i++) {
      var p = raiz.style[i];
      linhas.push("  " + p + ": " + raiz.style.getPropertyValue(p) + ";");
    }
    var css = linhas.length ? ":root {\n" + linhas.join("\n") + "\n}" : "/* nada alterado */";
    saida.textContent = css;
    saida.hidden = false;
    if (navigator.clipboard) navigator.clipboard.writeText(css).catch(function () {});
    copiar.textContent = "Copiado";
    setTimeout(function () { copiar.textContent = "Copiar CSS"; }, 1400);
  });

  var repor = document.createElement("button");
  repor.className = "sec";
  repor.textContent = "Repor";
  repor.addEventListener("click", function () {
    raiz.removeAttribute("style");
    saida.hidden = true;
    location.reload();
  });

  caixa.appendChild(copiar);
  caixa.appendChild(repor);
  caixa.appendChild(saida);
  document.body.appendChild(caixa);
})();
