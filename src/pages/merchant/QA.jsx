import React, { useState } from "react"
import { C, Fh, Fb } from "../../constants.js"
import { ago } from "../../utils.js"
import { Pill, Spin } from "../../components/ui.jsx"
import { censorContact } from "../../utils.js"
import { MerchantShell } from "./Shell.jsx"
import { btn, inp } from "../../components/ui.jsx"

export function MerchantQA({ user, products, nav, answerQ, showT }) {
  const [filter, setFilter] = useState("unanswered");
  const [drafts,  setDrafts] = useState({});
  const [saving,  setSaving] = useState({});

  const mine = products.filter(p => p.merchantId===user?.id);
  const allQs = mine.flatMap(p => (p.questions||[]).map(q => ({...q,productId:p.id,productName:p.name,productImage:p.image||p.images?.[0]})))
    .sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));

  const unanswered = allQs.filter(q=>!q.answer);
  const shown = filter==="unanswered" ? unanswered : filter==="answered" ? allQs.filter(q=>q.answer) : allQs;

  const doAnswer = async (productId, qId) => {
    const ans = (drafts[qId]||"").trim();
    if(!ans){ showT("Escribe una respuesta",true); return; }
    setSaving(s=>({...s,[qId]:true}));
    await answerQ(productId, qId, censorContact(ans));
    setDrafts(d=>({...d,[qId]:""}));
    setSaving(s=>({...s,[qId]:false}));
    showT("Respuesta publicada ✓");
  };

  return (
    <MerchantShell user={user} page="merchant-qa" nav={nav} pendingQA={unanswered.length}>
      <div style={{maxWidth:720}}>
        <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:18}}>
          <div style={{flex:1}}>
            <h1 style={{fontFamily:Fh,fontSize:"clamp(17px,3vw,20px)",fontWeight:800,margin:"0 0 2px"}}>❓ Preguntas de clientes</h1>
            <div style={{fontSize:12,color:unanswered.length?C.red:C.muted,fontWeight:unanswered.length?700:400}}>
              {unanswered.length ? `${unanswered.length} sin responder` : "Todo al día ✓"}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["unanswered","Sin responder"],["answered","Respondidas"],["all","Todas"]].map(([v,l]) => (
              <button key={v} onClick={()=>setFilter(v)}
                style={{fontSize:12,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${filter===v?C.navy:C.border}`,
                  background:filter===v?C.navy:"#fff",color:filter===v?"#fff":C.muted,cursor:"pointer",fontWeight:filter===v?700:400}}>
                {l}{v==="unanswered"&&unanswered.length?` (${unanswered.length})`:""}
              </button>
            ))}
          </div>
        </div>

        {shown.length===0 ? (
          <div style={{textAlign:"center",padding:"50px 20px",color:C.muted}}>
            <div style={{fontSize:44,marginBottom:10}}>💬</div>
            <div style={{fontWeight:700,fontSize:15}}>{filter==="unanswered"?"¡Todo respondido! 🎉":"Sin preguntas aún"}</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {shown.map(q => (
              <div key={q.id} style={{...{background:"#fff",borderRadius:12,boxShadow:"0 1px 8px rgba(0,0,0,.07)",border:`1px solid ${C.border}`},padding:16,border:!q.answer?`2px solid ${C.amber}44`:`1px solid ${C.border}`}}>
                <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:10,paddingBottom:9,borderBottom:`1px solid ${C.border}`}}>
                  {q.productImage && <img src={q.productImage} style={{width:36,height:36,borderRadius:7,objectFit:"cover",flexShrink:0,cursor:"pointer"}} onClick={()=>nav("product",{productId:q.productId})} />}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}} onClick={()=>nav("product",{productId:q.productId})}>{q.productName}</div>
                    <div style={{fontSize:10,color:C.muted}}>{new Date(q.createdAt).toLocaleDateString("es-VE",{day:"numeric",month:"short"})}</div>
                  </div>
                  <Pill label={q.answer?"Respondida ✓":"Sin responder"} c={q.answer?C.green:C.amber} sx={{fontSize:9}} />
                </div>
                <div style={{display:"flex",gap:9,marginBottom:q.answer?9:11}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:C.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>👤</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{q.buyerName}</div>
                    <div style={{fontSize:13,lineHeight:1.55,color:C.text}}>{q.question}</div>
                  </div>
                </div>
                {q.answer ? (
                  <div style={{display:"flex",gap:9,background:C.greenL,borderRadius:9,padding:"10px 12px",border:`1px solid ${C.green}22`}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,color:"#fff"}}>🏪</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:C.green,fontWeight:700,marginBottom:3}}>Tu respuesta</div>
                      <div style={{fontSize:13,lineHeight:1.55}}>{q.answer}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                    <textarea value={drafts[q.id]||""} onChange={e=>setDrafts(d=>({...d,[q.id]:e.target.value}))}
                      placeholder="Escribe tu respuesta…"
                      rows={2}
                      style={{flex:1,padding:"9px 11px",borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:13,resize:"vertical",fontFamily:Fb,outline:"none",lineHeight:1.5}} />
                    <button onClick={()=>doAnswer(q.productId,q.id)} disabled={saving[q.id]}
                      style={{...btn(C.navy),padding:"9px 14px",fontSize:12,flexShrink:0,opacity:saving[q.id]?0.6:1}}>
                      {saving[q.id]?<Spin/>:"Responder →"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MerchantShell>
  );
}
