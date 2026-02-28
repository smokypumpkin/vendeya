/**
 * useActions — business logic hook
 *
 * This is the ONLY place where API calls are combined with state updates.
 * Components call actions. Actions call API + dispatch. Reducer updates state.
 *
 * Every action:
 *   1. Calls the appropriate API function(s)
 *   2. Handles errors (shows toast, returns {error})
 *   3. Dispatches state update (or lets realtime handle it)
 *   4. Returns {error} or nothing — never throws
 */

import { useCallback } from 'react'
import { useAppState, useDispatch, useToast } from '../store/index.jsx'
import {
  authApi, profilesApi, productsApi, ordersApi,
  reviewsApi, notifsApi, payReqsApi, favsApi, configApi,
} from '../api/index.jsx'

export function useActions() {
  const state    = useAppState()
  const dispatch = useDispatch()
  const toast    = useToast()

  // ── Auth ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const { error } = await authApi.signIn(email, password)
    if (error) {
      const msg = error.message.includes('Invalid') ? 'Email o contraseña incorrectos' : error.message
      toast(msg, true)
      return { error: msg }
    }
    // onAuthStateChange in StoreProvider loads the profile + private data
    return {}
  }, [toast])

  const register = useCallback(async ({ email, password, role, name, location, storeName, storeDesc, storeLogo }) => {
    const meta = { role, name, location, storeName, storeDesc, storeLogo }
    const { data, error } = await authApi.signUp(email, password, meta)
    if (error) {
      const msg = error.message.includes('already') ? 'Email ya registrado' : error.message
      toast(msg, true)
      return { error: msg }
    }
    // Upsert profile with all fields (trigger may miss some)
    if (data?.user) {
      await profilesApi.upsertOwn({ ...meta, email, role, emailVerified: false, walletBalance: 0 })
    }
    return { data }
  }, [toast])

  const logout = useCallback(async () => {
    await authApi.signOut()
    dispatch({ type: 'SIGN_OUT' })
  }, [dispatch])

  // ── Profile ───────────────────────────────────────────────────────────────

  const updateProfile = useCallback(async (fields) => {
    const { error } = await profilesApi.upsertOwn(fields)
    if (error) { toast('Error al guardar perfil', true); return { error } }
    // Refresh from DB to get latest
    const { data } = await profilesApi.get(state.user?.id)
    if (data) dispatch({ type: 'UPSERT_PROFILE', payload: data })
    toast('Perfil actualizado ✓')
    return {}
  }, [state.user, dispatch, toast])

  const adminVerifyMerchant = useCallback(async (merchantId) => {
    const { error } = await profilesApi.adminVerify(merchantId)
    if (error) { toast('Error al verificar', true); return }
    const p = state.profiles.find(p => p.id === merchantId)
    if (p) dispatch({ type: 'UPSERT_PROFILE', payload: { ...p, merchantVerified: true } })
    await sendNotif(merchantId, '✅ ¡Tu cuenta de vendedor fue verificada por VendeYApp!')
    toast('Vendedor verificado ✓')
  }, [state.profiles, dispatch, toast])

  const adminToggleDisable = useCallback(async (userId) => {
    const { error } = await profilesApi.adminToggleDisable(userId)
    if (error) { toast('Error', true); return }
    const p = state.profiles.find(u => u.id === userId)
    if (p) dispatch({ type: 'UPSERT_PROFILE', payload: { ...p, disabled: !p.disabled } })
    toast(p?.disabled ? 'Cuenta habilitada' : 'Cuenta deshabilitada')
  }, [state.profiles, dispatch, toast])

  // ── Products ──────────────────────────────────────────────────────────────

  const saveProduct = useCallback(async (product) => {
    const { error } = await productsApi.upsert(product)
    if (error) { toast('Error al guardar producto', true); return { error } }
    dispatch({ type: 'UPSERT_PRODUCT', payload: product })
    toast('Producto guardado ✓')
    return {}
  }, [dispatch, toast])

  const deleteProduct = useCallback(async (productId) => {
    const { error } = await productsApi.delete(productId)
    if (error) { toast('Error al eliminar', true); return }
    dispatch({ type: 'DELETE_PRODUCT', payload: productId })
    toast('Producto eliminado')
  }, [dispatch, toast])

  const adminDisableProduct = useCallback(async (productId, reason, permanent = false) => {
    const p = state.products.find(x => x.id === productId)
    if (!p) return
    const updated = { ...p, active: false, adminDisabled: true, adminDisabledReason: reason, adminDisabledPermanent: permanent }
    const { error } = await productsApi.upsert(updated)
    if (error) { toast('Error', true); return }
    dispatch({ type: 'UPSERT_PRODUCT', payload: updated })
    const msg = permanent
      ? `🚫 Tu producto "${p.name}" fue deshabilitado permanentemente: "${reason}".`
      : `⚠️ Tu producto "${p.name}" fue pausado temporalmente: "${reason}".`
    await sendNotif(p.merchantId, msg)
    toast(permanent ? 'Producto deshabilitado' : 'Producto pausado')
  }, [state.products, dispatch, toast])

  const adminEnableProduct = useCallback(async (productId) => {
    const p = state.products.find(x => x.id === productId)
    if (!p || p.adminDisabledPermanent) { toast('No se puede reactivar', true); return }
    const updated = { ...p, active: true, adminDisabled: false, adminDisabledReason: null }
    const { error } = await productsApi.upsert(updated)
    if (error) { toast('Error', true); return }
    dispatch({ type: 'UPSERT_PRODUCT', payload: updated })
    await sendNotif(p.merchantId, `✅ Tu producto "${p.name}" fue reactivado.`)
    toast('Producto reactivado')
  }, [state.products, dispatch, toast])

  // ── Orders ────────────────────────────────────────────────────────────────

  const placeOrder = useCallback(async (orderData) => {
    const { error } = await ordersApi.create(orderData)
    if (error) { toast('Error al crear pedido', true); return { error } }

    // Decrement stock for each item
    for (const vendor of orderData.vendors || []) {
      for (const item of vendor.items || []) {
        await productsApi.decrementStock(item.productId, item.qty)
      }
    }

    // Optimistic local update (realtime will confirm)
    dispatch({ type: 'UPSERT_ORDER', payload: orderData })

    // Notify admins
    const admins = state.profiles.filter(u => u.role === 'admin')
    const short = orderData.id.slice(0, 8).toUpperCase()
    for (const admin of admins) {
      await sendNotif(admin.id,
        `🔍 Nuevo pedido #${short} · $${orderData.grandTotal?.toFixed(2)} · ${orderData.buyerName}`,
        orderData.id
      )
    }
    return {}
  }, [state.profiles, dispatch, toast])

  const updateOrderStatus = useCallback(async (orderId, status, extra = {}, vendorMerchantId = null) => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return
    const now = new Date().toISOString()
    const short = orderId.slice(0, 8).toUpperCase()

    // Build updated order
    let updatedOrder
    if (vendorMerchantId && order.vendors) {
      const updatedVendors = order.vendors.map(v => {
        if (v.merchantId !== vendorMerchantId) return v
        const updated = { ...v, ...extra, status }
        // Release: credit wallet
        if (status === 'released') {
          const merchant = state.profiles.find(u => u.id === v.merchantId)
          const newBalance = +((merchant?.walletBalance || 0) + v.merchantAmount).toFixed(2)
          profilesApi.creditWallet(v.merchantId, newBalance)
          dispatch({ type: 'UPSERT_PROFILE', payload: { ...merchant, walletBalance: newBalance } })
        }
        return updated
      })
      updatedOrder = { ...order, vendors: updatedVendors, updatedAt: now }
    } else {
      const vendorStatus = ['verified','processing','shipped','released','cancelled'].includes(status) ? status : undefined
      updatedOrder = {
        ...order, ...extra, status, updatedAt: now,
        vendors: vendorStatus && order.vendors
          ? order.vendors.map(v => ({ ...v, status: vendorStatus }))
          : order.vendors,
      }
    }

    const { error } = await ordersApi.update(orderId, {
      status: updatedOrder.status,
      vendors: updatedOrder.vendors,
      ...extra,
    })
    if (error) { toast('Error al actualizar pedido', true); return }
    dispatch({ type: 'UPSERT_ORDER', payload: updatedOrder })

    // Notifications by status
    const notifMap = {
      verified:    [
        [order.buyerId, `✅ Pedido #${short} verificado. Los vendedores están preparando tu compra.`, orderId],
        ...(order.vendors || []).map(v => [v.merchantId, `✅ Pedido #${short} verificado. ¡Prepara el pedido!`, orderId]),
      ],
      rejected:    [[order.buyerId, `❌ Pedido #${short} rechazado. Contacta soporte si tienes dudas.`, orderId]],
      processing:  order.deliveryType === 'pickup'
        ? [[order.buyerId, `📦 Pedido #${short} listo para retirar.`, orderId]]
        : [],
      shipped:     [[order.buyerId, `🚚 Pedido #${short} en camino.`, orderId]],
      released:    vendorMerchantId
        ? [
            [vendorMerchantId, `💰 Pedido #${short} completado. ¡Fondos acreditados a tu billetera!`, orderId],
            [order.buyerId, `✅ Entrega confirmada #${short}. ¡Deja tu reseña!`, orderId],
          ]
        : [],
      disputed:    [
        [order.buyerId, `⚠️ Disputa abierta en pedido #${short}. Te contactaremos en 24-48h.`, orderId],
        ...(order.vendors || []).map(v => [v.merchantId, `⚠️ Disputa en pedido #${short}. Estamos revisando.`, orderId]),
      ],
    }
    for (const [userId, msg, link] of notifMap[status] || []) {
      await sendNotif(userId, msg, link)
    }
  }, [state.orders, state.profiles, dispatch, toast])

  // ── Reviews ───────────────────────────────────────────────────────────────

  const submitReview = useCallback(async ({ orderId, merchantId, productId, rating, comment, direction = 'seller' }) => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return

    const targetMid = merchantId || order.vendors?.[0]?.merchantId
    const vendor    = order.vendors?.find(v => v.merchantId === targetMid)
    const now       = new Date().toISOString()

    if (direction === 'buyer') {
      // Merchant rating buyer — stored in order only (no public review table)
      const updatedVendors = order.vendors?.map(v =>
        v.merchantId === targetMid ? { ...v, buyerReview: { rating, comment, createdAt: now } } : v
      )
      await ordersApi.update(orderId, { vendors: updatedVendors })
      dispatch({ type: 'UPSERT_ORDER', payload: { ...order, vendors: updatedVendors } })
      await sendNotif(order.buyerId, `⭐ ${state.user?.storeName || state.user?.name} te calificó ${rating}/5 como comprador.`)
    } else {
      // Buyer rating merchant — public review table
      const firstItem  = vendor?.items?.[0]
      const productName = firstItem?.product?.name || ''
      const { error }  = await reviewsApi.save({
        p_order_id:    orderId,
        p_merchant_id: targetMid,
        p_product_id:  productId || firstItem?.productId || '',
        p_product_name: productName,
        p_rating:      rating,
        p_comment:     comment || '',
        p_buyer_name:  state.user?.name || '',
      })
      if (error) { toast('Error al enviar reseña', true); return { error } }

      const reviewId = `${orderId}-${targetMid}`
      dispatch({ type: 'UPSERT_REVIEW', payload: {
        id: reviewId, orderId, merchantId: targetMid, buyerId: state.user?.id,
        buyerName: state.user?.name || '', productId: productId || '',
        productName, rating, comment: comment || '', createdAt: now,
      }})

      // Also mark vendor.review in order for display consistency
      const updatedVendors = order.vendors?.map(v =>
        v.merchantId === targetMid ? { ...v, review: { rating, comment, createdAt: now } } : v
      )
      await ordersApi.update(orderId, { vendors: updatedVendors })
      dispatch({ type: 'UPSERT_ORDER', payload: { ...order, vendors: updatedVendors } })

      await sendNotif(targetMid, `⭐ ${state.user?.name} te dejó una reseña de ${rating}/5.`)
    }
    toast('¡Reseña enviada! ⭐')
    return {}
  }, [state.orders, state.user, dispatch, toast])

  // ── Notifications ─────────────────────────────────────────────────────────

  const sendNotif = useCallback(async (userId, msg, link = null) => {
    const { data, error } = await notifsApi.send(userId, msg, link)
    if (!error && data) dispatch({ type: 'UPSERT_NOTIF', payload: data })
  }, [dispatch])

  const markNotifRead = useCallback(async (notifId) => {
    await notifsApi.markRead(notifId)
    const n = state.notifs.find(n => n.id === notifId)
    if (n) dispatch({ type: 'UPSERT_NOTIF', payload: { ...n, read: true } })
  }, [state.notifs, dispatch])

  const markNotifDone = useCallback(async (notifId) => {
    const n = state.notifs.find(n => n.id === notifId)
    if (!n) return
    await notifsApi.markDone(notifId, { msg: n.msg, link: n.link })
    dispatch({ type: 'UPSERT_NOTIF', payload: { ...n, read: true, done: true } })
  }, [state.notifs, dispatch])

  const markAllNotifsRead = useCallback(async () => {
    if (state.user) {
      await notifsApi.markReadAll(state.user.id)
      dispatch({ type: 'SET_NOTIFS', payload: state.notifs.map(n => ({ ...n, read: true })) })
    }
  }, [state.user, state.notifs, dispatch])

  // ── Pay Requests ──────────────────────────────────────────────────────────

  const requestPayout = useCallback(async (amount) => {
    if (!state.user) return
    const { minPayout } = state.appCfg
    const wallet = state.user.walletBalance || 0
    if (amount < (minPayout || 20)) { toast(`Mínimo para liquidar: $${minPayout}`, true); return }
    if (amount > wallet)            { toast('Saldo insuficiente', true); return }
    if (state.payReqs.some(r => r.merchantId === state.user.id && r.status === 'pending')) {
      toast('Ya tienes una solicitud pendiente', true); return
    }

    const id = Math.random().toString(36).slice(2, 9)
    const req = {
      id, merchantId: state.user.id, amount,
      bankData: state.user.bankData || {},
      merchantName: state.user.storeName || state.user.name || '',
    }
    const { error } = await payReqsApi.create(req)
    if (error) { toast('Error al solicitar liquidación', true); return }

    // Deduct from wallet
    const newBalance = +(wallet - amount).toFixed(2)
    await profilesApi.creditWallet(state.user.id, newBalance)
    dispatch({ type: 'UPSERT_PROFILE', payload: { ...state.user, walletBalance: newBalance } })
    dispatch({ type: 'UPSERT_PAY_REQ', payload: { ...req, status: 'pending', requestedAt: new Date().toISOString() } })

    // Notify admins
    const admins = state.profiles.filter(u => u.role === 'admin')
    for (const admin of admins) {
      await sendNotif(admin.id, `💸 ${req.merchantName} solicita liquidación de $${amount.toFixed(2)}`)
    }
    toast('Solicitud de liquidación enviada ✓')
  }, [state, dispatch, toast, sendNotif])

  const completePayout = useCallback(async (reqId) => {
    const req = state.payReqs.find(r => r.id === reqId)
    if (!req) return
    const { error } = await payReqsApi.markPaid(reqId, {
      amount: req.amount, bankData: req.bankData, merchantName: req.merchantName,
    })
    if (error) { toast('Error al completar liquidación', true); return }
    dispatch({ type: 'UPSERT_PAY_REQ', payload: { ...req, status: 'paid', processedAt: new Date().toISOString() } })
    await sendNotif(req.merchantId, `💸 Tu liquidación de $${req.amount?.toFixed(2)} fue procesada.`)
    toast('Liquidación marcada como pagada ✓')
  }, [state.payReqs, dispatch, toast, sendNotif])

  // ── Cart ──────────────────────────────────────────────────────────────────

  const addToCart = useCallback((product, qty = 1) => {
    if (!product.active || product.stock < 1) { toast('Sin stock disponible', true); return }
    const existing = state.cart.find(i => i.productId === product.id)
    let newCart
    if (existing) {
      const nq = Math.min(existing.qty + qty, product.stock)
      if (nq === existing.qty) { toast(`Máximo disponible: ${product.stock}`, true); return }
      newCart = state.cart.map(i => i.productId === product.id ? { ...i, qty: nq } : i)
    } else {
      newCart = [...state.cart, { productId: product.id, qty: Math.min(qty, product.stock), product }]
    }
    dispatch({ type: 'SET_CART', payload: newCart })
    toast(`"${product.name.slice(0, 30)}" agregado al carrito`)
    productsApi.incrementViews(product.id)
  }, [state.cart, state.products, dispatch, toast])

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: 'SET_CART', payload: state.cart.filter(i => i.productId !== productId) })
  }, [state.cart, dispatch])

  const setCartQty = useCallback((productId, qty) => {
    if (qty < 1) { dispatch({ type: 'SET_CART', payload: state.cart.filter(i => i.productId !== productId) }); return }
    const product = state.products.find(p => p.id === productId)
    const safe = Math.min(qty, product?.stock || qty)
    dispatch({ type: 'SET_CART', payload: state.cart.map(i => i.productId === productId ? { ...i, qty: safe } : i) })
  }, [state.cart, state.products, dispatch])

  const clearCart = useCallback(() => {
    dispatch({ type: 'SET_CART', payload: [] })
  }, [dispatch])

  // ── Favorites ─────────────────────────────────────────────────────────────

  const toggleFav = useCallback(async (productId) => {
    if (!state.user) return false // caller handles redirect
    const isFav = state.favs.includes(productId)
    if (isFav) {
      dispatch({ type: 'REMOVE_FAV', payload: productId })
      await favsApi.remove(state.user.id, productId)
    } else {
      dispatch({ type: 'ADD_FAV', payload: productId })
      await favsApi.add(state.user.id, productId)
    }
    return true
  }, [state.user, state.favs, dispatch])

  // ── Q&A ───────────────────────────────────────────────────────────────────

  const askQuestion = useCallback(async (productId, rawQuestion, censorFn) => {
    if (!state.user) return false
    const question = censorFn ? censorFn(rawQuestion) : rawQuestion
    const product  = state.products.find(p => p.id === productId)
    if (!product) return
    const q = {
      id: Math.random().toString(36).slice(2, 9),
      buyerId: state.user.id, buyerName: state.user.name || '',
      question, answer: null, answeredAt: null,
      createdAt: new Date().toISOString(),
    }
    const updated = { ...product, questions: [...(product.questions || []), q] }
    await productsApi.upsert(updated)
    dispatch({ type: 'UPSERT_PRODUCT', payload: updated })
    await sendNotif(product.merchantId,
      `❓ ${state.user.name} preguntó en "${product.name.slice(0, 35)}": ${question.slice(0, 60)}`,
      `product:${productId}`
    )
    return question !== rawQuestion // returns true if censored
  }, [state.user, state.products, dispatch, sendNotif])

  const answerQuestion = useCallback(async (productId, qId, rawAnswer, censorFn) => {
    const answer  = censorFn ? censorFn(rawAnswer) : rawAnswer
    const product = state.products.find(p => p.id === productId)
    if (!product) return
    const q = product.questions?.find(q => q.id === qId)
    const updated = {
      ...product,
      questions: (product.questions || []).map(qu =>
        qu.id === qId ? { ...qu, answer, answeredAt: new Date().toISOString() } : qu
      ),
    }
    await productsApi.upsert(updated)
    dispatch({ type: 'UPSERT_PRODUCT', payload: updated })
    if (q) await sendNotif(q.buyerId,
      `💬 Respuesta en "${product.name.slice(0, 35)}": ${answer.slice(0, 60)}`,
      `product:${productId}`
    )
  }, [state.products, dispatch, sendNotif])

  // ── Social ────────────────────────────────────────────────────────────────

  const toggleFollow = useCallback(async (merchantId) => {
    if (!state.user) return false
    const merchant    = state.profiles.find(u => u.id === merchantId)
    if (!merchant) return
    const isFollowing = state.user.following?.includes(merchantId)

    const updatedUser = { ...state.user,
      following: isFollowing
        ? state.user.following.filter(id => id !== merchantId)
        : [...(state.user.following || []), merchantId]
    }
    const updatedMerchant = { ...merchant,
      followers: isFollowing
        ? (merchant.followers || []).filter(id => id !== state.user.id)
        : [...(merchant.followers || []), state.user.id]
    }
    dispatch({ type: 'UPSERT_PROFILE', payload: updatedUser })
    dispatch({ type: 'UPSERT_PROFILE', payload: updatedMerchant })
    await profilesApi.upsertOwn({ following: updatedUser.following })
    if (!isFollowing) {
      await sendNotif(merchantId, `👤 ${state.user.name} comenzó a seguir tu tienda.`)
    }
    return !isFollowing
  }, [state.user, state.profiles, dispatch, sendNotif])

  // ── Config ────────────────────────────────────────────────────────────────

  const updateAppCfg = useCallback(async (cfg) => {
    const merged = { ...state.appCfg, ...cfg }
    const { error } = await configApi.update(merged)
    if (error) { toast('Error al guardar configuración', true); return }
    dispatch({ type: 'SET_APP_CFG', payload: merged })
    toast('Configuración guardada ✓')
  }, [state.appCfg, dispatch, toast])

  return {
    // Auth
    login, register, logout,
    // Profile
    updateProfile, adminVerifyMerchant, adminToggleDisable,
    // Products
    saveProduct, deleteProduct, adminDisableProduct, adminEnableProduct,
    // Orders
    placeOrder, updateOrderStatus,
    // Reviews
    submitReview,
    // Notifications
    sendNotif, markNotifRead, markNotifDone, markAllNotifsRead,
    // Pay requests
    requestPayout, completePayout,
    // Cart
    addToCart, removeFromCart, setCartQty, clearCart,
    // Favorites
    toggleFav,
    // Q&A
    askQuestion, answerQuestion,
    // Social
    toggleFollow,
    // Config
    updateAppCfg,
  }
}
