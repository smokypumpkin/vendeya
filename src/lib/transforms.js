// ── DB row → App object transforms ──────────────────────────────────────────
// These are pure functions. No side effects, no API calls.
// Every field has a safe default so consumers never get undefined.

export const toProfile = (r) => {
  if (!r) return null
  const d = r.data || {}
  return {
    id:               r.id,
    email:            r.email            || '',
    role:             r.role             || 'buyer',
    emailVerified:    r.email_verified   || false,
    active:           r.active           !== false,
    joinedAt:         r.created_at       || null,
    // Merchant profile data
    name:             d.name             || '',
    location:         d.location         || '',
    storeName:        d.storeName        || '',
    storeDesc:        d.storeDesc        || '',
    storeLogo:        d.storeLogo        || '',
    pickupAddress:    d.pickupAddress    || '',
    pickupSchedule:   d.pickupSchedule   || '',
    bankData:         d.bankData         || {},
    walletBalance:    Number(d.walletBalance) || 0,
    merchantVerified: d.merchantVerified || false,
    disabled:         d.disabled         || false,
    following:        Array.isArray(d.following) ? d.following : [],
    followers:        Array.isArray(d.followers) ? d.followers : [],
  }
}

export const toProduct = (r) => {
  if (!r) return null
  const d = r.data || {}
  return {
    id:                    r.id,
    merchantId:            r.merchant_id            || null,
    category:              r.category               || '',
    active:                r.active                 !== false,
    createdAt:             r.created_at             || null,
    name:                  d.name                   || '',
    description:           d.description            || '',
    price:                 Number(d.price)          || 0,
    salePrice:             d.salePrice              ? Number(d.salePrice) : null,
    stock:                 Number(d.stock)          || 0,
    image:                 d.image                  || d.images?.[0] || '',
    images:                Array.isArray(d.images)  ? d.images : [],
    condition:             d.condition              || 'new',
    deliveryType:          d.deliveryType           || 'both',
    allowsPickup:          d.allowsPickup           !== false,
    allowsDelivery:        d.allowsDelivery         !== false,
    freeShipping:          d.freeShipping           || false,
    shippingCost:          Number(d.shippingCost)  || 0,
    deliveryDays:          d.deliveryDays           || '',
    views:                 Number(d.views)          || 0,
    merchantName:          d.merchantName           || '',
    merchantLoc:           d.merchantLoc            || '',
    questions:             Array.isArray(d.questions) ? d.questions : [],
    adminDisabled:         d.adminDisabled          || false,
    adminDisabledReason:   d.adminDisabledReason    || null,
    adminDisabledPermanent:d.adminDisabledPermanent || false,
  }
}

export const toOrder = (r) => {
  if (!r) return null
  const d = r.data || {}
  const vendors = Array.isArray(d.vendors) ? d.vendors : []
  const v0 = vendors[0] || {}
  return {
    id:              r.id,
    buyerId:         r.buyer_id                         || null,
    merchantId:      r.merchant_id || v0.merchantId     || null,
    status:          r.status                           || 'pending',
    createdAt:       r.created_at                       || null,
    updatedAt:       r.updated_at                       || null,
    buyerName:       d.buyerName                        || '',
    merchantName:    v0.merchantName                    || '',
    grandTotal:      Number(d.grandTotal)               || 0,
    shippingTotal:   Number(d.shippingTotal)            || 0,
    paymentMethod:   d.paymentMethod                    || '',
    paymentRef:      d.paymentRef                       || '',
    paymentProofImg: d.paymentProofImg                  || null,
    address:         d.address                          || '',
    deliveryType:    d.deliveryType                     || 'delivery',
    deadline:        d.deadline                         || null,
    vendors,
    // Flattened from first vendor so merchant-side code can access directly
    items:           Array.isArray(v0.items) ? v0.items : [],
    subtotal:        Number(v0.subtotal)                || 0,
    merchantAmount:  Number(v0.merchantAmount)          || 0,
    review:          v0.review                          || null,
    vendorStatus:    v0.status                          || null,
    shippingGuide:   v0.shippingGuide                   || null,
  }
}

export const toReview = (r) => {
  if (!r) return null
  return {
    id:          r.id,
    orderId:     r.order_id     || null,
    merchantId:  r.merchant_id  || null,
    buyerId:     r.buyer_id     || null,
    buyerName:   r.buyer_name   || '',
    productId:   r.product_id   || '',
    productName: r.product_name || '',
    rating:      Number(r.rating) || 0,
    comment:     r.comment      || '',
    createdAt:   r.created_at   || null,
  }
}

export const toNotif = (r) => {
  if (!r) return null
  const d = r.data || {}
  return {
    id:        r.id,
    userId:    r.user_id  || null,
    read:      r.read     || false,
    done:      d.done     || false,
    msg:       d.msg      || '',
    link:      d.link     || null,
    createdAt: r.created_at || null,
  }
}

export const toPayReq = (r) => {
  if (!r) return null
  const d = r.data || {}
  return {
    id:           r.id,
    merchantId:   r.merchant_id   || null,
    status:       r.status        || 'pending',
    requestedAt:  r.created_at    || null,
    amount:       Number(d.amount) || 0,
    bankData:     d.bankData      || {},
    merchantName: d.merchantName  || '',
    processedAt:  d.processedAt   || null,
  }
}
