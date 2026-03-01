import React, { useState } from "react"
import { C, Fh, PAY } from "../../constants.js"
import { fU, fD } from "../../utils.js"
import { Pill, Img, Spin, btn, inp, card } from "../../components/ui.jsx"
import { PlatformAnalytics } from "./Analytics.jsx"
import { AdminConfig } from "./Config.jsx"

function DisputeResolver({ order, updateStatus, showT }) {
  const [note, setNote] = useState(order.disputeNote||"");
  const [resolving, setResolving] = useState(false);

  const resolve = async (favor) => {
    if(!note.trim()) { showT("Agrega una nota explicando la resolución",true); return; }
    setResolving(true);
    const extra = {
      disputeResolution: favor,
      disputeNote: note.trim(),
      disputeResolvedAt: new Date().toISOString(),
    };
    // favor==="buyer" → refund (status "rejected"), favor==="merchant" → release funds
    const newStatus = favor==="buyer" ? "rejected" : "released";
    await updateStatus(order.id, newStatus, extra);
    setResolving(false);
    showT(favor==="buyer" ? "Disputa resuelta a favor del comprador ✓" : "Disputa resuelta a favor del vendedor ✓");
  };

  return (
    <div>
      <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>Nota de resolución (visible para ambas partes) *</label>
      <textarea value={note} onChange={e=>setNote(e.target.value)}
        placeholder="Ej: Revisadas las evidencias, se determina que el producto no fue entregado conforme a lo pactado…"
        style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,resize:"vertical",minHeight:65,fontFamily:"inherit",outline:"none",marginBottom:10,lineHeight:1.5}} />
      <div style={{display:"flex",gap:8}}>
        <button className="hop" disabled={resolving} onClick={()=>resolve("buyer")}
          style={{...btn(C.green),padding:"9px 14px",fontSize:12,flex:1,justifyContent:"center",fontWeight:700,opacity:resolving?0.6:1}}>
          {resolving?<Spin/>:"✅ Favor del comprador (reembolso)"}
        </button>
        <button className="hop" disabled={resolving} onClick={()=>resolve("merchant")}
          style={{...btn(C.navy),padding:"9px 14px",fontSize:12,flex:1,justifyContent:"center",fontWeight:700,opacity:resolving?0.6:1}}>
          {resolving?<Spin/>:"💰 Favor del vendedor (liberar fondos)"}
        </button>
      </div>
    </div>
  );
}


