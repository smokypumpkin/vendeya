/**
 * API layer — the ONLY place that talks to Supabase.
 *
 * Rules:
 * - Always returns { data, error }
 * - Never throws — callers decide what to do with errors
 * - No state, no side effects beyond the DB call
 * - Mutations use RPCs where security matters (orders, profiles)
 */

import { supabase as sb } from '../lib/supabase.js'
import { toProfile, toProduct, toOrder, toReview, toNotif, toPayReq } from '../lib/transforms.js'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  getSession:   ()               => sb.auth.getSession(),
  onAuthChange: (fn)             => sb.auth.onAuthStateChange(fn),
  signIn:       (email, pass)    => sb.auth.signInWithPassword({ email, password: pass }),
  signUp:       (email, pass, meta) => sb.auth.signUp({ email, password: pass, options: { data: meta } }),
  signOut:      ()               => sb.auth.signOut(),
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export const profilesApi = {
  async list() {
    const { data, error } = await sb.from('profiles').select('*')
    return { data: data?.map(toProfile) || [], error }
  },

  async get(id) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', id).single()
    return { data: toProfile(data), error }
  },

  async upsertOwn(profileFields) {
    const { error } = await sb.rpc('upsert_own_profile', { profile_data: profileFields })
    return { error }
  },

  async adminVerify(targetId) {
    const { error } = await sb.rpc('admin_verify_merchant', { target_id: targetId })
    return { error }
  },

  async adminToggleDisable(targetId) {
    const { error } = await sb.rpc('admin_toggle_disable', { target_id: targetId })
    return { error }
  },

  async creditWallet(targetId, newBalance) {
    const { error } = await sb.rpc('update_wallet_balance', { target_id: targetId, new_balance: newBalance })
    return { error }
  },
}

// ─── Products ────────────────────────────────────────────────────────────────

export const productsApi = {
  async list() {
    const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false })
    return { data: data?.map(toProduct) || [], error }
  },

  async upsert(product) {
    const { id, merchantId, category, active, createdAt, ...rest } = product
    const row = {
      id,
      merchant_id: merchantId,
      category,
      active: active !== false,
      ...(createdAt ? { created_at: createdAt } : {}),
      data: rest,
    }
    const { error } = await sb.from('products').upsert(row, { onConflict: 'id' })
    return { error }
  },

  async delete(id) {
    const { error } = await sb.from('products').delete().eq('id', id)
    return { error }
  },

  async incrementViews(productId) {
    await sb.rpc('increment_product_views', { product_id: productId })
  },

  async decrementStock(productId, qty) {
    await sb.rpc('decrement_product_stock', { product_id: productId, qty })
  },
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export const ordersApi = {
  async list() {
    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false })
    return { data: data?.map(toOrder) || [], error }
  },

  async create(order) {
    const { error } = await sb.rpc('create_order', { order_row: order })
    return { error }
  },

  async update(orderId, patch) {
    const { error } = await sb.rpc('update_order', { order_id: orderId, order_data: patch })
    return { error }
  },
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const reviewsApi = {
  async list() {
    const { data, error } = await sb
      .from('reviews')
      .select('id,order_id,merchant_id,buyer_id,buyer_name,product_id,product_name,rating,comment,created_at')
      .order('created_at', { ascending: false })
    return { data: data?.map(toReview) || [], error }
  },

  async save(params) {
    const { error } = await sb.rpc('save_review', params)
    return { error }
  },
}

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifsApi = {
  async listForUser(userId) {
    const { data, error } = await sb
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data: data?.map(toNotif) || [], error }
  },

  async send(userId, msg, link = null) {
    const id = Math.random().toString(36).slice(2, 9)
    const { error } = await sb.from('notifications').insert({
      id,
      user_id: userId,
      read: false,
      data: { msg, link, done: false },
    })
    return { data: { id, userId, msg, link, read: false, done: false, createdAt: new Date().toISOString() }, error }
  },

  async markRead(id) {
    const { error } = await sb.from('notifications').update({ read: true }).eq('id', id)
    return { error }
  },

  async markReadAll(userId) {
    const { error } = await sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    return { error }
  },

  async markDone(id, notifData) {
    const { error } = await sb.from('notifications').update({
      read: true,
      data: { ...notifData, done: true },
    }).eq('id', id)
    return { error }
  },
}

// ─── Pay Requests ─────────────────────────────────────────────────────────────

export const payReqsApi = {
  async list() {
    const { data, error } = await sb.from('pay_requests').select('*').order('created_at', { ascending: false })
    return { data: data?.map(toPayReq) || [], error }
  },

  async create(req) {
    const { id, merchantId, amount, bankData, merchantName } = req
    const { error } = await sb.from('pay_requests').insert({
      id,
      merchant_id: merchantId,
      status: 'pending',
      data: { amount, bankData, merchantName },
    })
    return { error }
  },

  async markPaid(id, notifData) {
    const { error } = await sb.from('pay_requests').update({
      status: 'paid',
      data: { ...notifData, processedAt: new Date().toISOString() },
    }).eq('id', id)
    return { error }
  },
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export const favsApi = {
  async listForUser(userId) {
    const { data, error } = await sb.from('favorites').select('product_id').eq('user_id', userId)
    return { data: data?.map(r => r.product_id) || [], error }
  },

  async add(userId, productId) {
    const { error } = await sb.from('favorites').insert({ user_id: userId, product_id: productId })
    return { error }
  },

  async remove(userId, productId) {
    const { error } = await sb.from('favorites').delete().eq('user_id', userId).eq('product_id', productId)
    return { error }
  },
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const configApi = {
  async get() {
    const { data, error } = await sb.from('app_config').select('*').single()
    return { data: data?.data || {}, error }
  },

  async update(cfg) {
    const { error } = await sb.from('app_config').upsert({ id: 'main', data: cfg })
    return { error }
  },
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export const realtimeApi = {
  /**
   * Subscribe to live changes on all tables.
   * Each handler receives the full refreshed dataset (not just the changed row).
   * Returns cleanup function.
   */
  subscribe({ onOrders, onProducts, onProfiles, onReviews, onNotifs, onPayReqs }) {
    const ch = sb.channel('vendeya:live')

    const onEvent = (table, handler) => {
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table }, handler)
      ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, handler)
    }

    if (onOrders)   onEvent('orders',        onOrders)
    if (onProducts) {
      onEvent('products', onProducts)
      ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, onProducts)
    }
    if (onProfiles) onEvent('profiles',      onProfiles)
    if (onReviews)  onEvent('reviews',       onReviews)
    if (onNotifs)   ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, onNotifs)
    if (onPayReqs)  onEvent('pay_requests',  onPayReqs)

    ch.subscribe()
    return () => sb.removeChannel(ch)
  },
}
