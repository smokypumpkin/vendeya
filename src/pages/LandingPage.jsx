import React from "react"
import { C, Fh, APP_DESC, APP_URL } from "../constants.js"
import { btn } from "../components/ui.jsx"
import { Pill } from "../components/ui.jsx"
import { Section } from "../components/ProductCard.jsx"
import { useDocTitle, useMeta, useSchema } from "../components/SmartSearch.jsx"

export function LandingPage({ products, nav, addToCart, rate, rateLabel, users, favs=[], toggleFav }) {
  useDocTitle(null);
  useMeta(APP_DESC);
  useSchema([{
    "@context":"https://schema.org",
    "@type":"ItemList",
    "name":"Productos destacados en VendeYApp",
    "description":"Los mejores productos del marketplace venezolano",
    "itemListElement": products.filter(p=>p.active&&p.stock>0&&p.salePrice).slice(0,12).map((p,i)=>({
      "@type":"ListItem","position":i+1,
      "item":{ "@type":"Product","name":p.name,"image":p.image,"description":p.description||p.name,
        "offers":{"@type":"Offer","price":p.salePrice||p.price,"priceCurrency":"USD","availability":"https://schema.org/InStock"}}
    }))
  }]);
  const f      = products.filter(p => p.active && p.stock > 0);
  const sorted = [...f].sort((a,b) => (a.salePrice||a.price)-(b.salePrice||b.price));
  const CATS_ICONS = [["Tecnología","💻"],["Moda","👟"],["Hogar","🏠"],["Deportes","🏋️"],["Alimentos","☕"],["Libros","📚"]];
  const merchants = (users||[]).filter(u => u.role==="merchant" && u.merchantVerified);

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{background:`linear-gradient(135deg,${C.navyD} 0%,#1a2744 60%,#22184a 100%)`,padding:"44px 16px 56px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,right:-60,width:340,height:340,borderRadius:"50%",background:C.red+"0E",pointerEvents:"none"}} />
        <div style={{position:"absolute",bottom:-60,left:-40,width:280,height:280,borderRadius:"50%",background:C.gold+"0A",pointerEvents:"none"}} />
        <div style={{position:"absolute",top:"50%",left:"55%",width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.02)",pointerEvents:"none"}} />
        <div style={{maxWidth:660,margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,107,74,.15)",border:"1px solid rgba(255,107,74,.3)",borderRadius:20,padding:"4px 16px",marginBottom:18}}>
            <span>🇻🇪</span><span style={{color:"#FF9A7A",fontSize:11,fontWeight:700,letterSpacing:.5}}>EL MARKETPLACE SEGURO DE VENEZUELA</span>
          </div>
          <h1 style={{fontFamily:Fh,color:"#fff",fontSize:"clamp(24px,5vw,48px)",margin:"0 0 14px",lineHeight:1.08,fontWeight:900,letterSpacing:"-.5px"}}>
            Compra y vende<br /><span style={{color:"#FF6B4A"}}>sin riesgos</span>
          </h1>
          <p style={{color:"rgba(255,255,255,.65)",fontSize:15,margin:"0 0 28px",lineHeight:1.7}}>
            Pagos protegidos · Vendedores verificados<br />
            <span style={{color:"rgba(255,255,255,.85)",fontWeight:600}}>PagoMóvil · Zelle · Tarjeta</span>
          </p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            <button className="hop" onClick={() => nav("browse")} style={{...btn(C.red),padding:"13px 28px",fontSize:15,fontWeight:700,boxShadow:"0 4px 20px rgba(220,38,38,.4)"}}>Ver Productos 🛍️</button>
            <button className="hop" onClick={() => nav("register")} style={{...btn("rgba(255,255,255,.1)","#fff"),border:"1.5px solid rgba(255,255,255,.25)",padding:"13px 28px",fontSize:15}}>Vende Aquí →</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:20}}>
            {[["🔒","Pago seguro"],["✅","Vendedores verificados"],["⭐","Reseñas reales"],["🚚","Todo el país"]].map(([ic,t]) => (
              <div key={t} style={{textAlign:"center",padding:"0 4px"}}>
                <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
                <div style={{color:"rgba(255,255,255,.6)",fontSize:10,fontWeight:600,lineHeight:1.3}}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1280,margin:"0 auto",padding:"28px 14px"}}>

        {/* ── CATEGORÍAS GRID ── */}
        <div style={{marginBottom:32}}>
          <h2 style={{fontFamily:Fh,fontSize:17,fontWeight:800,margin:"0 0 14px"}}>Explorar por categoría</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10}}>
            {CATS_ICONS.map(([cat,ic]) => {
              const count = f.filter(p=>p.category===cat).length;
              return (
                <button key={cat} className="hop" onClick={()=>nav("browse",{cat})}
                  style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"16px 8px",textAlign:"center",cursor:"pointer",transition:"all .18s",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                  <div style={{fontSize:28,marginBottom:6}}>{ic}</div>
                  <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:2}}>{cat}</div>
                  <div style={{fontSize:10,color:C.muted}}>{count} producto{count!==1?"s":""}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── OFERTAS DEL DÍA ── */}
        {f.filter(p=>p.salePrice).length > 0 && (
          <Section title="🔥 Ofertas del día"
            items={f.filter(p=>p.salePrice).sort((a,b)=>(1-a.salePrice/a.price)-(1-b.salePrice/b.price)).slice(0,8)}
            nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
            onMore={()=>nav("browse",{cond:"sale"})}
            favs={favs} toggleFav={toggleFav} />
        )}

        {/* ── TIENDAS DESTACADAS ── */}
        {merchants.length > 0 && (
          <div style={{marginBottom:32}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:Fh,fontSize:17,fontWeight:800,margin:0}}>🏪 Tiendas verificadas</h2>
            </div>
            <div style={{display:"flex",gap:12,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
              {merchants.map(m => {
                const mp = f.filter(p=>p.merchantId===m.id);
                return (
                  <div key={m.id} className="lift hop" onClick={()=>nav("merchant-profile",{merchantId:m.id})}
                    style={{flexShrink:0,width:160,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"16px 14px",textAlign:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                    <div style={{width:52,height:52,borderRadius:14,overflow:"hidden",background:C.navyD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",margin:"0 auto 10px",fontWeight:800,fontFamily:Fh}}>
                      {m.storeLogo ? <img src={m.storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : m.storeName?.[0]||"🏪"}
                    </div>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.storeName}</div>
                    <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{m.location?.split(",")[0]}</div>
                    <div style={{display:"flex",justifyContent:"center",gap:4}}>
                      <Pill label={`${mp.length} productos`} c={C.navy} sx={{fontSize:9}} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TECNOLOGÍA ── */}
        <Section title="💻 Tecnología"
          items={f.filter(p=>p.category==="Tecnología").slice(0,8)}
          nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
          onMore={()=>nav("browse",{cat:"Tecnología"})}
            favs={favs} toggleFav={toggleFav} />

        {/* ── NUEVOS PRODUCTOS ── */}
        <Section title="✨ Recién llegados"
          items={[...f].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8)}
          nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
          onMore={()=>nav("browse",{sort:"new"})}
            favs={favs} toggleFav={toggleFav} />

        {/* ── MODA & ESTILO ── */}
        {f.filter(p=>p.category==="Moda").length > 0 && (
          <Section title="👟 Moda y estilo"
            items={f.filter(p=>p.category==="Moda").slice(0,8)}
            nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
            onMore={()=>nav("browse",{cat:"Moda"})}
            favs={favs} toggleFav={toggleFav} />
        )}

        {/* ── ENVÍO GRATIS BANNER ── */}
        {f.filter(p=>p.freeShipping).length > 0 && (
          <div style={{background:`linear-gradient(120deg,${C.green}15,${C.green}05)`,border:`1.5px solid ${C.green}33`,borderRadius:16,padding:"20px 20px",marginBottom:32,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontFamily:Fh,fontWeight:800,fontSize:16,color:"#064E3B",marginBottom:4}}>🚚 Con envío GRATIS</div>
              <div style={{fontSize:13,color:C.teal}}>{f.filter(p=>p.freeShipping).length} productos con envío incluido</div>
            </div>
            <button className="hop" onClick={()=>nav("browse")} style={{...btn(C.green,"#fff"),padding:"10px 20px",fontSize:13,fontWeight:700}}>Ver todos →</button>
          </div>
        )}

        {/* ── MÁS ECONÓMICOS ── */}
        <Section title="💰 Más accesibles"
          items={sorted.slice(0,8)}
          nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
          onMore={()=>nav("browse",{sort:"default"})}
            favs={favs} toggleFav={toggleFav} />

        {/* ── DEPORTES & HOGAR ── */}
        {f.filter(p=>["Deportes","Hogar"].includes(p.category)).length > 0 && (
          <Section title="🏠 Hogar y Deporte"
            items={f.filter(p=>["Deportes","Hogar"].includes(p.category)).slice(0,8)}
            nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
            onMore={()=>nav("browse")}
            favs={favs} toggleFav={toggleFav} />
        )}

      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{background:C.white,borderTop:`1px solid ${C.border}`,padding:"44px 16px 50px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <h2 style={{fontFamily:Fh,textAlign:"center",margin:"0 0 8px",fontSize:20,fontWeight:800}}>¿Cómo funciona?</h2>
          <p style={{textAlign:"center",color:C.muted,fontSize:13,margin:"0 0 28px"}}>Compra 100% protegida en 5 pasos simples</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:16}}>
            {[["🛒","Selecciona","Elige y agrega al carrito"],["💳","Paga seguro","Tu pago queda protegido"],["🔍","Verificamos","Aprobamos el pago en 24h"],["📦","Te envían","Guía rastreable incluida"],["✅","Confirmas","El vendedor recibe su pago"]].map(([ic,t,d],i) => (
              <div key={t} style={{textAlign:"center",padding:"12px 8px",position:"relative"}}>
                {i < 4 && <div style={{position:"absolute",top:22,right:-8,fontSize:14,color:C.border,fontWeight:900,zIndex:1}} className="hide-sm">›</div>}
                <div style={{width:48,height:48,borderRadius:14,background:C.navy+"12",border:`2px solid ${C.navy}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 12px"}}>{ic}</div>
                <div style={{fontWeight:800,fontSize:12,marginBottom:4,color:C.navy}}>{t}</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:28}}>
            <button className="hop" onClick={()=>nav("register")} style={{...btn(C.red),padding:"12px 28px",fontSize:14,fontWeight:700}}>Crear cuenta gratis →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