function AdminProductCard({ p, nav, adminDisableProduct, adminEnableProduct }) {
  const [showDisable, setShowDisable] = useState(false);
  const [reason,      setReason]      = useState("");
  const [permanent,   setPermanent]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  const handleDisable = async () => {
    if(!reason.trim()) return;
    setSaving(true);
    await adminDisableProduct(p.id, reason.trim(), permanent);
    setSaving(false);
    setShowDisable(false);
    setReason("");
  };

  const isAdminOff = p.adminDisabled;
  const isPermanent = p.adminDisabledPermanent;

  return (
    <div style={{...card,overflow:"hidden",opacity:(!p.active||isAdminOff)?.75:1}}>
      {/* Image */}
      <div style={{height:110,background:C.light,overflow:"hidden",position:"relative"}}>
        <Img src={p.image} />
        <div style={{position:"absolute",top:5,right:5,display:"flex",gap:4,flexDirection:"column",alignItems:"flex-end"}}>
          <Pill label={p.active&&!isAdminOff?"ON":"OFF"} c={p.active&&!isAdminOff?C.green:C.red} solid sx={{fontSize:9}} />
          {isAdminOff && <Pill label={isPermanent?"🚫 Perm":"⚠️ Admin"} c={C.red} solid sx={{fontSize:9}} />}
        </div>
      </div>
      {/* Info */}
      <div style={{padding:"9px 10px"}}>
        <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.name}</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{p.merchantName}</div>
        {isAdminOff && p.adminDisabledReason && (
          <div style={{fontSize:10,color:C.red,background:C.redL,borderRadius:5,padding:"3px 7px",marginBottom:6,lineHeight:1.4}}>
            {isPermanent?"🚫":"⚠️"} {p.adminDisabledReason}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <span style={{fontWeight:700,color:C.red,fontSize:12}}>{fU(p.salePrice||p.price)}</span>
          <button className="hop" onClick={()=>nav("product",{productId:p.id})} style={{...btn(C.light,C.muted),padding:"3px 7px",fontSize:10}}>Ver →</button>
        </div>
        {/* Admin actions */}
        {!showDisable ? (
          <div style={{display:"flex",gap:5}}>
            {isAdminOff && !isPermanent && (
              <button className="hop" onClick={()=>adminEnableProduct(p.id)}
                style={{...btn(C.greenL,C.green),padding:"4px 8px",fontSize:10,flex:1,justifyContent:"center"}}>✅ Reactivar</button>
            )}
            {!isPermanent && (
              <button className="hop" onClick={()=>setShowDisable(true)}
                style={{...btn(C.redL,"#991B1B"),padding:"4px 8px",fontSize:10,flex:1,justifyContent:"center"}}>🚫 Deshabilitar</button>
            )}
          </div>
        ) : (
          <div>
            <select value={reason} onChange={e=>setReason(e.target.value)}
              style={{...inp,fontSize:11,marginBottom:6,padding:"5px 8px"}}>
              <option value="">— Motivo —</option>
              <option value="Contenido inapropiado o engañoso">Contenido inapropiado o engañoso</option>
              <option value="Precio incorrecto o abusivo">Precio incorrecto o abusivo</option>
              <option value="Imágenes de baja calidad o incorrectas">Imágenes incorrectas o baja calidad</option>
              <option value="Producto prohibido en la plataforma">Producto prohibido</option>
              <option value="Descripción incompleta o incorrecta">Descripción incompleta</option>
              <option value="Duplicado o spam">Duplicado / spam</option>
            </select>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,marginBottom:8,cursor:"pointer",color:C.red,fontWeight:600}}>
              <input type="checkbox" checked={permanent} onChange={e=>setPermanent(e.target.checked)} style={{accentColor:C.red}} />
              Deshabilitar permanentemente
            </label>
            <div style={{display:"flex",gap:6}}>
              <button className="hop" onClick={()=>{setShowDisable(false);setReason("");setPermanent(false);}}
                style={{...btn(C.light,C.muted),padding:"5px 8px",fontSize:10}}>Cancelar</button>
              <button className="hop" disabled={!reason||saving} onClick={handleDisable}
                style={{...btn(permanent?C.red:C.amberL,permanent?"#fff":"#78350F"),padding:"5px 8px",fontSize:10,flex:1,justifyContent:"center",opacity:!reason?0.5:1}}>
                {saving?<><Spin dark/>...</>:permanent?"🚫 Deshabilitar perm.":"⚠️ Pausar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export function AdminPanel({ users,products,orders,nav,updateStatus,verifyMerchant,showT,upU,upP,upO,completePayout,payReqs,setPayReqs,appCfg,setAppCfg,toggleDisable,adminDisableProduct,adminEnableProduct }) {
  const [tab,setTab] = useState("orders");
  const [merchantQ,setMerchantQ] = useState("");
  const [buyerQ,   setBuyerQ]    = useState("");
  const [productQ, setProductQ]  = useState("");
  const pending   = orders.filter(o=>o.status==="submitted" && !(o.deadline && new Date(o.deadline) < new Date()));
  const disputed  = orders.filter(o=>o.vendors?o.vendors.some(v=>v.status==="disputed"):o.status==="disputed");
  const adminPayReqs = (payReqs||[]).filter(r=>r.status==="pending");
  const merchants = users.filter(u=>u.role==="merchant");
  const buyers    = users.filter(u=>u.role==="buyer");
  const filteredMerchants = merchantQ ? merchants.filter(m=>(m.storeName||m.name||"").toLowerCase().includes(merchantQ.toLowerCase())||m.email.toLowerCase().includes(merchantQ.toLowerCase())) : merchants;
  const filteredBuyers    = buyerQ    ? buyers.filter(u=>u.name.toLowerCase().includes(buyerQ.toLowerCase())||u.email.toLowerCase().includes(buyerQ.toLowerCase())) : buyers;
  const filteredProducts  = productQ  ? products.filter(p=>(p.name||"").toLowerCase().includes(productQ.toLowerCase())||(p.merchantName||"").toLowerCase().includes(productQ.toLowerCase())) : products;
  const revenue   = orders.filter(o=>o.status==="released").reduce((s,o)=>{
    const v = o.vendors?.reduce((vs,v)=>vs+(+v.platformFee||0),0);
    return s + (v ?? (+o.platformFee||0));
  },0);
  const escrow    = orders.filter(o=>["submitted","verified","processing","shipped"].includes(o.status)).reduce((s,o)=>{
    return s + (+o.grandTotal || o.vendors?.reduce((vs,v)=>vs+v.subtotal+(v.shippingCost||0),0) || +o.subtotal || 0);
  },0);
  const tabs = [[`orders`,`📋 Órdenes${disputed.length>0?" ⚠️":""}`],[`payouts`,`💸 Liquidaciones${adminPayReqs.length>0?" ("+adminPayReqs.length+")":""}`],["merchants","🏪 Vendedores"],["users","👥 Compradores"],["products","🛍️ Productos"],["analytics","📊 Analytics"],["config","⚙️ Config"]];
  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 14px"}}>
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>⚙️ Panel Administrador</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:9,marginBottom:18}}>
        {[{l:"Por verificar",v:pending.length,ic:"⏳",c:C.amber},{l:"Disputas",v:disputed.length,ic:"⚠️",c:"#991B1B"},{l:"Liquidaciones",v:adminPayReqs.length,ic:"💸",c:C.purple},{l:"Vendedores",v:merchants.length,ic:"🏪",c:C.navy},{l:"Compradores",v:buyers.length,ic:"👥",c:C.green},{l:"Revenue plat.",v:`$${revenue.toFixed(0)}`,ic:"💰",c:C.green},{l:"En escrow",v:`$${escrow.toFixed(0)}`,ic:"🔒",c:C.amber}].map(s=>(
          <div key={s.l} style={{...card,padding:12}}><div style={{fontSize:18,marginBottom:3}}>{s.ic}</div><div style={{fontFamily:Fh,fontWeight:900,fontSize:16,color:s.c}}>{s.v}</div><div style={{color:C.muted,fontSize:10,lineHeight:1.3}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {tabs.map(([v,l])=><button key={v} className="hop" onClick={()=>setTab(v)} style={{...btn(tab===v?C.navy:C.light,tab===v?"#fff":C.muted),padding:"7px 14px",fontSize:12}}>{l}</button>)}
      </div>

      {tab==="orders" && (
        <div>
          {pending.length > 0 && (
            <div style={{marginBottom:18}}>
              <h3 style={{fontFamily:Fh,margin:"0 0 11px",fontSize:14,fontWeight:800,color:C.amber}}>⏳ Por verificar ({pending.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {pending.map(o=>{
                  const pm=PAY.find(m=>m.id===o.paymentMethod);
                  return (
                    <div key={o.id} style={{...card,padding:15,border:`2px solid ${C.amber}33`}}>
                      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:7}}>
                        <div><span style={{fontWeight:700,fontFamily:Fh}}>#{o.id.slice(0,8).toUpperCase()}</span><span style={{color:C.muted,fontSize:12,marginLeft:8}}>{o.buyerName} → {o.merchantName||"Tienda"} · {fD(o.createdAt)}</span></div>
                        <div style={{textAlign:"right"}}><div style={{fontFamily:Fh,fontWeight:800,fontSize:16,color:C.red}}>{fU(o.subtotal)}</div><div style={{fontSize:11,color:C.muted}}>{pm?.icon} {pm?.label}</div></div>
                      </div>
                      {o.paymentRef && <div style={{fontSize:11,color:C.muted,marginBottom:9,fontFamily:"monospace",background:C.light,padding:"4px 8px",borderRadius:5}}>Ref: {o.paymentRef}</div>}
                      {o.paymentProofImg && <img src={o.paymentProofImg} style={{maxHeight:130,maxWidth:"100%",borderRadius:7,border:`1px solid ${C.border}`,objectFit:"contain",display:"block",marginBottom:9}} />}
                      <div style={{display:"flex",gap:8}}>
                        <button className="hop" onClick={()=>nav("order-detail",{orderId:o.id})} style={{...btn(C.light,C.muted),padding:"7px 12px",fontSize:12,flex:1,justifyContent:"center"}}>Ver detalle</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {disputed.length > 0 && (
            <div style={{marginBottom:18}}>
              <h3 style={{fontFamily:Fh,margin:"0 0 11px",fontSize:14,fontWeight:800,color:"#991B1B"}}>⚠️ Disputas Activas ({disputed.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {disputed.map(o=>{
                  const buyer = users?.find(u=>u.id===o.buyerId);
                  const merch = users?.find(u=>u.id===o.merchantId);
                  return (
                    <div key={o.id} style={{...card,padding:16,border:`2px solid ${C.red}44`}}>
                      {/* Header */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                        <div>
                          <div style={{fontWeight:700,fontFamily:Fh,fontSize:14}}>#{o.id.slice(0,8).toUpperCase()}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                            Comprador: <strong>{o.buyerName}</strong> · Vendedor: <strong>{o.merchantName}</strong>
                          </div>
                          <div style={{fontSize:11,color:C.muted}}>Monto: <strong>{fU(o.subtotal)}</strong> · {new Date(o.disputeAt||o.createdAt).toLocaleDateString("es-VE")}</div>
                        </div>
                        <button className="hop" onClick={()=>nav("order-detail",{orderId:o.id})} style={{...btn(C.navyL,C.navy),padding:"5px 12px",fontSize:11}}>Ver orden →</button>
                      </div>
                      {/* Dispute info */}
                      {o.disputeReason && (
                        <div style={{background:C.redL,borderRadius:8,padding:"9px 12px",marginBottom:10}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:3}}>MOTIVO: {
                            {no_llegó:"El producto no llegó",diferente:"Producto diferente a lo descrito",dañado:"Producto llegó dañado",incompleto:"Pedido incompleto",fraude:"Posible fraude",otro:"Otro"}[o.disputeReason]||o.disputeReason
                          }</div>
                          {o.disputeDesc && <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{o.disputeDesc}</div>}
                        </div>
                      )}
                      {/* Resolution buttons */}
                      <DisputeResolver order={o} updateStatus={updateStatus} showT={showT} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!pending.length && !disputed.length && <div style={{textAlign:"center",padding:44,color:C.muted}}><div style={{fontSize:36}}>✅</div><div style={{marginTop:9,fontWeight:600}}>Todo al día</div></div>}
        </div>
      )}

      {tab==="payouts" && (
        <div>
          <h3 style={{fontFamily:Fh,margin:"0 0 13px",fontSize:14,fontWeight:800}}>💸 Solicitudes de liquidación ({adminPayReqs.length})</h3>
          {!adminPayReqs.length ? <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:30}}>Sin solicitudes pendientes</div> : (
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {adminPayReqs.map(r=>{
                const merchant = users.find(u=>u.id===r.merchantId);
                return (
                  <div key={r.id} style={{...card,padding:14,border:`2px solid ${C.purple}28`}}>
                    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{merchant?.storeName||merchant?.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>#{r.id.slice(0,8).toUpperCase()} · {fD(r.requestedAt)}</div>
                      </div>
                      <span style={{fontFamily:Fh,fontWeight:900,fontSize:16,color:C.green}}>{fU(r.amount)}</span>
                    </div>
                    {merchant?.bankData?.bank && (
                      <div style={{background:C.navyL,borderRadius:7,padding:"8px 11px",fontSize:11,color:C.navy,marginBottom:9,lineHeight:1.8}}>
                        🏦 {merchant.bankData.bank}<br/>
                        🔢 <span style={{fontFamily:"monospace"}}>{merchant.bankData.account}</span><br/>
                        👤 {merchant.bankData.accountHolder} · {merchant.bankData.rif}
                        {merchant.bankData.phone && <><br/>📱 {merchant.bankData.phone}</>}
                      </div>
                    )}
                    <button className="hop" onClick={()=>completePayout(r.id)} style={{...btn(C.green),padding:"9px",width:"100%",justifyContent:"center",fontSize:13,fontWeight:700}}>✓ Confirmar transferencia enviada</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab==="merchants" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,gap:10}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:14,fontWeight:800}}>Vendedores ({filteredMerchants.length}{merchantQ?` de ${merchants.length}`:""})</h3>
            <input value={merchantQ} onChange={e=>setMerchantQ(e.target.value)} placeholder="🔍 Buscar vendedor…"
              style={{...inp,fontSize:12,padding:"5px 10px",maxWidth:220,flex:1}} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {filteredMerchants.map(m=>{
              const mRev=orders.filter(o=>o.vendors?o.vendors.some(v=>v.merchantId===m.id):o.merchantId===m.id).reduce((s,o)=>{
                if(o.vendors){const v=o.vendors.find(v=>v.merchantId===m.id);return s+(v?.merchantAmount||0);}
                return o.status==="released"?s+(o.merchantAmount||0):s;
              },0);
              return (
                <div key={m.id} style={{...card,padding:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
                    <div style={{width:40,height:40,borderRadius:11,background:`linear-gradient(135deg,${C.red},#FF6B4A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:900,flexShrink:0}}>{m.storeName?m.storeName[0].toUpperCase():"🏪"}</div>
                    <div style={{flex:1,minWidth:140}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:13}}>{m.storeName||m.name}</span>{m.merchantVerified?<Pill label="✓ Verificado" c={C.green} bg={C.greenL} sx={{fontSize:10}} />:<Pill label="No verificado" c={C.amber} bg={C.amberL} sx={{fontSize:10}} />}</div>
                      <div style={{fontSize:11,color:C.muted}}>{m.email} · 📍{m.location}</div>
                      <div style={{fontSize:11,color:C.muted}}>${mRev.toFixed(0)} vendido</div>
                    </div>
                    <div style={{display:"flex",gap:7}}>
                      {!m.merchantVerified && <button className="hop" onClick={()=>verifyMerchant(m.id)} style={{...btn(C.green),padding:"6px 12px",fontSize:12}}>✓ Verificar</button>}
                      <button className="hop" onClick={()=>nav("merchant-profile",{merchantId:m.id})} style={{...btn(C.light,C.muted),padding:"6px 11px",fontSize:12}}>Ver →</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="users" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,gap:10}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:14,fontWeight:800}}>Compradores ({filteredBuyers.length}{buyerQ?` de ${buyers.length}`:""})</h3>
            <input value={buyerQ} onChange={e=>setBuyerQ(e.target.value)} placeholder="🔍 Buscar comprador…"
              style={{...inp,fontSize:12,padding:"5px 10px",maxWidth:220,flex:1}} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filteredBuyers.map(u=>{
              const uo=orders.filter(o=>o.buyerId===u.id);
              return (
                <div key={u.id} style={{...card,padding:13}}>
                  <div style={{display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:700,flexShrink:0}}>{(u.name||u.email||'?')[0].toUpperCase()}</div>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{u.name}</div><div style={{fontSize:11,color:C.muted}}>{u.email} · 📍{u.location} · {uo.length} órdenes</div></div>
                    {u.disabled && <Pill label="Deshabilitada" c="#991B1B" />}
                    <button onClick={()=>toggleDisable(u.id)}
                      style={{...btn(u.disabled?C.green:C.redL,u.disabled?"#fff":"#991B1B"),padding:"4px 10px",fontSize:11,fontWeight:700}}>
                      {u.disabled?"Habilitar":"Deshabilitar"}
                    </button>
                    <Pill label={u.emailVerified?"✓ Verificado":"Sin verificar"} c={u.emailVerified?C.green:C.amber} sx={{fontSize:10}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="products" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,gap:10}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:14,fontWeight:800}}>Productos ({filteredProducts.length}{productQ?` de ${products.length}`:""})</h3>
            <input value={productQ} onChange={e=>setProductQ(e.target.value)} placeholder="🔍 Buscar producto o vendedor…"
              style={{...inp,fontSize:12,padding:"5px 10px",maxWidth:250,flex:1}} />
          </div>
          <div className="vy-grid">
            {filteredProducts.map(p=>(
              <AdminProductCard key={p.id} p={p} nav={nav} adminDisableProduct={adminDisableProduct} adminEnableProduct={adminEnableProduct} />
            ))}
          </div>
        </div>
      )}

      {tab==="analytics" && (
        <PlatformAnalytics orders={orders} users={users} products={products} />
      )}
      {tab==="config" && (
        <AdminConfig appCfg={appCfg} setAppCfg={setAppCfg} showT={showT} />
      )}
    </div>
  );
}
