import React, { useState } from "react"
import { C, Fh } from "../../constants.js"
import { Spin, btn, inp, card } from "../../components/ui.jsx"

export function AdminConfig({ appCfg, setAppCfg, showT }) {
  const [minPayout, setMinPayout] = useState(appCfg?.minPayout||10);
  const [feePct,    setFeePct]    = useState(((appCfg?.platformFee||0.03)*100).toFixed(1));
  const [saving,    setSaving]    = useState(false);

  const save = async () => {
    setSaving(true);
    const cfg = {minPayout:+minPayout, platformFee:+(+feePct/100).toFixed(4)};
    await setAppCfg(cfg);  // routes through actions.updateAppCfg
    setSaving(false);
    showT("Configuración guardada ✓");
  };

  return (
    <div style={{maxWidth:480}}>
      <h3 style={{fontFamily:Fh,margin:"0 0 16px",fontSize:14,fontWeight:800}}>⚙️ Configuración del Sistema</h3>
      <div style={{...card,padding:20,display:"flex",flexDirection:"column",gap:13}}>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Monto mínimo de liquidación (USD)</label>
          <input type="number" value={minPayout} onChange={e=>setMinPayout(e.target.value)} min="1" step="1"
            style={inp} />
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>Los vendedores no podrán solicitar montos menores a este.</div>
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Comisión de plataforma (%)</label>
          <input type="number" value={feePct} onChange={e=>setFeePct(e.target.value)} min="0" max="30" step="0.1"
            style={inp} />
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>Porcentaje descontado de cada venta al vendedor.</div>
        </div>
        <button className="hop" onClick={save} disabled={saving}
          style={{...btn(C.red),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>
          {saving?<><Spin/>Guardando…</>:"Guardar cambios ✓"}
        </button>
      </div>
    </div>
  );
}
