import React from "react"
import { C, Fh } from "../../constants.js"
import { fU } from "../../utils.js"
import { card } from "../../components/ui.jsx"

export function PlatformAnalytics({ orders, users, products }) {
  const merchants = users.filter(u => u.role==="merchant");
  const buyers    = users.filter(u => u.role==="buyer");
  const released  = orders.filter(o => o.status==="released");
  const allOrders = orders;

  const totalRevenue   = released.reduce((s,o) => s+o.subtotal, 0);
  const platformEarned = released.reduce((s,o) => s+o.platformFee, 0);
  const avgOrderValue  = released.length ? totalRevenue/released.length : 0;
  const convRate       = allOrders.length && buyers.length ? (released.length/buyers.length*100).toFixed(1) : 0;

  // Last 6 months
  const now = new Date();
  const months = Array.from({length:6},(_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    return { label: d.toLocaleString("es-VE",{month:"short"}), year:d.getFullYear(), month:d.getMonth() };
  });
  const monthlyData = months.map(m => {
    const mo = released.filter(o => { const d=new Date(o.createdAt); return d.getFullYear()===m.year && d.getMonth()===m.month; });
    return { ...m, revenue: mo.reduce((s,o)=>s+o.subtotal,0), orders: mo.length, fee: mo.reduce((s,o)=>s+o.platformFee,0) };
  });
  const maxRev = Math.max(...monthlyData.map(m=>m.revenue), 1);

  // Top merchants
  const merchantRevenue = merchants.map(m => {
    const mo = released.filter(o => o.merchantId===m.id);
    return { name: m.storeName||m.name, revenue: mo.reduce((s,o)=>s+(o.merchantAmount||0),0), orders: mo.length };
  }).sort((a,b)=>b.revenue-a.revenue).slice(0,5);

  // Status breakdown
  const statusCounts = {};
  const ST_LABELS = {submitted:"Por pagar",verified:"Verificado",processing:"Preparando",shipped:"Enviado",released:"Completado",expired:"Expirado",rejected:"Rechazado",disputed:"Disputa"};
  allOrders.forEach(o => { statusCounts[o.status]=(statusCounts[o.status]||0)+1; });

  // Category revenue
  const catRevenue = {};
  released.forEach(o => (o.items||[]).forEach(i => {
    const p = products.find(p=>p.id===i.productId);
    const cat = p?.category||"Otro";
    catRevenue[cat]=(catRevenue[cat]||0)+(p?.salePrice||p?.price||0)*i.qty;
  }));
  const catArr = Object.entries(catRevenue).sort((a,b)=>b[1]-a[1]);

  const KPI = ({ic,label,val,sub,c}) => (
    <div style={{...card,padding:"14px 16px",border:`2px solid ${c||C.border}22`}}>
      <div style={{fontSize:22,marginBottom:4}}>{ic}</div>
      <div style={{fontFamily:Fh,fontWeight:900,fontSize:20,color:c||C.text}}>{val}</div>
      <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2}}>{label}</div>
      {sub && <div style={{fontSize:11,color:C.muted}}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <h3 style={{fontFamily:Fh,margin:"0 0 16px",fontSize:15,fontWeight:800}}>📊 Rendimiento de VendeYApp</h3>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
        <KPI ic="💰" label="Ingresos totales" val={fU(totalRevenue)} sub={`${released.length} ventas completadas`} c={C.green} />
        <KPI ic="🏷️" label="Comisiones ganadas" val={fU(platformEarned)} sub={`${(platformEarned/Math.max(totalRevenue,1)*100).toFixed(1)}% del GMV`} c={C.purple} />
        <KPI ic="📦" label="Órdenes totales" val={allOrders.length} sub={`${released.length} completadas`} c={C.navy} />
        <KPI ic="🏪" label="Vendedores" val={merchants.length} sub={`${merchants.filter(m=>m.merchantVerified).length} verificados`} c={C.red} />
        <KPI ic="👥" label="Compradores" val={buyers.length} sub={`Conv. ${convRate}%`} c={C.amber} />
        <KPI ic="💵" label="Ticket promedio" val={fU(avgOrderValue)} sub="por orden completada" c={C.gold} />
      </div>

      {/* Monthly revenue chart */}
      <div style={{...card,padding:18,marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Ingresos mensuales (últimos 6 meses)</div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end",height:130}}>
          {monthlyData.map((m,i) => (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{fontSize:9,color:C.muted,fontWeight:600}}>{m.revenue>0?fU(m.revenue):""}</div>
              <div
                title={`${m.revenue.toFixed(2)}`}
                style={{width:"100%",background:`linear-gradient(to top,${C.red},${C.red}88)`,borderRadius:"4px 4px 0 0",minHeight:4,transition:"height .3s",height:m.revenue>0?`${Math.round(m.revenue/maxRev*100)}%`:"4px"}}
              />
              <div style={{fontSize:9,color:C.muted,fontWeight:600,textTransform:"capitalize"}}>{m.label}</div>
              <div style={{fontSize:9,color:C.muted}}>{m.orders}p</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
        {/* Top merchants */}
        <div style={{...card,padding:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🏆 Top vendedores</div>
          {merchantRevenue.length ? merchantRevenue.map((m,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<merchantRevenue.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontFamily:Fh,fontWeight:900,fontSize:12,color:i===0?C.gold:C.muted,width:16,textAlign:"center"}}>{i+1}</span>
                <span style={{fontSize:12,fontWeight:600}}>{m.name}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.green}}>{fU(m.revenue)}</div>
                <div style={{fontSize:10,color:C.muted}}>{m.orders} venta{m.orders!==1?"s":""}</div>
              </div>
            </div>
          )) : <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:16}}>Sin ventas aún</div>}
        </div>

        {/* Order status breakdown */}
        <div style={{...card,padding:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Estado de órdenes</div>
          {Object.entries(statusCounts).map(([st,cnt]) => (
            <div key={st} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:12}}>{ST_LABELS[st]||st}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:70,height:6,background:C.light,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${cnt/allOrders.length*100}%`,height:"100%",background:st==="released"?C.green:st==="expired"||st==="rejected"?C.red:C.amber,borderRadius:3}} />
                </div>
                <span style={{fontSize:11,fontWeight:700,color:C.text,minWidth:16,textAlign:"right"}}>{cnt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by category */}
      {catArr.length > 0 && (
        <div style={{...card,padding:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Ventas por categoría</div>
          {catArr.map(([cat,rev],i) => (
            <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600}}>{cat}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:90,height:7,background:C.light,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${rev/catArr[0][1]*100}%`,height:"100%",background:C.navy,borderRadius:3}} />
                </div>
                <span style={{fontSize:12,fontWeight:700,minWidth:55,textAlign:"right"}}>{fU(rev)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
