import React from "react"
import { C, Fh } from "../constants.js"
import { ago } from "../utils.js"
import { btn, card } from "../components/ui.jsx"

export function NotificationsPage({ myNotifs,nav,markNotifDone,upN,user }) {
  const handleClick = (n) => {
    if(!n.link) return;
    if(n.link.startsWith("product:")) nav("product",{productId:n.link.replace("product:","")});
    else nav("order-detail",{orderId:n.link});
  };
  const active = myNotifs.filter(n => !n.done);
  const done   = myNotifs.filter(n => n.done);

  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>🔔 Notificaciones</h1>
      {!myNotifs.length && (
        <div style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:44}}>🔔</div><div style={{marginTop:10,fontWeight:600}}>Sin notificaciones</div></div>
      )}
      {active.length > 0 && (
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Activas ({active.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>
            {active.map(n => (
              <div key={n.id} style={{...card,padding:13,borderLeft:`4px solid ${n.read?C.border:C.red}`,display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{flex:1,cursor:n.link?"pointer":"default"}} onClick={()=>handleClick(n)}>
                  <div style={{fontSize:13,fontWeight:n.read?400:600,lineHeight:1.6}}>{n.msg}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:3}}>{ago(n.createdAt)}</div>
                </div>
                <button className="hop" onClick={()=>markNotifDone(n.id)}
                  style={{...btn(C.greenL,C.green),padding:"4px 10px",fontSize:11,flexShrink:0}}>✓ Listo</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Completadas ({done.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {done.slice(0,8).map(n => (
              <div key={n.id} style={{...card,padding:13,opacity:0.55,display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,lineHeight:1.55}}>{n.msg}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{ago(n.createdAt)} · ✓ Completada</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
