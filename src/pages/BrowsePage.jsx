import React, { useState, useEffect } from "react"
import { C, Fh, APP_URL, CATS } from "../constants.js"
import { PGrid } from "../components/ProductCard.jsx"
import { useDocTitle, useMeta, useSchema } from "../components/SmartSearch.jsx"

export function BrowsePage({ products, nav, addToCart, rate, rateLabel, params:ip={}, favs=[], toggleFav }) {
  const [search, setSearch] = useState(ip.search||"");
  const [cat,    setCat]    = useState(ip.cat||"Todo");
  const [cond,   setCond]   = useState(ip.cond||"all");
  const [sort,   setSort]   = useState(ip.sort||"default");
  const [loc,    setLoc]    = useState("all");
  const [minP,   setMinP]   = useState("");
  const [maxP,   setMaxP]   = useState("");

  const [showFilters, setShowFilters] = useState(false);

  // Sync search/cat when header nav updates params
  useEffect(() => { setSearch(ip.search||""); }, [ip.search]);
  useEffect(() => { if(ip.cat) setCat(ip.cat); }, [ip.cat]);

  let f = products.filter(p => p.active && p.stock > 0);
  if(search) f = f.filter(p => [p.name,p.merchantName,p.category,p.description,p.merchantLoc].some(s=>s?.toLowerCase().includes(search.toLowerCase())));
  if(cat!=="Todo") f = f.filter(p => p.category===cat);
  if(cond==="new")  f = f.filter(p => p.condition==="new");
  if(cond==="used") f = f.filter(p => p.condition==="used");
  if(cond==="sale") f = f.filter(p => p.salePrice);
  if(loc!=="all")   f = f.filter(p => p.merchantLoc===loc);
  if(minP) f = f.filter(p => (p.salePrice||p.price) >= +minP);
  if(maxP) f = f.filter(p => (p.salePrice||p.price) <= +maxP);
  if(sort==="default"||sort==="asc") f = [...f].sort((a,b) => (a.salePrice||a.price)-(b.salePrice||b.price));
  if(sort==="desc") f = [...f].sort((a,b) => (b.salePrice||b.price)-(a.salePrice||a.price));
  if(sort==="new")  f = [...f].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));

  const locs = ["all",...new Set(products.map(p=>p.merchantLoc).filter(Boolean))];
  const activeFilters = [search&&`"${search}"`, cat!=="Todo"&&cat, cond!=="all"&&cond, loc!=="all"&&loc, minP&&`>$${minP}`, maxP&&`<$${maxP}`].filter(Boolean);

  const hasAnyFilter = search || cat!=="Todo" || cond!=="all" || loc!=="all" || minP || maxP;
  const pageTitle = search ? `"${search}"` : cat!=="Todo" ? cat : "Todos los productos";

  useDocTitle(cat!=="Todo" ? cat : search ? `Buscar: ${search}` : "Explorar productos");
  useMeta(`Compra ${cat!=="Todo"?cat:"productos"} en Venezuela. ${search?`Resultados para "${search}". `:""}Precios en dólares, envíos y retiro en tienda.`);
  useSchema([{
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Inicio","item":APP_URL},
      {"@type":"ListItem","position":2,"name":"Explorar","item":`${APP_URL}/browse`},
      ...(cat!=="Todo"?[{"@type":"ListItem","position":3,"name":cat,"item":`${APP_URL}/browse?cat=${encodeURIComponent(cat)}`}]:[])
    ]
  }]);
  /* eslint-disable react-hooks/exhaustive-deps */
  return (
    <div className="page-wrap">

      {/* ── HEADER COMPACTO ── */}
      <div style={{marginBottom:14}}>

        {/* Título + conteo + ordenar en una línea */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontFamily:Fh,fontSize:"clamp(15px,3vw,18px)",fontWeight:800,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pageTitle}</h1>
            <span style={{fontSize:11,color:C.muted}}>{f.length} producto{f.length!==1?"s":""}</span>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
            <select value={sort} onChange={e=>setSort(e.target.value)}
              style={{fontSize:12,padding:"6px 9px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",color:C.text,outline:"none"}}>
              <option value="default">↑ Precio</option>
              <option value="desc">↓ Precio</option>
              <option value="new">Recientes</option>
            </select>
            <button className="hop" onClick={()=>setShowFilters(v=>!v)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:8,border:`1px solid ${showFilters||hasAnyFilter?C.navy:C.border}`,background:showFilters||hasAnyFilter?C.navyL:"#fff",color:showFilters||hasAnyFilter?C.navy:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",position:"relative",whiteSpace:"nowrap"}}>
              <span>⚙️</span>
              <span className="hide-sm">Filtros</span>
              {activeFilters.length>0&&<span style={{background:C.red,color:"#fff",fontSize:9,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters.length}</span>}
            </button>
          </div>
        </div>

        {/* Categorías en scroll horizontal */}
        <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:2,margin:"0 -4px",paddingLeft:4}}>
          {CATS.map(c => (
            <button key={c} className="hop" onClick={()=>setCat(c)}
              style={{fontSize:12,fontWeight:cat===c?700:500,color:cat===c?"#fff":C.text,background:cat===c?C.navy:"transparent",border:`1.5px solid ${cat===c?C.navy:C.border}`,borderRadius:20,padding:"4px 13px",whiteSpace:"nowrap",flexShrink:0,cursor:"pointer",transition:"all .15s"}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL DE FILTROS COLAPSABLE ── */}
      {showFilters && (
        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",marginBottom:12,animation:"vy-fade .15s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>

            <div>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Condición</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[["all","Todos"],["new","Nuevo"],["used","Usado"],["sale","Oferta"]].map(([v,l]) => (
                  <button key={v} onClick={()=>setCond(v)}
                    style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:`1.5px solid ${cond===v?C.red:C.border}`,background:cond===v?C.red:"transparent",color:cond===v?"#fff":C.text,cursor:"pointer",fontWeight:cond===v?700:400,whiteSpace:"nowrap"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Ciudad</div>
              <select value={loc} onChange={e=>setLoc(e.target.value)}
                style={{width:"100%",fontSize:12,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",outline:"none"}}>
                {locs.map(l => <option key={l} value={l}>{l==="all"?"Todas las ciudades":l}</option>)}
              </select>
            </div>

            <div>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Precio USD</div>
              <div style={{display:"flex",gap:6,alignItems:"center",width:"100%",boxSizing:"border-box"}}>
                <input value={minP} onChange={e=>setMinP(e.target.value)} placeholder="Mín"
                  type="number" style={{width:0,flex:1,fontSize:12,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.border}`,outline:"none",boxSizing:"border-box",minWidth:0}} />
                <span style={{color:C.muted,fontSize:11,flexShrink:0}}>—</span>
                <input value={maxP} onChange={e=>setMaxP(e.target.value)} placeholder="Máx"
                  type="number" style={{width:0,flex:1,fontSize:12,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.border}`,outline:"none",boxSizing:"border-box",minWidth:0}} />
              </div>
            </div>
          </div>

          {hasAnyFilter && (
            <div style={{borderTop:`1px solid ${C.border}`,marginTop:10,paddingTop:8,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.muted}}>Filtros activos:</span>
              {activeFilters.map(af => (
                <span key={af} style={{fontSize:11,fontWeight:600,color:C.navy,background:C.navyL,padding:"2px 9px",borderRadius:20,border:`1px solid ${C.navy}22`}}>{af}</span>
              ))}
              <button onClick={()=>{setSearch("");setCat("Todo");setCond("all");setLoc("all");setMinP("");setMaxP("");setShowFilters(false);}}
                style={{marginLeft:"auto",fontSize:11,color:"#991B1B",background:C.redL,border:"none",padding:"3px 10px",borderRadius:20,cursor:"pointer",fontWeight:600}}>
                ✕ Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTADOS ── */}
      {f.length===0
        ? (
          <div style={{textAlign:"center",padding:"50px 20px",color:C.muted}}>
            <div style={{fontSize:44,marginBottom:10}}>🔍</div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>Sin resultados{search?` para "${search}"`:`${cat!=="Todo"?` en ${cat}`:""}`}</div>
            <div style={{fontSize:12,marginBottom:16}}>Intenta con otra búsqueda o ajusta los filtros</div>
            {hasAnyFilter && (
              <button onClick={()=>{setSearch("");setCat("Todo");setCond("all");setLoc("all");setMinP("");setMaxP("");}}
                style={{fontSize:13,color:"#991B1B",background:C.redL,border:"none",padding:"8px 18px",borderRadius:20,cursor:"pointer",fontWeight:600}}>
                Ver todos los productos
              </button>
            )}
          </div>
        )
        : <PGrid items={f} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
      }
    </div>
  );
}
