/**
 * Global store — Context + useReducer
 *
 * Architecture:
 *   UI → dispatch action → reducer updates state → UI re-renders
 *   Side effects (API calls) live in action creators, not in reducer.
 *
 * Data flow:
 *   Boot → load public data (products, profiles, reviews)
 *        → restore session → load private data (orders, notifs, favs, payReqs)
 *        → subscribe realtime → keep everything in sync
 *
 * Public data (no auth): products, profiles, reviews, appCfg
 * Private data (needs auth): orders, notifs, favs, payReqs
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { supabase as sb } from '../lib/supabase.js'
import {
  authApi, profilesApi, productsApi, ordersApi, reviewsApi,
  notifsApi, payReqsApi, favsApi, configApi, realtimeApi,
} from '../api/index.jsx'

// ─── State ───────────────────────────────────────────────────────────────────

const initCart = () => {
  try { return JSON.parse(localStorage.getItem('vy_cart') || '[]') } catch { return [] }
}

const INIT_STATE = {
  ready:    false,
  user:     null,
  profiles: [],
  products: [],
  orders:   [],
  reviews:  [],
  notifs:   [],
  favs:     [],
  payReqs:  [],
  appCfg:   { minPayout: 20, platformFee: 5 },
  rate:     36.5,
  cart:     initCart(),
  toast:    null,
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state, { type, payload }) {
  switch (type) {
    case 'READY':         return { ...state, ready: true }
    case 'SET_USER':      return { ...state, user: payload }
    case 'SET_PROFILES':  return { ...state, profiles: payload }
    case 'SET_PRODUCTS':  return { ...state, products: payload }
    case 'SET_ORDERS':    return { ...state, orders: payload }
    case 'SET_REVIEWS':   return { ...state, reviews: payload }
    case 'SET_NOTIFS':    return { ...state, notifs: payload }
    case 'SET_FAVS':      return { ...state, favs: payload }
    case 'SET_PAY_REQS':  return { ...state, payReqs: payload }
    case 'SET_APP_CFG':   return { ...state, appCfg: { ...state.appCfg, ...payload } }
    case 'SET_RATE':      return { ...state, rate: payload }
    case 'TOAST':         return { ...state, toast: payload }

    case 'UPSERT_PROFILE': {
      const list = state.profiles.filter(p => p.id !== payload.id)
      const user = state.user?.id === payload.id ? payload : state.user
      return { ...state, profiles: [payload, ...list], user }
    }
    case 'UPSERT_PRODUCT': {
      const list = state.products.filter(p => p.id !== payload.id)
      return { ...state, products: [payload, ...list] }
    }
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== payload) }
    case 'UPSERT_ORDER': {
      const list = state.orders.filter(o => o.id !== payload.id)
      return { ...state, orders: [payload, ...list] }
    }
    case 'UPSERT_REVIEW': {
      const list = state.reviews.filter(r => r.id !== payload.id)
      return { ...state, reviews: [payload, ...list] }
    }
    case 'UPSERT_NOTIF': {
      const exists = state.notifs.find(n => n.id === payload.id)
      const list = exists
        ? state.notifs.map(n => n.id === payload.id ? payload : n)
        : [payload, ...state.notifs]
      return { ...state, notifs: list }
    }
    case 'UPSERT_PAY_REQ': {
      const list = state.payReqs.filter(r => r.id !== payload.id)
      return { ...state, payReqs: [payload, ...list] }
    }
    case 'SET_CART': {
      try { localStorage.setItem('vy_cart', JSON.stringify(payload)) } catch {}
      return { ...state, cart: payload }
    }
    case 'ADD_FAV':    return { ...state, favs: [...new Set([...state.favs, payload])] }
    case 'REMOVE_FAV': return { ...state, favs: state.favs.filter(id => id !== payload) }

    case 'SIGN_OUT':
      return { ...INIT_STATE, ready: true, profiles: state.profiles,
        products: state.products, reviews: state.reviews, appCfg: state.appCfg, rate: state.rate }

    default: return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StateCtx   = createContext(null)
const DispatchCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT_STATE)
  const toastTimer = useRef(null)
  const sessionRef = useRef(null)  // track current session for realtime handlers

  // ── Toast helper ────────────────────────────────────────────────────────
  const toast = useCallback((msg, isError = false) => {
    dispatch({ type: 'TOAST', payload: { msg, isError } })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => dispatch({ type: 'TOAST', payload: null }), 3500)
  }, [])

  // ── Load public data ─────────────────────────────────────────────────────
  const loadPublic = useCallback(async () => {
    const [pRes, prRes, rvRes, cfgRes] = await Promise.all([
      productsApi.list(),
      profilesApi.list(),
      reviewsApi.list(),
      configApi.get(),
    ])
    if (!prRes.error) dispatch({ type: 'SET_PROFILES', payload: prRes.data })
    if (!pRes.error)  dispatch({ type: 'SET_PRODUCTS', payload: pRes.data })
    if (!rvRes.error) dispatch({ type: 'SET_REVIEWS',  payload: rvRes.data })
    if (!cfgRes.error) dispatch({ type: 'SET_APP_CFG', payload: cfgRes.data })
  }, [])

  // ── Load private data (requires auth) ───────────────────────────────────
  const loadPrivate = useCallback(async (userId) => {
    const [oRes, nRes, fRes, pqRes] = await Promise.all([
      ordersApi.list(),
      notifsApi.listForUser(userId),
      favsApi.listForUser(userId),
      payReqsApi.list(),
    ])
    if (!oRes.error)  dispatch({ type: 'SET_ORDERS',   payload: oRes.data })
    if (!nRes.error)  dispatch({ type: 'SET_NOTIFS',   payload: nRes.data })
    if (!fRes.error)  dispatch({ type: 'SET_FAVS',     payload: fRes.data })
    if (!pqRes.error) dispatch({ type: 'SET_PAY_REQS', payload: pqRes.data })
  }, [])

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubRealtime

    const boot = async () => {
      // 1. Public data first — works without auth
      await loadPublic()

      // 2. Exchange rate (BCV)
      try {
        const r = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv&monitor=usd')
        const j = await r.json()
        const v = j?.price || j?.data?.price
        if (v && +v > 1) dispatch({ type: 'SET_RATE', payload: +v })
      } catch {}

      // 3. Restore existing session
      const { data: { session } } = await authApi.getSession()
      if (session?.user) {
        const { data: profile } = await profilesApi.get(session.user.id)
        if (profile) {
          dispatch({ type: 'SET_USER', payload: profile })
          sessionRef.current = session
        }
        await loadPrivate(session.user.id)
      }

      dispatch({ type: 'READY' })

      // 4. Realtime — keep state in sync across devices/tabs
      unsubRealtime = realtimeApi.subscribe({
        onOrders:   async () => { const r = await ordersApi.list();   if (!r.error) dispatch({ type: 'SET_ORDERS',   payload: r.data }) },
        onProducts: async () => { const r = await productsApi.list(); if (!r.error) dispatch({ type: 'SET_PRODUCTS', payload: r.data }) },
        onProfiles: async () => { const r = await profilesApi.list(); if (!r.error) dispatch({ type: 'SET_PROFILES', payload: r.data }) },
        onReviews:  async () => { const r = await reviewsApi.list();  if (!r.error) dispatch({ type: 'SET_REVIEWS',  payload: r.data }) },
        onNotifs:   async () => {
          // Reload all notifs when any notification changes
          // We filter by userId when displaying, so it's safe to reload all
          if (sessionRef.current?.user?.id) {
            const { data } = await sb.from('notifications')
              .select('*')
              .eq('user_id', sessionRef.current.user.id)
              .order('created_at', { ascending: false })
            if (data) dispatch({ type: 'SET_NOTIFS', payload: data.map(toNotif) })
          }
        },
        onPayReqs:  async () => { const r = await payReqsApi.list();  if (!r.error) dispatch({ type: 'SET_PAY_REQS', payload: r.data }) },
      })
    }

    boot()

    // 5. Auth state changes (login from another tab, deep-link OAuth, etc.)
    const { data: { subscription } } = authApi.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await profilesApi.get(session.user.id)
        if (profile) {
          dispatch({ type: 'SET_USER', payload: profile })
          sessionRef.current = session
        }
        await loadPrivate(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SIGN_OUT' })
      }
    })

    return () => {
      subscription.unsubscribe()
      unsubRealtime?.()
    }
  }, []) // eslint-disable-line

  return (
    <StateCtx.Provider value={{ state, toast }}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useAppState  = ()  => useContext(StateCtx).state
export const useToast     = ()  => useContext(StateCtx).toast
export const useDispatch  = ()  => useContext(DispatchCtx)
