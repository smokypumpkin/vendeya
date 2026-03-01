import React, { useState } from "react"
import { C, Fh, PAY, FLOW_DELIVERY, FLOW_PICKUP, FL_DELIVERY, FL_PICKUP } from "../constants.js"
import { fU, fBs, fD, readB64 } from "../utils.js"
import { Img, Spin, Stars, Countdown, btn, inp, card } from "../components/ui.jsx"
import { orderDisplayST, vendorST } from "./MyOrdersPage.jsx"

/* BUYER PROOF UPLOAD */
function BuyerProofUpload({ order, updateStatus, showT }) {
  const [ref,      setRef]      = useState(order.paymentRef||"");
  const [proofImg, setProofImg] = useState(order.paymentProofImg||null);
  const [proofName,setProofName]= useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(!!(order.paymentRef&&order.paymentProofImg));

  if(sent || (order.paymentRef && order.paymentProofImg)) {
    return (
      <div style={{background:C.greenL,borderRadius:8,padding:"9px 13px",fontSize:12,color:"#065F46",fontWeight:600,display:"flex",gap:7,alignItems:"center"}}>
        ✅ Comprobante enviado. Ref: {order.paymentRef}
      </div>
    );
  }

  const handleFile = async e => {
    const file=e.target.files[0]; if(!file) return;
    setProofName(file.name);
    const b = await readB64(file);
    setProofImg(b);
  };

  const handleSend = async () => {
    if(!ref.trim()) { showT("Escribe el número de referencia",true); return; }
    if(!proofImg) { showT("Adjunta el comprobante de pago",true); return; }
    setSending(true);
    await updateStatus(order.id, "submitted", {paymentRef:ref, paymentProofImg:proofImg});
    setSent(true);
    setSending(false);
    showT("Comprobante enviado ✓");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      <div>
        <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Número de referencia *</label>
        <input value={ref} onChange={e=>setRef(e.target.value)} placeholder="Ej: 00112233445566"
          style={{...inp,fontFamily:"monospace",fontSize:13}} />
      </div>
      <div>
        <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Captura del comprobante *</label>
        <label style={{display:"flex",alignItems:"center",gap:8,background:proofImg?C.greenL:C.light,border:`2px dashed ${proofImg?C.green:C.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer"}}>
          <span style={{fontSize:18}}>{proofImg?"✅":"📎"}</span>
          <span style={{fontSize:12,color:proofImg?C.green:C.muted,fontWeight:600}}>{proofName||"Seleccionar imagen"}</span>
          <input type="file" accept="image/*" onChange={handleFile} style={{display:"none"}} />
        </label>
      </div>
      {proofImg && (
        <img src={proofImg} style={{maxHeight:150,maxWidth:"100%",borderRadius:7,objectFit:"contain",border:`1px solid ${C.border}`}} />
      )}
      <button className="hop" onClick={handleSend} disabled={sending||!ref.trim()||!proofImg}
        style={{...btn(C.red),padding:"11px",width:"100%",justifyContent:"center",opacity:(sending||!ref.trim()||!proofImg)?0.5:1,fontWeight:700}}>
        {sending?<><Spin/>Enviando…</>:"Enviar Comprobante ✓"}
      </button>
    </div>
  );
}

/* ORDER DETAIL */
function ProofImageCard({ paymentProofImg, paymentRef }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <div style={{...card,padding:14,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>🧾 Comprobante de Pago</div>
        <div style={{position:"relative",cursor:"zoom-in"}} onClick={()=>setZoomed(true)}>
          <img src={paymentProofImg} style={{maxWidth:"100%",maxHeight:260,borderRadius:8,border:`1px solid ${C.border}`,objectFit:"contain",display:"block"}} />
          <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.55)",color:"#fff",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,pointerEvents:"none"}}>🔍 Ampliar</div>
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>Ref: <strong style={{fontFamily:"monospace"}}>{paymentRef||"N/A"}</strong></span>
          <button className="hop" onClick={()=>setZoomed(true)} style={{...btn(C.navyL,C.navy),padding:"3px 10px",fontSize:11}}>Ver completo</button>
        </div>
      </div>

      {/* Zoom overlay */}
      {zoomed && (
        <div onClick={()=>setZoomed(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,cursor:"zoom-out"}}>
          <div style={{position:"relative",maxWidth:"95vw",maxHeight:"95vh"}} onClick={e=>e.stopPropagation()}>
            <img src={paymentProofImg} style={{maxWidth:"90vw",maxHeight:"85vh",borderRadius:10,objectFit:"contain",display:"block",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}} />
            <button onClick={()=>setZoomed(false)} style={{position:"absolute",top:-14,right:-14,width:32,height:32,borderRadius:"50%",background:"#fff",border:"none",cursor:"pointer",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}>✕</button>
            <div style={{color:"#fff",fontSize:12,textAlign:"center",marginTop:10,opacity:.7}}>Ref: {paymentRef||"N/A"} · Clic fuera para cerrar</div>
          </div>
        </div>
      )}
    </>
  );
}

/* DisputeResolver — used inline in VendorSection for admin */
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


/* VendorSection — one per vendor inside an order detail */
function VendorSection({ vendor, order, isMerchant, isBuyer, isAdmin, user, updateStatus, submitReview, users, nav, showT, completePayout }) {
  const [shipB64,       setShipB64]      = useState(null);
  const [shipName,      setShipName]     = useState("");
  const [rating,        setRating]       = useState(0);
  const [comment,       setComment]      = useState("");
  const [submRev,       setSubmRev]      = useState(false);
  const [buyerRating,   setBuyerRating]  = useState(0);
  const [buyerComment,  setBuyerComment] = useState("");
  const [submBuyerRev,  setSubmBuyerRev] = useState(false);
  const [confirmDlv,    setConfirmDlv]   = useState(false);
  const [showDispute,   setShowDispute]  = useState(false);
  const [dispReason,    setDispReason]   = useState("");
  const [dispDesc,      setDispDesc]     = useState("");
  const [dispSub,       setDispSub]      = useState(false);

  const isPickup  = order.deliveryType==="pickup";
  const FLOW      = isPickup ? FLOW_PICKUP : FLOW_DELIVERY;
  const FL        = isPickup ? FL_PICKUP   : FL_DELIVERY;
  const vStatus   = vendor.status || "verified";
  const st        = vendorST(vendor, order.deliveryType);
  const curr      = FLOW.indexOf(vStatus);

  const handleShipFile = async e => {
    const f=e.target.files[0]; if(!f) return;
    setShipName(f.name);
    setShipB64(await readB64(f));
  };

  const upV = (s,ex={}) => updateStatus(order.id, s, ex, vendor.merchantId);

  const merch = users?.find(u=>u.id===vendor.merchantId);
  const multi = order.vendors?.length > 1;

  return (
    <div style={{...card,padding:16,marginBottom:12}}>
      {/* Vendor header */}
      {(multi || isBuyer || isAdmin) && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:14,fontFamily:Fh}}>🏪 {vendor.merchantName}</div>
          <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{st.l}</span>
        </div>
      )}

      {/* Items */}
      {vendor.items.map(i => (
        <div key={i.productId} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
          <div style={{width:46,height:46,borderRadius:8,overflow:"hidden",background:C.light,flexShrink:0}}><Img src={i.product?.image} /></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13}}>{i.product?.name||i.productId}</div>
            <div style={{color:C.muted,fontSize:11}}>×{i.qty} · {fU(i.product?.salePrice||i.product?.price||0)} c/u</div>
          </div>
          <div style={{fontWeight:700,color:C.red,flexShrink:0}}>{fU((i.product?.salePrice||i.product?.price||0)*i.qty)}</div>
        </div>
      ))}

      {/* Totals */}
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:4}}>
        {isMerchant ? (
          <>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:2}}><span>Subtotal</span><span>{fU(vendor.subtotal)}</span></div>
            {vendor.shippingCost>0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:2}}><span>Envío</span><span>{fU(vendor.shippingCost)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#991B1B",marginBottom:2}}><span>Comisión VendeYApp</span><span>-{fU(vendor.platformFee)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:C.green,marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`}}><span>Tu ganancia</span><span>{fU(vendor.merchantAmount)}</span></div>
          </>
        ) : (
          <>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.muted,marginBottom:3}}><span>Productos</span><span>{fU(vendor.subtotal)}</span></div>
            {vendor.shippingCost>0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.muted,marginBottom:3}}><span>🚚 Envío</span><span>{fU(vendor.shippingCost)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`}}><span>Total tienda</span><span style={{color:C.red}}>{fU(vendor.subtotal+vendor.shippingCost)}</span></div>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!["disputed"].includes(vStatus) && (
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`,overflowX:"auto"}}>
          <div style={{display:"flex",alignItems:"flex-start",minWidth:isPickup?300:380}}>
            {FLOW.map((s,i,arr) => {
              const done=i<=curr, active=i===curr;
              return (
                <div key={s} style={{display:"flex",alignItems:"center",flex:i<arr.length-1?1:undefined}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,minWidth:isPickup?58:50}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:done?C.green:C.border,border:active?`3px solid ${C.green}`:"none",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,boxShadow:active?`0 0 0 3px ${C.green}33`:"none"}}>{done?"✓":i+1}</div>
                    <div style={{fontSize:8,color:done?C.green:C.muted,fontWeight:active?800:done?700:400,marginTop:3,textAlign:"center",lineHeight:1.2,maxWidth:56}}>{FL[s]}</div>
                  </div>
                  {i<arr.length-1 && <div style={{flex:1,height:2,background:i<curr?C.green:C.border,margin:"0 2px",marginBottom:18,borderRadius:2}} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disputed card */}
      {vStatus==="disputed" && (
        <div style={{marginTop:12,padding:12,borderRadius:9,background:"#FFF1F2",border:`1.5px solid ${C.red}44`}}>
          <div style={{fontWeight:700,fontSize:13,color:C.red,marginBottom:6}}>⚠️ Disputa Abierta</div>
          {vendor.disputeReason && <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{{no_llegó:"No llegó",diferente:"Producto diferente",dañado:"Llegó dañado",incompleto:"Incompleto",fraude:"Fraude",otro:"Otro"}[vendor.disputeReason]||vendor.disputeReason}</div>}
          {vendor.disputeDesc && <div style={{fontSize:12,color:C.text,lineHeight:1.5,background:"#fff",borderRadius:7,padding:"7px 10px",marginBottom:6}}>{vendor.disputeDesc}</div>}
          {vendor.disputeResolution && (
            <div style={{padding:"8px 10px",borderRadius:7,background:vendor.disputeResolution==="buyer"?C.greenL:C.navyL,fontWeight:700,fontSize:12,color:vendor.disputeResolution==="buyer"?C.green:C.navy,marginTop:6}}>
              {vendor.disputeResolution==="buyer"?"✅ Resuelta: reembolso al comprador":"✅ Resuelta: fondos liberados al vendedor"}
              {vendor.disputeNote && <div style={{fontWeight:400,marginTop:3}}>{vendor.disputeNote}</div>}
            </div>
          )}
        </div>
      )}

      {/* Pickup address reveal — buyer only when processing */}
      {isPickup && ["processing","released"].includes(vStatus) && isBuyer && (
        <div style={{marginTop:12,padding:12,borderRadius:9,background:"#F0FDF4",border:`1.5px solid ${C.green}44`}}>
          <div style={{fontWeight:700,fontSize:13,color:C.green,marginBottom:8}}>{vStatus==="processing"?"📦 Listo para retirar":"🏪 Info de Retiro"}</div>
          {merch?.pickupAddress
            ? <><div style={{fontSize:13,background:"#fff",borderRadius:7,padding:"9px 11px",marginBottom:6,border:`1px solid ${C.border}`}}>{merch.pickupAddress}</div>{merch.pickupSchedule&&<div style={{fontSize:12,color:C.muted}}>🕐 {merch.pickupSchedule}</div>}</>
            : <div style={{fontSize:12,color:C.muted}}>El vendedor coordinará el retiro contigo.</div>
          }
          <div style={{fontSize:11,color:C.muted,marginTop:8,fontStyle:"italic"}}>Lleva tu comprobante de pago al momento del retiro.</div>
        </div>
      )}

      {/* Payout info — merchant only */}
      {isMerchant && vStatus==="released" && (
        <div style={{marginTop:12,padding:12,borderRadius:9,background:C.greenL,border:`1px solid ${C.green}33`}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>💸 Liquidación</div>
          {vendor.payoutStatus==="pending_payout" && <div style={{fontSize:12,color:C.text}}>Programada: <strong>{fD(vendor.payoutScheduledAt)}</strong> · {fU(vendor.merchantAmount)}</div>}
          {vendor.payoutStatus==="paid_out" && <div style={{fontSize:12,fontWeight:600,color:"#065F46"}}>✅ Completada el {fD(vendor.payoutCompletedAt)} · {fU(vendor.merchantAmount)}</div>}
          {!vendor.payoutStatus && <div style={{fontSize:12,color:C.muted}}>Fondos en proceso de liquidación.</div>}
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:12}}>

        {/* MERCHANT actions */}
        {isMerchant && vStatus==="verified" && !isPickup && (
          <button className="hop" onClick={()=>upV("processing")} style={{...btn(C.navy),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>📦 Marcar "Preparando pedido"</button>
        )}
        {isMerchant && vStatus==="verified" && isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🏪 Preparar para Retiro</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>Cuando tengas el pedido listo, presiona el botón. El comprador recibirá tu dirección de retiro.</div>
            {!merch?.pickupAddress && (
              <div style={{background:C.amberL,borderRadius:7,padding:"7px 10px",fontSize:11,color:"#78350F",marginBottom:10}}>
                ⚠️ No tienes dirección de retiro. <button className="hop" onClick={()=>nav("bank-settings")} style={{background:"none",border:"none",color:C.navy,fontWeight:700,cursor:"pointer",fontSize:11,padding:0}}>Agrégala →</button>
              </div>
            )}
            <button className="hop" onClick={()=>upV("processing")} style={{...btn(C.red),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>📦 Marcar como Listo para Retirar</button>
          </div>
        )}
        {isMerchant && vStatus==="processing" && isPickup && (
          <div style={{padding:13,borderRadius:9,background:C.navyL,border:`1px solid ${C.navy}22`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:C.navy}}>⏳ Esperando confirmación del comprador</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>El pedido está listo. Los fondos se liberarán automáticamente cuando el comprador confirme que retiró el producto.</div>
          </div>
        )}
        {isMerchant && vStatus==="processing" && !isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>🚚 Confirmar Envío</div>
            <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,background:"#fff",border:`2px dashed ${shipB64?C.green:C.border}`,borderRadius:9,padding:14,textAlign:"center",cursor:"pointer",marginBottom:9}}>
              <div style={{fontSize:22}}>{shipB64?"✅":"📤"}</div>
              <div style={{fontSize:12,fontWeight:600,color:shipB64?C.green:C.text}}>{shipName||"Seleccionar guía de envío"}</div>
              <div style={{fontSize:11,color:C.muted}}>Foto de guía, sticker courier</div>
              <input type="file" accept="image/*" onChange={handleShipFile} style={{display:"none"}} />
            </label>
            <button className="hop" onClick={()=>shipB64&&upV("shipped",{shippingGuide:shipB64})}
              style={{...btn(shipB64?C.red:C.light,shipB64?"#fff":C.muted),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>
              {shipB64?"🚚 Confirmar Envío":"⚠️ Sube la guía para continuar"}
            </button>
          </div>
        )}

        {/* BUYER: confirm pickup */}
        {isBuyer && vStatus==="processing" && isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🏪 ¿Retiraste el pedido?</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>
              El pedido está listo en <strong>{merch?.pickupAddress||vendor.merchantName}</strong>. Confirma solo cuando tengas el producto en tus manos — esto libera los fondos al vendedor.
            </div>
            {!confirmDlv
              ? <button className="hop" onClick={()=>setConfirmDlv(true)} style={{...btn(C.green),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>✅ Confirmar que retiré el pedido</button>
              : <div>
                  <div style={{background:C.amberL,borderRadius:7,padding:"8px 10px",fontSize:12,marginBottom:9,color:"#78350F"}}>⚠️ Al confirmar, los fondos se liberan al vendedor. ¿Ya tienes el producto?</div>
                  <div style={{display:"flex",gap:9}}>
                    <button className="hop" onClick={()=>upV("released")} style={{...btn(C.green),padding:"10px",flex:1,justifyContent:"center",fontWeight:700}}>✅ Sí, ya lo tengo</button>
                    <button className="hop" onClick={()=>setConfirmDlv(false)} style={{...btn(C.light,C.muted),padding:"10px"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
        )}

        {/* BUYER: confirm delivery */}
        {isBuyer && vStatus==="shipped" && !isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>📦 ¿Recibiste este pedido?</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>Al confirmar, los fondos se liberan al vendedor <strong>{vendor.merchantName}</strong>.</div>
            {!confirmDlv
              ? <button className="hop" onClick={()=>setConfirmDlv(true)} style={{...btn(C.green),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>{isPickup?"✅ Confirmar retiro":"✅ Confirmar recepción"} — Liberar fondos</button>
              : <div>
                  <div style={{background:C.amberL,borderRadius:7,padding:"8px 10px",fontSize:12,marginBottom:9}}>⚠️ Esta acción libera fondos al vendedor. ¿Confirmas?</div>
                  <div style={{display:"flex",gap:9}}>
                    <button className="hop" onClick={()=>upV("released")} style={{...btn(C.green),padding:"10px",flex:1,justifyContent:"center",fontWeight:700}}>✅ Confirmar</button>
                    <button className="hop" onClick={()=>setConfirmDlv(false)} style={{...btn(C.light,C.muted),padding:"10px"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
        )}

        {/* BUYER: open dispute */}
        {isBuyer && vStatus==="shipped" && !isPickup && !showDispute && (
          <button className="hop" onClick={()=>setShowDispute(true)} style={{...btn(C.redL,"#991B1B"),padding:"9px",justifyContent:"center",fontSize:12,border:`1px solid ${C.red}22`}}>⚠️ Tengo un problema con {vendor.merchantName} — Abrir Disputa</button>
        )}
        {isBuyer && vStatus==="shipped" && !isPickup && showDispute && (
          <div style={{padding:14,borderRadius:9,border:`1.5px solid ${C.red}44`,background:"#FFF8F8"}}>
            <div style={{fontWeight:700,fontSize:13,color:C.red,marginBottom:8}}>⚠️ Abrir Disputa — {vendor.merchantName}</div>
            <select value={dispReason} onChange={e=>setDispReason(e.target.value)} style={{...inp,cursor:"pointer",marginBottom:9}}>
              <option value="">— Selecciona el motivo —</option>
              <option value="no_llegó">El producto no llegó</option>
              <option value="diferente">Producto diferente a lo descrito</option>
              <option value="dañado">Llegó dañado</option>
              <option value="incompleto">Pedido incompleto</option>
              <option value="fraude">Posible fraude</option>
              <option value="otro">Otro</option>
            </select>
            <textarea value={dispDesc} onChange={e=>setDispDesc(e.target.value)} placeholder="Describe el problema en detalle…" style={{...inp,minHeight:70,resize:"vertical",fontSize:13,lineHeight:1.5,marginBottom:9}} />
            <div style={{display:"flex",gap:8}}>
              <button className="hop" onClick={()=>setShowDispute(false)} style={{...btn(C.light,C.muted),padding:"9px",flex:1,justifyContent:"center"}}>Cancelar</button>
              <button className="hop" disabled={!dispReason||!dispDesc.trim()||dispSub}
                onClick={async()=>{if(!dispReason||!dispDesc.trim())return;setDispSub(true);await upV("disputed",{disputeReason:dispReason,disputeDesc:dispDesc,disputeAt:new Date().toISOString()});setDispSub(false);setShowDispute(false);}}
                style={{...btn(C.red),padding:"9px",flex:2,justifyContent:"center",fontWeight:700,opacity:(!dispReason||!dispDesc.trim()||dispSub)?0.5:1}}>
                {dispSub?<><Spin/>Enviando…</>:"⚠️ Confirmar Disputa"}
              </button>
            </div>
          </div>
        )}

        {/* BUYER: review */}
        {isBuyer && vStatus==="released" && !vendor.review && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>⭐ Califica a {vendor.merchantName}</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <Stars v={rating} size={26} onChange={setRating} />
              {rating>0 && <span style={{fontSize:12,color:C.muted}}>{["","Malo","Regular","Bueno","Muy bueno","Excelente"][rating]}</span>}
            </div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comparte tu experiencia…" style={{...inp,minHeight:60,resize:"vertical",marginBottom:8}} />
            <button className="hop" onClick={async()=>{if(!rating)return;setSubmRev(true);await submitReview(order.id,rating,comment,vendor.merchantId);setSubmRev(false);}}
              disabled={submRev||!rating} style={{...btn(C.gold,C.navy),padding:"9px",width:"100%",justifyContent:"center",opacity:!rating?0.45:1,fontWeight:700}}>
              {submRev?<><Spin dark/>Enviando…</>:"Publicar Reseña ⭐"}
            </button>
          </div>
        )}
        {vendor.review && <div style={{background:C.greenL,borderRadius:9,padding:10,fontSize:12,color:"#065F46",display:"flex",alignItems:"center",gap:7}}><Stars v={vendor.review.rating} size={13} /><span>Reseña enviada ✓</span></div>}
        {isBuyer && vendor.buyerReview && vendor.review && (
          <div style={{background:C.navyL,borderRadius:9,padding:10,border:`1px solid ${C.navy}22`}}>
            <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:4}}>📝 El vendedor te calificó:</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <Stars v={vendor.buyerReview.rating} size={13} />
              {vendor.buyerReview.comment && <span style={{fontSize:11,color:C.muted}}>"{vendor.buyerReview.comment}"</span>}
            </div>
          </div>
        )}
        {isBuyer && vendor.buyerReview && !vendor.review && (
          <div style={{background:C.light,borderRadius:9,padding:10,border:`1px solid ${C.border}`,fontSize:12,color:C.muted}}>
            🔒 El vendedor ya te calificó — califica tú primero para ver su reseña.
          </div>
        )}

        {/* MERCHANT: review of buyer */}
        {isMerchant && vStatus==="released" && !vendor.buyerReview && (
          <div style={{padding:14,borderRadius:9,background:C.navyL,border:`1px solid ${C.navy}22`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:C.navy}}>⭐ Califica al comprador</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <Stars v={buyerRating} size={26} onChange={setBuyerRating} />
              {buyerRating>0 && <span style={{fontSize:12,color:C.muted}}>{["","Malo","Regular","Bueno","Muy bueno","Excelente"][buyerRating]}</span>}
            </div>
            <textarea value={buyerComment} onChange={e=>setBuyerComment(e.target.value)} placeholder="¿Cómo fue la experiencia con este comprador?" style={{...inp,minHeight:55,resize:"vertical",marginBottom:8}} />
            <button className="hop" onClick={async()=>{if(!buyerRating)return;setSubmBuyerRev(true);await submitReview(order.id,buyerRating,buyerComment,vendor.merchantId,"buyer");setSubmBuyerRev(false);}}
              disabled={submBuyerRev||!buyerRating} style={{...btn(C.navy),padding:"9px",width:"100%",justifyContent:"center",opacity:!buyerRating?0.45:1,fontWeight:700}}>
              {submBuyerRev?<><Spin dark/>Enviando…</>:"Publicar Reseña al Comprador ⭐"}
            </button>
          </div>
        )}
        {isMerchant && vendor.buyerReview && (
          <div style={{background:C.navyL,borderRadius:9,padding:10,fontSize:12,color:C.navy,display:"flex",alignItems:"center",gap:7}}>
            <Stars v={vendor.buyerReview.rating} size={13} />
            <span>Reseña al comprador enviada ✓</span>
          </div>
        )}

        {/* ADMIN: dispute resolution */}
        {isAdmin && vStatus==="disputed" && !vendor.disputeResolution && (
          <DisputeResolver order={{...order, ...vendor, id:order.id, merchantId:vendor.merchantId}} updateStatus={(id,s,ex)=>updateStatus(id,s,ex,vendor.merchantId)} showT={showT} />
        )}

        {/* ADMIN: payout completion */}
        {isAdmin && vStatus==="released" && vendor.payoutStatus==="pending_payout" && (
          <button className="hop" onClick={()=>completePayout&&completePayout(order.id,vendor.merchantId)} style={{...btn(C.green),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>💸 Confirmar Liquidación al Vendedor</button>
        )}
      </div>
    </div>
  );
}

export function OrderDetailPage({ orders,users,params,updateStatus,user,nav,submitReview,showT,completePayout,rate,rateLabel }) {
  const order = orders.find(o => o.id===params.orderId);

  if(!order) return (
    <div style={{padding:40,textAlign:"center",color:C.muted}}>
      Orden no encontrada. <span style={{cursor:"pointer",color:C.red,marginLeft:6}} onClick={()=>nav("my-orders")}>Volver</span>
    </div>
  );

  const isBuyer    = user?.id===order.buyerId;
  const isMerchant = user?.role==="merchant" && order.vendors?.some(v=>v.merchantId===user?.id);
  const isAdmin    = user?.role==="admin";
  const isExpired  = order.status==="submitted" && order.deadline && new Date(order.deadline) < new Date();

  /* Determine which vendors to show */
  const allVendors   = order.vendors || [];
  const displayVendors = isMerchant
    ? allVendors.filter(v=>v.merchantId===user.id)
    : allVendors;

  /* Overall display status (for header badge — buyer/admin) */
  const overallST = orderDisplayST(order);

  /* Total shipping for display */
  const shippingTotal = order.shippingTotal ?? allVendors.reduce((s,v)=>s+(v.shippingCost||0),0);
  const grandTotal    = order.grandTotal    ?? allVendors.reduce((s,v)=>s+v.subtotal+(v.shippingCost||0),0);

  return (
    <div className="page-wrap">
      <button className="hop" onClick={()=>nav(isMerchant?"merchant-orders":isAdmin?"admin":"my-orders")}
        style={{...btn(C.light,C.muted),padding:"6px 12px",fontSize:12,marginBottom:16}}>← Volver</button>

      {/* Order header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:9,marginBottom:16}}>
        <div>
          <h1 style={{fontFamily:Fh,margin:"0 0 3px",fontSize:18,fontWeight:800}}>Orden #{order.id.slice(0,8).toUpperCase()}</h1>
          <div style={{color:C.muted,fontSize:12}}>{fD(order.createdAt)} · {order.buyerName} · {order.deliveryType==="pickup"?"🏪 Retiro":"🚚 Envío"}</div>
        </div>
        {!isMerchant && (
          <span style={{background:overallST.bg,color:overallST.c,fontSize:12,fontWeight:700,padding:"5px 13px",borderRadius:20}}>
            {isExpired?"⏰ Expirado":overallST.l}
          </span>
        )}
      </div>

      {/* Payment countdown */}
      {order.status==="submitted" && order.deadline && !isExpired && isBuyer && !(order.paymentRef && displayVendors[0]?.items?.length) && (
        <div style={{background:C.amberL,border:`1px solid ${C.amber}44`,borderRadius:9,padding:"12px 14px",marginBottom:13}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:C.amber,fontWeight:700}}>⏱ Tiempo para enviar tu comprobante:</span>
            <Countdown deadline={order.deadline} onExpire={()=>updateStatus(order.id,"expired")} />
          </div>
          <div style={{fontSize:12,color:C.amber}}>Tienes <strong>10 minutos</strong> para adjuntar tu referencia y comprobante de pago.</div>
        </div>
      )}

      {/* Bank payment instructions — buyer only */}
      {isBuyer && order.status==="submitted" && !isExpired && (order.paymentMethod==="pagomovil"||order.paymentMethod==="zelle") && (
        <div style={{...card,padding:16,marginBottom:13,border:`2px solid ${order.paymentMethod==="pagomovil"?C.navy:C.purple}33`}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:11,fontFamily:Fh,color:order.paymentMethod==="pagomovil"?C.navy:"#5B21B6"}}>
            {order.paymentMethod==="pagomovil"?"🏦 Datos para PagoMóvil":"💵 Datos para Zelle"}
          </div>
          {order.paymentMethod==="pagomovil" && (
            <div style={{background:C.navyL,borderRadius:8,padding:"11px 14px",fontFamily:"monospace",fontSize:12,lineHeight:2.2,marginBottom:10}}>
              🏦 <strong>Banco Venezuela</strong> · Cód. 0102<br/>
              📱 <strong>0412-123-4567</strong><br/>
              🪪 <strong>RIF J-12345678-9</strong><br/>
              👤 <strong>VendeYApp C.A.</strong><br/>
              💰 Monto exacto: <strong style={{color:C.red,fontSize:14}}>{fBs(grandTotal,rate)}</strong>
            </div>
          )}
          {order.paymentMethod==="zelle" && (
            <div style={{background:"#F3EEFF",borderRadius:8,padding:"11px 14px",fontFamily:"monospace",fontSize:12,lineHeight:2.2,marginBottom:10}}>
              📧 <strong>pagos@vendeya.app</strong><br/>
              👤 <strong>VendeYApp C.A.</strong><br/>
              💰 Monto exacto: <strong style={{color:C.red,fontSize:14}}>{fU(grandTotal)}</strong>
            </div>
          )}
          <BuyerProofUpload order={order} updateStatus={updateStatus} showT={showT} />
        </div>
      )}
      {order.status==="submitted" && !isExpired && isMerchant && (
        <div style={{background:C.navyL,border:`1px solid ${C.navy}22`,borderRadius:9,padding:"10px 14px",marginBottom:13,fontSize:12,color:C.navy}}>
          ⏳ Esperando que el comprador adjunte su comprobante de pago.
        </div>
      )}
      {isExpired && <div style={{background:C.light,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",marginBottom:13,fontSize:12,color:C.muted}}>⏰ Esta orden expiró porque no se envió el comprobante a tiempo.</div>}

      {/* Admin: payment verification */}
      {isAdmin && order.status==="submitted" && !isExpired && (
        <div style={{...card,padding:16,marginBottom:12,border:`2px solid ${C.red}22`}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:5,fontFamily:Fh}}>⚙️ Verificar Pago</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:11}}>{order.paymentProofImg?"✅ Comprobante adjuntado.":"⚠️ Sin comprobante."} Ref: <strong style={{fontFamily:"monospace"}}>{order.paymentRef||"—"}</strong></div>
          <div style={{display:"flex",gap:9}}>
            <button className="hop" onClick={()=>updateStatus(order.id,"verified")} style={{...btn(C.green),padding:"10px 16px",flex:1,justifyContent:"center",fontWeight:700}}>✅ Verificar y Aprobar</button>
            <button className="hop" onClick={()=>updateStatus(order.id,"rejected")} style={{...btn(C.redL,"#991B1B"),padding:"10px 16px",flex:1,justifyContent:"center",fontWeight:700}}>✕ Rechazar</button>
          </div>
        </div>
      )}

      {/* Proof image — admin only */}
      {order.paymentProofImg && isAdmin && (
        <ProofImageCard paymentProofImg={order.paymentProofImg} paymentRef={order.paymentRef} />
      )}

      {/* Shipping guide — visible to buyer and admin */}
      {displayVendors.filter(v=>v.shippingGuide).map(v=>(
        <div key={v.merchantId} style={{...card,padding:14,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>📦 Guía de Envío{allVendors.length>1?` — ${v.merchantName}`:""}</div>
          <img src={v.shippingGuide} style={{maxWidth:"100%",maxHeight:280,borderRadius:8,border:`1px solid ${C.border}`,objectFit:"contain",display:"block"}} />
        </div>
      ))}

      {/* Order totals summary — buyer and admin only */}
      {!isMerchant && (
        <div style={{...card,padding:16,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🧾 Resumen de pago</div>
          {allVendors.map(v=>(
            <div key={v.merchantId}>
              {allVendors.length>1 && <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>🏪 {v.merchantName}</div>}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}><span>Productos</span><span>{fU(v.subtotal)}</span></div>
              {v.shippingCost>0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}><span>🚚 Envío</span><span>{fU(v.shippingCost)}</span></div>}
            </div>
          ))}
          {shippingTotal>0 && allVendors.length<=1 && null /* already shown above */}
          <div style={{display:"flex",justifyContent:"space-between",fontFamily:Fh,fontWeight:900,fontSize:17,marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
            <span>Total pagado</span><span style={{color:C.red}}>{fU(grandTotal)}</span>
          </div>
          <div style={{fontSize:11,color:C.muted,textAlign:"right",marginTop:2}}>{fBs(grandTotal,rate)} · Pago: {PAY.find(m=>m.id===order.paymentMethod)?.label}</div>
          {order.address && order.deliveryType!=="pickup" && <div style={{fontSize:11,color:C.muted,marginTop:6}}>📍 {order.address}</div>}
        </div>
      )}

      {/* Buyer protection message */}
      {isBuyer && !["rejected","expired"].includes(order.status) && (
        <div style={{background:overallST.l===ST.released.l?C.greenL:C.navyL,border:`1px solid ${overallST.l===ST.released.l?C.green:C.navy}22`,borderRadius:9,padding:"11px 14px",marginBottom:12,display:"flex",gap:9,alignItems:"flex-start"}}>
          <span style={{fontSize:18}}>{overallST.l===ST.released.l?"✅":"🔒"}</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:overallST.l===ST.released.l?"#065F46":C.navy,marginBottom:2}}>{overallST.l===ST.released.l?"¡Compra completada!":"Tu compra está protegida"}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>
              {overallST.l===ST.released.l?"El vendedor recibió el pago. Gracias por comprar en VendeYApp."
                :order.deliveryType==="pickup"?"Pagas y el vendedor recibe el dinero solo cuando confirme que retiraste el pedido."
                :"Pagas y el vendedor recibe el dinero solo cuando confirmes que tu pedido llegó correctamente."}
            </div>
          </div>
        </div>
      )}

      {/* Vendor sections */}
      {displayVendors.map(vendor => (
        <VendorSection key={vendor.merchantId}
          vendor={vendor} order={order}
          isMerchant={isMerchant} isBuyer={isBuyer} isAdmin={isAdmin}
          user={user} updateStatus={updateStatus} submitReview={submitReview}
          users={users} nav={nav} showT={showT} completePayout={completePayout} />
      ))}
    </div>
  );
}
