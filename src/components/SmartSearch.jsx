import React, { useState, useRef, useEffect } from "react"
import { C, Fb, KW, CATS, APP_NAME, APP_URL, APP_DESC, APP_LOGO } from "../constants.js"
import { HR } from "./ui.jsx"
import { Img } from "./ui.jsx"
import { fU } from "../utils.js"

/* ═══════════════════════════════════════════════
   SEO + SCHEMA.ORG — useSchema hook
   Injects JSON-LD structured data per page.
   Covers: WebSite, Organization, Product,
   LocalBusiness, BreadcrumbList, SearchAction.
   Target: Google Rich Results, AI overviews (AEO),
   LLM knowledge graphs, geo-local pack.
═══════════════════════════════════════════════ */
export function useSchema(schemas) {
  React.useEffect(() => {
    const id = "vy-jsonld";
    let el = document.getElementById(id);
    if(!el) { el = document.createElement("script"); el.id = id; el.type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify((schemas?.length === 1) ? schemas[0] : { "@context":"https://schema.org", "@graph": schemas || [] });
    return () => { /* keep on unmount — updated on next page */ };
  }, [JSON.stringify(schemas)]);
}

export function useDocTitle(title) {
  React.useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} — Marketplace Venezuela`;
  }, [title]);
}

export function useMeta(desc) {
  React.useEffect(() => {
    let el = document.querySelector('meta[name="description"]');
    if(!el) { el = document.createElement("meta"); el.name = "description"; document.head.appendChild(el); }
    el.content = desc || APP_DESC;
    let ogEl = document.querySelector('meta[property="og:description"]');
    if(!ogEl) { ogEl = document.createElement("meta"); ogEl.setAttribute("property","og:description"); document.head.appendChild(ogEl); }
    ogEl.content = desc || APP_DESC;
  }, [desc]);
}

/* SMART SEARCH */
export function SmartSearch({ products, nav }) {
  const [q,     setQ]     = useState("");
  const [focus, setFocus] = useState(false);
  const [res,   setRes]   = useState({prods:[],kws:[],cats:[]});
  const wRef=useRef(null), iRef=useRef(null);
  useEffect(() => {
    const h = e => { if(wRef.current && !wRef.current.contains(e.target)) setFocus(false); };
    document.addEventListener("mousedown",h);
    return () => document.removeEventListener("mousedown",h);
  },[]);
  useEffect(() => {
    if(!q.trim()) { setRes({prods:[],kws:[],cats:[]}); return; }
    const lq = q.toLowerCase();
    setRes({
      prods:products.filter(p => p.active && [p.name,p.merchantName,p.category,p.description].some(s=>s?.toLowerCase().includes(lq))).slice(0,5),
      kws:  KW.filter(k => k.toLowerCase().includes(lq)).slice(0,3),
      cats: CATS.filter(c => c!=="Todo" && c.toLowerCase().includes(lq)).slice(0,2)
    });
  },[q,products]);
  const go = () => { if(q.trim()) { nav("browse",{search:q.trim()}); setFocus(false); setQ(""); } };
  const hasSug = res.prods.length||res.kws.length||res.cats.length;
  return (
    <div ref={wRef} style={{position:"relative",width:"100%"}}>
      <div style={{display:"flex",background:"rgba(255,255,255,.12)",borderRadius:8,border:"1px solid rgba(255,255,255,.18)",overflow:"hidden"}}>
        <input ref={iRef} value={q} onChange={e=>setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onKeyDown={e => e.key==="Enter"&&go()}
          placeholder="Busca productos, marcas, categorías…"
          className="si"
          style={{flex:1,padding:"8px 13px",background:"transparent",border:"none",fontSize:13,color:"#fff",outline:"none",fontFamily:Fb}} />
        <button onClick={go} style={{background:"transparent",border:"none",padding:"0 12px",fontSize:16,cursor:"pointer",color:"rgba(255,255,255,.7)",flexShrink:0,display:"flex",alignItems:"center"}}>🔍</button>
      </div>
      {focus && (q.trim() ? hasSug : true) && (
        <div style={{position:"absolute",top:"calc(100% + 5px)",left:0,right:0,background:C.white,borderRadius:10,boxShadow:"0 12px 36px rgba(0,0,0,.18)",border:`1px solid ${C.border}`,zIndex:500,overflow:"hidden",animation:"vy-fade .15s ease"}}>
          {!q.trim() && (
            <div style={{padding:"11px 13px"}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:7}}>Populares</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {KW.slice(0,10).map(k => (
                  <span key={k} onClick={() => { setQ(k); iRef.current?.focus(); }}
                    style={{background:C.light,color:C.muted,fontSize:11,padding:"3px 9px",borderRadius:20,cursor:"pointer",fontWeight:600}}>{k}</span>
                ))}
              </div>
            </div>
          )}
          {q.trim() && hasSug && (
            <div>
              {res.cats.map(c => (
                <div key={c} onClick={() => { nav("browse",{cat:c}); setFocus(false); setQ(""); }}
                  style={{padding:"9px 13px",cursor:"pointer",fontSize:13,display:"flex",gap:8}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.light}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  📂 {c}
                </div>
              ))}
              {res.kws.map(k => (
                <div key={k} onClick={() => { setQ(k); setTimeout(go,50); }}
                  style={{padding:"9px 13px",cursor:"pointer",fontSize:13,display:"flex",gap:8}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.light}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  🔍 {k}
                </div>
              ))}
              {res.prods.length > 0 && (
                <>
                  <HR />
                  <div style={{padding:"4px 13px 10px"}}>
                    {res.prods.map(p => (
                      <div key={p.id} onClick={() => { nav("product",{productId:p.id}); setFocus(false); setQ(""); }}
                        style={{display:"flex",gap:9,alignItems:"center",padding:"7px 6px",borderRadius:7,cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.light}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{width:38,height:38,borderRadius:6,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={p.image} /></div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                          <div style={{fontSize:10,color:C.muted}}>{p.merchantName}</div>
                        </div>
                        <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:13,color:C.red,flexShrink:0}}>{fU(p.salePrice||p.price)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
