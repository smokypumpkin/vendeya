import React from "react"
import { C, Fh } from "../constants.js"
import { fU, fBs } from "../utils.js"
import { Pill, Img, btn, card } from "./ui.jsx"

/* Heart icon — saved/unsaved state */
export function HeartIcon({ saved, size=18 }) {
  return saved ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#E53E3E" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}


export function PCard({ product, nav, addToCart, rate, rateLabel, favs=[], toggleFav }) {
  const ep    = product.salePrice && product.salePrice < product.price;
  const price = ep ? product.salePrice : product.price;
  const disc  = ep ? Math.round((1-product.salePrice/product.price)*100) : 0;
  const noStock = product.stock === 0 || !product.active;
  return (
    <div className="lift" style={{...card,overflow:"hidden",cursor:"pointer",transition:"all .2s",display:"flex",flexDirection:"column",height:"100%"}}>
      <div onClick={() => nav("product",{productId:product.id})} style={{aspectRatio:"1/1",background:C.light,overflow:"hidden",position:"relative",flexShrink:0}}>
        <Img src={product.image} alt={product.name} />
        {/* Pills over image */}
        <div style={{position:"absolute",top:7,left:7,display:"flex",gap:4,flexWrap:"wrap",maxWidth:"calc(100% - 14px)"}}>
          <Pill label={product.condition==="new"?"Nuevo":"Usado"} c={product.condition==="new"?C.navy:C.slate} solid />
          {disc > 0 && <Pill label={`-${disc}%`} c={C.red} solid />}
        </div>
        {/* Fav heart */}
        {product.stock > 0 && product.stock <= 2 && !product.freeShipping && (
          <div style={{position:"absolute",bottom:7,left:7}}><Pill label={`¡Último! ${product.stock} disp.`} c={C.amber} solid /></div>
        )}
        {product.freeShipping && product.stock > 0 && (
          <div style={{position:"absolute",bottom:7,right:7}}><Pill label="🚚 GRATIS" c={C.teal} solid /></div>
        )}
        {noStock && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Pill label="Sin Stock" c="#fff" bg="rgba(0,0,0,.6)" sx={{fontSize:13,padding:"5px 13px"}} />
          </div>
        )}
      </div>
      <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",flex:1}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{product.category} · 📍{product.merchantLoc}</div>
        <div onClick={() => nav("product",{productId:product.id})} style={{fontWeight:600,fontSize:13,marginBottom:5,lineHeight:1.35,flex:1,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{product.name}</div>
        <div style={{marginBottom:4}}>
          {ep && <span style={{fontSize:11,color:C.muted,textDecoration:"line-through",marginRight:5}}>{fU(product.price)}</span>}
          <span style={{fontFamily:Fh,fontWeight:800,fontSize:16,color:C.red}}>{fU(price)}</span>
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:9}}>{fBs(price,rate)} · {rateLabel}</div>
        {product.freeShipping && !noStock && (
          <div style={{fontSize:10,color:C.teal,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
            <span>🚚</span><span>Envío GRATIS</span>
          </div>
        )}
        {!product.freeShipping && (product.shippingCost||0) > 0 && !noStock && (
          <div style={{fontSize:10,color:C.muted,marginBottom:4}}>🚚 Envío: {fU(product.shippingCost)}</div>
        )}
        <button className="hop"
          onClick={e => { e.stopPropagation(); addToCart(product); }}
          disabled={noStock}
          style={{...btn(noStock?C.light:C.red,noStock?C.muted:"#fff"),padding:"7px",fontSize:12,width:"100%",justifyContent:"center",cursor:noStock?"not-allowed":"pointer"}}>
          {noStock ? "Sin Stock" : "+ Agregar"}
        </button>
      </div>
    </div>
  );
}

export function PGrid({ items, nav, addToCart, rate, rateLabel }) {
  return (
    <div className="vy-grid">
      {items.map(p => <PCard key={p.id} product={p} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel} />)}
    </div>
  );
}

export function Section({ title, items, nav, addToCart, rate, rateLabel, onMore, favs=[], toggleFav }) {
  if(!items.length) return null;
  return (
    <div style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontFamily:Fh,margin:0,fontSize:17,fontWeight:800}}>{title}</h2>
        {onMore && <button className="hop" onClick={onMore} style={{...btn(C.light,C.muted),padding:"5px 12px",fontSize:12}}>Ver todos →</button>}
      </div>
      <PGrid items={items} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel} favs={favs} toggleFav={toggleFav} />
    </div>
  );
}
