import React, { useState } from "react"
import { C, Fh, Fb, PAY } from "../constants.js"
import { uid } from "../utils.js"
import { fU, fBs } from "../utils.js"
import { Img, Spin, btn, inp, card } from "../components/ui.jsx"

export function CheckoutPage({ cart,cartTotal,placeOrder,nav,rate,rateLabel,products,users }) {
  const [step,       setStep]      = useState(1);
  const [dlvType,    setDlvType]   = useState("delivery");
  const [address,    setAddress]   = useState("");
  const [pickupNote, setPickupNote]= useState("");
  const [method,     setMethod]    = useState(null);
  const [cardNum,    setCardNum]   = useState("");
  const [cardExp,    setCardExp]   = useState("");
  const [cardCvv,    setCardCvv]   = useState("");
  const [processing, setProcessing]= useState(false);
  const [sumOpen,    setSumOpen]   = useState(true); // collapsible summary

  if(!cart.length) { nav("browse"); return null; }

  /* Group cart by merchant for display */
  const byMerchant = {};
  for(const item of cart) {
    const mid = item.product.merchantId;
    if(!byMerchant[mid]) byMerchant[mid] = [];
    byMerchant[mid].push(item);
  }
  const merchantGroups = Object.entries(byMerchant);
  const multiMerchant  = merchantGroups.length > 1;

  const itemsTotal = cart.reduce((s,i) => s+(i.product.salePrice||i.product.price)*i.qty, 0);
  const shippingTotal = dlvType==="delivery"
    ? cart.reduce((s,i) => i.product.freeShipping?s:s+(+i.product.shippingCost||0), 0) : 0;
  const grandTotal = itemsTotal + shippingTotal;

  /* For pickup: use first product's merchant info */
  const firstProduct   = cart[0]?.product;
  const canStep2       = dlvType==="pickup" || address.trim().length > 5;
  const canConfirm     = !!method && (method!=="card" || (cardNum.replace(/\s/g,"").length>=15 && cardExp.length>=4 && cardCvv.length>=3));

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r,600));
    const pRef = method==="card" ? `CARD-${uid().toUpperCase()}` : "";
    const addr = dlvType==="pickup" ? `RETIRO EN TIENDA${pickupNote?` — ${pickupNote}`:""}` : address;
    await placeOrder(method, pRef, null, addr, dlvType, grandTotal, shippingTotal);
    setProcessing(false);
  };

  /* Order summary — collapsible on mobile */
  const OrderSummary = () => (
    <div style={{...card,padding:0,marginBottom:14,overflow:"hidden"}}>
      {/* Header / toggle */}
      <div onClick={()=>setSumOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",cursor:"pointer",userSelect:"none"}}
        onMouseEnter={e=>e.currentTarget.style.background=C.light}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{fontWeight:700,fontSize:13,fontFamily:Fh}}>📋 Resumen del pedido</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:Fh,fontWeight:900,fontSize:15,color:C.red}}>{fU(grandTotal)}</span>
          <span style={{fontSize:14,color:C.muted,transition:"transform .2s",display:"inline-block",transform:sumOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
        </div>
      </div>

      {sumOpen && (
        <div style={{padding:"0 16px 14px"}}>
          {merchantGroups.map(([mid, mItems]) => {
            const merchant = mItems[0]?.product;
            const mSub = mItems.reduce((s,i)=>s+(i.product.salePrice||i.product.price)*i.qty,0);
            const mShip = dlvType==="delivery" ? mItems.reduce((s,i)=>i.product.freeShipping?s:s+(+i.product.shippingCost||0),0) : 0;
            return (
              <div key={mid}>

                {mItems.map(i => {
                  const p = i.product.salePrice||i.product.price;
                  return (
                    <div key={i.productId} style={{display:"flex",gap:9,alignItems:"center",marginBottom:9}}>
                      <div style={{width:38,height:38,borderRadius:7,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={i.product.image} /></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.product.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>×{i.qty}
                          {dlvType==="delivery" && i.product.freeShipping && <span style={{color:C.teal,fontWeight:700,marginLeft:5}}>· 🚚 Gratis</span>}
                          {dlvType==="delivery" && !i.product.freeShipping && i.product.shippingCost>0 && <span style={{color:C.muted,marginLeft:5}}>+ {fU(i.product.shippingCost)} envío</span>}
                        </div>
                      </div>
                      <div style={{fontWeight:700,fontSize:13,color:C.red,flexShrink:0}}>{fU(p*i.qty)}</div>
                    </div>
                  );
                })}

              </div>
            );
          })}

          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}>
              <span>Subtotal productos</span><span>{fU(itemsTotal)}</span>
            </div>
            {dlvType==="delivery" && (
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:shippingTotal===0?C.teal:C.text,marginBottom:3}}>
                <span>🚚 Envío</span><span style={{fontWeight:600}}>{shippingTotal===0?"GRATIS":fU(shippingTotal)}</span>
              </div>
            )}
            {dlvType==="pickup" && (
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.navy,marginBottom:3}}>
                <span>🏪 Retiro en tienda</span><span style={{fontWeight:600}}>Sin costo</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:Fh,fontWeight:900,fontSize:17,marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
              <span>Total</span><span style={{color:C.red}}>{fU(grandTotal)}</span>
            </div>
            <div style={{fontSize:11,color:C.muted,textAlign:"right",marginTop:2}}>{fBs(grandTotal,rate)} · {rateLabel}</div>
          </div>
        </div>
      )}
    </div>
  );

  const steps = ["Entrega","Método de Pago","Confirmar"];

  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 16px",fontSize:19,fontWeight:800}}>Finalizar Compra</h1>

      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",marginBottom:18}}>
        {steps.map((s,i) => (
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<2?1:undefined}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:step>i+1?C.green:step===i+1?C.red:C.border,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{step>i+1?"✓":i+1}</div>
              <div style={{fontSize:9,marginTop:2,color:step===i+1?C.text:C.muted,fontWeight:step===i+1?700:400,textAlign:"center",whiteSpace:"nowrap"}}>{s}</div>
            </div>
            {i<2 && <div style={{flex:1,height:2,background:step>i+1?C.green:C.border,margin:"0 4px",marginBottom:16}} />}
          </div>
        ))}
      </div>



      <OrderSummary />

      {/* STEP 1: DELIVERY */}
      {step===1 && (
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 13px",fontSize:14,fontWeight:800}}>📍 ¿Cómo recibes tu pedido?</h3>

          <div style={{display:"flex",gap:9,marginBottom:14,flexWrap:"wrap"}}>
            {[["delivery","🚚","Envío a domicilio",firstProduct?.allowsDelivery!==false],
              ["pickup","🏪","Retiro en tienda",!!firstProduct?.allowsPickup]].map(([v,ic,t,ok]) => (
              <div key={v} onClick={()=>ok&&setDlvType(v)}
                style={{flex:1,minWidth:130,padding:12,textAlign:"center",borderRadius:10,cursor:ok?"pointer":"not-allowed",border:`2px solid ${dlvType===v?C.red:C.border}`,opacity:ok?1:0.45,background:dlvType===v?C.redL:"transparent",transition:"all .15s"}}>
                <div style={{fontSize:22,marginBottom:4}}>{ic}</div>
                <div style={{fontWeight:700,fontSize:12,color:dlvType===v?C.red:C.text}}>{t}</div>
              </div>
            ))}
          </div>
          {dlvType==="delivery" && (
            <>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>Dirección de entrega *</label>
              <textarea value={address} onChange={e=>setAddress(e.target.value)}
                placeholder="Calle, urbanización, municipio, ciudad, estado, punto de referencia…"
                style={{...inp,minHeight:80,resize:"vertical",fontFamily:Fb,fontSize:13}} />
            </>
          )}
          {dlvType==="pickup" && !multiMerchant && (() => {
            const merchant = firstProduct ? {storeName:firstProduct.merchantName,loc:firstProduct.merchantLoc} : {};
            return (
            <>
              <div style={{background:C.navyL,border:`1.5px solid ${C.navy}22`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:6}}>🏪 {merchant.storeName||"Tienda del vendedor"}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:2}}>📍 {merchant.loc||"Dirección por confirmar"}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:4,fontStyle:"italic"}}>La dirección exacta y horario de retiro te serán enviados cuando el vendedor marque tu pedido como <strong>Listo para retirar</strong>.</div>
              </div>
              <div style={{background:C.amberL,borderRadius:8,padding:"9px 12px",fontSize:11,color:"#78350F",marginBottom:12,display:"flex",gap:8}}>
                <span>ℹ️</span>
                <span>Al retirar en tienda <strong>no se cobra envío</strong>. Lleva tu comprobante de pago al recoger.</span>
              </div>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>Nota para el vendedor (opcional)</label>
              <textarea value={pickupNote} onChange={e=>setPickupNote(e.target.value)}
                placeholder="Ej: Prefiero retirar en la tarde, o cualquier consulta…"
                style={{...inp,minHeight:55,resize:"vertical",fontFamily:Fb,fontSize:13}} />
            </>
            );
          })()}
          <button className="hop" onClick={()=>canStep2&&setStep(2)}
            style={{...btn(canStep2?C.red:C.border,canStep2?"#fff":C.muted),padding:"12px",width:"100%",marginTop:14,fontSize:14,justifyContent:"center",fontWeight:700}}>
            Continuar →
          </button>
        </div>
      )}

      {/* STEP 2: PAYMENT METHOD */}
      {step===2 && (
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 13px",fontSize:14,fontWeight:800}}>💳 Método de Pago</h3>
          <div style={{background:C.navyL,borderRadius:9,padding:"9px 12px",fontSize:12,color:C.navy,marginBottom:13,display:"flex",gap:7,alignItems:"flex-start"}}>
            <span>ℹ️</span>
            <span>Selecciona cómo quieres pagar. Los datos bancarios se mostrarán <strong>después de confirmar</strong> para adjuntar tu comprobante.</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {PAY.map(pm => (
              <div key={pm.id} onClick={()=>setMethod(pm.id)}
                style={{border:`2px solid ${method===pm.id?pm.color:C.border}`,borderRadius:10,padding:13,cursor:"pointer",background:method===pm.id?"#FAFAFA":"transparent",display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
                <span style={{fontSize:22}}>{pm.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{pm.label}</div>
                  <div style={{color:C.muted,fontSize:11}}>{pm.desc}</div>
                </div>
                <div style={{width:17,height:17,borderRadius:"50%",border:`2px solid ${method===pm.id?pm.color:C.border}`,background:method===pm.id?pm.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {method===pm.id && <div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}} />}
                </div>
              </div>
            ))}
          </div>
          {method==="card" && (
            <div style={{background:C.light,borderRadius:9,padding:13,marginBottom:12,display:"flex",flexDirection:"column",gap:9}}>
              <div style={{background:C.amberL,borderRadius:7,padding:"7px 11px",fontSize:12,color:C.amber}}>ℹ️ Revisado por VendeYApp antes de procesar</div>
              <input value={cardNum} onChange={e=>setCardNum(e.target.value)} placeholder="0000 0000 0000 0000" maxLength={19} style={inp} />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                <input value={cardExp} onChange={e=>setCardExp(e.target.value)} placeholder="MM/AA" maxLength={5} style={inp} />
                <input type="password" value={cardCvv} onChange={e=>setCardCvv(e.target.value.slice(0,4))} placeholder="CVV" style={inp} />
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:9}}>
            <button className="hop" onClick={()=>setStep(1)} style={{...btn(C.light,C.muted),padding:"11px 16px",fontSize:13}}>← Atrás</button>
            <button className="hop" onClick={()=>canConfirm&&setStep(3)}
              style={{...btn(canConfirm?C.red:C.border,canConfirm?"#fff":C.muted),padding:"11px",flex:1,fontSize:14,justifyContent:"center",fontWeight:700}}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRM */}
      {step===3 && (
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>✅ Confirmar Pedido</h3>
          <div style={{fontSize:13,color:C.muted,marginBottom:4,display:"flex",justifyContent:"space-between"}}>
            <span>Entrega</span>
            <span style={{fontWeight:600,color:C.text}}>{dlvType==="pickup"?"🏪 Retiro en tienda":"🚚 A domicilio"}</span>
          </div>
          <div style={{fontSize:13,color:C.muted,marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span>Pago</span>
            <span style={{fontWeight:600,color:C.text}}>{PAY.find(m=>m.id===method)?.icon} {PAY.find(m=>m.id===method)?.label}</span>
          </div>

          {(method==="pagomovil"||method==="zelle") && (
            <div style={{background:C.greenL,border:`1px solid ${C.green}33`,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12,display:"flex",gap:7}}>
              <span>💡</span>
              <span>Luego de confirmar verás los datos de pago para <strong>{PAY.find(m=>m.id===method)?.label}</strong> y podrás adjuntar tu comprobante.</span>
            </div>
          )}
          <div style={{background:C.navyL,border:`1px solid ${C.navy}22`,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12}}>
            🔒 <strong>Compra Protegida VendeYApp:</strong> El vendedor recibe el pago solo cuando confirmes que tu pedido llegó en perfecto estado.
          </div>
          <div style={{display:"flex",gap:9,marginTop:4}}>
            <button className="hop" onClick={()=>setStep(2)} style={{...btn(C.light,C.muted),padding:"11px 16px",fontSize:13}}>← Atrás</button>
            <button className="hop" onClick={handleConfirm} disabled={processing}
              style={{...btn(C.red),padding:"12px",flex:1,fontSize:14,justifyContent:"center",opacity:processing?0.7:1,fontWeight:700}}>
              {processing ? <><Spin />Procesando…</> : `Confirmar ${fU(grandTotal)} 🔒`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
