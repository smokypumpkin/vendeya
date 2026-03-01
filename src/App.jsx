/**
 * App.jsx — VendeYApp UI Root (slim router)
 * State: store/index.jsx | Logic: hooks/useActions.jsx | API: api/index.jsx
 */
import { useState, useEffect, useCallback } from "react"
import { lazy, Suspense } from "react"
import { useAppState, useToast } from "./store/index.jsx"
import { useActions } from "./hooks/useActions.jsx"

import { C, Fh, Fb, PAY, APP_NAME, APP_URL, APP_DESC, APP_LOGO } from "./constants.js"
import { uid, censorContact } from "./utils.js"
import { Spin, btn } from "./components/ui.jsx"
import { useSchema } from "./components/SmartSearch.jsx"
import { Header } from "./components/Header.jsx"

const LandingPage = lazy(() => import("./pages/LandingPage.jsx").then(m => ({ default: m.LandingPage })))
const BrowsePage = lazy(() => import("./pages/BrowsePage.jsx").then(m => ({ default: m.BrowsePage })))
const ProductPage = lazy(() => import("./pages/ProductPage.jsx").then(m => ({ default: m.ProductPage })))
const MerchantProfile = lazy(() => import("./pages/MerchantProfile.jsx").then(m => ({ default: m.MerchantProfile })))
const CartPage = lazy(() => import("./pages/CartPage.jsx").then(m => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.jsx").then(m => ({ default: m.CheckoutPage })))
const AuthPage = lazy(() => import("./pages/AuthPage.jsx").then(m => ({ default: m.AuthPage })))
const FavoritesPage = lazy(() => import("./pages/FavoritesPage.jsx").then(m => ({ default: m.FavoritesPage })))
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage.jsx").then(m => ({ default: m.MyOrdersPage })))
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage.jsx").then(m => ({ default: m.OrderDetailPage })))
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.jsx").then(m => ({ default: m.NotificationsPage })))
const MerchantDash = lazy(() => import("./pages/merchant/Dash.jsx").then(m => ({ default: m.MerchantDash })))
const MerchantProducts = lazy(() => import("./pages/merchant/Products.jsx").then(m => ({ default: m.MerchantProducts })))
const MerchantAddEdit = lazy(() => import("./pages/merchant/AddEdit.jsx").then(m => ({ default: m.MerchantAddEdit })))
const MerchantOrders = lazy(() => import("./pages/merchant/Orders.jsx").then(m => ({ default: m.MerchantOrders })))
const MerchantAnalytics = lazy(() => import("./pages/merchant/Analytics.jsx").then(m => ({ default: m.MerchantAnalytics })))
const MerchantQA = lazy(() => import("./pages/merchant/QA.jsx").then(m => ({ default: m.MerchantQA })))
const PayoutsPage = lazy(() => import("./pages/PayoutsPage.jsx").then(m => ({ default: m.PayoutsPage })))
const BankSettingsPage = lazy(() => import("./pages/BankSettingsPage.jsx").then(m => ({ default: m.BankSettingsPage })))
const AdminPanel = lazy(() => import("./pages/admin/Panel.jsx").then(m => ({ default: m.AdminPanel })))

const ROUTES = new Set([
  "landing", "browse", "product", "merchant-profile", "cart", "checkout", "login", "register",
  "favorites", "my-orders", "order-detail", "notifications", "merchant-dash", "merchant-products",
  "merchant-add", "merchant-orders", "merchant-analytics", "merchant-qa", "payouts", "bank-settings", "admin",
])

const parseUrlState = () => {
  const slug = window.location.pathname.replace(/^\/+/, "").split("/")[0] || "landing"
  const page = ROUTES.has(slug) ? slug : "landing"
  const params = {}
  const qs = new URLSearchParams(window.location.search)
  qs.forEach((value, key) => {
    params[key] = value
  })
  return { pg: page, ps: params }
}

const toUrl = (pg, ps = {}) => {
  if (pg === "landing") return "/"
  const qs = new URLSearchParams()
  Object.entries(ps || {}).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") qs.set(key, String(val))
  })
  const suffix = qs.toString()
  return suffix ? `/${pg}?${suffix}` : `/${pg}`
}

