import React from "react"
import { C, Fh } from "../../constants.js"
import { btn } from "../../components/ui.jsx"

export const M_NAV = [
  {icon:"🏠",label:"Dashboard",    pg:"merchant-dash"},
  {icon:"🛍️",label:"Productos",    pg:"merchant-products"},
  {icon:"📋",label:"Pedidos",      pg:"merchant-orders"},
  {icon:"❓",label:"Preguntas",    pg:"merchant-qa"},
  {icon:"📊",label:"Analytics",   pg:"merchant-analytics"},
  {icon:"💸",label:"Liquidaciones",pg:"payouts"},
  {icon:"🏦",label:"Cuenta Bancaria",pg:"bank-settings"},
];

export function MerchantShell({ user, page, nav, children, pendingQA=0 }) {
  const SideLink = ({item}) => {
    const active = page===item.pg;
    const badge = item.pg==="merchant-qa" && pendingQA > 0;
    return (
      <button onClick={()=>nav(item.pg)}
        style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",borderRadius:9,border:"none",cursor:"pointer",width:"100%",textAlign:"left",
          background:active?"rgba(255,255,255,.13)":"transparent",
          color:active?"#fff":"rgba(255,255,255,.58)",
          fontWeight:active?700:400,fontSize:13,transition:"all .15s",position:"relative"}}>
        <span style={{fontSize:17,flexShrink:0}}>{item.icon}</span>
        <span style={{flex:1}}>{item.label}</span>
        {badge && <span style={{background:C.red,color:"#fff",fontSize:9,fontWeight:800,minWidth:16,height:16,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{pendingQA}</span>}
      </button>
    );
  };
  const TabLink = ({item}) => {
    const active = page===item.pg;
    const badge = item.pg==="merchant-qa" && pendingQA > 0;
    return (
      <button onClick={()=>nav(item.pg)}
        style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 10px",border:"none",cursor:"pointer",flexShrink:0,
          background:active?"rgba(255,255,255,.12)":"transparent",
          color:active?"#fff":"rgba(255,255,255,.5)",fontSize:10,fontWeight:active?700:400,position:"relative"}}>
        <span style={{fontSize:16}}>{item.icon}</span>
        <span style={{whiteSpace:"nowrap"}}>{item.label}</span>
        {badge && <span style={{position:"absolute",top:4,right:6,background:C.red,color:"#fff",fontSize:8,fontWeight:800,width:13,height:13,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{pendingQA}</span>}
      </button>
    );
  };
  return (
    <>
      {/* Mobile tab bar */}
      <div className="merchant-tab-bar">
        {M_NAV.map(item => <TabLink key={item.pg} item={item} />)}
      </div>
      {/* Layout container */}
      <div className="merchant-layout">
        {/* Desktop sidebar */}
        <div className="merchant-sidebar">
          {/* Store identity */}
          <div style={{padding:"10px 8px 14px",borderBottom:"1px solid rgba(255,255,255,.07)",marginBottom:6}}>
            <div style={{width:40,height:40,borderRadius:10,overflow:"hidden",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",marginBottom:8,fontFamily:Fh}}>
              {user?.storeLogo ? <img src={user.storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : user?.storeName?.[0]||"🏪"}
            </div>
            <div style={{fontWeight:700,fontSize:13,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.storeName}</div>
            {user?.merchantVerified && <div style={{fontSize:10,color:"#34D399",marginTop:2,fontWeight:600}}>✓ Verificado</div>}
          </div>
          {M_NAV.map(item => <SideLink key={item.pg} item={item} />)}
        </div>
        {/* Content area */}
        <div className="merchant-content">
          {children}
        </div>
      </div>
    </>
  );
}
