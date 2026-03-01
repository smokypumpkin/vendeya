import React, { useState } from "react"
import { C, Fh, Fb } from "../../constants.js"
import { ago, fU, compressImg } from "../../utils.js"
import { Pill, Img, Spin, btn, inp, card } from "../../components/ui.jsx"
import { vendorST } from "../MyOrdersPage.jsx"
import { MerchantShell } from "./Shell.jsx"

export function MerchantDash({ user,users,products,orders,nav,upU,showT,setUser,reviews=[] }) {
  const [pickupAddr,  setPickupAddr]  = useState("");
  const [pickupSched, setPickupSched] = useState("");
  const [pickupSaving,setPickupSaving]= useState(false);
  const mp    = products.filter(p => p.merchantId===user?.id);
  const mo    = orders.filter(o => o.merchantId===user?.id);
  const pending = mo.filter(o => ["submitted","verified"].includes(o.status));
  const escrow  = mo.filter(o => ["submitted","verified","processing","shipped"].includes(o.status)).reduce((s,o)=>s+(o.merchantAmount||0),0);
  const earned  = mo.filter(o => o.status==="released").reduce((s,o)=>s+(o.merchantAmount||0),0);
  const mu = users?.find(u=>u.id===user?.id)||user;
  const walletBal = mu?.walletBalance||0;
  // sync pickup state from user data
  React.useEffect(()=>{ setPickupAddr(mu?.pickupAddress||""); setPickupSched(mu?.pickupSchedule||""); },[mu?.pickupAddress,mu?.pickupSchedule]);
  const savePickup = async () => {
    setPickupSaving(true);
    const updated = users.map(u=>u.id===user.id?{...u,pickupAddress:pickupAddr.trim(),pickupSchedule:pickupSched.trim()}:u);
    await upU(updated);
    const nu = updated.find(u=>u.id===user.id);
    setUser(nu);
    setPickupSaving(false);
    showT("Datos de retiro guardados ✓");
  };
  const myReviews = reviews.filter(r=>r.merchantId===user?.id);
  const avgR    = myReviews.length ? (myReviews.reduce((s,r)=>s+r.rating,0)/myReviews.length).toFixed(1) : "—";

  const pendingQA = mp.flatMap(p =>
    (p.questions||[]).filter(q=>!q.answer).map(q=>({...q,productId:p.id,productName:p.name,productImage:p.image||p.images?.[0]}))
  );

  const STATS = [
    {ic:"🛍️",l:"Productos activos",v:mp.filter(p=>p.active).length,c:C.navy,action:()=>nav("merchant-products")},
    {ic:"📦",l:"Órdenes totales",v:mo.length,c:C.red,action:()=>nav("merchant-orders")},
    {ic:"⏳",l:"Pedidos pendientes",v:pending.length,c:C.amber,action:()=>nav("merchant-orders")},
    {ic:"🔒",l:"En custodia",v:`$${escrow.toFixed(0)}`,c:C.purple,action:null},
    {ic:"💰",l:"Ganado total",v:`$${earned.toFixed(0)}`,c:C.green,action:()=>nav("payouts")},
    {ic:"👛",l:"En billetera",v:`$${walletBal.toFixed(0)}`,c:C.gold,action:()=>nav("payouts")},
    {ic:"⭐",l:"Rating promedio",v:avgR,c:C.amber,action:null},
    {ic:"👁️",l:"Vistas totales",v:mp.reduce((s,p)=>s+(p.views||0),0),c:C.muted,action:()=>nav("merchant-analytics")},
  ];

  return (
    <MerchantShell user={user} page="merchant-dash" nav={nav} pendingQA={pendingQA.length}>
    <div style={{maxWidth:860}}>

      {/* ── HEADER ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <label title="Clic para cambiar logo" style={{position:"relative",width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:C.navy}}>
            {user?.storeLogo
              ? <img src={user.storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} />
              : <span style={{fontFamily:Fh,fontWeight:900,fontSize:22,color:"#fff"}}>{user?.storeName?.[0]||"🏪"}</span>}
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",opacity:0}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>📷</div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const b=await compressImg(f,400);if(b){const nu=users.map(u=>u.id===user.id?{...u,storeLogo:b}:u);await upU(nu);const nu2=nu.find(u=>u.id===user.id);setUser(nu2);showT("Logo actualizado ✓");}e.target.value="";}} />
          </label>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <h1 style={{fontFamily:Fh,margin:0,fontSize:"clamp(16px,3vw,20px)",fontWeight:800}}>{user?.storeName||"Mi Tienda"}</h1>
              {user?.merchantVerified && <Pill label="✓ Verificado" c={C.green} sx={{fontSize:10}} />}
            </div>
            <div style={{color:C.muted,fontSize:12,marginTop:2}}>{user?.location||"Sin ubicación"} · Miembro desde {new Date(user?.joinedAt||Date.now()).toLocaleDateString("es-VE",{month:"short",year:"numeric"})}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:1}}>Clic en el logo para cambiarlo</div>
          </div>
        </div>
        <button className="hop" onClick={()=>nav("merchant-add")} style={{...btn(C.red),padding:"10px 18px",fontSize:13,fontWeight:700,flexShrink:0}}>+ Nuevo Producto</button>
      </div>

      {/* ── VERIFICATION ALERT ── */}
      {!user?.merchantVerified && (
        <div style={{background:C.amberL,border:`1px solid ${C.amber}55`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:20,flexShrink:0}}>⚠️</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:C.amber}}>Verificación pendiente</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Tu tienda está en revisión. Podrás publicar y vender una vez aprobada.</div>
          </div>
        </div>
      )}

      {/* ── PENDING Q&A ALERT ── */}
      {pendingQA.length > 0 && (
        <div style={{background:C.redL,border:`1.5px solid ${C.red}33`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:16}}>❓</span>
            <span style={{fontWeight:700,fontSize:13,color:C.red}}>{pendingQA.length} pregunta{pendingQA.length!==1?"s":""} sin responder</span>
            <button className="hop" onClick={()=>nav("merchant-qa")} style={{...btn(C.red),padding:"3px 10px",fontSize:11,marginLeft:"auto"}}>Responder →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {pendingQA.slice(0,3).map(q => (
              <div key={q.id} onClick={()=>nav("merchant-qa")}
                style={{background:"#fff",borderRadius:8,padding:"8px 11px",cursor:"pointer",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9}}
                onMouseEnter={e=>e.currentTarget.style.background=C.light}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                {q.productImage && <img src={q.productImage} style={{width:30,height:30,borderRadius:5,objectFit:"cover",flexShrink:0}} />}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.productName}</div>
                  <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.question}</div>
                </div>
                <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{ago(q.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATS GRID ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
        {STATS.map(s => (
          <div key={s.l} onClick={s.action||undefined}
            style={{...card,padding:"14px 16px",cursor:s.action?"pointer":"default",transition:"all .15s"}}
            onMouseEnter={e=>{if(s.action)e.currentTarget.style.transform="translateY(-2px)"}}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{fontSize:22,marginBottom:6}}>{s.ic}</div>
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:"clamp(17px,2.5vw,22px)",color:s.c,lineHeight:1}}>{s.v}</div>
            <div style={{color:C.muted,fontSize:11,marginTop:4,lineHeight:1.3}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── 2-COL CONTENT ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>

        {/* Recent products */}
        <div style={{...card,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:14}}>🛍️ Mis productos</span>
            <button className="hop" onClick={()=>nav("merchant-products")} style={{...btn(C.navyL,C.navy),padding:"3px 10px",fontSize:11}}>Ver todos →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {mp.slice(0,5).map(p => (
              <div key={p.id} style={{display:"flex",gap:9,alignItems:"center",cursor:"pointer",padding:"4px 6px",borderRadius:7}}
                onClick={()=>nav("product",{productId:p.id})}
                onMouseEnter={e=>e.currentTarget.style.background=C.light}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:36,height:36,borderRadius:7,overflow:"hidden",background:C.light,flexShrink:0}}><Img src={p.image} /></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:11,color:C.red,fontWeight:700}}>{fU(p.salePrice||p.price)}</div>
                </div>
                <Pill label={p.active?"ON":"OFF"} c={p.active?C.green:C.red} sx={{fontSize:9,padding:"1px 6px"}} />
              </div>
            ))}
            {!mp.length && <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>Sin productos aún</div>}
          </div>
        </div>

        {/* Recent orders */}
        <div style={{...card,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:14}}>📋 Pedidos recientes</span>
            <button className="hop" onClick={()=>nav("merchant-orders")} style={{...btn(C.navyL,C.navy),padding:"3px 10px",fontSize:11}}>Ver todos →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {mo.slice(0,5).map(o => {
              const myV = o.vendors?o.vendors.find(v=>v.merchantId===user?.id):null;
              const st  = vendorST(myV||{status:o.status}, o.deliveryType);
              const mAmt= myV?myV.merchantAmount:o.merchantAmount;
              return (
                <div key={o.id} onClick={()=>nav("order-detail",{orderId:o.id})}
                  style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 8px",borderRadius:7,border:`1px solid ${C.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.light}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700}}>#{o.id.slice(0,6).toUpperCase()}</div>
                    <div style={{fontSize:10,color:C.muted}}>{o.buyerName} · {fU(o.merchantAmount)}</div>
                  </div>
                  <span style={{background:st.bg,color:st.c,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,whiteSpace:"nowrap"}}>{st.l}</span>
                </div>
              );
            })}
            {!mo.length && <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>Sin órdenes aún</div>}
          </div>
        </div>

        {/* Pickup address card */}
        <div style={{...card,padding:16,marginTop:0}}>
          <div style={{fontWeight:700,fontSize:14,fontFamily:Fh,marginBottom:4}}>🏪 Retiro en Tienda</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Esta dirección la verá el comprador cuando su pedido esté listo para retirar.</div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Dirección de retiro</label>
              <textarea value={pickupAddr} onChange={e=>setPickupAddr(e.target.value)}
                placeholder="Ej: CC Sambil, Nivel Feria, Local 142, Chacao, Caracas."
                style={{...inp,minHeight:60,resize:"vertical",fontFamily:Fb,fontSize:13,lineHeight:1.5}} />
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Horario de atención</label>
              <input value={pickupSched} onChange={e=>setPickupSched(e.target.value)}
                placeholder="Ej: Lunes a Sábado, 10:00am – 7:00pm" style={inp} />
            </div>
            <button className="hop" onClick={savePickup} disabled={pickupSaving}
              style={{...btn(C.navy),padding:"10px",justifyContent:"center",fontSize:13,fontWeight:700,opacity:pickupSaving?0.6:1}}>
              {pickupSaving?<><Spin/>Guardando…</>:"Guardar datos de retiro ✓"}
            </button>
          </div>
        </div>

      </div>
    </div>
    </MerchantShell>
  );
}
