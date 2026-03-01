import React, { useState } from "react"
import { C, Fh } from "../constants.js"
import { fU, fD } from "../utils.js"
import { Spin, btn, inp, card } from "../components/ui.jsx"
import { MerchantShell } from "./merchant/Shell.jsx"

export function PayoutsPage({ user, users, orders, nav, requestPayout, payReqs, setPayReqs, appCfg }) {
  const [amount,    setAmount]   = useState("");
  const [requesting,setRequesting]=useState(false);
  const mu = users?.find(u=>u.id===user?.id)||user;
  const walletBalance = mu?.walletBalance||0;
  const myReqs = (payReqs||[]).filter(r=>r.merchantId===user?.id).sort((a,b)=>new Date(b.requestedAt)-new Date(a.requestedAt));
  const pendingReqs = myReqs.filter(r=>r.status==="pending");
  const paidReqs    = myReqs.filter(r=>r.status==="paid");

  const handle = async () => {
    const a = +amount;
    if(!a || a <= 0 || a > walletBalance) return;
    setRequesting(true);
    await requestPayout(a);
    setAmount("");
    const updated = await (async()=>{try{const r=await window.storage?.get("v5_preqs");return r?.value?JSON.parse(r.value):[];}catch{return [];}})();
    if(setPayReqs) setPayReqs(updated);
    setRequesting(false);
  };

  return (
    <MerchantShell user={user} page="payouts" nav={nav}>
    <div style={{maxWidth:760}}>
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>💸 Mis Liquidaciones</h1>

      {/* Wallet balance card */}
      <div style={{...card,padding:22,marginBottom:16,background:`linear-gradient(135deg,${C.navy},${C.navyD})`,border:"none"}}>
        <div style={{color:"rgba(255,255,255,.6)",fontSize:12,marginBottom:6}}>Saldo disponible en tu bolsa</div>
        <div style={{fontFamily:Fh,fontWeight:900,fontSize:36,color:"#fff",marginBottom:4}}>{fU(walletBalance)}</div>
        <div style={{color:"rgba(255,255,255,.55)",fontSize:11}}>Ganancias netas acumuladas (ya descontada comisión VendeYApp)</div>
      </div>

      {/* Bank info */}
      {mu?.bankData?.bank ? (
        <div style={{...card,padding:14,marginBottom:14,border:`2px solid ${C.green}33`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontWeight:700,fontSize:13}}>🏦 Cuenta de destino</span>
            <button className="hop" onClick={()=>nav("bank-settings")} style={{...btn(C.light,C.muted),padding:"4px 10px",fontSize:11}}>Editar</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,fontSize:12}}>
            <div><span style={{color:C.muted}}>Banco: </span><strong>{mu.bankData.bank}</strong></div>
            <div><span style={{color:C.muted}}>Titular: </span><strong>{mu.bankData.accountHolder}</strong></div>
            <div style={{gridColumn:"span 2"}}><span style={{color:C.muted}}>Cuenta: </span><strong style={{fontFamily:"monospace"}}>{mu.bankData.account}</strong></div>
          </div>
        </div>
      ) : (
        <div style={{background:C.amberL,border:`1px solid ${C.amber}44`,borderRadius:10,padding:13,marginBottom:14,display:"flex",gap:9,alignItems:"center"}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13}}>Registra tu cuenta bancaria</div>
            <div style={{fontSize:12,color:C.muted}}>Sin cuenta registrada no podemos procesar tu liquidación.</div>
          </div>
          <button className="hop" onClick={()=>nav("bank-settings")} style={{...btn(C.amber,"#fff"),padding:"8px 14px",fontSize:12,flexShrink:0}}>Registrar →</button>
        </div>
      )}

      {/* Request payout form */}
      {walletBalance > 0 && mu?.bankData?.bank && !pendingReqs.length && (
        <div style={{...card,padding:18,marginBottom:16}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 13px",fontSize:15,fontWeight:800}}>Solicitar liquidación</h3>
          <div style={{background:C.amberL,borderRadius:8,padding:"9px 12px",fontSize:12,color:C.amber,marginBottom:12,lineHeight:1.55}}>
            ⏱ Las liquidaciones se procesan en <strong>48-72 horas hábiles</strong> desde tu solicitud.
          </div>
          <div style={{display:"flex",gap:9,alignItems:"flex-end"}}>
            <div style={{flex:1}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:5}}>Monto a liquidar (USD)</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Máx: ${fU(walletBalance)}`}
                min="1" max={walletBalance} step="0.01" style={inp} />
            </div>
            <button className="hop" onClick={handle} disabled={requesting||!amount||+amount<=0||+amount>walletBalance}
              style={{...btn(C.red),padding:"10px 16px",fontSize:13,flexShrink:0,opacity:(requesting||!amount||+amount>walletBalance)?0.5:1}}>
              {requesting?<><Spin/>Enviando…</>:"Solicitar 💸"}
            </button>
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:7}}>Monto mínimo: <strong>{fU(appCfg?.minPayout||10)}</strong> · Puedes solicitar el saldo completo o parcial.</div>
        </div>
      )}

      {/* Already has pending - show message */}
      {pendingReqs.length > 0 && walletBalance > 0 && mu?.bankData?.bank && (
        <div style={{background:C.amberL,border:`1px solid ${C.amber}44`,borderRadius:10,padding:13,marginBottom:14,fontSize:12,color:C.amber,display:"flex",gap:8,alignItems:"center"}}>
          <span>⏳</span>
          <div>Ya tienes una solicitud en proceso. Podrás hacer otra cuando sea completada.<br/><strong>Saldo reservado: {fU(pendingReqs[0].amount)}</strong></div>
        </div>
      )}

      {/* Pending requests */}
      {pendingReqs.length > 0 && (
        <div style={{marginBottom:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 10px",fontSize:14,fontWeight:800}}>En proceso ({pendingReqs.length})</h3>
          {pendingReqs.map(r => (
            <div key={r.id} style={{...card,padding:14,marginBottom:8,border:`2px solid ${C.amber}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:7}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>{fD(r.requestedAt)}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>⏳ En revisión · 48-72h hábiles</div>
                </div>
                <span style={{fontFamily:Fh,fontWeight:900,fontSize:17,color:C.amber}}>{fU(r.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {paidReqs.length > 0 && (
        <div>
          <h3 style={{fontFamily:Fh,margin:"0 0 10px",fontSize:14,fontWeight:800}}>Completadas ({paidReqs.length})</h3>
          {paidReqs.map(r => (
            <div key={r.id} style={{...card,padding:13,marginBottom:7,opacity:0.82}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700}}>{fD(r.processedAt||r.requestedAt)}</div>
                  <div style={{fontSize:11,color:C.muted}}>✅ Transferido a {mu?.bankData?.bank}</div>
                </div>
                <span style={{fontFamily:Fh,fontWeight:800,color:C.green,fontSize:15}}>{fU(r.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!walletBalance && !myReqs.length && (
        <div style={{textAlign:"center",padding:40,color:C.muted}}><div style={{fontSize:44}}>💸</div><div style={{marginTop:10,fontWeight:600}}>Tu bolsa está vacía</div><div style={{fontSize:12,marginTop:5}}>Los fondos se acumulan al confirmar entregas</div></div>
      )}
    </div>
    </MerchantShell>
  );
}