function SchemaBase() {
  useSchema([
    {
      "@context":"https://schema.org",
      "@type":"WebSite",
      "name":APP_NAME,
      "url":APP_URL,
      "description":APP_DESC,
      "inLanguage":"es-VE",
      "potentialAction":{
        "@type":"SearchAction",
        "target":{"@type":"EntryPoint","urlTemplate":APP_URL+"/browse?search={search_term_string}"},
        "query-input":"required name=search_term_string"
      }
    },
    {
      "@context":"https://schema.org",
      "@type":"Organization",
      "name":APP_NAME,
      "url":APP_URL,
      "logo":APP_LOGO,
      "description":APP_DESC,
      "foundingLocation":{"@type":"Place","name":"Caracas, Venezuela"},
      "areaServed":{"@type":"Country","name":"Venezuela"},
      "contactPoint":{"@type":"ContactPoint","contactType":"customer service","availableLanguage":"Spanish"}
    }
  ]);
  return null;
}

export default function App() {
  const { ready, user, profiles, products, orders, reviews, notifs, favs, payReqs, appCfg, rate, cart, toast } = useAppState()
  const showT   = useToast()
  const actions = useActions()

  const [page,      setPage]      = useState(() => parseUrlState().pg)
  const [params,    setParams]    = useState(() => parseUrlState().ps)
  const [rateLabel, setRateLabel] = useState("BCV")

  // Fetch BCV rate label
  useEffect(() => {
    const APIS = [
      async () => { const r = await fetch("https://ve.dolarapi.com/v1/dolares/oficial",{cache:"no-store"}); const d = await r.json(); return d?.promedio??d?.tasa??d?.precio },
      async () => { const r = await fetch("https://pydolarve.org/api/v1/dollar?page=bcv&monitor=usd",{cache:"no-store"}); const d = await r.json(); return d?.price??d?.data?.price },
    ]
    for(const api of APIS)(async()=>{ try{ const v=await api(); if(v&&+v>30) setRateLabel("BCV") }catch{} })()
  }, [])

  // History API routing
  const nav = useCallback((pg, ps = {}) => {
    setPage(pg)
    setParams(ps)
    window.scrollTo(0, 0)
    window.history.pushState({ pg, ps }, "", toUrl(pg, ps))
  }, [])

  useEffect(() => {
    if (!window.history.state?.pg) {
      const initial = parseUrlState()
      window.history.replaceState(initial, "", toUrl(initial.pg, initial.ps))
      setPage(initial.pg)
      setParams(initial.ps)
    }

    const onPop = (e) => {
      const s = e.state || parseUrlState()
      setPage(s.pg || "landing")
      setParams(s.ps || {})
      window.scrollTo(0, 0)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Derived
  const cartCount = cart.reduce((s,i)=>s+i.qty, 0)
  const cartTotal = cart.reduce((s,i)=>s+(i.product?(i.product.salePrice||i.product.price):0)*i.qty, 0)
  const myNotifs  = notifs.filter(n=>n.userId===user?.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
  const unread    = myNotifs.filter(n=>!n.read&&!n.done).length

  // placeOrder — builds order from cart then calls action
  const placeOrder = useCallback(async (method, ref, proofImg, address, deliveryType) => {
    const fee      = appCfg?.platformFee || 5
    const deadline = new Date(Date.now() + 10*60*1000).toISOString()
    const now      = new Date().toISOString()
    const pm       = PAY.find(m=>m.id===method)?.label||method

    const byMerchant = {}
    for(const item of cart) {
      const mid = item.product.merchantId
      if(!byMerchant[mid]) byMerchant[mid] = []
      byMerchant[mid].push(item)
    }
    const vendors = Object.entries(byMerchant).map(([mid, mItems]) => {
      const merch  = profiles.find(u=>u.id===mid)
      const mSub   = mItems.reduce((s,i)=>s+(i.product.salePrice||i.product.price)*i.qty, 0)
      const mShip  = deliveryType==="delivery" ? mItems.reduce((s,i)=>i.product.freeShipping?s:s+(+i.product.shippingCost||0), 0) : 0
      const mTotal = mSub+mShip
      const mFee   = +(mTotal*fee/100).toFixed(2)
      return {
        merchantId:mid, merchantName:merch?.storeName||merch?.name||"",
        items:mItems, subtotal:mSub, shippingCost:mShip,
        platformFee:mFee, merchantAmount:+(mTotal-mFee).toFixed(2),
        status:"submitted", shippingGuide:null, review:null,
        payoutStatus:null, payoutScheduledAt:null, payoutCompletedAt:null,
        disputeReason:null, disputeDesc:null, disputeAt:null, disputeResolution:null,
      }
    })
    const shippingTotal = vendors.reduce((s,v)=>s+v.shippingCost, 0)
    const grandTotal    = vendors.reduce((s,v)=>s+v.subtotal+v.shippingCost, 0)
    const orderId = uid()
    const orderData = {
      id:orderId, buyerId:user.id, buyerName:user.name||user.email,
      paymentMethod:method, paymentRef:ref, paymentProofImg:proofImg,
      status:"submitted", deliveryType, address,
      grandTotal:+grandTotal.toFixed(2), shippingTotal:+shippingTotal.toFixed(2),
      vendors, deadline, createdAt:now, updatedAt:now,
      merchantId:vendors[0]?.merchantId||null,
    }
    const result = await actions.placeOrder(orderData)
    if (!result?.error) {
      actions.clearCart()
      nav("order-detail", { orderId })
    }
    return result
  }, [cart, profiles, appCfg, user, actions, nav])

  const ctx = {
    // State
    user, users:profiles, products, orders, reviews, cart, cartCount, cartTotal,
    page, params, rate, rateLabel, myNotifs, unread, favs, payReqs, appCfg,
    // Navigation & UI
    nav, showT,
    // Auth
    login:          actions.login,
    logout:         actions.logout,
    register:       actions.register,
    verifyEmail:    async () => {},
    // Profile
    updateProfile:  actions.updateProfile,
    verifyMerchant: actions.adminVerifyMerchant,
    toggleDisable:  actions.adminToggleDisable,
    // Products
    saveProduct:    actions.saveProduct,
    deleteProduct:  actions.deleteProduct,
    adminDisableProduct:  actions.adminDisableProduct,
    adminEnableProduct:   actions.adminEnableProduct,
    // Orders
    placeOrder,
    updateStatus:   actions.updateOrderStatus,
    submitReview:   (orderId, rating, comment, vendorMerchantId) =>
      actions.submitReview({ orderId, merchantId:vendorMerchantId, rating, comment }),
    // Cart
    addToCart:      actions.addToCart,
    removeFromCart: actions.removeFromCart,
    setCartQty:     actions.setCartQty,
    clearCart:      actions.clearCart,
    // Favorites
    toggleFav:      async (productId) => {
      if(!user) { nav("login"); return }
      return actions.toggleFav(productId)
    },
    // Q&A
    askQ:           (productId, q) => actions.askQuestion(productId, q, censorContact),
    answerQ:        (productId, qId, a) => actions.answerQuestion(productId, qId, a, censorContact),
    // Social
    toggleFollow:   async (mid) => {
      if(!user) { nav("login"); return }
      return actions.toggleFollow(mid)
    },
    // Notifications
    markAllRead:    actions.markAllNotifsRead,
    markNotifDone:  actions.markNotifDone,
    note:           actions.sendNotif,
    // Payouts
    requestPayout:  actions.requestPayout,
    completePayout: actions.completePayout,
    setPayReqs:     () => {},
    // Config
    setAppCfg:      actions.updateAppCfg,
  }

  if(!ready) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:Fb,gap:14}}>
      <style>{"@keyframes vy-spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{fontSize:52}}>🛍️</div>
      <div style={{color:C.muted,fontSize:14,display:"flex",alignItems:"center",gap:8}}><Spin dark />Cargando VendeYApp…</div>
    </div>
  )

  if(user?.disabled) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:Fb,gap:14,textAlign:"center",padding:24}}>
      <div style={{fontSize:52}}>🚫</div>
      <div style={{fontFamily:Fh,fontSize:20,fontWeight:800,color:C.red}}>Cuenta suspendida</div>
      <div style={{color:C.muted,fontSize:14,maxWidth:340}}>Tu cuenta ha sido suspendida. Contacta al equipo de VendeYApp.</div>
      <button onClick={actions.logout} style={{...btn(C.navy),marginTop:8}}>Cerrar sesión</button>
    </div>
  )

  return (
    <div style={{fontFamily:Fb,background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes vy-spin{to{transform:rotate(360deg)}}
        @keyframes vy-fade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes vy-slide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input:focus,textarea:focus,select:focus{outline:none!important;border-color:${C.red}!important;box-shadow:0 0 0 3px ${C.red}1A!important}
        .lift:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.12)!important;transition:all .2s}
        .hop:hover{opacity:.82} .hop:active{opacity:.65}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        .si::placeholder{color:rgba(255,255,255,.5)}
        @media(max-width:640px){.hide-sm{display:none!important}.full-sm{width:100%!important}h1{font-size:18px!important}h2{font-size:16px!important}}
        .vy-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
        @media(max-width:480px){.vy-grid{grid-template-columns:repeat(2,1fr);gap:8px}}
        @media(max-width:380px){.vy-grid{grid-template-columns:repeat(2,1fr);gap:6px}}
        @media(min-width:641px){.mobile-search-bar{display:none!important}}
        .merchant-sidebar{display:none}
        .merchant-tab-bar{display:flex;overflow-x:auto;scrollbar-width:none;background:#0f172a;border-bottom:1px solid rgba(255,255,255,.08)}
        .merchant-content{padding:16px 12px}
        @media(min-width:900px){
          .merchant-sidebar{display:flex!important;flex-direction:column;width:220px;min-height:calc(100vh - 64px);background:#0f172a;flex-shrink:0;padding:16px 10px;gap:3px}
          .merchant-tab-bar{display:none!important}
          .merchant-layout{display:flex;align-items:flex-start}
          .merchant-content{flex:1;min-width:0;padding:24px 22px;background:#F8FAFC;min-height:calc(100vh - 64px)}
        }
        input,select,textarea{font-size:16px!important}
        @media(max-width:640px){input,select,textarea{font-size:14px!important}}
        .cats-scroll::-webkit-scrollbar{display:none}
        .page-wrap{padding:16px 14px}
        @media(min-width:900px){.page-wrap{max-width:960px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 2px 20px rgba(0,0,0,.06);padding:28px 32px;margin-top:20px;margin-bottom:20px}}
      `}</style>
      <SchemaBase />
      <Header {...ctx} />
      <main style={{paddingBottom:80,background:C.bg,minHeight:"calc(100vh - 64px)"}}>
        <Suspense fallback={<div style={{padding:20,color:C.muted}}><Spin dark /> Cargando...</div>}>
          {page==="landing"            && <LandingPage      {...ctx} />}
          {page==="browse"             && <BrowsePage       {...ctx} />}
          {page==="product"            && <ProductPage      {...ctx} />}
          {page==="merchant-profile"   && <MerchantProfile  {...ctx} />}
          {page==="cart"               && <CartPage         {...ctx} />}
          {page==="checkout"           && <CheckoutPage     {...ctx} />}
          {(page==="login"||page==="register") && <AuthPage {...ctx} initMode={page} />}
          {page==="favorites"          && (!user?(nav("login",{returnTo:"favorites"})||null):<FavoritesPage    {...ctx} />)}
          {page==="my-orders"          && (!user?(nav("login",{returnTo:"my-orders"})||null):<MyOrdersPage     {...ctx} />)}
          {page==="order-detail"       && (!user?(nav("login",{returnTo:"order-detail",...params})||null):<OrderDetailPage  {...ctx} />)}
          {page==="notifications"      && (!user?(nav("login",{returnTo:"notifications"})||null):<NotificationsPage {...ctx} />)}
          {page==="merchant-dash"      && (!user?(nav("login",{returnTo:"merchant-dash"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<MerchantDash     {...ctx} />)}
          {page==="merchant-products"  && (!user?(nav("login",{returnTo:"merchant-products"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<MerchantProducts {...ctx} />)}
          {page==="merchant-add"       && (!user?(nav("login",{returnTo:"merchant-add"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<MerchantAddEdit  {...ctx} />)}
          {page==="merchant-orders"    && (!user?(nav("login",{returnTo:"merchant-orders"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<MerchantOrders   {...ctx} />)}
          {page==="merchant-analytics" && (!user?(nav("login",{returnTo:"merchant-analytics"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<MerchantAnalytics {...ctx} />)}
          {page==="merchant-qa"        && (!user?(nav("login",{returnTo:"merchant-qa"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<MerchantQA       {...ctx} />)}
          {page==="payouts"            && (!user?(nav("login",{returnTo:"payouts"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<PayoutsPage      {...ctx} />)}
          {page==="bank-settings"      && (!user?(nav("login",{returnTo:"bank-settings"})||null):(user.role!=="merchant"&&user.role!=="admin")?(nav("landing")||null):<BankSettingsPage {...ctx} />)}
          {page==="admin"              && (!user?(nav("login",{returnTo:"admin"})||null):user.role!=="admin"?(nav("landing")||null):<AdminPanel {...ctx} />)}
        </Suspense>
      </main>
      {toast && (
        <div style={{position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",background:toast.isError?"#7F1D1D":C.navy,color:"#fff",padding:"11px 24px",borderRadius:12,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:"0 8px 28px rgba(0,0,0,.25)",maxWidth:"92vw",textAlign:"center",animation:"vy-fade .2s ease",pointerEvents:"none"}}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
