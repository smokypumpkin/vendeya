import React from "react"
import { C, Fh } from "../constants.js"
import { fU, fBs } from "../utils.js"
import { Img, btn, card } from "../components/ui.jsx"

export function CartPage({ cart,cartTotal,removeFromCart,setCartQty,nav,user,rate,rateLabel }) {
  if(!cart.length) return (
    <div style={{maxWidth:480,margin:"50px auto",padding:"0 16px",textAlign:"center"}}>
      <div style={{fontSize:52}}>🛒</div>
      <h2 style={{fontFamily:Fh,fontWeight:800,marginTop:10}}>Tu carrito está vacío</h2>
      <button className="hop" onClick={()=>nav("browse")} style={{...btn(C.red),padding:"12px 24px",fontSize:14,justifyContent:"center",marginTop:12}}>Explorar productos</button>
    </div>
  );
  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>Carrito</h1>
      <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:18}}>
        {cart.map(item => {
          const price = item.product.salePrice||item.product.price;
          return (
            <div key={item.productId} style={{...card,padding:13,display:"flex",gap:11,alignItems:"center"}}>
              <div style={{width:58,height:58,borderRadius:8,overflow:"hidden",flexShrink:0,background:C.light,cursor:"pointer"}} onClick={()=>nav("product",{productId:item.productId})}>
                <Img src={item.product.image} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>{item.product.name}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:5}}>📍 {item.product.merchantLoc} · Stock: {item.product.stock}</div>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{display:"flex",alignItems:"center",background:C.light,borderRadius:7,overflow:"hidden"}}>
                    <button className="hop" onClick={()=>item.qty>1?setCartQty(item.productId,item.qty-1):removeFromCart(item.productId)} style={{...btn(C.light,C.muted),padding:"3px 10px",borderRadius:0,fontSize:14}}>−</button>
                    <span style={{fontWeight:700,minWidth:22,textAlign:"center",fontSize:13}}>{item.qty}</span>
                    <button className="hop"
                      onClick={()=>item.qty<item.product.stock&&setCartQty(item.productId,item.qty+1)}
                      style={{...btn(item.qty>=item.product.stock?C.border:C.light,item.qty>=item.product.stock?C.border:C.muted),padding:"3px 10px",borderRadius:0,fontSize:14,cursor:item.qty>=item.product.stock?"not-allowed":"pointer"}}>+</button>
                  </div>
                  <span style={{fontSize:11,color:C.muted}}>{fU(price)} c/u</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:Fh,fontWeight:800,fontSize:15,color:C.red}}>{fU(price*item.qty)}</div>
                <button className="hop" onClick={()=>removeFromCart(item.productId)} style={{...btn("transparent","#DC2626"),padding:"2px 0",fontSize:11,marginTop:3}}>✕ Quitar</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{...card,padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontFamily:Fh,fontWeight:900,fontSize:22,marginBottom:3}}>
          <span>Total</span><span style={{color:C.red}}>{fU(cartTotal)}</span>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14,textAlign:"center"}}>{fBs(cartTotal,rate)} · {rateLabel}</div>
        <div style={{background:C.greenL,border:`1px solid ${C.green}22`,borderRadius:9,padding:10,fontSize:12,color:"#065F46",marginBottom:13,display:"flex",gap:8,alignItems:"center"}}>
          <span>🔒</span><span>Compra <strong>100% protegida</strong> — fondos liberados solo cuando confirmes tu entrega.</span>
        </div>
        <button className="hop" onClick={()=>user?nav("checkout"):nav("login",{returnTo:"cart"})}
          style={{...btn(C.red),padding:"13px",fontSize:15,width:"100%",justifyContent:"center",fontWeight:700}}>
          {user?"Proceder al Pago Seguro 🔒":"Ingresar para continuar"}
        </button>
      </div>
    </div>
  );
}
