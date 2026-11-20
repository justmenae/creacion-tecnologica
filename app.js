:root{--fondo:#EEF1F5;--papel:#fff;--tinta:#1B2A41;--suave:#5B6B80;--linea:#D5DCE5;--acento:#0E6B63;--ok:#2E8B6A;--amb:#D9860B;--red:#C0392B;--serif:Charter,"Iowan Old Style",Georgia,serif;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--tinta);font:16px/1.5 var(--sans)}
h1,.arq{font-family:var(--serif);margin:0}
button{font:inherit;cursor:pointer;color:inherit}
:focus-visible{outline:3px solid var(--acento);outline-offset:2px}

/* Portada */
.hero{height:140vh;background:linear-gradient(160deg,var(--tinta),var(--acento))}
.stick{position:sticky;top:0;height:100vh;display:grid;place-items:center;text-align:center;color:#fff}
.bg{position:absolute;inset:0;width:100%;height:100%}
.hc{position:relative;padding:0 1rem}
.hc h1{font-size:clamp(4rem,16vw,9rem);letter-spacing:.08em}
.hc p{font-size:1.2rem;opacity:.9;margin:.3rem 0 2rem}
.cta{min-height:70vh;display:grid;place-items:center;padding:2rem}
.inicio{background:var(--papel);border:2px solid var(--tinta);border-radius:14px;padding:1.6rem 2rem;max-width:520px;text-align:left;box-shadow:0 8px 0 var(--tinta);transition:transform .2s,box-shadow .2s}
.inicio:hover{transform:translateY(4px);box-shadow:0 4px 0 var(--tinta)}
.inicio b{display:block;font:700 1.5rem var(--serif);color:var(--acento)}
.inicio span{color:var(--suave)}

/* Taller */
.taller{display:flex;height:0;opacity:0;overflow:hidden;transition:height .9s ease,opacity .9s ease}
.taller.abierto{height:100vh;opacity:1}
.lienzo{flex:1;position:relative;background:#fff;min-width:0}
.lienzo svg{width:100%;height:100%;display:block;touch-action:none}
.hint{position:absolute;left:1rem;top:.8rem;z-index:1;font-size:.85rem;color:var(--suave);background:var(--fondo);padding:.25rem .8rem;border-radius:99px}
.barra{width:340px;overflow-y:auto;background:var(--fondo);border-left:3px solid var(--tinta);padding:1rem}
h3{font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:var(--suave);margin:1.1rem 0 .4rem}
.mini{font-size:.8rem;color:var(--suave);margin:.3rem 0}
.score{display:flex;gap:1rem;align-items:center}
.medidor{--p:0;--c:var(--linea);width:96px;height:96px;flex:none;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(closest-side,#fff 74%,transparent 76%),conic-gradient(var(--c) calc(var(--p)*1%),var(--linea) 0);transition:background .4s}
.medidor span{font:700 1.9rem/1 var(--serif)}
.medidor small{font-size:.7rem;color:var(--suave)}
.medidor.win{animation:pop .6s}
@keyframes pop{50%{transform:scale(1.14)}}
.arq{font-size:1rem;font-weight:700;color:var(--acento)}
.delta{font-weight:700;margin-left:.4rem}
.delta.up{color:var(--ok)}.delta.dn{color:var(--red)}

.tools,.chips{display:flex;flex-wrap:wrap;gap:.4rem}
.tools button,.chips button{background:var(--papel);border:2px solid var(--linea);border-radius:8px;padding:.3rem .65rem;font-size:.88rem;font-weight:600;transition:border-color .15s,background .15s}
.tools button:hover,.chips button:hover{border-color:var(--acento)}
[aria-pressed="true"]{border-color:var(--acento)!important;background:#E3F1EE!important}
.chips i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:.3rem;border:1px solid #0003}
.sel{margin-top:.6rem}
.sel input{width:100%;border:2px solid var(--linea);border-radius:8px;padding:.35rem .6rem;font:inherit;margin-bottom:.4rem}
.rng{display:block;font-size:.9rem;font-weight:600}
.rng output{color:var(--acento);float:right}
.rng input{width:100%;accent-color:var(--acento)}

.dim{display:grid;grid-template-columns:110px 1fr 32px;gap:.5rem;align-items:center;font-size:.82rem;margin:.25rem 0;cursor:help}
.dim .b{height:9px;background:var(--linea);border-radius:5px;overflow:hidden}
.dim .b i{display:block;height:100%;border-radius:5px;transition:width .4s}
.dim i.ok{background:var(--ok)}.dim i.amb{background:var(--amb)}.dim i.red{background:var(--red)}
.alertas{list-style:none;margin:.7rem 0;padding:0}
.alertas li{border-left:6px solid var(--ok);background:var(--papel);border-radius:0 8px 8px 0;padding:.3rem .6rem;margin:.35rem 0;font-size:.85rem}
.alertas li.red{border-color:var(--red)}.alertas li.amb{border-color:var(--amb)}
.alertas b{display:block}
.plan{background:var(--tinta);color:#fff;border-radius:10px;padding:.6rem .8rem;font-size:.88rem}
.plan small{display:block;color:#9fe0d6;font-weight:700;text-transform:uppercase;letter-spacing:.06em}

/* Organigrama SVG */
.lin{stroke:#9AA8BA;stroke-width:1.6;fill:none}
.cru{stroke:var(--red);stroke-width:1.8;stroke-dasharray:5 4;fill:none}
.n{cursor:grab}
.n circle{stroke-width:3}
.n.ok circle{stroke:var(--ok)}.n.amb circle{stroke:var(--amb)}.n.red circle{stroke:var(--red)}
.n.dual circle{stroke:var(--red);stroke-dasharray:4 3}
.n .halo{fill:none;stroke:var(--acento);stroke-width:2;opacity:0}
.n.sel .halo{opacity:.7}
.n text{font:700 12px var(--sans);text-anchor:middle;pointer-events:none;fill:var(--tinta)}
.n .nm{font:500 11px var(--sans);fill:var(--suave)}

@media (max-width:860px){
  .taller{flex-direction:column}
  .taller.abierto{height:auto}
  .lienzo{height:60vh;flex:none}
  .barra{width:auto;border-left:0;border-top:3px solid var(--tinta)}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
