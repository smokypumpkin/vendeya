import React from "react"
import { C, Fh } from "../constants.js"
import { btn } from "../components/ui.jsx"
import { HeartIcon, PGrid } from "../components/ProductCard.jsx"
import { useDocTitle, useMeta } from "../components/SmartSearch.jsx"

export function FavoritesPage({ products, nav, addToCart, rate, rateLabel, favs=[], toggleFav, user }) {
  const favProducts = products.filter(p => favs.includes(p.id));
  useDocTitle("Mis Favoritos");
  useMeta("Tus productos guardados en VendeYApp.");
  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>❤️ Mis Favoritos</h1>
      {!favProducts.length ? (
        <div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
          <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><HeartIcon saved={false} size={52} /></div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Aún no tienes favoritos</div>
          <div style={{fontSize:13,marginBottom:20}}>Guarda productos que te interesen con el corazón</div>
          <button className="hop" onClick={()=>nav("browse")} style={{...btn(C.red),padding:"11px 24px",fontSize:14}}>Explorar productos</button>
        </div>
      ) : (
        <>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{favProducts.length} producto{favProducts.length!==1?"s":""} guardado{favProducts.length!==1?"s":""}</div>
          <PGrid items={favProducts} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel} favs={favs} toggleFav={toggleFav} />
        </>
      )}
    </div>
  );
}
