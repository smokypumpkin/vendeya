import React, { useState } from "react"
import { C, Fh, APP_NAME, APP_URL } from "../constants.js"
import { fU, fBs, ago } from "../utils.js"
import { Pill, Img, Stars, btn, inp, card } from "../components/ui.jsx"
import { HeartIcon, PGrid } from "../components/ProductCard.jsx"
import { useDocTitle, useMeta, useSchema } from "../components/SmartSearch.jsx"

export function ProductPage({ products, orders, users, params, nav, addToCart, user, rate, rateLabel, askQ, answerQ, showT, favs=[], toggleFav, reviews=[] }) {
  const product = products.find(p => p.id===params.productId);
  const [qty,       setQtyL]    = useState(1);
  const [question,  setQuestion]= useState("");
  const [ansInputs, setAnsInputs]= useState({});
  const [asking,    setAsking]  = useState(false);
  const [imgTab,    setImgTab]  = useState(0);

  if(!product) return (
    <div style={{padding:40,textAlign:"center",color:C.muted}}>
      Producto no encontrado. <span style={{color:C.red,cursor:"pointer"}} onClick={() => nav("browse")}>← Volver</span>
    </div>
  );

  const ep         = product.salePrice && product.salePrice < product.price;
  const finalPrice = ep ? product.salePrice : product.price;
  const savings    = ep ? +(product.price-product.salePrice).toFixed(2) : 0;
  const disc       = ep ? Math.round((1-product.salePrice/product.price)*100) : 0;
  const isMerchant = user?.id===product.merchantId;
  const mu         = users?.find(u => u.id===product.merchantId);

  /* ── SEO & Schema ── */
  useDocTitle(product.name);
  useMeta(`${product.name} — ${product.condition==="new"?"Nuevo":"Usado"} · ${product.category} en Venezuela. Precio: $${(product.salePrice||product.price).toFixed(2)}${product.freeShipping?" · Envío GRATIS":""}.`);
  useSchema([
    {
      "@context":"https://schema.org",
      "@type":"Product",
      "name":product.name,
      "description":product.description||product.name,
      "image":product.image,
      "brand":{"@type":"Brand","name":mu?.storeName||mu?.name||APP_NAME},
      "category":product.category,
      "condition":`https://schema.org/${product.condition==="new"?"NewCondition":"UsedCondition"}`,
      "offers":{
        "@type":"Offer",
        "price":(product.salePrice||product.price).toFixed(2),
        "priceCurrency":"USD",
        "availability":product.stock>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",
        "seller":{"@type":"Organization","name":mu?.storeName||mu?.name||APP_NAME},
        "shippingDetails":product.freeShipping?{
          "@type":"OfferShippingDetails",
          "shippingRate":{"@type":"MonetaryAmount","value":"0","currency":"USD"},
          "shippingDestination":{"@type":"DefinedRegion","addressCountry":"VE"}
        }:undefined
      },
      "aggregateRating": (() => {
        const revs = (orders||[]).filter(o=>o.vendors?o.vendors.some(v=>v.merchantId===product.merchantId&&v.review):o.review&&o.merchantId===product.merchantId);
        if(!revs.length) return undefined;
        const ratings = revs.map(o=>o.vendors?o.vendors.find(v=>v.merchantId===product.merchantId)?.review?.rating:o.review?.rating).filter(Boolean);
        if(!ratings.length) return undefined;
        return {"@type":"AggregateRating","ratingValue":(ratings.reduce((s,r)=>s+r,0)/ratings.length).toFixed(1),"reviewCount":ratings.length,"bestRating":"5","worstRating":"1"};
      })()
    },
    {
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      "itemListElement":[
        {"@type":"ListItem","position":1,"name":"Inicio","item":APP_URL},
        {"@type":"ListItem","position":2,"name":"Explorar","item":`${APP_URL}/browse`},
        {"@type":"ListItem","position":3,"name":product.category,"item":`${APP_URL}/browse?cat=${encodeURIComponent(product.category)}`},
        {"@type":"ListItem","position":4,"name":product.name,"item":`${APP_URL}/product/${product.id}`}
      ]
    }
  ].filter(s=>s));

  /* Product reviews: reviews for this specific product */
  const productReviews = orders.filter(o => o.review && (o.items||[]).some(i => i.productId===product.id)).map(o => ({...o.review, buyerName:o.buyerName}));
  const storeReviews   = orders.filter(o => o.merchantId===product.merchantId && o.review).map(o => ({...o.review, buyerName:o.buyerName}));
  const avgR = productReviews.length ? productReviews.reduce((s,r)=>s+r.rating,0)/productReviews.length : 0;

  /* Same merchant, other products */
  const sameVendor = products.filter(p => p.active && p.merchantId===product.merchantId && p.id!==product.id).sort((a,b)=>(a.salePrice||a.price)-(b.salePrice||b.price)).slice(0,6);
  /* Other vendors, same category */
  const otherVendors = products.filter(p => p.active && p.merchantId!==product.merchantId && p.category===product.category && p.id!==product.id).sort((a,b)=>(a.salePrice||a.price)-(b.salePrice||b.price)).slice(0,6);

  const handleAsk = async () => {
    if(!question.trim()||!user) return;
    setAsking(true);
    await askQ(product.id, question);
    setQuestion(""); setAsking(false);
  };
  const handleAnswer = async qId => {
    const a = ansInputs[qId]?.trim();
    if(!a) return;
    await answerQ(product.id, qId, a);
    setAnsInputs(p => ({...p,[qId]:""}));
  };
  const noStock = product.stock===0 || !product.active;

  return (
    <div className="page-wrap">
      {/* Breadcrumb */}
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:14,fontSize:12,color:C.muted,flexWrap:"wrap"}}>
        <span onClick={() => nav("landing")} style={{cursor:"pointer",color:C.red}}>Inicio</span>
        <span>›</span>
        <span onClick={() => nav("browse",{cat:product.category})} style={{cursor:"pointer",color:C.red}}>{product.category}</span>
        <span>›</span>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{product.name}</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,marginBottom:20}}>
        {/* Image Gallery */}
        <div>
          {(() => {
            const imgs = product.images?.length ? product.images : product.image ? [product.image] : [];
            const [activeImg, setActiveImg] = useState(0);
            return (
              <>
                <div style={{borderRadius:12,overflow:"hidden",aspectRatio:"1/1",width:"100%",background:C.light,position:"relative"}}>
                  <Img src={imgs[activeImg]||imgs[0]||""} alt={product.name} />
                  <div style={{position:"absolute",top:10,left:10,display:"flex",gap:5,flexWrap:"wrap"}}>
                    <Pill label={product.condition==="new"?"Nuevo":"Usado"} c={product.condition==="new"?C.navy:C.slate} solid />
                    {disc > 0 && <Pill label={`-${disc}%`} c={C.red} solid />}
                    {noStock && <Pill label="Sin Stock" c="#fff" bg="rgba(0,0,0,.75)" />}
                  </div>
                  {imgs.length > 1 && (
                    <>
                      <button onClick={()=>setActiveImg(i=>Math.max(0,i-1))} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.45)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                      <button onClick={()=>setActiveImg(i=>Math.min(imgs.length-1,i+1))} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.45)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                      <div style={{position:"absolute",bottom:8,right:10,background:"rgba(0,0,0,.5)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20}}>{activeImg+1}/{imgs.length}</div>
                    </>
                  )}
                </div>
                {imgs.length > 1 && (
                  <div style={{display:"flex",gap:6,marginTop:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
                    {imgs.map((img,i) => (
                      <div key={i} onClick={()=>setActiveImg(i)} style={{width:56,height:56,borderRadius:7,overflow:"hidden",flexShrink:0,border:`2px solid ${activeImg===i?C.red:C.border}`,cursor:"pointer",background:C.light,transition:"border-color .15s"}}>
                        <img src={img} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
          {avgR > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,padding:"8px 12px",background:C.goldL,borderRadius:9,border:`1px solid ${C.gold}33`}}>
              <Stars v={Math.round(avgR)} size={15} />
              <span style={{fontSize:13,fontWeight:700,color:C.amber}}>{avgR.toFixed(1)}</span>
              <span style={{fontSize:12,color:C.muted}}>({productReviews.length} reseña{productReviews.length!==1?"s":""})</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{product.category}</div>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
            <h1 style={{fontFamily:Fh,fontSize:"clamp(18px,3vw,22px)",margin:0,lineHeight:1.2,fontWeight:800,flex:1}}>{product.name}</h1>
            <button onClick={()=>toggleFav&&toggleFav(product.id)}
              style={{background:favs.includes(product.id)?"#FFF5F5":"transparent",
                border:`1px solid ${favs.includes(product.id)?"#FCA5A5":C.border}`,
                borderRadius:8,cursor:"pointer",padding:"7px 12px",display:"flex",alignItems:"center",gap:6,
                flexShrink:0,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#FFF5F5";e.currentTarget.style.borderColor="#FCA5A5";}}
              onMouseLeave={e=>{e.currentTarget.style.background=favs.includes(product.id)?"#FFF5F5":"transparent";e.currentTarget.style.borderColor=favs.includes(product.id)?"#FCA5A5":C.border;}}>
              <HeartIcon saved={favs.includes(product.id)} size={16} />
              <span style={{fontSize:12,fontWeight:600,color:favs.includes(product.id)?"#E53E3E":"#6B7280"}}>
                {favs.includes(product.id)?"Guardado":"Guardar"}
              </span>
            </button>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span onClick={() => nav("merchant-profile",{merchantId:product.merchantId})} style={{color:C.navy,fontWeight:700,fontSize:13,cursor:"pointer"}}>🏪 {product.merchantName}</span>
            {mu?.merchantVerified && <Pill label="✓ Verificado" c={C.green} bg={C.greenL} />}
            <span style={{color:C.muted,fontSize:12}}>📍 {product.merchantLoc}</span>
          </div>

          {/* Price block */}
          <div style={{padding:"12px 0",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
            {ep && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontSize:14,color:C.muted,textDecoration:"line-through"}}>{fU(product.price)}</span>
                <Pill label={`Ahorra ${fU(savings)}`} c={C.teal} bg={C.tealL} />
              </div>
            )}
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:"clamp(28px,4vw,36px)",color:C.red,lineHeight:1}}>{fU(finalPrice)}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>{fBs(finalPrice,rate)} · Tasa {rateLabel} (BCV)</div>
          </div>

          {/* Delivery options */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {product.allowsDelivery && (
              <div style={{background:product.freeShipping?C.tealL:C.light,color:product.freeShipping?C.teal:C.text,padding:"6px 11px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${product.freeShipping?C.teal+"33":C.border}`,display:"flex",gap:5,alignItems:"center"}}>
                🚚 {product.freeShipping ? "Envío GRATIS" : (product.shippingCost||0)>0 ? `Envío: ${fU(product.shippingCost)}` : "Consultar envío"} · {product.deliveryDays||"3-7"} días
              </div>
            )}
            {product.allowsPickup && <div style={{background:C.navyL,color:C.navy,padding:"6px 11px",borderRadius:8,fontSize:12,fontWeight:600}}>🏪 Retiro en {product.merchantLoc}</div>}
          </div>

          <div style={{background:C.light,borderRadius:9,padding:12,fontSize:13,lineHeight:1.7,color:C.text}}>{product.description}</div>

          {/* Qty picker */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:13,fontWeight:600}}>Cantidad:</span>
            <div style={{display:"flex",alignItems:"center",background:C.light,borderRadius:8,overflow:"hidden"}}>
              <button className="hop" onClick={() => setQtyL(Math.max(1,qty-1))} style={{...btn(C.light,C.text),padding:"6px 12px",borderRadius:0,fontSize:16}}>−</button>
              <span style={{fontWeight:700,minWidth:28,textAlign:"center",fontSize:14}}>{qty}</span>
              <button className="hop" onClick={() => setQtyL(Math.min(product.stock,qty+1))} style={{...btn(C.light,C.text),padding:"6px 12px",borderRadius:0,fontSize:16}}>+</button>
            </div>
            <span style={{fontSize:12,color:product.stock<=3?C.amber:C.muted}}>{product.stock} disp.</span>
          </div>

          <button className="hop" onClick={() => addToCart(product,qty)} disabled={noStock}
            style={{...btn(noStock?C.border:C.red,noStock?C.muted:"#fff"),padding:"13px",fontSize:15,justifyContent:"center",fontWeight:700,cursor:noStock?"not-allowed":"pointer"}}>
            {noStock ? "Sin Stock" : "🛒 Agregar al carrito"}
          </button>

          {/* Escrow badge */}
          <div style={{background:C.greenL,border:`1px solid ${C.green}28`,borderRadius:10,padding:11,display:"flex",gap:9,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>🔒</span>
            <div style={{fontSize:12,color:"#065F46",lineHeight:1.55}}>
              <strong>Compra 100% Protegida:</strong> El vendedor recibe el pago solo cuando confirmes que recibiste tu pedido.
            </div>
          </div>
        </div>
      </div>

      {/* Reviews for THIS product */}
      {productReviews.length > 0 && (
        <div style={{...card,padding:20,marginBottom:16}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:16,fontWeight:800}}>⭐ Reseñas de este producto ({productReviews.length})</h3>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {productReviews.map((r,i) => (
              <div key={i} style={{padding:"12px 14px",background:C.bg,borderRadius:9,borderLeft:`3px solid ${C.gold}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:C.navy,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(r.buyerName||'?')[0].toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700}}>{r.buyerName}</div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}><Stars v={r.rating} size={12} /><span style={{fontSize:10,color:C.muted}}>{ago(r.createdAt)}</span></div>
                  </div>
                </div>
                <div style={{fontSize:13,lineHeight:1.6,marginLeft:36}}>{r.comment}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A */}
      <div style={{...card,padding:20,marginBottom:16}}>
        <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:16,fontWeight:800}}>❓ Preguntas y Respuestas</h3>
        {!(product.questions||[]).length && <p style={{color:C.muted,fontSize:13,margin:"0 0 14px"}}>Sé el primero en preguntar.</p>}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {(product.questions||[]).map(q => (
            <div key={q.id} style={{borderLeft:`3px solid ${C.border}`,paddingLeft:12}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>❓ {q.question}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{q.buyerName} · {ago(q.createdAt)}</div>
              {q.answer
                ? <div style={{background:C.navyL,borderRadius:8,padding:"9px 12px"}}><div style={{fontSize:10,color:C.navy,fontWeight:700,marginBottom:2}}>💬 Vendedor:</div><div style={{fontSize:13}}>{q.answer}</div></div>
                : isMerchant
                  ? <div style={{display:"flex",gap:7}}>
                      <input value={ansInputs[q.id]||""} onChange={e=>setAnsInputs(p=>({...p,[q.id]:e.target.value}))} placeholder="Tu respuesta…" style={{...inp,flex:1,fontSize:12}} />
                      <button className="hop" onClick={() => handleAnswer(q.id)} style={{...btn(C.navy),padding:"8px 12px",fontSize:12,flexShrink:0}}>Responder</button>
                    </div>
                  : <div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Esperando respuesta…</div>
              }
            </div>
          ))}
        </div>
        {user && !isMerchant && (
          <div style={{display:"flex",gap:7,marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
            <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Escribe tu pregunta… (no incluyas datos personales)" style={{...inp,flex:1,fontSize:12}} onKeyDown={e=>e.key==="Enter"&&handleAsk()} />
            <button className="hop" onClick={handleAsk} disabled={asking||!question.trim()}
              style={{...btn(C.red),padding:"9px 14px",fontSize:12,flexShrink:0,opacity:(!question.trim()||asking)?0.45:1}}>Preguntar</button>
          </div>
        )}
        {!user && <p style={{fontSize:12,color:C.muted,margin:"12px 0 0"}}><span onClick={()=>nav("login")} style={{color:C.red,cursor:"pointer",fontWeight:600}}>Inicia sesión</span> para preguntar.</p>}
      </div>

      {/* Same vendor carousel */}
      {sameVendor.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:15,fontWeight:800}}>Más de <span onClick={()=>nav("merchant-profile",{merchantId:product.merchantId})} style={{color:C.red,cursor:"pointer"}}>{product.merchantName}</span></h3>
            <button className="hop" onClick={()=>nav("merchant-profile",{merchantId:product.merchantId})} style={{...btn(C.light,C.muted),padding:"5px 11px",fontSize:11}}>Ver tienda →</button>
          </div>
          <PGrid items={sameVendor} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
        </div>
      )}

      {/* Other vendors same category */}
      {otherVendors.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:15,fontWeight:800}}>También en {product.category} · otros vendedores</h3>
            <button className="hop" onClick={()=>nav("browse",{cat:product.category})} style={{...btn(C.light,C.muted),padding:"5px 11px",fontSize:11}}>Ver más →</button>
          </div>
          <PGrid items={otherVendors} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
        </div>
      )}
    </div>
  );
}
