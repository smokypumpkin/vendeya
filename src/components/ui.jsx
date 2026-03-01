import React, { useState, useRef, useEffect } from "react"
import { C, Fb, Fh, STATES } from "../constants.js"

/* ═══════════════════════════════════════════════
   MICRO UI COMPONENTS
═══════════════════════════════════════════════ */
export function Stars({ v=0, size=14, onChange }) {
  const [h, setH] = useState(0);
  return (
    <span style={{display:"inline-flex",gap:1}}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          style={{fontSize:size,cursor:onChange?"pointer":"default",color:(h||v)>=i?"#F59E0B":"#D1D5DB"}}
          onMouseEnter={() => onChange && setH(i)}
          onMouseLeave={() => onChange && setH(0)}
          onClick={() => onChange && onChange(i)}>★</span>
      ))}
    </span>
  );
}

export function Pill({ label, c=C.red, bg, icon, sx={}, solid=false }) {
  return (
    <span style={{
      background: bg || (solid ? c : c+"22"),
      color: solid ? "#fff" : c,
      fontSize:11, fontWeight:700,
      padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap",
      display:"inline-flex", alignItems:"center", gap:4,
      border: solid ? "none" : `1px solid ${c}33`,
      boxShadow:"0 1px 3px rgba(0,0,0,.2)",
      ...sx
    }}>
      {icon && <span>{icon}</span>}{label}
    </span>
  );
}

export function HR() { return <div style={{height:1,background:C.border,margin:"12px 0"}} />; }

export function Spin({ dark, size=16 }) {
  return (
    <div style={{
      width:size,height:size,
      border:`2px solid ${dark?"rgba(0,0,0,.12)":"rgba(255,255,255,.25)"}`,
      borderTopColor:dark?C.navy:"#fff",
      borderRadius:"50%",animation:"vy-spin .7s linear infinite",flexShrink:0
    }} />
  );
}

export function Img({ src, alt="" }) {
  const [err, setErr] = useState(false);
  const [ok,  setOk]  = useState(false);
  if(err||!src) return (
    <div style={{width:"100%",height:"100%",background:C.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:C.muted}}>📷</div>
  );
  return (
    <div style={{width:"100%",height:"100%",background:C.light,position:"relative"}}>
      {!ok && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><Spin dark size={20} /></div>}
      <img src={src} alt={alt}
        style={{width:"100%",height:"100%",objectFit:"cover",opacity:ok?1:0,transition:"opacity .3s"}}
        onLoad={() => setOk(true)}
        onError={() => setErr(true)}
        loading="lazy" />
    </div>
  );
}

/* Location Picker */
export function LocationPicker({ value, onChange, placeholder="📍 Seleccionar ciudad" }) {
  const [open, setOpen]   = useState(false);
  const [st,   setSt]     = useState("");
  const [filt, setFilt]   = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return () => document.removeEventListener("mousedown",h);
  },[]);
  const filtered = STATES.filter(s =>
    !filt || s.s.toLowerCase().includes(filt.toLowerCase()) ||
    s.cs.some(c => c.toLowerCase().includes(filt.toLowerCase()))
  );
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button type="button" onClick={() => setOpen(v=>!v)}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontFamily:Fb,color:value?C.text:C.muted,background:"#fff",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{value||placeholder}</span><span style={{color:C.muted}}>▾</span>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:500,maxHeight:300,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"8px 10px",borderBottom:`1px solid ${C.border}`}}>
            <input autoFocus value={filt} onChange={e=>setFilt(e.target.value)} placeholder="Buscar ciudad o estado…"
              style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",fontSize:12,fontFamily:Fb,outline:"none",boxSizing:"border-box"}} />
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {filtered.map(s => (
              <div key={s.s}>
                <div style={{padding:"5px 12px 3px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:.5,background:C.light,borderBottom:`1px solid ${C.border}`}}>{s.s}</div>
                {s.cs.filter(c => !filt || c.toLowerCase().includes(filt.toLowerCase()) || s.s.toLowerCase().includes(filt.toLowerCase())).map(c => {
                  const full = `${c}, ${s.s}`;
                  return (
                    <div key={full} onClick={() => { onChange(full); setOpen(false); setFilt(""); setSt(""); }}
                      style={{padding:"8px 16px",cursor:"pointer",fontSize:13,color:value===full?C.red:C.text,fontWeight:value===full?700:400,background:value===full?C.redL:"#fff"}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.light}
                      onMouseLeave={e=>e.currentTarget.style.background=value===full?C.redL:"#fff"}>
                      {c}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Countdown timer for payment */
export function Countdown({ deadline, onExpire }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => {
      const rem = new Date(deadline) - Date.now();
      if(rem <= 0) { setLeft(0); onExpire && onExpire(); }
      else setLeft(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  if(left <= 0) return <span style={{color:C.red,fontWeight:700}}>Tiempo agotado</span>;
  const m = String(~~(left/60000)).padStart(2,"0");
  const s = String(~~(left/1000)%60).padStart(2,"0");
  const urgent = left < 120000;
  return (
    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:15,color:urgent?C.red:C.amber,display:"inline-flex",alignItems:"center",gap:5}}>
      ⏱ {m}:{s}
    </span>
  );
}

export const btn = (bg=C.red, co="#fff") => ({
  background:bg,color:co,border:"none",borderRadius:8,
  padding:"9px 16px",fontSize:13,fontWeight:600,cursor:"pointer",
  fontFamily:Fb,display:"inline-flex",alignItems:"center",gap:5,
  transition:"opacity .15s",lineHeight:1.3
});
export const inp = {
  width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,
  borderRadius:8,fontSize:13,fontFamily:Fb,color:C.text,background:"#fff",
  outline:"none",boxSizing:"border-box"
};
export const card = {
  background:C.white,borderRadius:12,border:`1px solid ${C.border}`,
  boxShadow:"0 1px 6px rgba(0,0,0,.05)"
};
