import React from "react"
import { C, Fh } from "../../constants.js"
import { fU } from "../../utils.js"
import { Pill, Img, btn, card } from "../../components/ui.jsx"
import { MerchantShell } from "./Shell.jsx"

export function MerchantProducts({ user,products,saveProduct,deleteProduct,nav,showT }) {
  const mp = products.filter(p => p.merchantId===user?.id);
  const toggle = async id => {
    const prod = products.find(p=>p.id===id);
    if(prod?.adminDisabledPermanent) { showT("Este producto fue deshabilitado permanentemente por el admin",true); return; }
    if(prod?.adminDisabled) { showT("Pausado por el admin. Contacta soporte para reactivarlo.",true); return; }
    if(prod && !prod.active && prod.stock<=0) { showT("Sin stock: recarga el inventario antes de activar",true); return; }
    await saveProduct({...prod, active:!prod.active});
    showT("Actualizado ✓");
  };
  const del    = async id => { if(!confirm("¿Eliminar?")) return; await deleteProduct(id); showT("Eliminado"); };
  return (
    <MerchantShell user={user} page="merchant-products" nav={nav}>
    <div style={{maxWidth:900}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h1 style={{fontFamily:Fh,margin:0,fontSize:20,fontWeight:800}}>Mis Productos ({mp.length})</h1>
        <button className="hop" onClick={()=>nav("merchant-add")} style={{...btn(C.red),padding:"9px 16px",fontSize:13,fontWeight:700}}>+ Nuevo</button>
      </div>
      {!mp.length
        ? <div style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:44}}>🛍️</div><div style={{marginTop:10,fontWeight:600}}>Sin productos</div><button className="hop" onClick={()=>nav("merchant-add")} style={{...btn(C.red),padding:"10px 20px",marginTop:13,justifyContent:"center"}}>Publicar</button></div>
        : <div className="vy-grid">
            {mp.map(p => (
              <div key={p.id} style={{...card,overflow:"hidden"}}>
                <div style={{height:130,overflow:"hidden",position:"relative",background:C.light}}>
                  <Img src={p.image} />
                  <div style={{position:"absolute",top:6,left:6}}><Pill label={p.condition==="new"?"Nuevo":"Usado"} c={p.condition==="new"?C.navy:C.slate} solid /></div>
                  <div style={{position:"absolute",top:6,right:6,display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                    <Pill label={p.active&&!p.adminDisabled?"ON":p.adminDisabledPermanent?"🚫 Bloqueado":"PAUSADO"} c={p.active&&!p.adminDisabled?C.green:C.red} />
                  </div>
                  {p.adminDisabled && (
                    <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.65)",color:"#fff",fontSize:9,padding:"3px 7px",fontWeight:600,lineHeight:1.4}}>
                      {p.adminDisabledPermanent?"🚫":"⚠️"} {p.adminDisabledReason||"Bloqueado por admin"}
                    </div>
                  )}
                  {p.stock===0 && <div style={{position:"absolute",bottom:6,left:6}}><Pill label="Sin stock" c="#fff" bg="rgba(0,0,0,.55)" /></div>}
                </div>
                <div style={{padding:11}}>
                  <div style={{fontWeight:600,fontSize:12,marginBottom:4,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                    {p.salePrice && <span style={{fontSize:10,color:C.muted,textDecoration:"line-through"}}>{fU(p.price)}</span>}
                    <span style={{color:C.red,fontWeight:800,fontSize:14,fontFamily:Fh}}>{fU(p.salePrice||p.price)}</span>
                  </div>
                  <div style={{fontSize:10,color:C.muted,marginBottom:9}}>Stock: {p.stock} · Vistas: {p.views||0}</div>
                  <div style={{display:"flex",gap:5}}>
                    <button className="hop" onClick={()=>toggle(p.id)} style={{...btn(C.light,C.muted),padding:"5px 7px",fontSize:10,flex:1,justifyContent:"center"}}>{p.active?"Pausar":"Activar"}</button>
                    <button className="hop" onClick={()=>nav("merchant-add",{editId:p.id})} style={{...btn(C.navyL,C.navy),padding:"5px 8px",fontSize:11}}>✏️</button>
                    <button className="hop" onClick={()=>del(p.id)} style={{...btn(C.redL,"#991B1B"),padding:"5px 8px",fontSize:11}}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
    </MerchantShell>
  );
}
