import React, { useState } from "react"
import { C, Fh } from "../../constants.js"
import { fU, fD } from "../../utils.js"
import { Pill, Img, btn, card } from "../../components/ui.jsx"
import { vendorST } from "../MyOrdersPage.jsx"
import { MerchantShell } from "./Shell.jsx"

export function MerchantOrders({ user,orders,nav }) {
  const mo = orders.filter(o =>
    o.vendors ? o.vendors.some(v=>v.merchantId===user?.id) : o.merchantId===user?.id
  ).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const [filter,setFilter] = useState("all");

  /* filter by vendor status for this merchant */
  const f = mo.filter(o => {
    if(filter==="all") return true;
    const myV = o.vendors?.find(v=>v.merchantId===user?.id);
    const vs = myV?.status || o.status;
    return vs===filter;
  });

  return (
    <MerchantShell user={user} page="merchant-orders" nav={nav}>
    <div style={{maxWidth:860}}>
      <h1 style={{fontFamily:Fh,margin:"0 0 16px",fontSize:20,fontWeight:800}}>Pedidos Recibidos ({mo.length})</h1>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","Todos"],["submitted","Por Verificar"],["verified","Verificados"],["processing","Preparando"],["shipped","En Camino"],["released","Completados"]].map(([v,l]) => (
          <button key={v} className="hop" onClick={()=>setFilter(v)}
            style={{...btn(filter===v?C.navy:C.light,filter===v?"#fff":C.muted),padding:"5px 11px",fontSize:11}}>{l}</button>
        ))}
      </div>
      {!f.length
        ? <div style={{textAlign:"center",padding:44,color:C.muted}}><div style={{fontSize:36}}>📋</div><div style={{marginTop:9,fontWeight:600}}>Sin pedidos</div></div>
        : <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {f.map(o => {
              const myV   = o.vendors?.find(v=>v.merchantId===user?.id);
              const st    = vendorST(myV||{status:o.status}, o.deliveryType);
              const mTotal = myV ? myV.subtotal + myV.shippingCost : (o.grandTotal||o.subtotal||0);
              const mItems = myV?.items || o.items || [];
              const vStatus = myV?.status || o.status;
              const needsAction = ["submitted","processing"].includes(o.status) || ["verified","processing"].includes(vStatus);
              return (
                <div key={o.id} style={{...card,padding:14,cursor:"pointer"}} onClick={()=>nav("order-detail",{orderId:o.id})}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:8}}>
                    <div>
                      <span style={{fontWeight:700,fontFamily:Fh}}>#{o.id.slice(0,8).toUpperCase()}</span>
                      <span style={{color:C.muted,fontSize:12,marginLeft:9}}>{fD(o.createdAt)} · {o.buyerName}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{st.l}</span>
                      <span style={{fontFamily:Fh,fontWeight:800,fontSize:15,color:C.red}}>{fU(mTotal)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {mItems.slice(0,4).map(i => <div key={i.productId} style={{width:36,height:36,borderRadius:6,overflow:"hidden",background:C.light,flexShrink:0}}><Img src={i.product?.image} /></div>)}
                    <span style={{fontSize:11,color:C.muted,marginLeft:3}}>{mItems.reduce((s,i)=>s+i.qty,0)} art. · {o.deliveryType==="pickup"?"🏪":"🚚"}</span>
                    {needsAction && <div style={{marginLeft:"auto"}}><Pill label="⚡ Acción requerida" c={C.amber} bg={C.amberL} sx={{fontSize:10}} /></div>}
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
    </MerchantShell>
  );
}
