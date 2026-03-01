import React from "react"
import { C, Fh } from "../../constants.js"
import { fU } from "../../utils.js"
import { Img, Stars, card } from "../../components/ui.jsx"
import { MerchantShell } from "./Shell.jsx"

export function MerchantAnalytics({ user, products, orders, nav, reviews=[] }) {
  const mp = products.filter(p => p.merchantId===user?.id);
  const mo = orders.filter(o => o.merchantId===user?.id);

  const released     = mo.filter(o => o.status==="released" || o.vendorStatus==="released");
  const totalRevenue = released.reduce((s,o)=>s+(o.merchantAmount||0),0);
  const totalSales   = released.reduce((s,o)=>s+(o.items||[]).reduce((a,i)=>a+(i.qty||0),0),0);
  const pendingEscrow= mo.filter(o=>["submitted","verified","processing","shipped"].includes(o.status)).reduce((s,o)=>s+(o.subtotal||0),0);
  const totalViews   = mp.reduce((s,p)=>s+(p.views||0),0);
  const myReviews    = reviews.filter(r=>r.merchantId===user?.id);
  const avgR         = myReviews.length ? (myReviews.reduce((s,r)=>s+r.rating,0)/myReviews.length) : 0;
  const convRate     = totalViews > 0 ? ((totalSales/totalViews)*100).toFixed(1) : "0.0";

  /* top products by revenue */
  const prodRevenue = mp.map(p => {
    const sales = released.filter(o => (o.items||[]).some(i=>i.productId===p.id));
    const rev   = sales.reduce((s,o)=>{const item=(o.items||[]).find(i=>i.productId===p.id);return s+(item?(p.salePrice||p.price)*item.qty:0);},0);
    const qty   = sales.reduce((s,o)=>{const item=(o.items||[]).find(i=>i.productId===p.id);return s+(item?item.qty:0);},0);
    return {...p,rev,qty};
  }).sort((a,b)=>b.rev-a.rev);

  /* monthly breakdown (last 6 months) */
  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    return {month:d.toLocaleString("es-VE",{month:"short",year:"2-digit"}), key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`};
  }).reverse();
  const monthlyData = months.map(m => ({
    ...m,
    revenue: released.filter(o=>o.createdAt?.startsWith(m.key)).reduce((s,o)=>s+(o.merchantAmount||0),0),
    orders:  released.filter(o=>o.createdAt?.startsWith(m.key)).length
  }));
  const maxRev = Math.max(...monthlyData.map(m=>m.revenue),1);

  /* ratings distribution */
  const ratingDist = [5,4,3,2,1].map(r => ({r,count:reviews.filter(rv=>rv.rating===r).length}));
  const maxRatingCount = Math.max(...ratingDist.map(d=>d.count),1);

  return (
    <MerchantShell user={user} page="merchant-analytics" nav={nav}>
    <div style={{maxWidth:860}}>
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>📈 Analytics de Tienda</h1>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:20}}>
        {[
          {ic:"💰",l:"Ingresos Totales",v:`$${totalRevenue.toFixed(0)}`,c:C.green},
          {ic:"📦",l:"Ventas",v:released.length,c:C.navy},
          {ic:"🛍️",l:"Artículos vendidos",v:totalSales,c:C.red},
          {ic:"👁️",l:"Vistas totales",v:totalViews,c:C.muted},
          {ic:"🔄",l:"Conversión",v:`${convRate}%`,c:C.amber},
          {ic:"⭐",l:"Rating promedio",v:avgR?avgR.toFixed(1):"—",c:C.gold},
          {ic:"🔒",l:"En custodia",v:`$${pendingEscrow.toFixed(0)}`,c:C.purple},
          {ic:"📝",l:"Reseñas",v:myReviews.length,c:C.muted}
        ].map(s => (
          <div key={s.l} style={{...card,padding:13}}>
            <div style={{fontSize:20,marginBottom:4}}>{s.ic}</div>
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:17,color:s.c}}>{s.v}</div>
            <div style={{color:C.muted,fontSize:10,lineHeight:1.3}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Revenue chart */}
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>📊 Ingresos mensuales</h3>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120}}>
            {monthlyData.map(m => (
              <div key={m.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:9,color:C.muted,fontWeight:600}}>{m.revenue>0?`$${m.revenue.toFixed(0)}`:""}</div>
                <div style={{width:"100%",background:C.red,borderRadius:"4px 4px 0 0",minHeight:4,height:`${Math.max(4,(m.revenue/maxRev)*90)}px`,transition:"height .3s"}} />
                <div style={{fontSize:9,color:C.muted}}>{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ratings distribution */}
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>⭐ Distribución de reseñas</h3>
          {myReviews.length===0 ? <div style={{color:C.muted,fontSize:13,textAlign:"center",paddingTop:20}}>Sin reseñas aún</div> : (
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {ratingDist.map(d => (
                <div key={d.r} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:12,color:C.muted,width:16,textAlign:"right"}}>{d.r}★</div>
                  <div style={{flex:1,height:14,background:C.light,borderRadius:7,overflow:"hidden"}}>
                    <div style={{height:"100%",background:C.gold,borderRadius:7,width:`${Math.max(0,(d.count/maxRatingCount)*100)}%`,transition:"width .4s"}} />
                  </div>
                  <div style={{fontSize:11,color:C.muted,width:18,textAlign:"right"}}>{d.count}</div>
                </div>
              ))}
              <div style={{marginTop:8,textAlign:"center"}}><Stars v={Math.round(avgR)} size={16} /><span style={{fontSize:13,color:C.amber,fontWeight:700,marginLeft:6}}>{avgR.toFixed(1)}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Top products table */}
      <div style={{...card,padding:18}}>
        <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>🏆 Productos por rendimiento</h3>
        {prodRevenue.length===0 ? <div style={{color:C.muted,fontSize:13}}>Sin datos aún</div> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.light}}>
                  {["Producto","Categoría","Precio","Stock","Vistas","Ventas","Ingresos"].map(h => (
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:C.muted,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prodRevenue.map((p,i) => (
                  <tr key={p.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":C.bg}}>
                    <td style={{padding:"9px 10px",display:"flex",gap:7,alignItems:"center"}}>
                      <div style={{width:30,height:30,borderRadius:6,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={p.image} /></div>
                      <span style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:150}}>{p.name}</span>
                    </td>
                    <td style={{padding:"9px 10px",color:C.muted}}>{p.category}</td>
                    <td style={{padding:"9px 10px",fontWeight:700,color:C.red}}>{fU(p.salePrice||p.price)}</td>
                    <td style={{padding:"9px 10px",color:p.stock===0?"#991B1B":p.stock<=3?C.amber:C.green,fontWeight:700}}>{p.stock}</td>
                    <td style={{padding:"9px 10px"}}>{p.views||0}</td>
                    <td style={{padding:"9px 10px",fontWeight:600}}>{p.qty}</td>
                    <td style={{padding:"9px 10px",fontWeight:700,color:C.green}}>{p.rev>0?`$${p.rev.toFixed(0)}`:"-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </MerchantShell>
  );
}
