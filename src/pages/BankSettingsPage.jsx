import React, { useState } from "react"
import { C, Fh } from "../constants.js"
import { Spin, btn, inp, card } from "../components/ui.jsx"
import { MerchantShell } from "./merchant/Shell.jsx"

export function BankSettingsPage({ user, updateProfile, nav, showT }) {
  const mu = user;
  const [bank,         setBank]    = useState(mu?.bankData?.bank || "");
  const [account,      setAccount] = useState(mu?.bankData?.account || "");
  const [holder,       setHolder]  = useState(mu?.bankData?.accountHolder || "");
  const [rif,          setRif]     = useState(mu?.bankData?.rif || "");
  const [phone,        setPhone]   = useState(mu?.bankData?.phone || "");

  const [saving,       setSaving]  = useState(false);
  const [confirmed,    setConfirmed]= useState(false);

  const BANKS = ["Banesco","Mercantil","Provincial","Venezuela","Bicentenario","Tesoro","Activo","Sofitasa","Bancrecer","BFC","Del Sur","Exterior","Fondo Común","Industrial","Mi Banco","Otro"];

  const handle = async () => {
    if(!bank||!account||!holder||!rif) { showT("Completa todos los campos obligatorios",true); return; }
    if(!confirmed) { showT("Debes confirmar que los datos son correctos",true); return; }
    setSaving(true);
    const bankData = { bank, account, accountHolder:holder, rif, phone };
    await updateProfile({ bankData });
    setSaving(false);
    showT("Datos guardados ✓");
    nav("payouts");
  };

  return (
    <MerchantShell user={user} page="bank-settings" nav={nav}>
    <div style={{maxWidth:760}}>
      <button className="hop" onClick={()=>nav("payouts")} style={{...btn(C.light,C.muted),padding:"6px 12px",fontSize:12,marginBottom:16}}>← Mis Liquidaciones</button>
      <h1 style={{fontFamily:Fh,margin:"0 0 6px",fontSize:20,fontWeight:800}}>🏦 Cuenta Bancaria</h1>
      <p style={{color:C.muted,fontSize:13,margin:"0 0 18px"}}>Para recibir tus liquidaciones</p>

      <div style={{background:C.amberL,border:`1px solid ${C.amber}44`,borderRadius:10,padding:13,marginBottom:18,fontSize:12,color:C.amber,lineHeight:1.7}}>
        ⚠️ <strong>Importante:</strong> VendeYApp no se hace responsable por errores en el registro de datos bancarios. Verifica cuidadosamente que la información sea correcta antes de guardar. Las transferencias realizadas a cuentas incorrectas no son reversibles.
      </div>

      <div style={{...card,padding:22,display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Banco <span style={{color:C.red}}>*</span></label>
          <select value={bank} onChange={e=>setBank(e.target.value)} style={{...inp,cursor:"pointer"}}>
            <option value="">— Selecciona tu banco —</option>
            {BANKS.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Número de cuenta <span style={{color:C.red}}>*</span></label>
          <input value={account} onChange={e=>setAccount(e.target.value.replace(/\D/g,"").slice(0,20))}
            placeholder="0000-0000-0000-0000-0000" style={{...inp,fontFamily:"monospace",letterSpacing:1}} />
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>20 dígitos sin guiones</div>
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Titular de la cuenta <span style={{color:C.red}}>*</span></label>
          <input value={holder} onChange={e=>setHolder(e.target.value)} placeholder="Nombre completo como aparece en el banco" style={inp} />
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>RIF o Cédula <span style={{color:C.red}}>*</span></label>
          <input value={rif} onChange={e=>setRif(e.target.value)} placeholder="J-12345678-9 o V-12345678" style={inp} />
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Teléfono PagoMóvil (opcional)</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="04XX-XXXXXXX" style={inp} />
        </div>

        {/* Preview */}
        {bank && account && holder && (
          <div style={{background:C.navyL,borderRadius:9,padding:13,border:`1px solid ${C.navy}22`}}>
            <div style={{fontWeight:700,fontSize:12,color:C.navy,marginBottom:7}}>Vista previa · Así recibirás tus pagos:</div>
            <div style={{fontSize:12,lineHeight:2,color:C.text}}>
              🏦 <strong>{bank}</strong><br/>
              🔢 <span style={{fontFamily:"monospace"}}>{account}</span><br/>
              👤 <strong>{holder}</strong><br/>
              📋 {rif}
              {phone && <><br/>📱 {phone}</>}
            </div>
          </div>
        )}

        <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer",padding:"12px",borderRadius:9,border:`2px solid ${confirmed?C.green:C.border}`,background:confirmed?C.greenL:"#fff"}}>
          <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{width:16,height:16,accentColor:C.green,flexShrink:0,marginTop:1}} />
          <div style={{fontSize:12,lineHeight:1.6,color:C.text}}>
            <strong>Confirmo que los datos bancarios son correctos.</strong> Entiendo que VendeYApp no se hace responsable por transferencias realizadas a cuentas incorrectas por error en el registro.
          </div>
        </label>

        <button className="hop" onClick={handle} disabled={saving||!confirmed}
          style={{...btn(C.red),padding:"13px",width:"100%",justifyContent:"center",fontSize:14,opacity:(saving||!confirmed)?0.5:1,fontWeight:700}}>
          {saving?<><Spin/>Guardando…</>:"Guardar cuenta bancaria ✓"}
        </button>
      </div>
    </div>
    </MerchantShell>
  );
}
