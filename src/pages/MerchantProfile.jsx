import React from "react"
import { C, Fh, APP_NAME, APP_URL, APP_LOGO, APP_GEO } from "../constants.js"
import { ago } from "../utils.js"
import { fU } from "../utils.js"
import { Pill, Img, Stars, btn, card } from "../components/ui.jsx"
import { PGrid } from "../components/ProductCard.jsx"
import { useDocTitle, useMeta, useSchema } from "../components/SmartSearch.jsx"

export function MerchantProfile({ users,products,orders,params,nav,user,toggleFollow,addToCart,rate,rateLabel,favs=[],toggleFav,reviews=[] }) {
  const merchant = users.find(u => u.id===params.merchantId);
  if(!merchant) return <div style={{padding:40,textAlign:"center",color:C.muted}}>Tienda no encontrada</div>;

  const mp       = products.filter(p => p.merchantId===merchant.id && p.active && p.stock>0).sort((a,b)=>(a.salePrice||a.price)-(b.salePrice||b.price));
  const released = orders.filter(o => o.merchantId===merchant.id && o.status==="released");
  const storeRevs = orders.filter(o => o.merchantId===merchant.id && o.review).map(o => ({...o.review,buyerName:o.buyerName}));
  const avgR      = storeRevs.length ? storeRevs.reduce((s,r)=>s+r.rating,0)/storeRevs.length : 0;
  const isF      = (user?.following||[]).includes(merchant.id);
  const years    = Math.max(1, new Date().getFullYear()-new Date(merchant.joinedAt).getFullYear());
  const fl       = (merchant.followers||[]).length;

  /* ── SEO & Schema ── */
  useDocTitle(merchant.storeName||merchant.name);
  useMeta(`${merchant.storeName||merchant.name} — Tienda en VendeYApp${merchant.location?` · ${merchant.location}`:""}. ${mp.length} producto${mp.length!==1?"s":""} disponibles${avgR>0?`. Calificación: ${avgR.toFixed(1)}/5`:""}.`);
  useSchema([
    {
      "@context":"https://schema.org",
      "@type":"LocalBusiness",
      "name":merchant.storeName||merchant.name,
      "description":merchant.storeDesc||`Tienda de ${merchant.storeName||merchant.name} en VendeYApp`,
      "image":merchant.storeLogo||APP_LOGO,
      "url":`${APP_URL}/merchant/${merchant.id}`,
      "address":{"@type":"PostalAddress","addressLocality":merchant.location||"Venezuela","addressCountry":"VE"},
      "geo":{"@type":"GeoCoordinates","latitude":APP_GEO.lat,"longitude":APP_GEO.lng},
      "areaServed":{"@type":"Country","name":"Venezuela"},
      "priceRange":"$$",
      ...(avgR>0?{"aggregateRating":{"@type":"AggregateRating","ratingValue":avgR.toFixed(1),"reviewCount":reviews.length,"bestRating":"5","worstRating":"1"}}:{}),
      "hasOfferCatalog":{
        "@type":"OfferCatalog",
        "name":`Catálogo de ${merchant.storeName||merchant.name}`,
        "numberOfItems":mp.length
      }
    },
    {
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      "itemListElement":[
        {"@type":"ListItem","position":1,"name":"Inicio","item":APP_URL},
        {"@type":"ListItem","position":2,"name":"Tiendas","item":`${APP_URL}/browse`},
        {"@type":"ListItem","position":3,"name":merchant.storeName||merchant.name,"item":`${APP_URL}/merchant/${merchant.id}`}
      ]
    }
  ]);

  return (
    <div className="page-wrap">
      <div style={{...card,overflow:"hidden",marginBottom:16}}>
        <div style={{background:`linear-gradient(135deg,${C.navyD},${C.navy})`,padding:"22px 20px 18px"}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
            <div style={{width:66,height:66,borderRadius:14,background:`linear-gradient(135deg,${C.red},#FF6B4A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#fff",fontWeight:900,fontFamily:Fh,flexShrink:0}}>
              {merchant.storeLogo
                ? <img src={merchant.storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                : merchant.storeName?merchant.storeName[0].toUpperCase():"🏪"}
            </div>
            <div style={{flex:1,minWidth:160}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                <h2 style={{fontFamily:Fh,margin:0,fontSize:19,color:"#fff",fontWeight:800}}>{merchant.storeName||merchant.name}</h2>
                {merchant.merchantVerified && <Pill label="✓ Verificado" c={C.green} bg={C.greenL} />}
              </div>
              {merchant.storeDesc && <p style={{color:"rgba(255,255,255,.68)",fontSize:12,margin:"0 0 7px",lineHeight:1.5}}>{merchant.storeDesc}</p>}
              <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:"rgba(255,255,255,.55)"}}>
                <span>📍 {merchant.location}</span>
                <span>📅 {years} año{years!==1?"s":""}</span>
                <span>👥 {fl} seguidor{fl!==1?"es":""}</span>
              </div>
            </div>
            <button className="hop" onClick={() => toggleFollow(merchant.id)}
              style={{...btn(isF?"rgba(255,255,255,.14)":C.red,isF?"rgba(255,255,255,.85)":"#fff"),padding:"9px 18px",fontSize:13,border:isF?"1px solid rgba(255,255,255,.28)":"none"}}>
              {isF?"✓ Siguiendo":"+Seguir"}
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)"}}>
          {[{l:"Ventas",v:released.length,ic:"📦"},{l:"Productos",v:mp.length,ic:"🛍️"},{l:"Rating",v:avgR>0?avgR.toFixed(1):"—",ic:"⭐"},{l:"Reseñas",v:reviews.length,ic:"💬"},{l:"Seguidores",v:fl,ic:"👥"}].map((s,i) => (
            <div key={s.l} style={{textAlign:"center",padding:"13px 8px",borderRight:i<4?`1px solid ${C.border}`:"none"}}>
              <div style={{fontSize:17,marginBottom:2}}>{s.ic}</div>
              <div style={{fontFamily:Fh,fontWeight:800,fontSize:17,color:C.red}}>{s.v}</div>
              <div style={{fontSize:10,color:C.muted}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {mp.length > 0 && (
        <div style={{marginBottom:16}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 12px",fontSize:15,fontWeight:800}}>Productos ({mp.length}) · precio más bajo primero</h3>
          <PGrid items={mp} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
        </div>
      )}

      <div style={{...card,padding:20}}>
        <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:15,fontWeight:800}}>⭐ Reseñas ({reviews.length})</h3>
        {!reviews.length && <p style={{color:C.muted,fontSize:13}}>Sin reseñas aún.</p>}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {reviews.map((r,i) => (
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",paddingBottom:14,borderBottom:i<reviews.length-1?`1px solid ${C.border}`:"none"}}>
              {/* Product image */}
              {r.productImage && (
                <div style={{width:48,height:48,borderRadius:8,overflow:"hidden",flexShrink:0,background:C.light,cursor:"pointer"}} onClick={()=>r.productId&&nav("product",{productId:r.productId})}>
                  <Img src={r.productImage} alt={r.productName} />
                </div>
              )}
              <div style={{flex:1}}>
                {r.productName && <div style={{fontSize:11,color:C.navy,fontWeight:700,marginBottom:3}}>📦 {r.productName}</div>}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.muted,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(r.buyerName||'?')[0].toUpperCase()}</div>
                  <span style={{fontSize:12,fontWeight:700}}>{r.buyerName}</span>
                  <Stars v={r.rating} size={12} />
                  <span style={{fontSize:10,color:C.muted}}>{ago(r.createdAt)}</span>
                </div>
                <div style={{fontSize:13,lineHeight:1.6,color:C.text}}>{r.comment}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
