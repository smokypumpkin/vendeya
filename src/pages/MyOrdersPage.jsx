import React from "react"
import { C, Fh, ST, ST_PICKUP } from "../constants.js"
import { fU, fD } from "../utils.js"
import { Img, Stars, Countdown, btn, card } from "../components/ui.jsx"

/* Derive a single display status from an order for buyer/admin overview */
export function orderDisplayST(order) {
  if(!order.vendors) return (order.deliveryType==="pickup"?ST_PICKUP:ST)[order.status]||{};
  if(["submitted","rejected","expired"].includes(order.status))
    return ST[order.status]||{};
  /* payment verified — derive from vendor statuses */
  const vs = order.vendors.map(v=>v.status||"verified");
  if(vs.some(s=>s==="disputed"))  return ST.disputed;
  if(vs.every(s=>s==="released")) return ST.released;
  if(vs.some(s=>s==="shipped"))   return ST.shipped;
  if(vs.some(s=>s==="processing"))return ST.processing;
  return ST.verified;
}
/* Derive display ST for a specific merchant's vendor entry */
export function vendorST(vendor, deliveryType) {
  return (deliveryType==="pickup"?ST_PICKUP:ST)[vendor.status||"verified"]||{};
}


export function OCard({ order,nav }) {
  const st      = orderDisplayST(order);
  const expired = order.status==="submitted" && order.deadline && new Date(order.deadline) < new Date();
  return (
    <div className="lift" style={{...card,padding:14,cursor:"pointer",transition:"all .2s"}} onClick={()=>nav("order-detail",{orderId:order.id})}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:9}}>
        <div>
          <span style={{fontWeight:700,fontSize:13,fontFamily:Fh}}>#{order.id.slice(0,8).toUpperCase()}</span>
          <span style={{color:C.muted,fontSize:11,marginLeft:9}}>{fD(order.createdAt)} · {order.deliveryType==="pickup"?"🏪 Retiro":"🚚 Envío"}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{expired?"⏰ Expirado":st.l}</span>
          <span style={{fontFamily:Fh,fontWeight:800,fontSize:15,color:C.red}}>{fU(order.grandTotal||order.subtotal)}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {(order.vendors ? order.vendors.flatMap(v=>v.items) : order.items||[]).slice(0,4).map(i => <div key={i.productId} style={{width:38,height:38,borderRadius:6,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={i.product?.image} /></div>)}
        {order.vendors && (
          <span style={{fontSize:10,color:C.navy,fontWeight:700,background:C.navyL,padding:"2px 6px",borderRadius:8}}>
            {order.vendors.length === 1 ? `🏪 ${order.vendors[0].merchantName}` : `${order.vendors.length} tiendas`}
          </span>
        )}
        {(order.vendors ? order.vendors.some(v=>v.review) : order.review) && <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}><Stars v={(order.vendors?order.vendors.find(v=>v.review)?.review:order.review)?.rating||0} size={11} /><span style={{fontSize:10,color:C.muted}}>Reseñada</span></div>}
        {order.status==="submitted" && order.deadline && !expired && !(order.paymentRef && order.paymentProofImg) && (
          <div style={{marginLeft:"auto",fontSize:12}}>
            <Countdown deadline={order.deadline} />
          </div>
        )}
        {order.status==="submitted" && (order.paymentRef || order.paymentProofImg) && (
          <span style={{marginLeft:"auto",fontSize:10,color:C.green,fontWeight:700}}>✓ Pago enviado</span>
        )}
      </div>
    </div>
  );
}

export function MyOrdersPage({ user,orders,nav }) {
  const mine = orders.filter(o => o.buyerId===user?.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>Mis Compras</h1>
      {!mine.length
        ? <div style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:48}}>📦</div><div style={{marginTop:10,fontWeight:600}}>Sin pedidos aún</div><button className="hop" onClick={()=>nav("browse")} style={{...btn(C.red),padding:"10px 20px",marginTop:14,justifyContent:"center"}}>Explorar</button></div>
        : <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {mine.map(o => <OCard key={o.id} order={o} nav={nav} />)}
          </div>
      }
    </div>
  );
}
