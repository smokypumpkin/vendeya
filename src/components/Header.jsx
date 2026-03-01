import React, { useState, useRef, useEffect } from "react"
import { C, Fh, Fb, CATS } from "../constants.js"
import { btn, HR } from "./ui.jsx"
import { SmartSearch } from "./SmartSearch.jsx"

function useDragScroll() {
  const elRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const onMouseDown = e => {
    isDown.current = true;
    startX.current = e.pageX - elRef.current.offsetLeft;
    scrollLeft.current = elRef.current.scrollLeft;
    elRef.current.style.cursor = "grabbing";
  };
  const onMouseLeave = () => { isDown.current = false; if(elRef.current) elRef.current.style.cursor = "grab"; };
  const onMouseUp    = () => { isDown.current = false; if(elRef.current) elRef.current.style.cursor = "grab"; };
  const onMouseMove  = e => {
    if(!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - elRef.current.offsetLeft;
    elRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5;
  };
  return { elRef, onMouseDown, onMouseLeave, onMouseUp, onMouseMove };
}

function MI({ icon,label,onClick }) {
  const [h,setH]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{padding:"9px 12px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:9,fontSize:13,background:h?C.light:"transparent"}}>
      <span>{icon}</span><span style={{fontWeight:500,color:C.text}}>{label}</span>
    </div>
  );
}

export function Header({ user,cartCount,unread,nav,logout,markAllRead,products }) {
  const [menu, setMenu] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const ref = useRef(null);
  const drag = useDragScroll();
  useEffect(() => {
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown",h);
    return () => document.removeEventListener("mousedown",h);
  },[]);

  return (
    <div style={{background:C.navy,position:"sticky",top:0,zIndex:300,boxShadow:"0 2px 14px rgba(0,0,0,.22)"}}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"0 12px",height:58,display:"flex",alignItems:"center",gap:10}}>
        {/* Logo */}
        <div onClick={() => nav("landing")} style={{cursor:"pointer",display:"flex",alignItems:"center",flexShrink:0}}>
          <div style={{lineHeight:1.1}}>
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:17,color:"#fff",letterSpacing:"-.3px",whiteSpace:"nowrap"}}>VendeY<span style={{color:C.gold}}>App</span></div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:".8px",textTransform:"uppercase"}}>Venezuela</div>
          </div>
        </div>

        {/* Search - centered, hidden on small mobile */}
        <div style={{flex:1,display:"flex",justifyContent:"center",minWidth:0}}>
          <div style={{width:"100%",maxWidth:520}} className="hide-sm-search">
            <SmartSearch products={products} nav={nav} />
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {cartCount > 0 && (
            <button className="hop" onClick={() => nav("cart")}
              style={{padding:"6px 12px",fontSize:12,fontWeight:700,background:"rgba(255,255,255,.18)",color:"#fff",border:"1.5px solid rgba(255,255,255,.35)",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>🛒 {cartCount}</button>
          )}
          {!user ? (
            <>
              <button className="hop" onClick={() => nav("login")}
                style={{...btn("rgba(255,255,255,.1)","rgba(255,255,255,.88)"),border:"1px solid rgba(255,255,255,.18)",padding:"6px 11px",fontSize:12}}>Entrar</button>
              <button className="hop" onClick={() => nav("register")}
                style={{...btn(C.red),padding:"6px 13px",fontSize:12}}>Registro</button>
            </>
          ) : (
            <div style={{position:"relative",display:"flex",gap:6}} ref={ref}>
              <button className="hop" onClick={() => { nav("notifications"); markAllRead(); }}
                style={{...btn("rgba(255,255,255,.1)","rgba(255,255,255,.88)"),padding:"6px 10px",position:"relative",border:"1px solid rgba(255,255,255,.14)"}}>
                🔔
                {unread > 0 && (
                  <span style={{position:"absolute",top:-3,right:-3,background:C.red,color:"#fff",fontSize:8,fontWeight:700,width:15,height:15,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread>9?"9+":unread}</span>
                )}
              </button>
              <button className="hop" onClick={() => setMenu(v=>!v)}
                style={{...btn("rgba(255,255,255,.1)","#fff"),padding:"5px 10px",fontSize:12,border:"1px solid rgba(255,255,255,.14)",gap:6}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:C.red,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(user.name||user.email||'?')[0].toUpperCase()}</div>
                <span className="hide-sm">{(user.name||user.email||'').split(" ")[0]}</span>
              </button>
              {menu && (
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:6,minWidth:210,boxShadow:"0 12px 32px rgba(0,0,0,.15)",zIndex:400,animation:"vy-fade .15s ease"}} onClick={() => setMenu(false)}>
                  <div style={{padding:"8px 12px 7px",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                    <div style={{fontWeight:700,fontSize:13}}>{user.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{user.email}</div>
                  </div>
                  <MI icon="📦" label="Mis Compras"          onClick={() => nav("my-orders")} />
                  <MI icon="❤️" label="Mis Favoritos"        onClick={() => nav("favorites")} />
                  {user.role==="merchant" && (
                    <>
                      <MI icon="📊" label="Mi Tienda"           onClick={() => nav("merchant-dash")} />
                      <MI icon="🛍️" label="Mis Productos"       onClick={() => nav("merchant-products")} />
                      <MI icon="📋" label="Pedidos Recibidos"   onClick={() => nav("merchant-orders")} />
                      <MI icon="📈" label="Analytics"           onClick={() => nav("merchant-analytics")} />
                      <MI icon="💸" label="Mis Liquidaciones"   onClick={() => nav("payouts")} />
                      <MI icon="🏦" label="Mi Cuenta Bancaria"  onClick={() => nav("bank-settings")} />
                    </>
                  )}
                  {user.role==="admin" && <MI icon="⚙️" label="Panel Admin" onClick={() => nav("admin")} />}
                  <HR />
                  <MI icon="🚪" label="Cerrar Sesión" onClick={logout} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category bar */}
      <div style={{background:C.navyD,borderTop:"1px solid rgba(255,255,255,.07)",overflowX:"auto",scrollbarWidth:"none"}}>
        <div ref={drag.elRef} style={{display:"flex",gap:0,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",cursor:"grab",userSelect:"none"}} className="cats-scroll"
          onMouseDown={drag.onMouseDown} onMouseLeave={drag.onMouseLeave} onMouseUp={drag.onMouseUp} onMouseMove={drag.onMouseMove}>
          {CATS.filter(c => c!=="Todo").map(c => (
            <button key={c} className="hop" onClick={() => nav("browse",{cat:c})}
              style={{...btn("transparent","rgba(255,255,255,.65)"),padding:"6px 13px",fontSize:11,borderRadius:0,whiteSpace:"nowrap",fontWeight:500,flexShrink:0}}>{c}</button>
          ))}
        </div>
      </div>

      {/* Mobile search bar */}
      <div style={{display:"none"}} className="mobile-search-bar">
        <div style={{padding:"6px 12px 8px",background:C.navyD}}>
          <SmartSearch products={products} nav={nav} />
        </div>
      </div>

      <style>{`
        @media(max-width:640px){
          .hide-sm-search{display:none!important}
          .mobile-search-bar{display:block!important}
        }
      `}</style>
    </div>
  );
}
