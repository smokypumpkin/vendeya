import React, { useState } from "react"
import { C, Fh, Fb, CATS } from "../../constants.js"
import { uid, fU, compressImg, censorContact } from "../../utils.js"
import { Spin, btn, inp, card } from "../../components/ui.jsx"

export function MerchantAddEdit({ user,products,saveProduct,nav,showT,params }) {
  const ep = params?.editId ? products.find(p=>p.id===params.editId) : null;
  const [name,         setName]        = useState(ep?.name||"");
  const [price,        setPrice]       = useState(ep?.price||"");
  const [salePrice,    setSalePrice]   = useState(ep?.salePrice||"");
  const [cat,          setCat]         = useState(ep?.category||"Tecnología");
  const [cond,         setCond]        = useState(ep?.condition||"new");
  const [desc,         setDesc]        = useState(ep?.description||"");
  const [images,       setImages]      = useState(ep?.images || (ep?.image ? [ep.image] : []));
  const [uploading,    setUploading]   = useState(false);
  const [stock,        setStock]       = useState(ep?.stock||"");
  const [allowsPickup, setPickup]      = useState(ep?.allowsPickup??true);
  const [allowsDelivery,setDelivery]   = useState(ep?.allowsDelivery??true);
  const [deliveryDays, setDays]        = useState(ep?.deliveryDays||"3-5");
  const [shippingCost, setShippingCost]= useState(ep?.shippingCost??5);
  const [freeShipping, setFreeShip]   = useState(ep?.freeShipping??false);
  const [saving,       setSaving]      = useState(false);
  const handleFiles = async e => {
    const files = Array.from(e.target.files);
    if(!files.length) return;
    if(images.length + files.length > 8) { showT("Máximo 8 fotos por producto",true); return; }
    setUploading(true);
    const newImgs = [];
    for(const file of files) {
      const b = await compressImg(file, 900);
      if(b) newImgs.push(b);
    }
    setImages(prev => [...prev, ...newImgs]);
    showT(`${newImgs.length} foto${newImgs.length>1?"s":""} agregada${newImgs.length>1?"s":""} ✓`);
    setUploading(false);
    e.target.value = "";
  };
  const moveImg = (from, to) => {
    if(to < 0 || to >= images.length) return;
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setImages(arr);
  };
  const removeImg = idx => setImages(prev => prev.filter((_,i)=>i!==idx));
  const handleSave = async () => {
    if(!name.trim()||!price||!images.length||!stock) { showT("Completa los campos * y sube al menos 1 imagen",true); return; }
    if(salePrice && +salePrice >= +price) { showT("El precio de oferta debe ser menor al precio normal",true); return; }
    if(!allowsPickup && !allowsDelivery) { showT("Debes activar al menos una opción de entrega",true); return; }
    if(allowsDelivery && !freeShipping && (!shippingCost || +shippingCost <= 0)) { showT("Indica el costo de envío o activa Envío GRATIS",true); return; }
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));
    const data = {
      name:censorContact(name),price:+price,
      salePrice:salePrice&&+salePrice<+price ? +salePrice : null,
      category:cat,condition:cond,description:censorContact(desc),
      image:images[0]||"", images:[...images],
      stock:+stock,allowsPickup,allowsDelivery,deliveryDays,
      shippingCost:freeShipping?0:(+shippingCost||0),freeShipping:!!freeShipping,
      merchantLoc:user.location||"Venezuela"
    };
    if(ep) {
      await saveProduct({...ep, ...data, active:+stock>0?ep.active:false});
      showT("Actualizado ✓");
    } else {
      const np = {id:uid(),merchantId:user.id,merchantName:user.storeName||user.name,merchantLoc:user.location||"Venezuela",active:true,views:0,questions:[],createdAt:new Date().toISOString(),...data};
      await saveProduct(np);
      showT("Publicado 🎉");
    }
    setSaving(false);
    nav("merchant-products");
  };
  const disc = salePrice&&price&&+salePrice<+price ? Math.round((1-+salePrice/+price)*100) : 0;

  return (
    <div style={{maxWidth:580,margin:"0 auto",padding:"20px 14px"}}>
      <button className="hop" onClick={()=>nav("merchant-products")} style={{...btn(C.light,C.muted),padding:"6px 12px",fontSize:12,marginBottom:16}}>← Volver</button>
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>{ep?"Editar":"Nuevo"} Producto</h1>
      <div style={{...card,padding:24,display:"flex",flexDirection:"column",gap:13}}>

        {/* Multi-image upload */}
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:4}}>📸 Fotos del producto <span style={{color:C.red}}>*</span></label>
          <div style={{fontSize:11,color:C.muted,marginBottom:9}}>La 1ª foto es el thumbnail de portada · ← → para reordenar · Máx. 8 fotos</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-start"}}>
            {images.map((img,i) => (
              <div key={i} style={{position:"relative",width:86,height:86,borderRadius:9,overflow:"hidden",border:`3px solid ${i===0?C.red:C.border}`,flexShrink:0,background:C.light}}>
                <img src={img} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                {i===0 && <div style={{position:"absolute",top:2,left:2,background:C.red,color:"#fff",fontSize:8,fontWeight:800,padding:"2px 5px",borderRadius:4,lineHeight:1}}>PORTADA</div>}
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.6)",display:"flex",justifyContent:"center",gap:0,padding:"3px 0"}}>
                  {i>0 && <button onClick={()=>moveImg(i,i-1)} style={{background:"none",border:"none",color:"#fff",fontSize:12,cursor:"pointer",padding:"0 6px",lineHeight:1}}>←</button>}
                  {i<images.length-1 && <button onClick={()=>moveImg(i,i+1)} style={{background:"none",border:"none",color:"#fff",fontSize:12,cursor:"pointer",padding:"0 6px",lineHeight:1}}>→</button>}
                  <button onClick={()=>removeImg(i)} style={{background:"none",border:"none",color:"#ff8888",fontSize:12,cursor:"pointer",padding:"0 6px",lineHeight:1}}>✕</button>
                </div>
              </div>
            ))}
            {images.length < 8 && (
              <label style={{width:86,height:86,borderRadius:9,background:C.light,border:`2px dashed ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:uploading?"wait":"pointer",gap:4,flexShrink:0}}>
                {uploading ? <><Spin/><span style={{fontSize:9,color:C.muted}}>Subiendo…</span></> : <><span style={{fontSize:24,lineHeight:1}}>＋</span><span style={{fontSize:10,color:C.muted,fontWeight:600}}>Foto</span></>}
                <input type="file" accept="image/*" multiple onChange={handleFiles} style={{display:"none"}} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Nombre del producto <span style={{color:C.red}}>*</span></label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: iPhone 14 Pro 256GB Negro" style={inp} />
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Precio USD <span style={{color:C.red}}>*</span></label>
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" style={inp} min="0" step="0.01" />
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Precio oferta (opcional)</label>
            <input type="number" value={salePrice} onChange={e=>setSalePrice(e.target.value)} placeholder="Menor al precio" style={inp} min="0" step="0.01" />
          </div>
        </div>
        {disc > 0 && <div style={{background:C.greenL,border:`1px solid ${C.green}22`,borderRadius:8,padding:"7px 11px",fontSize:12,color:C.green,fontWeight:700}}>✓ Descuento: -{disc}% · De {fU(+price)} a {fU(+salePrice)}</div>}
        {salePrice && +salePrice >= +price && price && <div style={{background:C.redL,borderRadius:8,padding:"7px 11px",fontSize:12,color:"#991B1B",fontWeight:600}}>⚠️ El precio de oferta debe ser menor al precio normal</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Categoría</label>
            <select value={cat} onChange={e=>setCat(e.target.value)} style={{...inp,cursor:"pointer"}}>
              {CATS.filter(c=>c!=="Todo").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Stock <span style={{color:C.red}}>*</span></label>
            <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="0" style={inp} min="0" />
          </div>
        </div>

        {stock=="0" && <div style={{background:C.amberL,borderRadius:8,padding:"7px 11px",fontSize:12,color:C.amber}}>⚠️ Con stock 0, la publicación se pausará automáticamente.</div>}

        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:7}}>Condición</label>
          <div style={{display:"flex",gap:8}}>
            {[["new","✨ Nuevo"],["used","Usado / Seminuevo"]].map(([v,l]) => (
              <div key={v} onClick={()=>setCond(v)}
                style={{flex:1,padding:"10px 12px",textAlign:"center",borderRadius:9,cursor:"pointer",border:`2px solid ${cond===v?C.red:C.border}`,background:cond===v?C.redL:"#fff",fontSize:13,fontWeight:cond===v?700:400,color:cond===v?C.red:C.text,transition:"all .15s"}}>{l}</div>
            ))}
          </div>
        </div>

        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Descripción</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Detalles, estado, especificaciones, qué incluye…" style={{...inp,minHeight:85,resize:"vertical",fontFamily:Fb}} />
        </div>

        {/* Delivery options — shipping cost is part of the delivery option */}
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:9}}>Opciones de Entrega</label>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>

            {/* ENVÍO A DOMICILIO */}
            <div style={{borderRadius:9,border:`2px solid ${allowsDelivery?C.green:C.border}`,background:allowsDelivery?C.greenL:"#fff",overflow:"hidden"}}>
              <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"10px 12px"}}>
                <input type="checkbox" checked={allowsDelivery} onChange={e=>setDelivery(e.target.checked)} style={{width:15,height:15,accentColor:C.green}} />
                <div><div style={{fontWeight:600,fontSize:13}}>🚚 Envío a domicilio</div><div style={{fontSize:11,color:C.muted}}>Envías el producto al comprador</div></div>
              </label>
              {allowsDelivery && (
                <div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:8}}>
                  <input value={deliveryDays} onChange={e=>setDays(e.target.value)} placeholder="Días de entrega (ej: 3-5)" style={{...inp,fontSize:12}} />
                  {/* Shipping cost inside delivery */}
                  <div style={{display:"flex",gap:8}}>
                    <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"8px 11px",borderRadius:8,border:`1.5px solid ${freeShipping?C.teal:C.border}`,background:freeShipping?"#fff":"transparent",flex:1}}>
                      <input type="checkbox" checked={freeShipping} onChange={e=>{setFreeShip(e.target.checked);if(e.target.checked)setShippingCost(0);}} style={{accentColor:C.teal}} />
                      <div style={{fontWeight:700,fontSize:12,color:C.teal}}>🚚 Envío GRATIS</div>
                    </label>
                  </div>
                  {!freeShipping && (
                    <div>
                      <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Costo de envío (USD) <span style={{color:C.red}}>*</span></label>
                      <input type="number" value={shippingCost} onChange={e=>setShippingCost(e.target.value)} placeholder="Ej: 5.00" style={{...inp,borderColor:!freeShipping&&(!shippingCost||+shippingCost<=0)?C.red:C.border}} min="0.01" step="0.01" />
                      {!freeShipping && (!shippingCost || +shippingCost <= 0) && (
                        <div style={{fontSize:11,color:C.red,marginTop:3,fontWeight:600}}>⚠️ Requerido: ingresa el costo o activa Envío GRATIS</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"10px 12px",borderRadius:9,border:`2px solid ${allowsPickup?C.navy:C.border}`,background:allowsPickup?C.navyL:"#fff"}}>
              <input type="checkbox" checked={allowsPickup} onChange={e=>setPickup(e.target.checked)} style={{width:15,height:15,accentColor:C.navy}} />
              <div><div style={{fontWeight:600,fontSize:13}}>🏪 Retiro en tienda</div><div style={{fontSize:11,color:C.muted}}>El comprador retira en {user?.location||"tu ciudad"}</div></div>
            </label>
          </div>
        </div>

        <button className="hop" onClick={handleSave} disabled={saving}
          style={{...btn(C.red),padding:"13px",width:"100%",justifyContent:"center",fontSize:15,opacity:saving?0.7:1,fontWeight:700,marginTop:4}}>
          {saving ? <><Spin />Guardando…</> : ep ? "Actualizar Producto ✓" : "Publicar Producto 🚀"}
        </button>
      </div>
    </div>
  );
}
