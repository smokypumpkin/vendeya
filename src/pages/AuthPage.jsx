import React, { useState } from "react"
import { C, Fh, Fb } from "../constants.js"
import { gC } from "../utils.js"
import { compressImg } from "../utils.js"
import { Spin, LocationPicker, btn, inp, card } from "../components/ui.jsx"
import { useDocTitle, useMeta } from "../components/SmartSearch.jsx"

export function AuthPage({ login,register,verifyEmail,nav,initMode="login",params={} }) {
  useDocTitle(initMode==="login"?"Iniciar sesión":"Crear cuenta");
  useMeta("Inicia sesión o crea tu cuenta en VendeYApp. Compra y vende en Venezuela de forma segura.");
  const [isLogin, setIsLogin] = useState(initMode==="login");
  const [role,    setRole]    = useState("buyer");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [storeN,   setStoreN]   = useState("");
  const [storeD,   setStoreD]   = useState("");
  const [storeLogo,setStoreLogo]= useState("");
  const [logoUpl,  setLogoUpl]  = useState(false);
  const [location,setLocation]= useState("");
  const [bankData,setBankData]= useState({bank:"",account:"",rif:"",phone:"",accountHolder:""});
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [vs,      setVs]      = useState(null);
  const [code,    setCode]    = useState("");
  const [codeErr, setCodeErr] = useState("");

  const handle = async () => {
    setErr(""); setLoading(true);
    await new Promise(r => setTimeout(r,500));
    if(isLogin) {
      const r = await login(email,pw);
      if(r?.error==="not_verified") { const c=gC(); setVs({userId:r.userId,code:c,email}); setLoading(false); return; }
      if(r?.error) { setErr(r.error); setLoading(false); return; }
      const ret = params?.returnTo;
      const retParams = params?.returnToParams || {};
      nav(ret ? ret : r.user.role==="admin"?"admin":r.user.role==="merchant"?"merchant-dash":"landing",
          {...retParams, ...(params?.pendingFav ? {pendingFav:params.pendingFav} : {})});
    } else {
      if(!name||!email||!pw||!location) { setErr("Completa todos los campos."); setLoading(false); return; }
      const r = await register({name,email,password:pw,role,location,...(role==="merchant"?{storeName:storeN||`${name} Store`,storeDesc:storeD,storeLogo,bankData}:{storeName:"",storeDesc:""})});
      if(r.error) { setErr(r.error); setLoading(false); return; }
      if(!r.user) { setErr("Error al crear cuenta. Intenta de nuevo."); setLoading(false); return; }
      const c = gC(); setVs({userId:r.user.id,code:c,email});
    }
    setLoading(false);
  };
  const handleVerify = async () => {
    setCodeErr("");
    if(code!==vs.code) { setCodeErr("Código incorrecto."); return; }
    await verifyEmail(vs.userId);
    nav("landing");
  };

  if(vs) return (
    <div style={{maxWidth:380,margin:"40px auto",padding:"0 16px"}}>
      <div style={{...card,padding:28,textAlign:"center"}}>
        <div style={{width:62,height:62,borderRadius:18,background:C.red+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>📧</div>
        <h2 style={{fontFamily:Fh,margin:"0 0 7px",fontSize:19,fontWeight:800}}>Verifica tu correo</h2>
        <p style={{color:C.muted,fontSize:12,margin:"0 0 18px",lineHeight:1.65}}>Enviamos un código a <strong>{vs.email}</strong></p>
        <div style={{background:C.gold+"18",border:`1px solid ${C.gold}44`,borderRadius:9,padding:"11px 14px",marginBottom:18}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Código demo:</div>
          <div style={{fontFamily:"monospace",fontWeight:900,fontSize:28,letterSpacing:6,color:C.red}}>{vs.code}</div>
        </div>
        <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}
          style={{...inp,textAlign:"center",letterSpacing:6,fontSize:24,fontFamily:"monospace",marginBottom:9,fontWeight:700}} />
        {codeErr && <div style={{color:"#991B1B",fontSize:12,marginBottom:9}}>⚠️ {codeErr}</div>}
        <button className="hop" onClick={handleVerify} style={{...btn(C.red),padding:"12px",width:"100%",justifyContent:"center",fontSize:14,fontWeight:700}}>✓ Verificar y entrar</button>
        <p style={{fontSize:12,color:C.muted,marginTop:12}}><span style={{cursor:"pointer",color:C.red,fontWeight:600}} onClick={()=>setVs(p=>({...p,code:gC()}))}>Reenviar código</span></p>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:420,margin:"30px auto",padding:"0 16px"}}>
      <div style={{...card,padding:24}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:Fh,fontWeight:900,fontSize:22,marginBottom:3}}>VendeY<span style={{color:C.red}}>App</span></div>
          <h2 style={{fontFamily:Fh,margin:"0 0 3px",fontSize:17,fontWeight:800}}>{isLogin?"Bienvenido":"Crea tu cuenta"}</h2>
          <p style={{color:C.muted,fontSize:12,margin:0}}>Marketplace seguro · Venezuela</p>
        </div>

        {!isLogin && (
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[["buyer","🛒","Comprador"],["merchant","🏪","Vendedor"]].map(([r,ic,l]) => (
              <div key={r} onClick={()=>setRole(r)}
                style={{flex:1,padding:11,textAlign:"center",borderRadius:10,cursor:"pointer",border:`2px solid ${role===r?C.red:C.border}`,background:role===r?C.redL:"#fff",transition:"all .15s"}}>
                <div style={{fontSize:22,marginBottom:3}}>{ic}</div>
                <div style={{fontSize:12,fontWeight:700,color:role===r?C.red:C.text}}>{l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {!isLogin && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo *" style={inp} />}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo electrónico *" style={inp} />
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Contraseña *" style={inp} />
          {!isLogin && <LocationPicker value={location} onChange={setLocation} placeholder="📍 Tu ciudad *" />}
          {!isLogin && role==="merchant" && (
            <>
              {/* Store logo */}
              <div style={{display:"flex",gap:11,alignItems:"center",padding:"10px 12px",background:C.light,borderRadius:9}}>
                <div style={{width:52,height:52,borderRadius:10,overflow:"hidden",background:C.border,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                  {storeLogo ? <img src={storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : "🏪"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>Logo de tu tienda (opcional)</div>
                  <label style={{...btn(C.light,C.muted),padding:"5px 10px",fontSize:11,cursor:"pointer",display:"inline-flex",gap:5,alignItems:"center"}}>
                    {logoUpl ? <><Spin/>Subiendo…</> : storeLogo ? "Cambiar logo" : "📷 Subir logo"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setLogoUpl(true);const b=await compressImg(f,300);if(b)setStoreLogo(b);setLogoUpl(false);}} />
                  </label>
                </div>
              </div>
              <input value={storeN} onChange={e=>setStoreN(e.target.value)} placeholder="Nombre de tu tienda" style={inp} />
              <textarea value={storeD} onChange={e=>setStoreD(e.target.value)} placeholder="Descripción de tu tienda…" style={{...inp,minHeight:60,resize:"vertical",fontFamily:Fb}} />
              <div style={{background:C.navyL,borderRadius:9,padding:11,fontSize:12,color:C.navy}}>
                <div style={{fontWeight:700,marginBottom:8}}>💸 Datos bancarios para liquidaciones</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  <input value={bankData.bank} onChange={e=>setBankData(p=>({...p,bank:e.target.value}))} placeholder="Banco (ej: Banesco, Mercantil…)" style={inp} />
                  <input value={bankData.account} onChange={e=>setBankData(p=>({...p,account:e.target.value}))} placeholder="Número de cuenta" style={inp} />
                  <input value={bankData.accountHolder} onChange={e=>setBankData(p=>({...p,accountHolder:e.target.value}))} placeholder="Titular de la cuenta" style={inp} />
                  <input value={bankData.rif} onChange={e=>setBankData(p=>({...p,rif:e.target.value}))} placeholder="RIF o Cédula" style={inp} />
                  <input value={bankData.phone} onChange={e=>setBankData(p=>({...p,phone:e.target.value}))} placeholder="Teléfono PagoMóvil" style={inp} />
                </div>
              </div>
            </>
          )}
        </div>

        {err && <div style={{background:C.redL,color:"#991B1B",borderRadius:7,padding:"8px 12px",fontSize:12,marginTop:9}}>⚠️ {err}</div>}



        <button className="hop" onClick={handle} disabled={loading}
          style={{...btn(C.red),padding:"12px",width:"100%",marginTop:13,fontSize:14,justifyContent:"center",opacity:loading?0.7:1,fontWeight:700}}>
          {loading ? <><Spin />Procesando…</> : isLogin ? "Ingresar →" : role==="merchant" ? "Crear mi tienda 🚀" : "Registrarme 🚀"}
        </button>
        <p style={{textAlign:"center",marginTop:11,fontSize:12,color:C.muted}}>
          {isLogin?"¿Sin cuenta? ":"¿Ya tienes cuenta? "}
          <span onClick={()=>setIsLogin(v=>!v)} style={{color:C.red,fontWeight:600,cursor:"pointer"}}>{isLogin?"Regístrate gratis":"Ingresar"}</span>
        </p>
      </div>
    </div>
  );
}
