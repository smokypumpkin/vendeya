/**
 * App.jsx — VendeYApp UI Root
 * State: store/index.jsx | Logic: hooks/useActions.jsx | API: api/index.jsx
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAppState, useToast } from "./store/index.jsx"
import { useActions } from "./hooks/useActions.jsx"

/* ═══════════════════════════════════════════════
   BRAND TOKENS
═══════════════════════════════════════════════ */
const C = {
  red:"#CF2A0E",redD:"#A81F08",redL:"#FDECEA",
  navy:"#0B1F5B",navyD:"#071445",navyL:"#EBF0FB",
  gold:"#E59B00",goldL:"#FEF3DC",
  green:"#0F7A3C",greenL:"#E6F4ED",
  amber:"#B45309",amberL:"#FEF3C7",
  teal:"#0A7E75",tealL:"#E0F4F2",   /* beneficio logístico — envío, gratis */
  slate:"#3D4A5C",slateL:"#EDF0F3", /* condición neutra — Usado */
  bg:"#F3F1EB",white:"#FFFFFF",border:"#DDD8CE",
  light:"#ECE9E0",text:"#111827",muted:"#5C5C72",
  purple:"#6D28D9",purpleL:"#EDE9FE"
};

/* ─── TAG DESIGN SYSTEM ───────────────────────────────────────
   Roles semánticos de color en tags de producto:
   NAVY  → Identidad / condición "Nuevo"  (marca)
   SLATE → Condición secundaria "Usado"   (neutro)
   RED   → Acción de precio "-X%"         (urgencia de compra)
   AMBER → Escasez "¡Último!"             (urgencia de stock)
   TEAL  → Beneficio logístico "GRATIS"   (propuesta de valor)
   ──────────────────────────────────────────────────────────── */
const Fh = "'Sora',sans-serif";
const Fb = "'Plus Jakarta Sans',sans-serif";

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */
const uid  = () => Math.random().toString(36).slice(2,9);
const fU   = p  => `$${(+p).toFixed(2)}`;
const fBs  = (p, r) => {
  const bs = (+p) * (+r);
  return "Bs. " + bs.toLocaleString("es-VE", {minimumFractionDigits:2, maximumFractionDigits:2});
};
const fD   = d  => new Date(d).toLocaleDateString("es-VE",{day:"2-digit",month:"short",year:"numeric"});
const ago  = d  => {
  const s = (Date.now()-new Date(d))/1000;
  if(s<60)   return "ahora";
  if(s<3600) return `${~~(s/60)}m`;
  if(s<86400) return `${~~(s/3600)}h`;
  return fD(d);
};
const gC  = () => Math.floor(100000+Math.random()*900000).toString();
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r.toISOString(); };

const censorContact = (text) => {
  if(!text || typeof text !== "string") return text || "";
  let out = text;
  // Emails
  out = out.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[correo oculto]");
  // Venezuelan mobiles: 0412, 0414, 0416, 0424, 0426 — all formats
  out = out.replace(/(?:\+?58)?[-\s.]?0?(4(?:1[2-6]|2[46]))[-\s.]?\d{3}[-\s.]?\d{4}/g, "[número oculto]");
  // 7+ digit sequences (catch obfuscated numbers like "04121234567" or "412-123-4567")
  out = out.replace(/(?<![\d\-])\d[\d\s.\-]{6,14}\d(?![\d\-])/g, m => {
    const digits = m.replace(/\D/g,'');
    return digits.length >= 7 ? "[número oculto]" : m;
  });
  // WhatsApp / Telegram links
  out = out.replace(/(?:wa|t)\.me\/[\w+]+/gi, "[enlace oculto]");
  // Explicit social/contact keyword followed by handle
  out = out.replace(/(?:whatsapp|telegram|signal|instagram|ig|escríbeme|contactame?|llámame|escribeme|dm)\s*:?\s*@?[\w.\-]{2,30}/gi, "[contacto oculto]");
  return out;
};

/* ═══════════════════════════════════════════════
   SUPABASE CLIENT
   Reemplaza estos dos valores con los de tu proyecto:
   Supabase Dashboard → Project Settings → API
═══════════════════════════════════════════════ */
const SUPABASE_URL      = "REEMPLAZA_CON_TU_PROJECT_URL";
const SUPABASE_ANON_KEY = "REEMPLAZA_CON_TU_ANON_KEY";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── DB ↔ App transforms ──────────────────────────────────────
   La BD guarda columnas indexadas + un campo JSONB `data`.
   fromDB: convierte fila de BD → objeto que usa el app
   toDB:   convierte objeto del app → fila para la BD
──────────────────────────────────────────────────────────────*/
const fromDB = {
  profile: r => r ? ({...r.data, id:r.id, email:r.email, role:r.role, emailVerified:r.email_verified, active:r.active!==false, joinedAt:r.created_at}) : null,
  product: r => r ? ({...r.data, id:r.id, merchantId:r.merchant_id, category:r.category, active:r.active!==false, createdAt:r.created_at}) : null,
  order:   r => r ? ({...r.data, id:r.id, buyerId:r.buyer_id, status:r.status, createdAt:r.created_at}) : null,
  notif:   r => r ? ({...r.data, id:r.id, userId:r.user_id, read:r.read||false, createdAt:r.created_at}) : null,
  payReq:  r => r ? ({...r.data, id:r.id, merchantId:r.merchant_id, status:r.status, requestedAt:r.created_at}) : null,
};
const toDB = {
  profile: u => {
    const {id,email,role,emailVerified,active,joinedAt,...rest} = u;
    return {id, email, role:role||"buyer", email_verified:emailVerified||false, active:active!==false, data:rest};
  },
  product: p => {
    const {id,merchantId,category,active,createdAt,...rest} = p;
    return {id, merchant_id:merchantId, category, active:active!==false, created_at:createdAt||new Date().toISOString(), data:rest};
  },
  order: o => {
    const {id,buyerId,status,createdAt,...rest} = o;
    return {id, buyer_id:buyerId, status, created_at:createdAt||new Date().toISOString(), data:rest};
  },
  notif: n => {
    const {id,userId,read,createdAt,...rest} = n;
    return {id, user_id:userId, read:read||false, created_at:createdAt||new Date().toISOString(), data:rest};
  },
  payReq: r => {
    const {id,merchantId,status,requestedAt,...rest} = r;
    return {id, merchant_id:merchantId, status:status||"pending", created_at:requestedAt||new Date().toISOString(), data:rest};
  },
};

/* ── Memory cache (solo para el tipo de cambio) ── */
const MEM = {};


/* ═══════════════════════════════════════════════
   IMAGE COMPRESS
═══════════════════════════════════════════════ */
function readB64(file) {
  return new Promise(res => {
    if(!file) return res(null);
    const fr = new FileReader();
    fr.onload = e => res(e.target.result);
    fr.onerror = () => res(null);
    fr.readAsDataURL(file);
  });
}
async function compressImg(file, max=800) {
  try {
    const b64 = await readB64(file);
    if(!b64) return null;
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(max/img.width, max/img.height, 1);
        const cv = document.createElement("canvas");
        cv.width  = ~~(img.width*sc);
        cv.height = ~~(img.height*sc);
        cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
        res(cv.toDataURL("image/jpeg",.8));
      };
      img.onerror = () => res(b64);
      img.src = b64;
    });
  } catch { return null; }
}

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const CATS = ["Todo","Tecnología","Moda","Hogar y Deco","Electrodomésticos","Alimentos y Bebidas","Deportes y Fitness","Autos y Motos","Belleza y Cuidado Personal","Bebés y Niños","Libros y Educación","Arte y Manualidades","Mascotas","Herramientas y Construcción","Joyas y Accesorios","Juguetes y Videojuegos","Salud y Bienestar","Oficina y Papelería","Servicios","Otros"];

const STATES = [
  {s:"Distrito Capital",cs:["Caracas","El Valle","La Vega","Antímano","Caricuao","Catia","Coche","El Junquito","Macarao"]},
  {s:"Miranda",cs:["Guarenas","Guatire","Los Teques","Charallave","Cúa","Santa Lucía","San Antonio de los Altos","Ocumare del Tuy","San Francisco de Yare","El Hatillo","Petare","Caucagua","Río Chico","Santa Teresa del Tuy","Carrizal"]},
  {s:"Zulia",cs:["Maracaibo","Cabimas","Ciudad Ojeda","San Francisco","Lagunillas","Machiques","Tía Juana","La Cañada de Urdaneta","Rosario de Perijá","Villa del Rosario","San Carlos del Zulia","El Moján","Paraguaipoa","Gibraltar"]},
  {s:"Carabobo",cs:["Valencia","Puerto Cabello","Guacara","Naguanagua","San Diego","Los Guayos","Mariara","Morón","Tocuyito","Bejuma","Montalbán","Carlos Arvelo"]},
  {s:"Aragua",cs:["Maracay","La Victoria","Cagua","Villa de Cura","Turmero","El Limón","Palo Negro","Las Tejerías","Ocumare de la Costa","San Mateo","Colonia Tovar","San Casimiro"]},
  {s:"Lara",cs:["Barquisimeto","Cabudare","El Tocuyo","Quíbor","Carora","Duaca","Sarare","Sanare","Guarico","Aguada Grande"]},
  {s:"Mérida",cs:["Mérida","El Vigía","Tovar","Ejido","Lagunillas","Mucuchíes","Tabay","Timotes","Aricagua","La Grita"]},
  {s:"Táchira",cs:["San Cristóbal","San Antonio del Táchira","Táriba","Rubio","La Fría","Colón","Ureña","Seboruco","Capacho Nuevo","San Josecito","Coloncito","El Piñal","Pregonero"]},
  {s:"Bolívar",cs:["Ciudad Guayana","Ciudad Bolívar","Upata","El Callao","Tumeremo","Santa Elena de Uairén","Caicara del Orinoco","Maripa","Soledad","Guasipati","La Paragua"]},
  {s:"Anzoátegui",cs:["Barcelona","Puerto La Cruz","Lecherías","El Tigre","Anaco","Cantaura","Píritu","El Tigrito","Clarines","Guanta","Bergantín","Naricual"]},
  {s:"Monagas",cs:["Maturín","Punta de Mata","Temblador","Barrancas del Orinoco","Caripito","El Tejero","Aragua de Maturín","Quiriquire","Uracoa"]},
  {s:"Sucre",cs:["Cumaná","Carúpano","Guiria","Araya","Río Caribe","El Pilar","Cariaco","Yaguaraparo","Casanay","Marigüitar"]},
  {s:"Nueva Esparta",cs:["Porlamar","La Asunción","Juan Griego","Pampatar","El Valle del Espíritu Santo","Villa Rosa","Punta de Piedras","Boca del Río"]},
  {s:"Falcón",cs:["Coro","Punto Fijo","La Vela de Coro","Tucacas","Chichiriviche","Puerto Cumarebo","Churuguara","Santa Ana de Coro","Moruy","Cabure"]},
  {s:"Portuguesa",cs:["Guanare","Araure","Acarigua","Turén","Papelón","Biscucuy","Ospino","Agua Blanca","Chabasquén"]},
  {s:"Yaracuy",cs:["San Felipe","Chivacoa","Yaritagua","Nirgua","Bruzual","La Luz","Urachiche","Cocorote","Aroa","Independencia"]},
  {s:"Trujillo",cs:["Trujillo","Valera","Boconó","Pampán","Pampanito","La Ceiba","Escuque","Motatán","Sabana de Mendoza","Carache","Betijoque"]},
  {s:"Barinas",cs:["Barinas","Barinitas","Socopó","Obispos","Santa Bárbara de Barinas","Sabaneta","Arismendi","Libertad","Pedraza","Torunos","Ciudad Bolivia"]},
  {s:"Guárico",cs:["San Juan de los Morros","Valle de la Pascua","Calabozo","Zaraza","Altagracia de Orituco","El Sombrero","Camaguán","Las Mercedes del Llano","Tucupido"]},
  {s:"Apure",cs:["San Fernando de Apure","Guasdualito","Achaguas","Biruaca","El Amparo","Puerto Páez","El Nula"]},
  {s:"Cojedes",cs:["San Carlos","Tinaquillo","El Baúl","Libertad","Macapo"]},
  {s:"La Guaira",cs:["La Guaira","Maiquetía","Catia La Mar","Naiguatá","Los Caracas","Macuto","Caraballeda","Tanaguarena"]},
  {s:"Delta Amacuro",cs:["Tucupita","Curiapo","Pedernales","Los Castillos","Sierra Imataca"]},
  {s:"Amazonas",cs:["Puerto Ayacucho","San Fernando de Atabapo","San Juan de Manapiare","La Esmeralda","Maroa"]},
];const ALL_LOCS = STATES.flatMap(s => s.cs.map(c => `${c}, ${s.s}`));

const PAY = [
  {id:"pagomovil",label:"PagoMóvil",icon:"🏦",desc:"Transferencia VES interbancaria",color:C.navy},
  {id:"zelle",    label:"Zelle",    icon:"💵",desc:"USD desde banca americana",      color:"#5A24DB"},
  {id:"card",     label:"Tarjeta",  icon:"💳",desc:"Visa/Mastercard USD",            color:C.red}
];
const ST = {
  pending:    {l:"Esperando Pago",     c:"#92400E",bg:"#FEF3C7"},
  submitted:  {l:"Pago Enviado ⏳",   c:C.navy,   bg:C.navyL},
  verified:   {l:"Verificado ✓",      c:C.green,  bg:C.greenL},
  processing: {l:"Preparando 📦",     c:"#5B21B6",bg:"#EDE9FE"},
  shipped:    {l:"En Camino 🚚",      c:"#0369A1",bg:"#E0F2FE"},
  released:   {l:"Completado ✅",     c:"#065F46",bg:C.greenL},
  disputed:   {l:"En Disputa ⚠️",    c:"#991B1B",bg:C.redL},
  rejected:   {l:"Pago Rechazado ✗", c:"#991B1B",bg:C.redL},
  expired:    {l:"Expirado ⏰",       c:C.muted,  bg:C.light},
  pending_payout:{l:"Pago Pendiente 💸",c:"#5B21B6",bg:"#EDE9FE"},
  paid_out:   {l:"Liquidado ✅",      c:"#065F46",bg:C.greenL}
};
// Pickup-specific status label overrides (no "shipped" step — merchant confirms → released directly)
const ST_PICKUP = {...ST,
  processing:{...ST.processing, l:"Listo p/ Retirar 🏪", c:"#065F46", bg:C.greenL},
};
// Delivery flow: pending → submitted → verified → processing → shipped → released
const FLOW_DELIVERY = ["pending","submitted","verified","processing","shipped","released"];
const FL_DELIVERY   = {pending:"Esperando pago",submitted:"Pago enviado",verified:"Verificado",processing:"Preparando",shipped:"En camino 🚚",released:"Completado"};
// Pickup flow:   pending → submitted → verified → processing → released  (no "shipped" — merchant confirms pickup → funds released directly)
const FLOW_PICKUP   = ["pending","submitted","verified","processing","released"];
const FL_PICKUP     = {pending:"Esperando pago",submitted:"Pago enviado",verified:"Verificado",processing:"Listo p/ Retirar 🏪",released:"Completado ✅"};
const KW   = ["iPhone","Samsung","PlayStation","AirPods","Laptop","Zapatos","Nike","Adidas","Bolso","Nevera","Televisor","Café","Reloj","Bicicleta","Ropa","Mueble","Perfume","Bicicleta"];

const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const PAYOUT_HOURS_MIN = 48;
const PAYOUT_HOURS_MAX = 72;
const PLATFORM_FEE_PCT = 0.03; // 3% platform commission
const DEFAULT_MIN_PAYOUT = 10; // $10 minimum, configurable from admin

/* ═══════════════════════════════════════════════
   SEED DATA
═══════════════════════════════════════════════ */
const SU = [
  {id:"admin1",name:"Admin VendeYApp",email:"admin@vendeya.com",password:"admin2024",role:"admin",emailVerified:true,merchantVerified:false,joinedAt:"2023-01-01",following:[],followers:[],storeName:"",storeDesc:"",location:"Caracas, Distrito Capital"},
  {id:"m2",name:"María Rodríguez",email:"maria@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:true,joinedAt:"2023-07-05",storeName:"ModaCaracas",storeDesc:"Moda, calzado y accesorios originales para toda Venezuela. Envíos desde Valencia.",location:"Valencia, Carabobo",pickupAddress:"Av. Bolívar Norte, C.C. Prebo, Local 45-B, Valencia. Mar-Dom 9am-7pm",pickupSchedule:"Martes a Domingo, 9:00am – 7:00pm",following:[],followers:["u1"],bankData:{bank:"Mercantil",account:"01050987654321098765",rif:"J-98765432-1",phone:"0414-9876543",accountHolder:"María Rodríguez"},walletBalance:42.00},
  {id:"m3",name:"Alejandro Fuentes",email:"alex@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:true,joinedAt:"2023-05-20",storeName:"HogarVzla",storeDesc:"Todo para el hogar y la cocina. Electrodomésticos, decoración y más.",location:"Maracaibo, Zulia",following:[],followers:[],bankData:{bank:"Venezuela",account:"01020456789012345678",rif:"J-44444444-4",phone:"0261-1234567",accountHolder:"Alejandro Fuentes"},walletBalance:88.50},
  {id:"m4",name:"Gabriela Torres",email:"gabi@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:true,joinedAt:"2023-09-01",storeName:"SportLife VE",storeDesc:"Ropa deportiva, suplementos y equipos fitness. ¡Vive activo!",location:"Barquisimeto, Lara",following:[],followers:[],bankData:{bank:"Banesco",account:"01340987654321012345",rif:"J-55555555-5",phone:"0251-7654321",accountHolder:"Gabriela Torres"},walletBalance:22.00},
  {id:"m5",name:"Roberto Salcedo",email:"roberto@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:false,joinedAt:"2024-01-10",storeName:"LibrosVE",storeDesc:"Libros nuevos y usados, papelería y artículos educativos.",location:"Mérida, Mérida",following:[],followers:[],bankData:{bank:"Provincial",account:"01080123456789012345",rif:"J-66666666-6",phone:"0274-1234567",accountHolder:"Roberto Salcedo"},walletBalance:0},
  {id:"u1",name:"Pedro López",email:"pedro@demo.com",password:"1234",role:"buyer",emailVerified:true,merchantVerified:false,joinedAt:"2023-09-20",storeName:"",storeDesc:"",location:"Caracas, Distrito Capital",following:["m1","m2"],followers:[]},
  {id:"u2",name:"Ana Martínez",email:"ana@demo.com",password:"1234",role:"buyer",emailVerified:true,merchantVerified:false,joinedAt:"2023-11-05",storeName:"",storeDesc:"",location:"Valencia, Carabobo",following:["m1"],followers:[]},
];
const SP = [
  /* ── TechVzla Store (m1) ── */
  {id:"p1",merchantId:"m1",merchantName:"TechVzla Store",merchantLoc:"Caracas, Distrito Capital",name:"iPhone 13 128GB Negro",price:450,salePrice:null,category:"Tecnología",condition:"used",stock:3,active:true,views:142,image:"https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=70",images:["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=70","https://images.unsplash.com/photo-1592286927505-1def25115558?w=600&q=70"],description:"iPhone 13 en perfectas condiciones. Batería 93%. Caja y cargador originales. Liberado para todas las operadoras.",questions:[{id:"q1",buyerId:"u1",buyerName:"Pedro López",question:"¿Tiene garantía?",answer:"Sí, 30 días de garantía por defecto.",answeredAt:"2024-01-14T12:00:00",createdAt:"2024-01-14T10:00:00"},{id:"q2",buyerId:"u2",buyerName:"Ana Martínez",question:"¿Hace Face ID correctamente?",answer:null,answeredAt:null,createdAt:"2024-02-01T09:00:00"}],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-5",shippingCost:5,freeShipping:false,createdAt:"2024-01-01T00:00:00"},
  {id:"p2",merchantId:"m1",merchantName:"TechVzla Store",merchantLoc:"Caracas, Distrito Capital",name:"AirPods Pro 2da Generación",price:190,salePrice:155,category:"Tecnología",condition:"new",stock:8,active:true,views:89,image:"https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=70",images:["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=70"],description:"AirPods Pro 2da gen. Cancelación de ruido activa, estuche MagSafe. Sellados en caja.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"2-4",shippingCost:0,freeShipping:true,createdAt:"2024-01-05T00:00:00"},
  {id:"p5",merchantId:"m1",merchantName:"TechVzla Store",merchantLoc:"Caracas, Distrito Capital",name:"Monitor LG 27 4K UHD",price:280,salePrice:249,category:"Tecnología",condition:"new",stock:2,active:true,views:115,image:"https://images.unsplash.com/photo-1527443224154-c4a573d5b7a3?w=600&q=70",images:["https://images.unsplash.com/photo-1527443224154-c4a573d5b7a3?w=600&q=70"],description:"LG 27 pulgadas 4K IPS, 60Hz, HDR10. Cable HDMI incluido. Sellado en caja.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-5",shippingCost:10,freeShipping:false,createdAt:"2024-01-20T00:00:00"},
  {id:"p9",merchantId:"m1",merchantName:"TechVzla Store",merchantLoc:"Caracas, Distrito Capital",name:"MacBook Air M2 8GB 256GB",price:980,salePrice:920,category:"Tecnología",condition:"new",stock:1,active:true,views:310,image:"https://images.unsplash.com/photo-1611186871525-46e5c92a4a67?w=600&q=70",images:["https://images.unsplash.com/photo-1611186871525-46e5c92a4a67?w=600&q=70"],description:"MacBook Air M2 color Midnight. 8GB RAM, 256GB SSD. Garantía Apple 1 año. Sin uso.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"2-4",shippingCost:0,freeShipping:true,createdAt:"2024-02-01T00:00:00"},
  {id:"p10",merchantId:"m1",merchantName:"TechVzla Store",merchantLoc:"Caracas, Distrito Capital",name:"Samsung Galaxy S24 Ultra 256GB",price:860,salePrice:null,category:"Tecnología",condition:"new",stock:4,active:true,views:203,image:"https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=70",images:["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=70"],description:"Samsung Galaxy S24 Ultra 256GB. Titanio negro. Cámara 200MP, S-Pen incluido. Sellado.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-5",shippingCost:8,freeShipping:false,createdAt:"2024-02-10T00:00:00"},
  {id:"p11",merchantId:"m1",merchantName:"TechVzla Store",merchantLoc:"Caracas, Distrito Capital",name:"PlayStation 5 Slim + 2 Joysticks",price:550,salePrice:499,category:"Tecnología",condition:"new",stock:2,active:true,views:445,image:"https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&q=70",images:["https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&q=70"],description:"PS5 Slim edición digital con dos controles DualSense. Sin juegos incluidos. Sellado en caja.",questions:[],allowsPickup:true,allowsDelivery:false,deliveryDays:"",shippingCost:0,freeShipping:false,createdAt:"2024-02-15T00:00:00"},
  /* ── ModaCaracas (m2) ── */
  {id:"p3",merchantId:"m2",merchantName:"ModaCaracas",merchantLoc:"Valencia, Carabobo",name:"Nike Air Max 270 Talla 42",price:95,salePrice:79,category:"Moda",condition:"new",stock:10,active:true,views:201,image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=70",images:["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=70","https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=70"],description:"Nike Air Max 270 T42. Nuevas en caja. 100% auténticas con etiquetas.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"4-7",shippingCost:6,freeShipping:false,createdAt:"2024-01-10T00:00:00"},
  {id:"p4",merchantId:"m2",merchantName:"ModaCaracas",merchantLoc:"Valencia, Carabobo",name:"Bolso Michael Kors Original",price:120,salePrice:null,category:"Moda",condition:"new",stock:2,active:true,views:67,image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=70",images:["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=70"],description:"Bolso MK original. Negro, talla mediana. Certificado de autenticidad incluido.",questions:[],allowsPickup:false,allowsDelivery:true,deliveryDays:"5-8",shippingCost:7,freeShipping:false,createdAt:"2024-01-15T00:00:00"},
  {id:"p12",merchantId:"m2",merchantName:"ModaCaracas",merchantLoc:"Valencia, Carabobo",name:"Vestido Casual de Verano",price:38,salePrice:28,category:"Moda",condition:"new",stock:15,active:true,views:88,image:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=70",images:["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=70"],description:"Vestido floral tallas S/M/L/XL disponibles. Tela liviana, perfecto para el clima venezolano.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"4-6",shippingCost:4,freeShipping:false,createdAt:"2024-02-05T00:00:00"},
  {id:"p13",merchantId:"m2",merchantName:"ModaCaracas",merchantLoc:"Valencia, Carabobo",name:"Perfume Armani Code 100ml",price:85,salePrice:72,category:"Moda",condition:"new",stock:6,active:true,views:134,image:"https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=70",images:["https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=70"],description:"Armani Code Homme 100ml. Original sellado. Fragancia maderada y especiada.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-5",shippingCost:0,freeShipping:true,createdAt:"2024-02-12T00:00:00"},
  /* ── HogarVzla (m3) ── */
  {id:"p14",merchantId:"m3",merchantName:"HogarVzla",merchantLoc:"Maracaibo, Zulia",name:"Cafetera Nespresso Vertuo",price:145,salePrice:119,category:"Hogar",condition:"new",stock:5,active:true,views:167,image:"https://images.unsplash.com/photo-1520970014086-2208d157c9e2?w=600&q=70",images:["https://images.unsplash.com/photo-1520970014086-2208d157c9e2?w=600&q=70"],description:"Cafetera Nespresso Vertuo Pop. Cápsulas compatibles. Capacidad 600ml. Sellada con garantía.",questions:[{id:"q3",buyerId:"u1",buyerName:"Pedro López",question:"¿Las cápsulas están incluidas?",answer:null,answeredAt:null,createdAt:"2024-02-20T08:00:00"}],allowsPickup:true,allowsDelivery:true,deliveryDays:"5-8",shippingCost:8,freeShipping:false,createdAt:"2024-01-25T00:00:00"},
  {id:"p15",merchantId:"m3",merchantName:"HogarVzla",merchantLoc:"Maracaibo, Zulia",name:"Silla de Escritorio Ergonómica",price:190,salePrice:165,category:"Hogar",condition:"new",stock:3,active:true,views:92,image:"https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=70",images:["https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=70"],description:"Silla gaming/oficina con soporte lumbar, apoyabrazos 4D, altura ajustable. Carga hasta 130kg.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"5-10",shippingCost:15,freeShipping:false,createdAt:"2024-02-01T00:00:00"},
  {id:"p16",merchantId:"m3",merchantName:"HogarVzla",merchantLoc:"Maracaibo, Zulia",name:"Licuadora Oster 1200W",price:55,salePrice:null,category:"Hogar",condition:"new",stock:12,active:true,views:56,image:"https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=70",images:["https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=70"],description:"Licuadora Oster 6 velocidades 1200W. Jarra de vidrio 1.5L. Resistente y silenciosa.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"4-7",shippingCost:6,freeShipping:false,createdAt:"2024-02-08T00:00:00"},
  {id:"p17",merchantId:"m3",merchantName:"HogarVzla",merchantLoc:"Maracaibo, Zulia",name:"Juego de Sábanas King Premium",price:42,salePrice:35,category:"Hogar",condition:"new",stock:20,active:true,views:44,image:"https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=70",images:["https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=70"],description:"Sábanas king 600 hilos, algodón egipcio. Set completo: sabana plana, ajustable y 2 fundas.",questions:[],allowsPickup:false,allowsDelivery:true,deliveryDays:"4-6",shippingCost:5,freeShipping:false,createdAt:"2024-02-14T00:00:00"},
  /* ── SportLife VE (m4) ── */
  {id:"p18",merchantId:"m4",merchantName:"SportLife VE",merchantLoc:"Barquisimeto, Lara",name:"Whey Protein Gold Standard 5lb",price:75,salePrice:65,category:"Deportes",condition:"new",stock:25,active:true,views:189,image:"https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=70",images:["https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=70"],description:"ON Gold Standard 100% Whey 5lb Double Rich Chocolate. 24g proteína por scoop. Original sellado.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-6",shippingCost:0,freeShipping:true,createdAt:"2024-01-18T00:00:00"},
  {id:"p19",merchantId:"m4",merchantName:"SportLife VE",merchantLoc:"Barquisimeto, Lara",name:"Guantes de Boxeo Everlast 16oz",price:48,salePrice:null,category:"Deportes",condition:"new",stock:8,active:true,views:63,image:"https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=70",images:["https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=70"],description:"Guantes Everlast Pro Style 16oz. Cuero sintético, relleno de espuma moldeable. Color negro.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"4-7",shippingCost:5,freeShipping:false,createdAt:"2024-01-28T00:00:00"},
  {id:"p20",merchantId:"m4",merchantName:"SportLife VE",merchantLoc:"Barquisimeto, Lara",name:"Bicicleta Estática Spinning Pro",price:320,salePrice:275,category:"Deportes",condition:"new",stock:3,active:true,views:241,image:"https://images.unsplash.com/photo-1520395012680-dd3a3d4f08e4?w=600&q=70",images:["https://images.unsplash.com/photo-1520395012680-dd3a3d4f08e4?w=600&q=70"],description:"Bicicleta spinning profesional. Resistencia magnética, pantalla LCD, soporte tablet. Armado incluido.",questions:[],allowsPickup:true,allowsDelivery:false,deliveryDays:"",shippingCost:0,freeShipping:false,createdAt:"2024-02-06T00:00:00"},
  {id:"p21",merchantId:"m4",merchantName:"SportLife VE",merchantLoc:"Barquisimeto, Lara",name:"Mancuernas Ajustables 40kg Set",price:89,salePrice:79,category:"Deportes",condition:"new",stock:10,active:true,views:112,image:"https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=70",images:["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=70"],description:"Set mancuernas ajustables 2-40kg. 18 ajustes. Sistema de seguridad automático. Funda incluida.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"5-8",shippingCost:12,freeShipping:false,createdAt:"2024-02-18T00:00:00"},
  /* ── LibrosVE (m5) ── */
  {id:"p6",merchantId:"m5",merchantName:"LibrosVE",merchantLoc:"Mérida, Mérida",name:"Café Premium Mérida 1kg",price:18,salePrice:null,category:"Alimentos",condition:"new",stock:50,active:true,views:33,image:"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=70",images:["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=70"],description:"Café de especialidad región Mérida. Tostado medio, bolsa hermética resellable.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-6",shippingCost:4,freeShipping:false,createdAt:"2024-01-25T00:00:00"},
  {id:"p22",merchantId:"m5",merchantName:"LibrosVE",merchantLoc:"Mérida, Mérida",name:"Atomic Habits - James Clear",price:12,salePrice:null,category:"Libros",condition:"new",stock:30,active:true,views:78,image:"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=70",images:["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=70"],description:"Atomic Habits en español. Edición tapa dura. Cómo crear buenos hábitos y eliminar los malos.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-7",shippingCost:3,freeShipping:false,createdAt:"2024-01-30T00:00:00"},
  {id:"p23",merchantId:"m5",merchantName:"LibrosVE",merchantLoc:"Mérida, Mérida",name:"Pack 5 Libros de Autoayuda",price:45,salePrice:35,category:"Libros",condition:"new",stock:15,active:true,views:55,image:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=70",images:["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=70"],description:"Pack: Hábitos Atómicos, El Poder del Ahora, Piensa y Hazte Rico, El Monje que Vendió su Ferrari, Padre Rico.",questions:[],allowsPickup:true,allowsDelivery:true,deliveryDays:"3-7",shippingCost:0,freeShipping:true,createdAt:"2024-02-20T00:00:00"},
]
const SO = [{
  id:"ord01",buyerId:"u1",buyerName:"Pedro López",
  paymentMethod:"zelle",paymentRef:"ZL-20240115-8893",paymentProofImg:null,
  status:"verified",deliveryType:"delivery",address:"Urb. La Castellana, Caracas",
  grandTotal:160,shippingTotal:5,
  deadline:null,createdAt:"2024-01-15T10:00:00",updatedAt:"2024-01-20T15:00:00",
  vendors:[{
    merchantId:"m1",merchantName:"TechVzla Store",
    items:[{productId:"p2",qty:1,product:SP[1]}],
    subtotal:155,shippingCost:5,platformFee:4.80,merchantAmount:155.20,
    status:"released",shippingGuide:null,
    review:{rating:5,comment:"Excelente vendedor, producto impecable.",productId:"p2",productName:"AirPods Pro 2da Generación",productImage:"https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200&q=70",createdAt:"2024-01-20T15:00:00"},
    payoutStatus:"paid_out",payoutScheduledAt:"2024-01-22T15:00:00",payoutCompletedAt:"2024-01-22T18:00:00",
    disputeReason:null,disputeDesc:null,disputeAt:null,disputeResolution:null,disputeNote:null
  }]
}];

/* ═══════════════════════════════════════════════
   MICRO UI COMPONENTS
═══════════════════════════════════════════════ */
function Stars({ v=0, size=14, onChange }) {
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

function Pill({ label, c=C.red, bg, icon, sx={}, solid=false }) {
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

function HR() { return <div style={{height:1,background:C.border,margin:"12px 0"}} />; }

function Spin({ dark, size=16 }) {
  return (
    <div style={{
      width:size,height:size,
      border:`2px solid ${dark?"rgba(0,0,0,.12)":"rgba(255,255,255,.25)"}`,
      borderTopColor:dark?C.navy:"#fff",
      borderRadius:"50%",animation:"vy-spin .7s linear infinite",flexShrink:0
    }} />
  );
}

function Img({ src, alt="" }) {
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
function LocationPicker({ value, onChange, placeholder="📍 Seleccionar ciudad" }) {
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
function Countdown({ deadline, onExpire }) {
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

const btn = (bg=C.red, co="#fff") => ({
  background:bg,color:co,border:"none",borderRadius:8,
  padding:"9px 16px",fontSize:13,fontWeight:600,cursor:"pointer",
  fontFamily:Fb,display:"inline-flex",alignItems:"center",gap:5,
  transition:"opacity .15s",lineHeight:1.3
});
const inp = {
  width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,
  borderRadius:8,fontSize:13,fontFamily:Fb,color:C.text,background:"#fff",
  outline:"none",boxSizing:"border-box"
};
const card = {
  background:C.white,borderRadius:12,border:`1px solid ${C.border}`,
  boxShadow:"0 1px 6px rgba(0,0,0,.05)"
};

/* ═══════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════ */
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

  const [page,      setPage]      = useState("landing")
  const [params,    setParams]    = useState({})
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
  const nav = useCallback((pg, ps={}) => {
    setPage(pg); setParams(ps); window.scrollTo(0,0)
    window.history.pushState({pg,ps}, "", pg==="landing" ? "/" : `/${pg}`)
  }, [])

  useEffect(() => {
    const onPop = e => { const s=e.state||{pg:"landing",ps:{}}; setPage(s.pg||"landing"); setParams(s.ps||{}); window.scrollTo(0,0) }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Derived
  const cartCount = cart.reduce((s,i)=>s+i.qty, 0)
  const cartTotal = cart.reduce((s,i)=>s+(i.product.salePrice||i.product.price)*i.qty, 0)
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
    if(!result?.error) nav("order-detail", {orderId})
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
    upU:            async () => {},
    setUser:        () => {},
    verifyMerchant: actions.adminVerifyMerchant,
    toggleDisable:  actions.adminToggleDisable,
    // Products
    upP:            async () => {},
    adminDisableProduct:  actions.adminDisableProduct,
    adminEnableProduct:   actions.adminEnableProduct,
    // Orders
    upO:            async () => {},
    placeOrder,
    updateStatus:   actions.updateOrderStatus,
    submitReview:   (orderId, rating, comment, vendorMerchantId) =>
      actions.submitReview({ orderId, merchantId:vendorMerchantId, rating, comment }),
    // Cart
    addToCart:      actions.addToCart,
    removeFromCart: actions.removeFromCart,
    setCartQty:     actions.setCartQty,
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
    upN:            async () => {},
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
      <Header {...ctx} />
      <main style={{paddingBottom:80,background:C.bg,minHeight:"calc(100vh - 64px)"}}>
        {page==="landing"            && <LandingPage      {...ctx} />}
        {page==="browse"             && <BrowsePage       {...ctx} />}
        {page==="product"            && <ProductPage      {...ctx} />}
        {page==="merchant-profile"   && <MerchantProfile  {...ctx} />}
        {page==="cart"               && <CartPage         {...ctx} />}
        {page==="checkout"           && <CheckoutPage     {...ctx} />}
        {(page==="login"||page==="register") && <AuthPage {...ctx} initMode={page} />}
        {page==="favorites"          && <FavoritesPage    {...ctx} />}
        {page==="my-orders"          && <MyOrdersPage     {...ctx} />}
        {page==="order-detail"       && <OrderDetailPage  {...ctx} />}
        {page==="notifications"      && <NotificationsPage {...ctx} />}
        {page==="merchant-dash"      && <MerchantDash     {...ctx} />}
        {page==="merchant-products"  && <MerchantProducts {...ctx} />}
        {page==="merchant-add"       && <MerchantAddEdit  {...ctx} />}
        {page==="merchant-orders"    && <MerchantOrders   {...ctx} />}
        {page==="merchant-analytics" && <MerchantAnalytics {...ctx} />}
        {page==="merchant-qa"        && <MerchantQA       {...ctx} />}
        {page==="payouts"            && <PayoutsPage      {...ctx} />}
        {page==="bank-settings"      && <BankSettingsPage {...ctx} />}
        {user?.role==="admin" && page==="admin" && <AdminPanel {...ctx} />}
      </main>
      {toast && (
        <div style={{position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",background:toast.isError?"#7F1D1D":C.navy,color:"#fff",padding:"11px 24px",borderRadius:12,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:"0 8px 28px rgba(0,0,0,.25)",maxWidth:"92vw",textAlign:"center",animation:"vy-fade .2s ease",pointerEvents:"none"}}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function useDragScroll() {
  const elRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const onMouseDown = e => {
    isDown.current = true;
    startX.current = e.pageX - elRef.current.offsetLeft;
    scrollLeft.current = elRef.current.scrollLeft;
    elRef.current.style.cursor = "grabbing";
  };
  const onMouseLeave = () => { isDown.current = false; if(elRef.current) elRef.current.style.cursor = "grab"; };
  const onMouseUp    = () => { isDown.current = false; if(elRef.current) elRef.current.style.cursor = "grab"; };
  const onMouseMove  = e => {
    if(!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - elRef.current.offsetLeft;
    elRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5;
  };
  return { elRef, onMouseDown, onMouseLeave, onMouseUp, onMouseMove };
}

function Header({ user,cartCount,unread,nav,logout,markAllRead,products }) {
  const [menu, setMenu] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const ref = useRef(null);
  const drag = useDragScroll();
  useEffect(() => {
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown",h);
    return () => document.removeEventListener("mousedown",h);
  },[]);

  return (
    <div style={{background:C.navy,position:"sticky",top:0,zIndex:300,boxShadow:"0 2px 14px rgba(0,0,0,.22)"}}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"0 12px",height:58,display:"flex",alignItems:"center",gap:10}}>
        {/* Logo */}
        <div onClick={() => nav("landing")} style={{cursor:"pointer",display:"flex",alignItems:"center",flexShrink:0}}>
          <div style={{lineHeight:1.1}}>
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:17,color:"#fff",letterSpacing:"-.3px",whiteSpace:"nowrap"}}>VendeY<span style={{color:C.gold}}>App</span></div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:".8px",textTransform:"uppercase"}}>Venezuela</div>
          </div>
        </div>

        {/* Search - centered, hidden on small mobile */}
        <div style={{flex:1,display:"flex",justifyContent:"center",minWidth:0}}>
          <div style={{width:"100%",maxWidth:520}} className="hide-sm-search">
            <SmartSearch products={products} nav={nav} />
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {cartCount > 0 && (
            <button className="hop" onClick={() => nav("cart")}
              style={{padding:"6px 12px",fontSize:12,fontWeight:700,background:"rgba(255,255,255,.18)",color:"#fff",border:"1.5px solid rgba(255,255,255,.35)",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>🛒 {cartCount}</button>
          )}
          {!user ? (
            <>
              <button className="hop" onClick={() => nav("login")}
                style={{...btn("rgba(255,255,255,.1)","rgba(255,255,255,.88)"),border:"1px solid rgba(255,255,255,.18)",padding:"6px 11px",fontSize:12}}>Entrar</button>
              <button className="hop" onClick={() => nav("register")}
                style={{...btn(C.red),padding:"6px 13px",fontSize:12}}>Registro</button>
            </>
          ) : (
            <div style={{position:"relative",display:"flex",gap:6}} ref={ref}>
              <button className="hop" onClick={() => { nav("notifications"); markAllRead(); }}
                style={{...btn("rgba(255,255,255,.1)","rgba(255,255,255,.88)"),padding:"6px 10px",position:"relative",border:"1px solid rgba(255,255,255,.14)"}}>
                🔔
                {unread > 0 && (
                  <span style={{position:"absolute",top:-3,right:-3,background:C.red,color:"#fff",fontSize:8,fontWeight:700,width:15,height:15,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread>9?"9+":unread}</span>
                )}
              </button>
              <button className="hop" onClick={() => setMenu(v=>!v)}
                style={{...btn("rgba(255,255,255,.1)","#fff"),padding:"5px 10px",fontSize:12,border:"1px solid rgba(255,255,255,.14)",gap:6}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:C.red,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{user.name[0].toUpperCase()}</div>
                <span className="hide-sm">{user.name.split(" ")[0]}</span>
              </button>
              {menu && (
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:6,minWidth:210,boxShadow:"0 12px 32px rgba(0,0,0,.15)",zIndex:400,animation:"vy-fade .15s ease"}} onClick={() => setMenu(false)}>
                  <div style={{padding:"8px 12px 7px",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                    <div style={{fontWeight:700,fontSize:13}}>{user.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{user.email}</div>
                  </div>
                  <MI icon="📦" label="Mis Compras"          onClick={() => nav("my-orders")} />
                  <MI icon="❤️" label="Mis Favoritos"        onClick={() => nav("favorites")} />
                  {user.role==="merchant" && (
                    <>
                      <MI icon="📊" label="Mi Tienda"           onClick={() => nav("merchant-dash")} />
                      <MI icon="🛍️" label="Mis Productos"       onClick={() => nav("merchant-products")} />
                      <MI icon="📋" label="Pedidos Recibidos"   onClick={() => nav("merchant-orders")} />
                      <MI icon="📈" label="Analytics"           onClick={() => nav("merchant-analytics")} />
                      <MI icon="💸" label="Mis Liquidaciones"   onClick={() => nav("payouts")} />
                      <MI icon="🏦" label="Mi Cuenta Bancaria"  onClick={() => nav("bank-settings")} />
                    </>
                  )}
                  {user.role==="admin" && <MI icon="⚙️" label="Panel Admin" onClick={() => nav("admin")} />}
                  <HR />
                  <MI icon="🚪" label="Cerrar Sesión" onClick={logout} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category bar */}
      <div style={{background:C.navyD,borderTop:"1px solid rgba(255,255,255,.07)",overflowX:"auto",scrollbarWidth:"none"}}>
        <div ref={drag.elRef} style={{display:"flex",gap:0,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",cursor:"grab",userSelect:"none"}} className="cats-scroll"
          onMouseDown={drag.onMouseDown} onMouseLeave={drag.onMouseLeave} onMouseUp={drag.onMouseUp} onMouseMove={drag.onMouseMove}>
          {CATS.filter(c => c!=="Todo").map(c => (
            <button key={c} className="hop" onClick={() => nav("browse",{cat:c})}
              style={{...btn("transparent","rgba(255,255,255,.65)"),padding:"6px 13px",fontSize:11,borderRadius:0,whiteSpace:"nowrap",fontWeight:500,flexShrink:0}}>{c}</button>
          ))}
        </div>
      </div>

      {/* Mobile search bar */}
      <div style={{display:"none"}} className="mobile-search-bar">
        <div style={{padding:"6px 12px 8px",background:C.navyD}}>
          <SmartSearch products={products} nav={nav} />
        </div>
      </div>

      <style>{`
        @media(max-width:640px){
          .hide-sm-search{display:none!important}
          .mobile-search-bar{display:block!important}
        }
      `}</style>
    </div>
  );
}
function MI({ icon,label,onClick }) {
  const [h,setH]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{padding:"9px 12px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:9,fontSize:13,background:h?C.light:"transparent"}}>
      <span>{icon}</span><span style={{fontWeight:500,color:C.text}}>{label}</span>
    </div>
  );
}

/* SMART SEARCH */
function SmartSearch({ products, nav }) {
  const [q,     setQ]     = useState("");
  const [focus, setFocus] = useState(false);
  const [res,   setRes]   = useState({prods:[],kws:[],cats:[]});
  const wRef=useRef(null), iRef=useRef(null);
  useEffect(() => {
    const h = e => { if(wRef.current && !wRef.current.contains(e.target)) setFocus(false); };
    document.addEventListener("mousedown",h);
    return () => document.removeEventListener("mousedown",h);
  },[]);
  useEffect(() => {
    if(!q.trim()) { setRes({prods:[],kws:[],cats:[]}); return; }
    const lq = q.toLowerCase();
    setRes({
      prods:products.filter(p => p.active && [p.name,p.merchantName,p.category,p.description].some(s=>s?.toLowerCase().includes(lq))).slice(0,5),
      kws:  KW.filter(k => k.toLowerCase().includes(lq)).slice(0,3),
      cats: CATS.filter(c => c!=="Todo" && c.toLowerCase().includes(lq)).slice(0,2)
    });
  },[q,products]);
  const go = () => { if(q.trim()) { nav("browse",{search:q.trim()}); setFocus(false); setQ(""); } };
  const hasSug = res.prods.length||res.kws.length||res.cats.length;
  return (
    <div ref={wRef} style={{position:"relative",width:"100%"}}>
      <div style={{display:"flex",background:"rgba(255,255,255,.12)",borderRadius:8,border:"1px solid rgba(255,255,255,.18)",overflow:"hidden"}}>
        <input ref={iRef} value={q} onChange={e=>setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onKeyDown={e => e.key==="Enter"&&go()}
          placeholder="Busca productos, marcas, categorías…"
          className="si"
          style={{flex:1,padding:"8px 13px",background:"transparent",border:"none",fontSize:13,color:"#fff",outline:"none",fontFamily:Fb}} />
        <button onClick={go} style={{background:"transparent",border:"none",padding:"0 12px",fontSize:16,cursor:"pointer",color:"rgba(255,255,255,.7)",flexShrink:0,display:"flex",alignItems:"center"}}>🔍</button>
      </div>
      {focus && (q.trim() ? hasSug : true) && (
        <div style={{position:"absolute",top:"calc(100% + 5px)",left:0,right:0,background:C.white,borderRadius:10,boxShadow:"0 12px 36px rgba(0,0,0,.18)",border:`1px solid ${C.border}`,zIndex:500,overflow:"hidden",animation:"vy-fade .15s ease"}}>
          {!q.trim() && (
            <div style={{padding:"11px 13px"}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:7}}>Populares</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {KW.slice(0,10).map(k => (
                  <span key={k} onClick={() => { setQ(k); iRef.current?.focus(); }}
                    style={{background:C.light,color:C.muted,fontSize:11,padding:"3px 9px",borderRadius:20,cursor:"pointer",fontWeight:600}}>{k}</span>
                ))}
              </div>
            </div>
          )}
          {q.trim() && hasSug && (
            <div>
              {res.cats.map(c => (
                <div key={c} onClick={() => { nav("browse",{cat:c}); setFocus(false); setQ(""); }}
                  style={{padding:"9px 13px",cursor:"pointer",fontSize:13,display:"flex",gap:8}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.light}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  📂 {c}
                </div>
              ))}
              {res.kws.map(k => (
                <div key={k} onClick={() => { setQ(k); setTimeout(go,50); }}
                  style={{padding:"9px 13px",cursor:"pointer",fontSize:13,display:"flex",gap:8}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.light}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  🔍 {k}
                </div>
              ))}
              {res.prods.length > 0 && (
                <>
                  <HR />
                  <div style={{padding:"4px 13px 10px"}}>
                    {res.prods.map(p => (
                      <div key={p.id} onClick={() => { nav("product",{productId:p.id}); setFocus(false); setQ(""); }}
                        style={{display:"flex",gap:9,alignItems:"center",padding:"7px 6px",borderRadius:7,cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.light}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{width:38,height:38,borderRadius:6,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={p.image} /></div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                          <div style={{fontSize:10,color:C.muted}}>{p.merchantName}</div>
                        </div>
                        <div style={{fontFamily:Fh,fontWeight:800,fontSize:13,color:C.red,flexShrink:0}}>{fU(p.salePrice||p.price)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   SEO + SCHEMA.ORG — useSchema hook
   Injects JSON-LD structured data per page.
   Covers: WebSite, Organization, Product,
   LocalBusiness, BreadcrumbList, SearchAction.
   Target: Google Rich Results, AI overviews (AEO),
   LLM knowledge graphs, geo-local pack.
═══════════════════════════════════════════════ */
const APP_URL  = "https://vendeya.app";
const APP_NAME = "VendeYApp";
const APP_DESC = "Marketplace venezolano de compra y venta online. Productos nuevos y usados con pago seguro en Bolívares, PagoMóvil y Zelle.";
const APP_LOGO = `${APP_URL}/logo.png`;
const APP_GEO  = { country:"VE", region:"Caracas, Venezuela", lat:10.4806, lng:-66.9036 };

function useSchema(schemas) {
  React.useEffect(() => {
    const id = "vy-jsonld";
    let el = document.getElementById(id);
    if(!el) { el = document.createElement("script"); el.id = id; el.type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : { "@context":"https://schema.org", "@graph": schemas });
    return () => { /* keep on unmount — updated on next page */ };
  }, [JSON.stringify(schemas)]);
}

function useDocTitle(title) {
  React.useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} — Marketplace Venezuela`;
  }, [title]);
}

function useMeta(desc) {
  React.useEffect(() => {
    let el = document.querySelector('meta[name="description"]');
    if(!el) { el = document.createElement("meta"); el.name = "description"; document.head.appendChild(el); }
    el.content = desc || APP_DESC;
    let ogEl = document.querySelector('meta[property="og:description"]');
    if(!ogEl) { ogEl = document.createElement("meta"); ogEl.setAttribute("property","og:description"); document.head.appendChild(ogEl); }
    ogEl.content = desc || APP_DESC;
  }, [desc]);
}


/* Heart icon — saved/unsaved state */
function HeartIcon({ saved, size=18 }) {
  return saved ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#E53E3E" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}


function PCard({ product, nav, addToCart, rate, rateLabel, favs=[], toggleFav }) {
  const ep    = product.salePrice && product.salePrice < product.price;
  const price = ep ? product.salePrice : product.price;
  const disc  = ep ? Math.round((1-product.salePrice/product.price)*100) : 0;
  const noStock = product.stock === 0 || !product.active;
  return (
    <div className="lift" style={{...card,overflow:"hidden",cursor:"pointer",transition:"all .2s",display:"flex",flexDirection:"column",height:"100%"}}>
      <div onClick={() => nav("product",{productId:product.id})} style={{aspectRatio:"1/1",background:C.light,overflow:"hidden",position:"relative",flexShrink:0}}>
        <Img src={product.image} alt={product.name} />
        {/* Pills over image */}
        <div style={{position:"absolute",top:7,left:7,display:"flex",gap:4,flexWrap:"wrap",maxWidth:"calc(100% - 14px)"}}>
          <Pill label={product.condition==="new"?"Nuevo":"Usado"} c={product.condition==="new"?C.navy:C.slate} solid />
          {disc > 0 && <Pill label={`-${disc}%`} c={C.red} solid />}
        </div>
        {/* Fav heart */}
        {product.stock > 0 && product.stock <= 2 && !product.freeShipping && (
          <div style={{position:"absolute",bottom:7,left:7}}><Pill label={`¡Último! ${product.stock} disp.`} c={C.amber} solid /></div>
        )}
        {product.freeShipping && product.stock > 0 && (
          <div style={{position:"absolute",bottom:7,right:7}}><Pill label="🚚 GRATIS" c={C.teal} solid /></div>
        )}
        {noStock && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Pill label="Sin Stock" c="#fff" bg="rgba(0,0,0,.6)" sx={{fontSize:13,padding:"5px 13px"}} />
          </div>
        )}
      </div>
      <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",flex:1}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{product.category} · 📍{product.merchantLoc}</div>
        <div onClick={() => nav("product",{productId:product.id})} style={{fontWeight:600,fontSize:13,marginBottom:5,lineHeight:1.35,flex:1,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{product.name}</div>
        <div style={{marginBottom:4}}>
          {ep && <span style={{fontSize:11,color:C.muted,textDecoration:"line-through",marginRight:5}}>{fU(product.price)}</span>}
          <span style={{fontFamily:Fh,fontWeight:800,fontSize:16,color:C.red}}>{fU(price)}</span>
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:9}}>{fBs(price,rate)} · {rateLabel}</div>
        {product.freeShipping && !noStock && (
          <div style={{fontSize:10,color:C.teal,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
            <span>🚚</span><span>Envío GRATIS</span>
          </div>
        )}
        {!product.freeShipping && (product.shippingCost||0) > 0 && !noStock && (
          <div style={{fontSize:10,color:C.muted,marginBottom:4}}>🚚 Envío: {fU(product.shippingCost)}</div>
        )}
        <button className="hop"
          onClick={e => { e.stopPropagation(); addToCart(product); }}
          disabled={noStock}
          style={{...btn(noStock?C.light:C.red,noStock?C.muted:"#fff"),padding:"7px",fontSize:12,width:"100%",justifyContent:"center",cursor:noStock?"not-allowed":"pointer"}}>
          {noStock ? "Sin Stock" : "+ Agregar"}
        </button>
      </div>
    </div>
  );
}

function PGrid({ items, nav, addToCart, rate, rateLabel }) {
  return (
    <div className="vy-grid">
      {items.map(p => <PCard key={p.id} product={p} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel} />)}
    </div>
  );
}

function Section({ title, items, nav, addToCart, rate, rateLabel, onMore, favs=[], toggleFav }) {
  if(!items.length) return null;
  return (
    <div style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontFamily:Fh,margin:0,fontSize:17,fontWeight:800}}>{title}</h2>
        {onMore && <button className="hop" onClick={onMore} style={{...btn(C.light,C.muted),padding:"5px 12px",fontSize:12}}>Ver todos →</button>}
      </div>
      <PGrid items={items} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel} favs={favs} toggleFav={toggleFav} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LANDING
═══════════════════════════════════════════════ */
function LandingPage({ products, nav, addToCart, rate, rateLabel, users, favs=[], toggleFav }) {
  useDocTitle(null);
  useMeta(APP_DESC);
  useSchema([{
    "@context":"https://schema.org",
    "@type":"ItemList",
    "name":"Productos destacados en VendeYApp",
    "description":"Los mejores productos del marketplace venezolano",
    "itemListElement": products.filter(p=>p.active&&p.stock>0&&p.salePrice).slice(0,12).map((p,i)=>({
      "@type":"ListItem","position":i+1,
      "item":{ "@type":"Product","name":p.name,"image":p.image,"description":p.description||p.name,
        "offers":{"@type":"Offer","price":p.salePrice||p.price,"priceCurrency":"USD","availability":"https://schema.org/InStock"}}
    }))
  }]);
  const f      = products.filter(p => p.active && p.stock > 0);
  const sorted = [...f].sort((a,b) => (a.salePrice||a.price)-(b.salePrice||b.price));
  const CATS_ICONS = [["Tecnología","💻"],["Moda","👟"],["Hogar","🏠"],["Deportes","🏋️"],["Alimentos","☕"],["Libros","📚"]];
  const merchants = (users||[]).filter(u => u.role==="merchant" && u.merchantVerified);

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{background:`linear-gradient(135deg,${C.navyD} 0%,#1a2744 60%,#22184a 100%)`,padding:"44px 16px 56px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,right:-60,width:340,height:340,borderRadius:"50%",background:C.red+"0E",pointerEvents:"none"}} />
        <div style={{position:"absolute",bottom:-60,left:-40,width:280,height:280,borderRadius:"50%",background:C.gold+"0A",pointerEvents:"none"}} />
        <div style={{position:"absolute",top:"50%",left:"55%",width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.02)",pointerEvents:"none"}} />
        <div style={{maxWidth:660,margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,107,74,.15)",border:"1px solid rgba(255,107,74,.3)",borderRadius:20,padding:"4px 16px",marginBottom:18}}>
            <span>🇻🇪</span><span style={{color:"#FF9A7A",fontSize:11,fontWeight:700,letterSpacing:.5}}>EL MARKETPLACE SEGURO DE VENEZUELA</span>
          </div>
          <h1 style={{fontFamily:Fh,color:"#fff",fontSize:"clamp(24px,5vw,48px)",margin:"0 0 14px",lineHeight:1.08,fontWeight:900,letterSpacing:"-.5px"}}>
            Compra y vende<br /><span style={{color:"#FF6B4A"}}>sin riesgos</span>
          </h1>
          <p style={{color:"rgba(255,255,255,.65)",fontSize:15,margin:"0 0 28px",lineHeight:1.7}}>
            Pagos protegidos · Vendedores verificados<br />
            <span style={{color:"rgba(255,255,255,.85)",fontWeight:600}}>PagoMóvil · Zelle · Tarjeta</span>
          </p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            <button className="hop" onClick={() => nav("browse")} style={{...btn(C.red),padding:"13px 28px",fontSize:15,fontWeight:700,boxShadow:"0 4px 20px rgba(220,38,38,.4)"}}>Ver Productos 🛍️</button>
            <button className="hop" onClick={() => nav("register")} style={{...btn("rgba(255,255,255,.1)","#fff"),border:"1.5px solid rgba(255,255,255,.25)",padding:"13px 28px",fontSize:15}}>Vende Aquí →</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:20}}>
            {[["🔒","Pago seguro"],["✅","Vendedores verificados"],["⭐","Reseñas reales"],["🚚","Todo el país"]].map(([ic,t]) => (
              <div key={t} style={{textAlign:"center",padding:"0 4px"}}>
                <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
                <div style={{color:"rgba(255,255,255,.6)",fontSize:10,fontWeight:600,lineHeight:1.3}}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1280,margin:"0 auto",padding:"28px 14px"}}>

        {/* ── CATEGORÍAS GRID ── */}
        <div style={{marginBottom:32}}>
          <h2 style={{fontFamily:Fh,fontSize:17,fontWeight:800,margin:"0 0 14px"}}>Explorar por categoría</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10}}>
            {CATS_ICONS.map(([cat,ic]) => {
              const count = f.filter(p=>p.category===cat).length;
              return (
                <button key={cat} className="hop" onClick={()=>nav("browse",{cat})}
                  style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"16px 8px",textAlign:"center",cursor:"pointer",transition:"all .18s",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                  <div style={{fontSize:28,marginBottom:6}}>{ic}</div>
                  <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:2}}>{cat}</div>
                  <div style={{fontSize:10,color:C.muted}}>{count} producto{count!==1?"s":""}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── OFERTAS DEL DÍA ── */}
        {f.filter(p=>p.salePrice).length > 0 && (
          <Section title="🔥 Ofertas del día"
            items={f.filter(p=>p.salePrice).sort((a,b)=>(1-a.salePrice/a.price)-(1-b.salePrice/b.price)).slice(0,8)}
            nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
            onMore={()=>nav("browse",{cond:"sale"})} 
            favs={favs} toggleFav={toggleFav} />
        )}

        {/* ── TIENDAS DESTACADAS ── */}
        {merchants.length > 0 && (
          <div style={{marginBottom:32}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:Fh,fontSize:17,fontWeight:800,margin:0}}>🏪 Tiendas verificadas</h2>
            </div>
            <div style={{display:"flex",gap:12,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
              {merchants.map(m => {
                const mp = f.filter(p=>p.merchantId===m.id);
                return (
                  <div key={m.id} className="lift hop" onClick={()=>nav("merchant-profile",{merchantId:m.id})}
                    style={{flexShrink:0,width:160,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"16px 14px",textAlign:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                    <div style={{width:52,height:52,borderRadius:14,overflow:"hidden",background:C.navyD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",margin:"0 auto 10px",fontWeight:800,fontFamily:Fh}}>
                      {m.storeLogo ? <img src={m.storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : m.storeName?.[0]||"🏪"}
                    </div>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.storeName}</div>
                    <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{m.location?.split(",")[0]}</div>
                    <div style={{display:"flex",justifyContent:"center",gap:4}}>
                      <Pill label={`${mp.length} productos`} c={C.navy} sx={{fontSize:9}} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TECNOLOGÍA ── */}
        <Section title="💻 Tecnología"
          items={f.filter(p=>p.category==="Tecnología").slice(0,8)}
          nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
          onMore={()=>nav("browse",{cat:"Tecnología"})} 
            favs={favs} toggleFav={toggleFav} />

        {/* ── NUEVOS PRODUCTOS ── */}
        <Section title="✨ Recién llegados"
          items={[...f].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8)}
          nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
          onMore={()=>nav("browse",{sort:"new"})} 
            favs={favs} toggleFav={toggleFav} />

        {/* ── MODA & ESTILO ── */}
        {f.filter(p=>p.category==="Moda").length > 0 && (
          <Section title="👟 Moda y estilo"
            items={f.filter(p=>p.category==="Moda").slice(0,8)}
            nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
            onMore={()=>nav("browse",{cat:"Moda"})} 
            favs={favs} toggleFav={toggleFav} />
        )}

        {/* ── ENVÍO GRATIS BANNER ── */}
        {f.filter(p=>p.freeShipping).length > 0 && (
          <div style={{background:`linear-gradient(120deg,${C.green}15,${C.green}05)`,border:`1.5px solid ${C.green}33`,borderRadius:16,padding:"20px 20px",marginBottom:32,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontFamily:Fh,fontWeight:800,fontSize:16,color:"#064E3B",marginBottom:4}}>🚚 Con envío GRATIS</div>
              <div style={{fontSize:13,color:C.teal}}>{f.filter(p=>p.freeShipping).length} productos con envío incluido</div>
            </div>
            <button className="hop" onClick={()=>nav("browse")} style={{...btn(C.green,"#fff"),padding:"10px 20px",fontSize:13,fontWeight:700}}>Ver todos →</button>
          </div>
        )}

        {/* ── MÁS ECONÓMICOS ── */}
        <Section title="💰 Más accesibles"
          items={sorted.slice(0,8)}
          nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
          onMore={()=>nav("browse",{sort:"default"})} 
            favs={favs} toggleFav={toggleFav} />

        {/* ── DEPORTES & HOGAR ── */}
        {f.filter(p=>["Deportes","Hogar"].includes(p.category)).length > 0 && (
          <Section title="🏠 Hogar y Deporte"
            items={f.filter(p=>["Deportes","Hogar"].includes(p.category)).slice(0,8)}
            nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}
            onMore={()=>nav("browse")} 
            favs={favs} toggleFav={toggleFav} />
        )}

      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{background:C.white,borderTop:`1px solid ${C.border}`,padding:"44px 16px 50px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <h2 style={{fontFamily:Fh,textAlign:"center",margin:"0 0 8px",fontSize:20,fontWeight:800}}>¿Cómo funciona?</h2>
          <p style={{textAlign:"center",color:C.muted,fontSize:13,margin:"0 0 28px"}}>Compra 100% protegida en 5 pasos simples</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:16}}>
            {[["🛒","Selecciona","Elige y agrega al carrito"],["💳","Paga seguro","Tu pago queda protegido"],["🔍","Verificamos","Aprobamos el pago en 24h"],["📦","Te envían","Guía rastreable incluida"],["✅","Confirmas","El vendedor recibe su pago"]].map(([ic,t,d],i) => (
              <div key={t} style={{textAlign:"center",padding:"12px 8px",position:"relative"}}>
                {i < 4 && <div style={{position:"absolute",top:22,right:-8,fontSize:14,color:C.border,fontWeight:900,zIndex:1}} className="hide-sm">›</div>}
                <div style={{width:48,height:48,borderRadius:14,background:C.navy+"12",border:`2px solid ${C.navy}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 12px"}}>{ic}</div>
                <div style={{fontWeight:800,fontSize:12,marginBottom:4,color:C.navy}}>{t}</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:28}}>
            <button className="hop" onClick={()=>nav("register")} style={{...btn(C.red),padding:"12px 28px",fontSize:14,fontWeight:700}}>Crear cuenta gratis →</button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════
   BROWSE
═══════════════════════════════════════════════ */
function BrowsePage({ products, nav, addToCart, rate, rateLabel, params:ip={}, favs=[], toggleFav }) {
  const [search, setSearch] = useState(ip.search||"");
  const [cat,    setCat]    = useState(ip.cat||"Todo");
  const [cond,   setCond]   = useState(ip.cond||"all");
  const [sort,   setSort]   = useState(ip.sort||"default");
  const [loc,    setLoc]    = useState("all");
  const [minP,   setMinP]   = useState("");
  const [maxP,   setMaxP]   = useState("");

  const [showFilters, setShowFilters] = useState(false);

  // Sync search/cat when header nav updates params
  useEffect(() => { setSearch(ip.search||""); }, [ip.search]);
  useEffect(() => { if(ip.cat) setCat(ip.cat); }, [ip.cat]);

  let f = products.filter(p => p.active && p.stock > 0);
  if(search) f = f.filter(p => [p.name,p.merchantName,p.category,p.description,p.merchantLoc].some(s=>s?.toLowerCase().includes(search.toLowerCase())));
  if(cat!=="Todo") f = f.filter(p => p.category===cat);
  if(cond==="new")  f = f.filter(p => p.condition==="new");
  if(cond==="used") f = f.filter(p => p.condition==="used");
  if(cond==="sale") f = f.filter(p => p.salePrice);
  if(loc!=="all")   f = f.filter(p => p.merchantLoc===loc);
  if(minP) f = f.filter(p => (p.salePrice||p.price) >= +minP);
  if(maxP) f = f.filter(p => (p.salePrice||p.price) <= +maxP);
  if(sort==="default"||sort==="asc") f = [...f].sort((a,b) => (a.salePrice||a.price)-(b.salePrice||b.price));
  if(sort==="desc") f = [...f].sort((a,b) => (b.salePrice||b.price)-(a.salePrice||a.price));
  if(sort==="new")  f = [...f].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));

  const locs = ["all",...new Set(products.map(p=>p.merchantLoc).filter(Boolean))];
  const activeFilters = [search&&`"${search}"`, cat!=="Todo"&&cat, cond!=="all"&&cond, loc!=="all"&&loc, minP&&`>$${minP}`, maxP&&`<$${maxP}`].filter(Boolean);

  const hasAnyFilter = search || cat!=="Todo" || cond!=="all" || loc!=="all" || minP || maxP;
  const pageTitle = search ? `"${search}"` : cat!=="Todo" ? cat : "Todos los productos";

  useDocTitle(cat!=="Todo" ? cat : search ? `Buscar: ${search}` : "Explorar productos");
  useMeta(`Compra ${cat!=="Todo"?cat:"productos"} en Venezuela. ${search?`Resultados para "${search}". `:""}Precios en dólares, envíos y retiro en tienda.`);
  useSchema([{
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Inicio","item":APP_URL},
      {"@type":"ListItem","position":2,"name":"Explorar","item":`${APP_URL}/browse`},
      ...(cat!=="Todo"?[{"@type":"ListItem","position":3,"name":cat,"item":`${APP_URL}/browse?cat=${encodeURIComponent(cat)}`}]:[])
    ]
  }]);
  /* eslint-disable react-hooks/exhaustive-deps */
  return (
    <div className="page-wrap">

      {/* ── HEADER COMPACTO ── */}
      <div style={{marginBottom:14}}>

        {/* Título + conteo + ordenar en una línea */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontFamily:Fh,fontSize:"clamp(15px,3vw,18px)",fontWeight:800,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pageTitle}</h1>
            <span style={{fontSize:11,color:C.muted}}>{f.length} producto{f.length!==1?"s":""}</span>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
            <select value={sort} onChange={e=>setSort(e.target.value)}
              style={{fontSize:12,padding:"6px 9px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",color:C.text,outline:"none"}}>
              <option value="default">↑ Precio</option>
              <option value="desc">↓ Precio</option>
              <option value="new">Recientes</option>
            </select>
            <button className="hop" onClick={()=>setShowFilters(v=>!v)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:8,border:`1px solid ${showFilters||hasAnyFilter?C.navy:C.border}`,background:showFilters||hasAnyFilter?C.navyL:"#fff",color:showFilters||hasAnyFilter?C.navy:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",position:"relative",whiteSpace:"nowrap"}}>
              <span>⚙️</span>
              <span className="hide-sm">Filtros</span>
              {activeFilters.length>0&&<span style={{background:C.red,color:"#fff",fontSize:9,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters.length}</span>}
            </button>
          </div>
        </div>

        {/* Categorías en scroll horizontal */}
        <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:2,margin:"0 -4px",paddingLeft:4}}>
          {CATS.map(c => (
            <button key={c} className="hop" onClick={()=>setCat(c)}
              style={{fontSize:12,fontWeight:cat===c?700:500,color:cat===c?"#fff":C.text,background:cat===c?C.navy:"transparent",border:`1.5px solid ${cat===c?C.navy:C.border}`,borderRadius:20,padding:"4px 13px",whiteSpace:"nowrap",flexShrink:0,cursor:"pointer",transition:"all .15s"}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL DE FILTROS COLAPSABLE ── */}
      {showFilters && (
        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",marginBottom:12,animation:"vy-fade .15s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>

            <div>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Condición</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[["all","Todos"],["new","Nuevo"],["used","Usado"],["sale","Oferta"]].map(([v,l]) => (
                  <button key={v} onClick={()=>setCond(v)}
                    style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:`1.5px solid ${cond===v?C.red:C.border}`,background:cond===v?C.red:"transparent",color:cond===v?"#fff":C.text,cursor:"pointer",fontWeight:cond===v?700:400,whiteSpace:"nowrap"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Ciudad</div>
              <select value={loc} onChange={e=>setLoc(e.target.value)}
                style={{width:"100%",fontSize:12,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",outline:"none"}}>
                {locs.map(l => <option key={l} value={l}>{l==="all"?"Todas las ciudades":l}</option>)}
              </select>
            </div>

            <div>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Precio USD</div>
              <div style={{display:"flex",gap:6,alignItems:"center",width:"100%",boxSizing:"border-box"}}>
                <input value={minP} onChange={e=>setMinP(e.target.value)} placeholder="Mín"
                  type="number" style={{width:0,flex:1,fontSize:12,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.border}`,outline:"none",boxSizing:"border-box",minWidth:0}} />
                <span style={{color:C.muted,fontSize:11,flexShrink:0}}>—</span>
                <input value={maxP} onChange={e=>setMaxP(e.target.value)} placeholder="Máx"
                  type="number" style={{width:0,flex:1,fontSize:12,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.border}`,outline:"none",boxSizing:"border-box",minWidth:0}} />
              </div>
            </div>
          </div>

          {hasAnyFilter && (
            <div style={{borderTop:`1px solid ${C.border}`,marginTop:10,paddingTop:8,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.muted}}>Filtros activos:</span>
              {activeFilters.map(af => (
                <span key={af} style={{fontSize:11,fontWeight:600,color:C.navy,background:C.navyL,padding:"2px 9px",borderRadius:20,border:`1px solid ${C.navy}22`}}>{af}</span>
              ))}
              <button onClick={()=>{setSearch("");setCat("Todo");setCond("all");setLoc("all");setMinP("");setMaxP("");setShowFilters(false);}}
                style={{marginLeft:"auto",fontSize:11,color:"#991B1B",background:C.redL,border:"none",padding:"3px 10px",borderRadius:20,cursor:"pointer",fontWeight:600}}>
                ✕ Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTADOS ── */}
      {f.length===0
        ? (
          <div style={{textAlign:"center",padding:"50px 20px",color:C.muted}}>
            <div style={{fontSize:44,marginBottom:10}}>🔍</div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>Sin resultados{search?` para "${search}"`:`${cat!=="Todo"?` en ${cat}`:""}`}</div>
            <div style={{fontSize:12,marginBottom:16}}>Intenta con otra búsqueda o ajusta los filtros</div>
            {hasAnyFilter && (
              <button onClick={()=>{setSearch("");setCat("Todo");setCond("all");setLoc("all");setMinP("");setMaxP("");}}
                style={{fontSize:13,color:"#991B1B",background:C.redL,border:"none",padding:"8px 18px",borderRadius:20,cursor:"pointer",fontWeight:600}}>
                Ver todos los productos
              </button>
            )}
          </div>
        )
        : <PGrid items={f} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRODUCT PAGE
═══════════════════════════════════════════════ */
function ProductPage({ products, orders, users, params, nav, addToCart, user, rate, rateLabel, askQ, answerQ, showT, favs=[], toggleFav, reviews=[] }) {
  const product = products.find(p => p.id===params.productId);
  const [qty,       setQtyL]    = useState(1);
  const [question,  setQuestion]= useState("");
  const [ansInputs, setAnsInputs]= useState({});
  const [asking,    setAsking]  = useState(false);
  const [imgTab,    setImgTab]  = useState(0);

  if(!product) return (
    <div style={{padding:40,textAlign:"center",color:C.muted}}>
      Producto no encontrado. <span style={{color:C.red,cursor:"pointer"}} onClick={() => nav("browse")}>← Volver</span>
    </div>
  );

  const ep         = product.salePrice && product.salePrice < product.price;
  const finalPrice = ep ? product.salePrice : product.price;
  const savings    = ep ? +(product.price-product.salePrice).toFixed(2) : 0;
  const disc       = ep ? Math.round((1-product.salePrice/product.price)*100) : 0;
  const isMerchant = user?.id===product.merchantId;
  const mu         = users?.find(u => u.id===product.merchantId);

  /* ── SEO & Schema ── */
  useDocTitle(product.name);
  useMeta(`${product.name} — ${product.condition==="new"?"Nuevo":"Usado"} · ${product.category} en Venezuela. Precio: $${(product.salePrice||product.price).toFixed(2)}${product.freeShipping?" · Envío GRATIS":""}.`);
  useSchema([
    {
      "@context":"https://schema.org",
      "@type":"Product",
      "name":product.name,
      "description":product.description||product.name,
      "image":product.image,
      "brand":{"@type":"Brand","name":mu?.storeName||mu?.name||APP_NAME},
      "category":product.category,
      "condition":`https://schema.org/${product.condition==="new"?"NewCondition":"UsedCondition"}`,
      "offers":{
        "@type":"Offer",
        "price":(product.salePrice||product.price).toFixed(2),
        "priceCurrency":"USD",
        "availability":product.stock>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",
        "seller":{"@type":"Organization","name":mu?.storeName||mu?.name||APP_NAME},
        "shippingDetails":product.freeShipping?{
          "@type":"OfferShippingDetails",
          "shippingRate":{"@type":"MonetaryAmount","value":"0","currency":"USD"},
          "shippingDestination":{"@type":"DefinedRegion","addressCountry":"VE"}
        }:undefined
      },
      "aggregateRating": (() => {
        const revs = (orders||[]).filter(o=>o.vendors?o.vendors.some(v=>v.merchantId===product.merchantId&&v.review):o.review&&o.merchantId===product.merchantId);
        if(!revs.length) return undefined;
        const ratings = revs.map(o=>o.vendors?o.vendors.find(v=>v.merchantId===product.merchantId)?.review?.rating:o.review?.rating).filter(Boolean);
        if(!ratings.length) return undefined;
        return {"@type":"AggregateRating","ratingValue":(ratings.reduce((s,r)=>s+r,0)/ratings.length).toFixed(1),"reviewCount":ratings.length,"bestRating":"5","worstRating":"1"};
      })()
    },
    {
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      "itemListElement":[
        {"@type":"ListItem","position":1,"name":"Inicio","item":APP_URL},
        {"@type":"ListItem","position":2,"name":"Explorar","item":`${APP_URL}/browse`},
        {"@type":"ListItem","position":3,"name":product.category,"item":`${APP_URL}/browse?cat=${encodeURIComponent(product.category)}`},
        {"@type":"ListItem","position":4,"name":product.name,"item":`${APP_URL}/product/${product.id}`}
      ]
    }
  ].filter(s=>s));

  /* Product reviews: reviews for this specific product */
  const productReviews = orders.filter(o => o.review && o.items.some(i => i.productId===product.id)).map(o => ({...o.review, buyerName:o.buyerName}));
  const storeReviews   = orders.filter(o => o.merchantId===product.merchantId && o.review).map(o => ({...o.review, buyerName:o.buyerName}));
  const avgR = productReviews.length ? productReviews.reduce((s,r)=>s+r.rating,0)/productReviews.length : 0;

  /* Same merchant, other products */
  const sameVendor = products.filter(p => p.active && p.merchantId===product.merchantId && p.id!==product.id).sort((a,b)=>(a.salePrice||a.price)-(b.salePrice||b.price)).slice(0,6);
  /* Other vendors, same category */
  const otherVendors = products.filter(p => p.active && p.merchantId!==product.merchantId && p.category===product.category && p.id!==product.id).sort((a,b)=>(a.salePrice||a.price)-(b.salePrice||b.price)).slice(0,6);

  const handleAsk = async () => {
    if(!question.trim()||!user) return;
    setAsking(true);
    await askQ(product.id, question);
    setQuestion(""); setAsking(false);
  };
  const handleAnswer = async qId => {
    const a = ansInputs[qId]?.trim();
    if(!a) return;
    await answerQ(product.id, qId, a);
    setAnsInputs(p => ({...p,[qId]:""}));
  };
  const noStock = product.stock===0 || !product.active;

  return (
    <div className="page-wrap">
      {/* Breadcrumb */}
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:14,fontSize:12,color:C.muted,flexWrap:"wrap"}}>
        <span onClick={() => nav("landing")} style={{cursor:"pointer",color:C.red}}>Inicio</span>
        <span>›</span>
        <span onClick={() => nav("browse",{cat:product.category})} style={{cursor:"pointer",color:C.red}}>{product.category}</span>
        <span>›</span>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{product.name}</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,marginBottom:20}}>
        {/* Image Gallery */}
        <div>
          {(() => {
            const imgs = product.images?.length ? product.images : product.image ? [product.image] : [];
            const [activeImg, setActiveImg] = useState(0);
            return (
              <>
                <div style={{borderRadius:12,overflow:"hidden",aspectRatio:"1/1",width:"100%",background:C.light,position:"relative"}}>
                  <Img src={imgs[activeImg]||imgs[0]||""} alt={product.name} />
                  <div style={{position:"absolute",top:10,left:10,display:"flex",gap:5,flexWrap:"wrap"}}>
                    <Pill label={product.condition==="new"?"Nuevo":"Usado"} c={product.condition==="new"?C.navy:C.slate} solid />
                    {disc > 0 && <Pill label={`-${disc}%`} c={C.red} solid />}
                    {noStock && <Pill label="Sin Stock" c="#fff" bg="rgba(0,0,0,.75)" />}
                  </div>
                  {imgs.length > 1 && (
                    <>
                      <button onClick={()=>setActiveImg(i=>Math.max(0,i-1))} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.45)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                      <button onClick={()=>setActiveImg(i=>Math.min(imgs.length-1,i+1))} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.45)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                      <div style={{position:"absolute",bottom:8,right:10,background:"rgba(0,0,0,.5)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20}}>{activeImg+1}/{imgs.length}</div>
                    </>
                  )}
                </div>
                {imgs.length > 1 && (
                  <div style={{display:"flex",gap:6,marginTop:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
                    {imgs.map((img,i) => (
                      <div key={i} onClick={()=>setActiveImg(i)} style={{width:56,height:56,borderRadius:7,overflow:"hidden",flexShrink:0,border:`2px solid ${activeImg===i?C.red:C.border}`,cursor:"pointer",background:C.light,transition:"border-color .15s"}}>
                        <img src={img} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
          {avgR > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,padding:"8px 12px",background:C.goldL,borderRadius:9,border:`1px solid ${C.gold}33`}}>
              <Stars v={Math.round(avgR)} size={15} />
              <span style={{fontSize:13,fontWeight:700,color:C.amber}}>{avgR.toFixed(1)}</span>
              <span style={{fontSize:12,color:C.muted}}>({productReviews.length} reseña{productReviews.length!==1?"s":""})</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{product.category}</div>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
            <h1 style={{fontFamily:Fh,fontSize:"clamp(18px,3vw,22px)",margin:0,lineHeight:1.2,fontWeight:800,flex:1}}>{product.name}</h1>
            <button onClick={()=>toggleFav&&toggleFav(product.id)}
              style={{background:favs.includes(product.id)?"#FFF5F5":"transparent",
                border:`1px solid ${favs.includes(product.id)?"#FCA5A5":C.border}`,
                borderRadius:8,cursor:"pointer",padding:"7px 12px",display:"flex",alignItems:"center",gap:6,
                flexShrink:0,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#FFF5F5";e.currentTarget.style.borderColor="#FCA5A5";}}
              onMouseLeave={e=>{e.currentTarget.style.background=favs.includes(product.id)?"#FFF5F5":"transparent";e.currentTarget.style.borderColor=favs.includes(product.id)?"#FCA5A5":C.border;}}>
              <HeartIcon saved={favs.includes(product.id)} size={16} />
              <span style={{fontSize:12,fontWeight:600,color:favs.includes(product.id)?"#E53E3E":"#6B7280"}}>
                {favs.includes(product.id)?"Guardado":"Guardar"}
              </span>
            </button>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span onClick={() => nav("merchant-profile",{merchantId:product.merchantId})} style={{color:C.navy,fontWeight:700,fontSize:13,cursor:"pointer"}}>🏪 {product.merchantName}</span>
            {mu?.merchantVerified && <Pill label="✓ Verificado" c={C.green} bg={C.greenL} />}
            <span style={{color:C.muted,fontSize:12}}>📍 {product.merchantLoc}</span>
          </div>

          {/* Price block */}
          <div style={{padding:"12px 0",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
            {ep && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontSize:14,color:C.muted,textDecoration:"line-through"}}>{fU(product.price)}</span>
                <Pill label={`Ahorra ${fU(savings)}`} c={C.teal} bg={C.tealL} />
              </div>
            )}
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:"clamp(28px,4vw,36px)",color:C.red,lineHeight:1}}>{fU(finalPrice)}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>{fBs(finalPrice,rate)} · Tasa {rateLabel} (BCV)</div>
          </div>

          {/* Delivery options */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {product.allowsDelivery && (
              <div style={{background:product.freeShipping?C.tealL:C.light,color:product.freeShipping?C.teal:C.text,padding:"6px 11px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${product.freeShipping?C.teal+"33":C.border}`,display:"flex",gap:5,alignItems:"center"}}>
                🚚 {product.freeShipping ? "Envío GRATIS" : (product.shippingCost||0)>0 ? `Envío: ${fU(product.shippingCost)}` : "Consultar envío"} · {product.deliveryDays||"3-7"} días
              </div>
            )}
            {product.allowsPickup && <div style={{background:C.navyL,color:C.navy,padding:"6px 11px",borderRadius:8,fontSize:12,fontWeight:600}}>🏪 Retiro en {product.merchantLoc}</div>}
          </div>

          <div style={{background:C.light,borderRadius:9,padding:12,fontSize:13,lineHeight:1.7,color:C.text}}>{product.description}</div>

          {/* Qty picker */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:13,fontWeight:600}}>Cantidad:</span>
            <div style={{display:"flex",alignItems:"center",background:C.light,borderRadius:8,overflow:"hidden"}}>
              <button className="hop" onClick={() => setQtyL(Math.max(1,qty-1))} style={{...btn(C.light,C.text),padding:"6px 12px",borderRadius:0,fontSize:16}}>−</button>
              <span style={{fontWeight:700,minWidth:28,textAlign:"center",fontSize:14}}>{qty}</span>
              <button className="hop" onClick={() => setQtyL(Math.min(product.stock,qty+1))} style={{...btn(C.light,C.text),padding:"6px 12px",borderRadius:0,fontSize:16}}>+</button>
            </div>
            <span style={{fontSize:12,color:product.stock<=3?C.amber:C.muted}}>{product.stock} disp.</span>
          </div>

          <button className="hop" onClick={() => addToCart(product,qty)} disabled={noStock}
            style={{...btn(noStock?C.border:C.red,noStock?C.muted:"#fff"),padding:"13px",fontSize:15,justifyContent:"center",fontWeight:700,cursor:noStock?"not-allowed":"pointer"}}>
            {noStock ? "Sin Stock" : "🛒 Agregar al carrito"}
          </button>

          {/* Escrow badge */}
          <div style={{background:C.greenL,border:`1px solid ${C.green}28`,borderRadius:10,padding:11,display:"flex",gap:9,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>🔒</span>
            <div style={{fontSize:12,color:"#065F46",lineHeight:1.55}}>
              <strong>Compra 100% Protegida:</strong> El vendedor recibe el pago solo cuando confirmes que recibiste tu pedido.
            </div>
          </div>
        </div>
      </div>

      {/* Reviews for THIS product */}
      {productReviews.length > 0 && (
        <div style={{...card,padding:20,marginBottom:16}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:16,fontWeight:800}}>⭐ Reseñas de este producto ({productReviews.length})</h3>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {productReviews.map((r,i) => (
              <div key={i} style={{padding:"12px 14px",background:C.bg,borderRadius:9,borderLeft:`3px solid ${C.gold}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:C.navy,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{r.buyerName[0].toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700}}>{r.buyerName}</div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}><Stars v={r.rating} size={12} /><span style={{fontSize:10,color:C.muted}}>{ago(r.createdAt)}</span></div>
                  </div>
                </div>
                <div style={{fontSize:13,lineHeight:1.6,marginLeft:36}}>{r.comment}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A */}
      <div style={{...card,padding:20,marginBottom:16}}>
        <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:16,fontWeight:800}}>❓ Preguntas y Respuestas</h3>
        {!(product.questions||[]).length && <p style={{color:C.muted,fontSize:13,margin:"0 0 14px"}}>Sé el primero en preguntar.</p>}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {(product.questions||[]).map(q => (
            <div key={q.id} style={{borderLeft:`3px solid ${C.border}`,paddingLeft:12}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>❓ {q.question}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{q.buyerName} · {ago(q.createdAt)}</div>
              {q.answer
                ? <div style={{background:C.navyL,borderRadius:8,padding:"9px 12px"}}><div style={{fontSize:10,color:C.navy,fontWeight:700,marginBottom:2}}>💬 Vendedor:</div><div style={{fontSize:13}}>{q.answer}</div></div>
                : isMerchant
                  ? <div style={{display:"flex",gap:7}}>
                      <input value={ansInputs[q.id]||""} onChange={e=>setAnsInputs(p=>({...p,[q.id]:e.target.value}))} placeholder="Tu respuesta…" style={{...inp,flex:1,fontSize:12}} />
                      <button className="hop" onClick={() => handleAnswer(q.id)} style={{...btn(C.navy),padding:"8px 12px",fontSize:12,flexShrink:0}}>Responder</button>
                    </div>
                  : <div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Esperando respuesta…</div>
              }
            </div>
          ))}
        </div>
        {user && !isMerchant && (
          <div style={{display:"flex",gap:7,marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
            <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Escribe tu pregunta… (no incluyas datos personales)" style={{...inp,flex:1,fontSize:12}} onKeyDown={e=>e.key==="Enter"&&handleAsk()} />
            <button className="hop" onClick={handleAsk} disabled={asking||!question.trim()}
              style={{...btn(C.red),padding:"9px 14px",fontSize:12,flexShrink:0,opacity:(!question.trim()||asking)?0.45:1}}>Preguntar</button>
          </div>
        )}
        {!user && <p style={{fontSize:12,color:C.muted,margin:"12px 0 0"}}><span onClick={()=>nav("login")} style={{color:C.red,cursor:"pointer",fontWeight:600}}>Inicia sesión</span> para preguntar.</p>}
      </div>

      {/* Same vendor carousel */}
      {sameVendor.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:15,fontWeight:800}}>Más de <span onClick={()=>nav("merchant-profile",{merchantId:product.merchantId})} style={{color:C.red,cursor:"pointer"}}>{product.merchantName}</span></h3>
            <button className="hop" onClick={()=>nav("merchant-profile",{merchantId:product.merchantId})} style={{...btn(C.light,C.muted),padding:"5px 11px",fontSize:11}}>Ver tienda →</button>
          </div>
          <PGrid items={sameVendor} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
        </div>
      )}

      {/* Other vendors same category */}
      {otherVendors.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:15,fontWeight:800}}>También en {product.category} · otros vendedores</h3>
            <button className="hop" onClick={()=>nav("browse",{cat:product.category})} style={{...btn(C.light,C.muted),padding:"5px 11px",fontSize:11}}>Ver más →</button>
          </div>
          <PGrid items={otherVendors} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MERCHANT PROFILE
═══════════════════════════════════════════════ */
function MerchantProfile({ users,products,orders,params,nav,user,toggleFollow,addToCart,rate,rateLabel,favs=[],toggleFav,reviews=[] }) {
  const merchant = users.find(u => u.id===params.merchantId);
  if(!merchant) return <div style={{padding:40,textAlign:"center",color:C.muted}}>Tienda no encontrada</div>;

  const mp       = products.filter(p => p.merchantId===merchant.id && p.active && p.stock>0).sort((a,b)=>(a.salePrice||a.price)-(b.salePrice||b.price));
  const released = orders.filter(o => o.merchantId===merchant.id && o.status==="released");
  const storeRevs = orders.filter(o => o.merchantId===merchant.id && o.review).map(o => ({...o.review,buyerName:o.buyerName}));
  const avgR      = storeRevs.length ? storeRevs.reduce((s,r)=>s+r.rating,0)/storeRevs.length : 0;
  const isF      = (user?.following||[]).includes(merchant.id);
  const years    = Math.max(1, new Date().getFullYear()-new Date(merchant.joinedAt).getFullYear());
  const fl       = (merchant.followers||[]).length;

  /* ── SEO & Schema ── */
  useDocTitle(merchant.storeName||merchant.name);
  useMeta(`${merchant.storeName||merchant.name} — Tienda en VendeYApp${merchant.location?` · ${merchant.location}`:""}. ${mp.length} producto${mp.length!==1?"s":""} disponibles${avgR>0?`. Calificación: ${avgR.toFixed(1)}/5`:""}.`);
  useSchema([
    {
      "@context":"https://schema.org",
      "@type":"LocalBusiness",
      "name":merchant.storeName||merchant.name,
      "description":merchant.storeDesc||`Tienda de ${merchant.storeName||merchant.name} en VendeYApp`,
      "image":merchant.storeLogo||APP_LOGO,
      "url":`${APP_URL}/merchant/${merchant.id}`,
      "address":{"@type":"PostalAddress","addressLocality":merchant.location||"Venezuela","addressCountry":"VE"},
      "geo":{"@type":"GeoCoordinates","latitude":APP_GEO.lat,"longitude":APP_GEO.lng},
      "areaServed":{"@type":"Country","name":"Venezuela"},
      "priceRange":"$$",
      ...(avgR>0?{"aggregateRating":{"@type":"AggregateRating","ratingValue":avgR.toFixed(1),"reviewCount":reviews.length,"bestRating":"5","worstRating":"1"}}:{}),
      "hasOfferCatalog":{
        "@type":"OfferCatalog",
        "name":`Catálogo de ${merchant.storeName||merchant.name}`,
        "numberOfItems":mp.length
      }
    },
    {
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      "itemListElement":[
        {"@type":"ListItem","position":1,"name":"Inicio","item":APP_URL},
        {"@type":"ListItem","position":2,"name":"Tiendas","item":`${APP_URL}/browse`},
        {"@type":"ListItem","position":3,"name":merchant.storeName||merchant.name,"item":`${APP_URL}/merchant/${merchant.id}`}
      ]
    }
  ]);

  return (
    <div className="page-wrap">
      <div style={{...card,overflow:"hidden",marginBottom:16}}>
        <div style={{background:`linear-gradient(135deg,${C.navyD},${C.navy})`,padding:"22px 20px 18px"}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
            <div style={{width:66,height:66,borderRadius:14,background:`linear-gradient(135deg,${C.red},#FF6B4A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#fff",fontWeight:900,fontFamily:Fh,flexShrink:0}}>
              {merchant.storeLogo
                ? <img src={merchant.storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                : merchant.storeName?merchant.storeName[0].toUpperCase():"🏪"}
            </div>
            <div style={{flex:1,minWidth:160}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                <h2 style={{fontFamily:Fh,margin:0,fontSize:19,color:"#fff",fontWeight:800}}>{merchant.storeName||merchant.name}</h2>
                {merchant.merchantVerified && <Pill label="✓ Verificado" c={C.green} bg={C.greenL} />}
              </div>
              {merchant.storeDesc && <p style={{color:"rgba(255,255,255,.68)",fontSize:12,margin:"0 0 7px",lineHeight:1.5}}>{merchant.storeDesc}</p>}
              <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:"rgba(255,255,255,.55)"}}>
                <span>📍 {merchant.location}</span>
                <span>📅 {years} año{years!==1?"s":""}</span>
                <span>👥 {fl} seguidor{fl!==1?"es":""}</span>
              </div>
            </div>
            <button className="hop" onClick={() => toggleFollow(merchant.id)}
              style={{...btn(isF?"rgba(255,255,255,.14)":C.red,isF?"rgba(255,255,255,.85)":"#fff"),padding:"9px 18px",fontSize:13,border:isF?"1px solid rgba(255,255,255,.28)":"none"}}>
              {isF?"✓ Siguiendo":"+Seguir"}
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)"}}>
          {[{l:"Ventas",v:released.length,ic:"📦"},{l:"Productos",v:mp.length,ic:"🛍️"},{l:"Rating",v:avgR>0?avgR.toFixed(1):"—",ic:"⭐"},{l:"Reseñas",v:reviews.length,ic:"💬"},{l:"Seguidores",v:fl,ic:"👥"}].map((s,i) => (
            <div key={s.l} style={{textAlign:"center",padding:"13px 8px",borderRight:i<4?`1px solid ${C.border}`:"none"}}>
              <div style={{fontSize:17,marginBottom:2}}>{s.ic}</div>
              <div style={{fontFamily:Fh,fontWeight:800,fontSize:17,color:C.red}}>{s.v}</div>
              <div style={{fontSize:10,color:C.muted}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {mp.length > 0 && (
        <div style={{marginBottom:16}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 12px",fontSize:15,fontWeight:800}}>Productos ({mp.length}) · precio más bajo primero</h3>
          <PGrid items={mp} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel}  favs={favs} toggleFav={toggleFav}/>
        </div>
      )}

      <div style={{...card,padding:20}}>
        <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:15,fontWeight:800}}>⭐ Reseñas ({reviews.length})</h3>
        {!reviews.length && <p style={{color:C.muted,fontSize:13}}>Sin reseñas aún.</p>}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {reviews.map((r,i) => (
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",paddingBottom:14,borderBottom:i<reviews.length-1?`1px solid ${C.border}`:"none"}}>
              {/* Product image */}
              {r.productImage && (
                <div style={{width:48,height:48,borderRadius:8,overflow:"hidden",flexShrink:0,background:C.light,cursor:"pointer"}} onClick={()=>r.productId&&nav("product",{productId:r.productId})}>
                  <Img src={r.productImage} alt={r.productName} />
                </div>
              )}
              <div style={{flex:1}}>
                {r.productName && <div style={{fontSize:11,color:C.navy,fontWeight:700,marginBottom:3}}>📦 {r.productName}</div>}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.muted,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{r.buyerName[0].toUpperCase()}</div>
                  <span style={{fontSize:12,fontWeight:700}}>{r.buyerName}</span>
                  <Stars v={r.rating} size={12} />
                  <span style={{fontSize:10,color:C.muted}}>{ago(r.createdAt)}</span>
                </div>
                <div style={{fontSize:13,lineHeight:1.6,color:C.text}}>{r.comment}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CART
═══════════════════════════════════════════════ */
function CartPage({ cart,cartTotal,removeFromCart,setCartQty,nav,user,rate,rateLabel }) {
  if(!cart.length) return (
    <div style={{maxWidth:480,margin:"50px auto",padding:"0 16px",textAlign:"center"}}>
      <div style={{fontSize:52}}>🛒</div>
      <h2 style={{fontFamily:Fh,fontWeight:800,marginTop:10}}>Tu carrito está vacío</h2>
      <button className="hop" onClick={()=>nav("browse")} style={{...btn(C.red),padding:"12px 24px",fontSize:14,justifyContent:"center",marginTop:12}}>Explorar productos</button>
    </div>
  );
  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>Carrito</h1>
      <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:18}}>
        {cart.map(item => {
          const price = item.product.salePrice||item.product.price;
          return (
            <div key={item.productId} style={{...card,padding:13,display:"flex",gap:11,alignItems:"center"}}>
              <div style={{width:58,height:58,borderRadius:8,overflow:"hidden",flexShrink:0,background:C.light,cursor:"pointer"}} onClick={()=>nav("product",{productId:item.productId})}>
                <Img src={item.product.image} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>{item.product.name}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:5}}>📍 {item.product.merchantLoc} · Stock: {item.product.stock}</div>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{display:"flex",alignItems:"center",background:C.light,borderRadius:7,overflow:"hidden"}}>
                    <button className="hop" onClick={()=>item.qty>1?setCartQty(item.productId,item.qty-1):removeFromCart(item.productId)} style={{...btn(C.light,C.muted),padding:"3px 10px",borderRadius:0,fontSize:14}}>−</button>
                    <span style={{fontWeight:700,minWidth:22,textAlign:"center",fontSize:13}}>{item.qty}</span>
                    <button className="hop"
                      onClick={()=>item.qty<item.product.stock&&setCartQty(item.productId,item.qty+1)}
                      style={{...btn(item.qty>=item.product.stock?C.border:C.light,item.qty>=item.product.stock?C.border:C.muted),padding:"3px 10px",borderRadius:0,fontSize:14,cursor:item.qty>=item.product.stock?"not-allowed":"pointer"}}>+</button>
                  </div>
                  <span style={{fontSize:11,color:C.muted}}>{fU(price)} c/u</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:Fh,fontWeight:800,fontSize:15,color:C.red}}>{fU(price*item.qty)}</div>
                <button className="hop" onClick={()=>removeFromCart(item.productId)} style={{...btn("transparent","#DC2626"),padding:"2px 0",fontSize:11,marginTop:3}}>✕ Quitar</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{...card,padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontFamily:Fh,fontWeight:900,fontSize:22,marginBottom:3}}>
          <span>Total</span><span style={{color:C.red}}>{fU(cartTotal)}</span>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14,textAlign:"center"}}>{fBs(cartTotal,rate)} · {rateLabel}</div>
        <div style={{background:C.greenL,border:`1px solid ${C.green}22`,borderRadius:9,padding:10,fontSize:12,color:"#065F46",marginBottom:13,display:"flex",gap:8,alignItems:"center"}}>
          <span>🔒</span><span>Compra <strong>100% protegida</strong> — fondos liberados solo cuando confirmes tu entrega.</span>
        </div>
        <button className="hop" onClick={()=>user?nav("checkout"):nav("login",{returnTo:"cart"})}
          style={{...btn(C.red),padding:"13px",fontSize:15,width:"100%",justifyContent:"center",fontWeight:700}}>
          {user?"Proceder al Pago Seguro 🔒":"Ingresar para continuar"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHECKOUT
═══════════════════════════════════════════════ */
function CheckoutPage({ cart,cartTotal,placeOrder,nav,rate,rateLabel,products,users }) {
  const [step,       setStep]      = useState(1);
  const [dlvType,    setDlvType]   = useState("delivery");
  const [address,    setAddress]   = useState("");
  const [pickupNote, setPickupNote]= useState("");
  const [method,     setMethod]    = useState(null);
  const [cardNum,    setCardNum]   = useState("");
  const [cardExp,    setCardExp]   = useState("");
  const [cardCvv,    setCardCvv]   = useState("");
  const [processing, setProcessing]= useState(false);
  const [sumOpen,    setSumOpen]   = useState(true); // collapsible summary

  if(!cart.length) { nav("browse"); return null; }

  /* Group cart by merchant for display */
  const byMerchant = {};
  for(const item of cart) {
    const mid = item.product.merchantId;
    if(!byMerchant[mid]) byMerchant[mid] = [];
    byMerchant[mid].push(item);
  }
  const merchantGroups = Object.entries(byMerchant);
  const multiMerchant  = merchantGroups.length > 1;

  const itemsTotal = cart.reduce((s,i) => s+(i.product.salePrice||i.product.price)*i.qty, 0);
  const shippingTotal = dlvType==="delivery"
    ? cart.reduce((s,i) => i.product.freeShipping?s:s+(+i.product.shippingCost||0), 0) : 0;
  const grandTotal = itemsTotal + shippingTotal;

  /* For pickup: use first product's merchant info */
  const firstProduct   = cart[0]?.product;
  const canStep2       = dlvType==="pickup" || address.trim().length > 5;
  const canConfirm     = !!method && (method!=="card" || (cardNum.replace(/\s/g,"").length>=15 && cardExp.length>=4 && cardCvv.length>=3));

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r,600));
    const pRef = method==="card" ? `CARD-${uid().toUpperCase()}` : "";
    const addr = dlvType==="pickup" ? `RETIRO EN TIENDA${pickupNote?` — ${pickupNote}`:""}` : address;
    await placeOrder(method, pRef, null, addr, dlvType, grandTotal, shippingTotal);
    setProcessing(false);
  };

  /* Order summary — collapsible on mobile */
  const OrderSummary = () => (
    <div style={{...card,padding:0,marginBottom:14,overflow:"hidden"}}>
      {/* Header / toggle */}
      <div onClick={()=>setSumOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",cursor:"pointer",userSelect:"none"}}
        onMouseEnter={e=>e.currentTarget.style.background=C.light}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{fontWeight:700,fontSize:13,fontFamily:Fh}}>📋 Resumen del pedido</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:Fh,fontWeight:900,fontSize:15,color:C.red}}>{fU(grandTotal)}</span>
          <span style={{fontSize:14,color:C.muted,transition:"transform .2s",display:"inline-block",transform:sumOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
        </div>
      </div>

      {sumOpen && (
        <div style={{padding:"0 16px 14px"}}>
          {merchantGroups.map(([mid, mItems]) => {
            const merchant = mItems[0]?.product;
            const mSub = mItems.reduce((s,i)=>s+(i.product.salePrice||i.product.price)*i.qty,0);
            const mShip = dlvType==="delivery" ? mItems.reduce((s,i)=>i.product.freeShipping?s:s+(+i.product.shippingCost||0),0) : 0;
            return (
              <div key={mid}>

                {mItems.map(i => {
                  const p = i.product.salePrice||i.product.price;
                  return (
                    <div key={i.productId} style={{display:"flex",gap:9,alignItems:"center",marginBottom:9}}>
                      <div style={{width:38,height:38,borderRadius:7,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={i.product.image} /></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.product.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>×{i.qty}
                          {dlvType==="delivery" && i.product.freeShipping && <span style={{color:C.teal,fontWeight:700,marginLeft:5}}>· 🚚 Gratis</span>}
                          {dlvType==="delivery" && !i.product.freeShipping && i.product.shippingCost>0 && <span style={{color:C.muted,marginLeft:5}}>+ {fU(i.product.shippingCost)} envío</span>}
                        </div>
                      </div>
                      <div style={{fontWeight:700,fontSize:13,color:C.red,flexShrink:0}}>{fU(p*i.qty)}</div>
                    </div>
                  );
                })}

              </div>
            );
          })}

          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}>
              <span>Subtotal productos</span><span>{fU(itemsTotal)}</span>
            </div>
            {dlvType==="delivery" && (
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:shippingTotal===0?C.teal:C.text,marginBottom:3}}>
                <span>🚚 Envío</span><span style={{fontWeight:600}}>{shippingTotal===0?"GRATIS":fU(shippingTotal)}</span>
              </div>
            )}
            {dlvType==="pickup" && (
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.navy,marginBottom:3}}>
                <span>🏪 Retiro en tienda</span><span style={{fontWeight:600}}>Sin costo</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:Fh,fontWeight:900,fontSize:17,marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
              <span>Total</span><span style={{color:C.red}}>{fU(grandTotal)}</span>
            </div>
            <div style={{fontSize:11,color:C.muted,textAlign:"right",marginTop:2}}>{fBs(grandTotal,rate)} · {rateLabel}</div>
          </div>
        </div>
      )}
    </div>
  );

  const steps = ["Entrega","Método de Pago","Confirmar"];

  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 16px",fontSize:19,fontWeight:800}}>Finalizar Compra</h1>

      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",marginBottom:18}}>
        {steps.map((s,i) => (
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<2?1:undefined}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:step>i+1?C.green:step===i+1?C.red:C.border,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{step>i+1?"✓":i+1}</div>
              <div style={{fontSize:9,marginTop:2,color:step===i+1?C.text:C.muted,fontWeight:step===i+1?700:400,textAlign:"center",whiteSpace:"nowrap"}}>{s}</div>
            </div>
            {i<2 && <div style={{flex:1,height:2,background:step>i+1?C.green:C.border,margin:"0 4px",marginBottom:16}} />}
          </div>
        ))}
      </div>



      <OrderSummary />

      {/* STEP 1: DELIVERY */}
      {step===1 && (
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 13px",fontSize:14,fontWeight:800}}>📍 ¿Cómo recibes tu pedido?</h3>

          <div style={{display:"flex",gap:9,marginBottom:14,flexWrap:"wrap"}}>
            {[["delivery","🚚","Envío a domicilio",firstProduct?.allowsDelivery!==false],
              ["pickup","🏪","Retiro en tienda",!!firstProduct?.allowsPickup]].map(([v,ic,t,ok]) => (
              <div key={v} onClick={()=>ok&&setDlvType(v)}
                style={{flex:1,minWidth:130,padding:12,textAlign:"center",borderRadius:10,cursor:ok?"pointer":"not-allowed",border:`2px solid ${dlvType===v?C.red:C.border}`,opacity:ok?1:0.45,background:dlvType===v?C.redL:"transparent",transition:"all .15s"}}>
                <div style={{fontSize:22,marginBottom:4}}>{ic}</div>
                <div style={{fontWeight:700,fontSize:12,color:dlvType===v?C.red:C.text}}>{t}</div>
              </div>
            ))}
          </div>
          {dlvType==="delivery" && (
            <>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>Dirección de entrega *</label>
              <textarea value={address} onChange={e=>setAddress(e.target.value)}
                placeholder="Calle, urbanización, municipio, ciudad, estado, punto de referencia…"
                style={{...inp,minHeight:80,resize:"vertical",fontFamily:Fb,fontSize:13}} />
            </>
          )}
          {dlvType==="pickup" && !multiMerchant && (() => {
            const merchant = firstProduct ? {storeName:firstProduct.merchantName,loc:firstProduct.merchantLoc} : {};
            return (
            <>
              <div style={{background:C.navyL,border:`1.5px solid ${C.navy}22`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:6}}>🏪 {merchant.storeName||"Tienda del vendedor"}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:2}}>📍 {merchant.loc||"Dirección por confirmar"}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:4,fontStyle:"italic"}}>La dirección exacta y horario de retiro te serán enviados cuando el vendedor marque tu pedido como <strong>Listo para retirar</strong>.</div>
              </div>
              <div style={{background:C.amberL,borderRadius:8,padding:"9px 12px",fontSize:11,color:"#78350F",marginBottom:12,display:"flex",gap:8}}>
                <span>ℹ️</span>
                <span>Al retirar en tienda <strong>no se cobra envío</strong>. Lleva tu comprobante de pago al recoger.</span>
              </div>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>Nota para el vendedor (opcional)</label>
              <textarea value={pickupNote} onChange={e=>setPickupNote(e.target.value)}
                placeholder="Ej: Prefiero retirar en la tarde, o cualquier consulta…"
                style={{...inp,minHeight:55,resize:"vertical",fontFamily:Fb,fontSize:13}} />
            </>
            );
          })()}
          <button className="hop" onClick={()=>canStep2&&setStep(2)}
            style={{...btn(canStep2?C.red:C.border,canStep2?"#fff":C.muted),padding:"12px",width:"100%",marginTop:14,fontSize:14,justifyContent:"center",fontWeight:700}}>
            Continuar →
          </button>
        </div>
      )}

      {/* STEP 2: PAYMENT METHOD */}
      {step===2 && (
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 13px",fontSize:14,fontWeight:800}}>💳 Método de Pago</h3>
          <div style={{background:C.navyL,borderRadius:9,padding:"9px 12px",fontSize:12,color:C.navy,marginBottom:13,display:"flex",gap:7,alignItems:"flex-start"}}>
            <span>ℹ️</span>
            <span>Selecciona cómo quieres pagar. Los datos bancarios se mostrarán <strong>después de confirmar</strong> para adjuntar tu comprobante.</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {PAY.map(pm => (
              <div key={pm.id} onClick={()=>setMethod(pm.id)}
                style={{border:`2px solid ${method===pm.id?pm.color:C.border}`,borderRadius:10,padding:13,cursor:"pointer",background:method===pm.id?"#FAFAFA":"transparent",display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
                <span style={{fontSize:22}}>{pm.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{pm.label}</div>
                  <div style={{color:C.muted,fontSize:11}}>{pm.desc}</div>
                </div>
                <div style={{width:17,height:17,borderRadius:"50%",border:`2px solid ${method===pm.id?pm.color:C.border}`,background:method===pm.id?pm.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {method===pm.id && <div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}} />}
                </div>
              </div>
            ))}
          </div>
          {method==="card" && (
            <div style={{background:C.light,borderRadius:9,padding:13,marginBottom:12,display:"flex",flexDirection:"column",gap:9}}>
              <div style={{background:C.amberL,borderRadius:7,padding:"7px 11px",fontSize:12,color:C.amber}}>ℹ️ Revisado por VendeYApp antes de procesar</div>
              <input value={cardNum} onChange={e=>setCardNum(e.target.value)} placeholder="0000 0000 0000 0000" maxLength={19} style={inp} />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                <input value={cardExp} onChange={e=>setCardExp(e.target.value)} placeholder="MM/AA" maxLength={5} style={inp} />
                <input type="password" value={cardCvv} onChange={e=>setCardCvv(e.target.value.slice(0,4))} placeholder="CVV" style={inp} />
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:9}}>
            <button className="hop" onClick={()=>setStep(1)} style={{...btn(C.light,C.muted),padding:"11px 16px",fontSize:13}}>← Atrás</button>
            <button className="hop" onClick={()=>canConfirm&&setStep(3)}
              style={{...btn(canConfirm?C.red:C.border,canConfirm?"#fff":C.muted),padding:"11px",flex:1,fontSize:14,justifyContent:"center",fontWeight:700}}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRM */}
      {step===3 && (
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>✅ Confirmar Pedido</h3>
          <div style={{fontSize:13,color:C.muted,marginBottom:4,display:"flex",justifyContent:"space-between"}}>
            <span>Entrega</span>
            <span style={{fontWeight:600,color:C.text}}>{dlvType==="pickup"?"🏪 Retiro en tienda":"🚚 A domicilio"}</span>
          </div>
          <div style={{fontSize:13,color:C.muted,marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span>Pago</span>
            <span style={{fontWeight:600,color:C.text}}>{PAY.find(m=>m.id===method)?.icon} {PAY.find(m=>m.id===method)?.label}</span>
          </div>

          {(method==="pagomovil"||method==="zelle") && (
            <div style={{background:C.greenL,border:`1px solid ${C.green}33`,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12,display:"flex",gap:7}}>
              <span>💡</span>
              <span>Luego de confirmar verás los datos de pago para <strong>{PAY.find(m=>m.id===method)?.label}</strong> y podrás adjuntar tu comprobante.</span>
            </div>
          )}
          <div style={{background:C.navyL,border:`1px solid ${C.navy}22`,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12}}>
            🔒 <strong>Compra Protegida VendeYApp:</strong> El vendedor recibe el pago solo cuando confirmes que tu pedido llegó en perfecto estado.
          </div>
          <div style={{display:"flex",gap:9,marginTop:4}}>
            <button className="hop" onClick={()=>setStep(2)} style={{...btn(C.light,C.muted),padding:"11px 16px",fontSize:13}}>← Atrás</button>
            <button className="hop" onClick={handleConfirm} disabled={processing}
              style={{...btn(C.red),padding:"12px",flex:1,fontSize:14,justifyContent:"center",opacity:processing?0.7:1,fontWeight:700}}>
              {processing ? <><Spin />Procesando…</> : `Confirmar ${fU(grandTotal)} 🔒`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */
function AuthPage({ login,register,verifyEmail,nav,initMode="login",params={} }) {
  useDocTitle(initMode==="login"?"Iniciar sesión":"Crear cuenta");
  useMeta("Inicia sesión o crea tu cuenta en VendeYApp. Compra y vende en Venezuela de forma segura.");
  const [isLogin, setIsLogin] = useState(initMode==="login");
  const [role,    setRole]    = useState("buyer");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [storeN,   setStoreN]   = useState("");
  const [storeD,   setStoreD]   = useState("");
  const [storeLogo,setStoreLogo]= useState("");
  const [logoUpl,  setLogoUpl]  = useState(false);
  const [location,setLocation]= useState("");
  const [bankData,setBankData]= useState({bank:"",account:"",rif:"",phone:"",accountHolder:""});
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [vs,      setVs]      = useState(null);
  const [code,    setCode]    = useState("");
  const [codeErr, setCodeErr] = useState("");

  const handle = async () => {
    setErr(""); setLoading(true);
    await new Promise(r => setTimeout(r,500));
    if(isLogin) {
      const r = await login(email,pw);
      if(r?.error==="not_verified") { const c=gC(); setVs({userId:r.userId,code:c,email}); setLoading(false); return; }
      if(r?.error) { setErr(r.error); setLoading(false); return; }
      const ret = params?.returnTo;
      const retParams = params?.returnToParams || {};
      nav(ret ? ret : r.user.role==="admin"?"admin":r.user.role==="merchant"?"merchant-dash":"landing",
          {...retParams, ...(params?.pendingFav ? {pendingFav:params.pendingFav} : {})});
    } else {
      if(!name||!email||!pw||!location) { setErr("Completa todos los campos."); setLoading(false); return; }
      const r = await register({name,email,password:pw,role,location,...(role==="merchant"?{storeName:storeN||`${name} Store`,storeDesc:storeD,storeLogo,bankData}:{storeName:"",storeDesc:""})});
      if(r.error) { setErr(r.error); setLoading(false); return; }
      const c = gC(); setVs({userId:r.user.id,code:c,email});
    }
    setLoading(false);
  };
  const handleVerify = async () => {
    setCodeErr("");
    if(code!==vs.code) { setCodeErr("Código incorrecto."); return; }
    await verifyEmail(vs.userId);
    nav("landing");
  };

  if(vs) return (
    <div style={{maxWidth:380,margin:"40px auto",padding:"0 16px"}}>
      <div style={{...card,padding:28,textAlign:"center"}}>
        <div style={{width:62,height:62,borderRadius:18,background:C.red+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>📧</div>
        <h2 style={{fontFamily:Fh,margin:"0 0 7px",fontSize:19,fontWeight:800}}>Verifica tu correo</h2>
        <p style={{color:C.muted,fontSize:12,margin:"0 0 18px",lineHeight:1.65}}>Enviamos un código a <strong>{vs.email}</strong></p>
        <div style={{background:C.gold+"18",border:`1px solid ${C.gold}44`,borderRadius:9,padding:"11px 14px",marginBottom:18}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Código demo:</div>
          <div style={{fontFamily:"monospace",fontWeight:900,fontSize:28,letterSpacing:6,color:C.red}}>{vs.code}</div>
        </div>
        <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}
          style={{...inp,textAlign:"center",letterSpacing:6,fontSize:24,fontFamily:"monospace",marginBottom:9,fontWeight:700}} />
        {codeErr && <div style={{color:"#991B1B",fontSize:12,marginBottom:9}}>⚠️ {codeErr}</div>}
        <button className="hop" onClick={handleVerify} style={{...btn(C.red),padding:"12px",width:"100%",justifyContent:"center",fontSize:14,fontWeight:700}}>✓ Verificar y entrar</button>
        <p style={{fontSize:12,color:C.muted,marginTop:12}}><span style={{cursor:"pointer",color:C.red,fontWeight:600}} onClick={()=>setVs(p=>({...p,code:gC()}))}>Reenviar código</span></p>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:420,margin:"30px auto",padding:"0 16px"}}>
      <div style={{...card,padding:24}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:Fh,fontWeight:900,fontSize:22,marginBottom:3}}>VendeY<span style={{color:C.red}}>App</span></div>
          <h2 style={{fontFamily:Fh,margin:"0 0 3px",fontSize:17,fontWeight:800}}>{isLogin?"Bienvenido":"Crea tu cuenta"}</h2>
          <p style={{color:C.muted,fontSize:12,margin:0}}>Marketplace seguro · Venezuela</p>
        </div>

        {!isLogin && (
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[["buyer","🛒","Comprador"],["merchant","🏪","Vendedor"]].map(([r,ic,l]) => (
              <div key={r} onClick={()=>setRole(r)}
                style={{flex:1,padding:11,textAlign:"center",borderRadius:10,cursor:"pointer",border:`2px solid ${role===r?C.red:C.border}`,background:role===r?C.redL:"#fff",transition:"all .15s"}}>
                <div style={{fontSize:22,marginBottom:3}}>{ic}</div>
                <div style={{fontSize:12,fontWeight:700,color:role===r?C.red:C.text}}>{l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {!isLogin && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo *" style={inp} />}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo electrónico *" style={inp} />
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Contraseña *" style={inp} />
          {!isLogin && <LocationPicker value={location} onChange={setLocation} placeholder="📍 Tu ciudad *" />}
          {!isLogin && role==="merchant" && (
            <>
              {/* Store logo */}
              <div style={{display:"flex",gap:11,alignItems:"center",padding:"10px 12px",background:C.light,borderRadius:9}}>
                <div style={{width:52,height:52,borderRadius:10,overflow:"hidden",background:C.border,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                  {storeLogo ? <img src={storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : "🏪"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>Logo de tu tienda (opcional)</div>
                  <label style={{...btn(C.light,C.muted),padding:"5px 10px",fontSize:11,cursor:"pointer",display:"inline-flex",gap:5,alignItems:"center"}}>
                    {logoUpl ? <><Spin/>Subiendo…</> : storeLogo ? "Cambiar logo" : "📷 Subir logo"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setLogoUpl(true);const b=await compressImg(f,300);if(b)setStoreLogo(b);setLogoUpl(false);}} />
                  </label>
                </div>
              </div>
              <input value={storeN} onChange={e=>setStoreN(e.target.value)} placeholder="Nombre de tu tienda" style={inp} />
              <textarea value={storeD} onChange={e=>setStoreD(e.target.value)} placeholder="Descripción de tu tienda…" style={{...inp,minHeight:60,resize:"vertical",fontFamily:Fb}} />
              <div style={{background:C.navyL,borderRadius:9,padding:11,fontSize:12,color:C.navy}}>
                <div style={{fontWeight:700,marginBottom:8}}>💸 Datos bancarios para liquidaciones</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  <input value={bankData.bank} onChange={e=>setBankData(p=>({...p,bank:e.target.value}))} placeholder="Banco (ej: Banesco, Mercantil…)" style={inp} />
                  <input value={bankData.account} onChange={e=>setBankData(p=>({...p,account:e.target.value}))} placeholder="Número de cuenta" style={inp} />
                  <input value={bankData.accountHolder} onChange={e=>setBankData(p=>({...p,accountHolder:e.target.value}))} placeholder="Titular de la cuenta" style={inp} />
                  <input value={bankData.rif} onChange={e=>setBankData(p=>({...p,rif:e.target.value}))} placeholder="RIF o Cédula" style={inp} />
                  <input value={bankData.phone} onChange={e=>setBankData(p=>({...p,phone:e.target.value}))} placeholder="Teléfono PagoMóvil" style={inp} />
                </div>
              </div>
            </>
          )}
        </div>

        {err && <div style={{background:C.redL,color:"#991B1B",borderRadius:7,padding:"8px 12px",fontSize:12,marginTop:9}}>⚠️ {err}</div>}

        

        <button className="hop" onClick={handle} disabled={loading}
          style={{...btn(C.red),padding:"12px",width:"100%",marginTop:13,fontSize:14,justifyContent:"center",opacity:loading?0.7:1,fontWeight:700}}>
          {loading ? <><Spin />Procesando…</> : isLogin ? "Ingresar →" : role==="merchant" ? "Crear mi tienda 🚀" : "Registrarme 🚀"}
        </button>
        <p style={{textAlign:"center",marginTop:11,fontSize:12,color:C.muted}}>
          {isLogin?"¿Sin cuenta? ":"¿Ya tienes cuenta? "}
          <span onClick={()=>setIsLogin(v=>!v)} style={{color:C.red,fontWeight:600,cursor:"pointer"}}>{isLogin?"Regístrate gratis":"Ingresar"}</span>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MY ORDERS + ORDER DETAIL
═══════════════════════════════════════════════ */
function FavoritesPage({ products, nav, addToCart, rate, rateLabel, favs=[], toggleFav, user }) {
  const favProducts = products.filter(p => favs.includes(p.id));
  useDocTitle("Mis Favoritos");
  useMeta("Tus productos guardados en VendeYApp.");
  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>❤️ Mis Favoritos</h1>
      {!favProducts.length ? (
        <div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
          <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><HeartIcon saved={false} size={52} /></div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Aún no tienes favoritos</div>
          <div style={{fontSize:13,marginBottom:20}}>Guarda productos que te interesen con el corazón</div>
          <button className="hop" onClick={()=>nav("browse")} style={{...btn(C.red),padding:"11px 24px",fontSize:14}}>Explorar productos</button>
        </div>
      ) : (
        <>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{favProducts.length} producto{favProducts.length!==1?"s":""} guardado{favProducts.length!==1?"s":""}</div>
          <PGrid items={favProducts} nav={nav} addToCart={addToCart} rate={rate} rateLabel={rateLabel} favs={favs} toggleFav={toggleFav} />
        </>
      )}
    </div>
  );
}

function MyOrdersPage({ user,orders,nav }) {
  const mine = orders.filter(o => o.buyerId===user?.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>Mis Compras</h1>
      {!mine.length
        ? <div style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:48}}>📦</div><div style={{marginTop:10,fontWeight:600}}>Sin pedidos aún</div><button className="hop" onClick={()=>nav("browse")} style={{...btn(C.red),padding:"10px 20px",marginTop:14,justifyContent:"center"}}>Explorar</button></div>
        : <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {mine.map(o => <OCard key={o.id} order={o} nav={nav} />)}
          </div>
      }
    </div>
  );
}

/* Derive a single display status from an order for buyer/admin overview */
function orderDisplayST(order) {
  if(!order.vendors) return (order.deliveryType==="pickup"?ST_PICKUP:ST)[order.status]||{};
  if(["submitted","rejected","expired"].includes(order.status))
    return ST[order.status]||{};
  /* payment verified — derive from vendor statuses */
  const vs = order.vendors.map(v=>v.status||"verified");
  if(vs.some(s=>s==="disputed"))  return ST.disputed;
  if(vs.every(s=>s==="released")) return ST.released;
  if(vs.some(s=>s==="shipped"))   return ST.shipped;
  if(vs.some(s=>s==="processing"))return ST.processing;
  return ST.verified;
}
/* Derive display ST for a specific merchant's vendor entry */
function vendorST(vendor, deliveryType) {
  return (deliveryType==="pickup"?ST_PICKUP:ST)[vendor.status||"verified"]||{};
}


function OCard({ order,nav }) {
  const st      = orderDisplayST(order);
  const expired = order.status==="submitted" && order.deadline && new Date(order.deadline) < new Date();
  return (
    <div className="lift" style={{...card,padding:14,cursor:"pointer",transition:"all .2s"}} onClick={()=>nav("order-detail",{orderId:order.id})}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:9}}>
        <div>
          <span style={{fontWeight:700,fontSize:13,fontFamily:Fh}}>#{order.id.slice(0,8).toUpperCase()}</span>
          <span style={{color:C.muted,fontSize:11,marginLeft:9}}>{fD(order.createdAt)} · {order.deliveryType==="pickup"?"🏪 Retiro":"🚚 Envío"}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{expired?"⏰ Expirado":st.l}</span>
          <span style={{fontFamily:Fh,fontWeight:800,fontSize:15,color:C.red}}>{fU(order.grandTotal||order.subtotal)}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {(order.vendors ? order.vendors.flatMap(v=>v.items) : order.items||[]).slice(0,4).map(i => <div key={i.productId} style={{width:38,height:38,borderRadius:6,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={i.product?.image} /></div>)}
        {order.vendors && (
          <span style={{fontSize:10,color:C.navy,fontWeight:700,background:C.navyL,padding:"2px 6px",borderRadius:8}}>
            {order.vendors.length === 1 ? `🏪 ${order.vendors[0].merchantName}` : `${order.vendors.length} tiendas`}
          </span>
        )}
        {(order.vendors ? order.vendors.some(v=>v.review) : order.review) && <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}><Stars v={(order.vendors?order.vendors.find(v=>v.review)?.review:order.review)?.rating||0} size={11} /><span style={{fontSize:10,color:C.muted}}>Reseñada</span></div>}
        {order.status==="submitted" && order.deadline && !expired && !(order.paymentRef && order.paymentProofImg) && (
          <div style={{marginLeft:"auto",fontSize:12}}>
            <Countdown deadline={order.deadline} />
          </div>
        )}
        {order.status==="submitted" && (order.paymentRef || order.paymentProofImg) && (
          <span style={{marginLeft:"auto",fontSize:10,color:C.green,fontWeight:700}}>✓ Pago enviado</span>
        )}
      </div>
    </div>
  );
}

/* BUYER PROOF UPLOAD */
function BuyerProofUpload({ order, updateStatus, showT }) {
  const [ref,      setRef]      = useState(order.paymentRef||"");
  const [proofImg, setProofImg] = useState(order.paymentProofImg||null);
  const [proofName,setProofName]= useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(!!(order.paymentRef&&order.paymentProofImg));

  if(sent || (order.paymentRef && order.paymentProofImg)) {
    return (
      <div style={{background:C.greenL,borderRadius:8,padding:"9px 13px",fontSize:12,color:"#065F46",fontWeight:600,display:"flex",gap:7,alignItems:"center"}}>
        ✅ Comprobante enviado. Ref: {order.paymentRef}
      </div>
    );
  }

  const handleFile = async e => {
    const file=e.target.files[0]; if(!file) return;
    setProofName(file.name);
    const b = await readB64(file);
    setProofImg(b);
  };

  const handleSend = async () => {
    if(!ref.trim()) { showT("Escribe el número de referencia",true); return; }
    if(!proofImg) { showT("Adjunta el comprobante de pago",true); return; }
    setSending(true);
    await updateStatus(order.id, "submitted", {paymentRef:ref, paymentProofImg:proofImg});
    setSent(true);
    setSending(false);
    showT("Comprobante enviado ✓");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      <div>
        <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Número de referencia *</label>
        <input value={ref} onChange={e=>setRef(e.target.value)} placeholder="Ej: 00112233445566"
          style={{...inp,fontFamily:"monospace",fontSize:13}} />
      </div>
      <div>
        <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Captura del comprobante *</label>
        <label style={{display:"flex",alignItems:"center",gap:8,background:proofImg?C.greenL:C.light,border:`2px dashed ${proofImg?C.green:C.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer"}}>
          <span style={{fontSize:18}}>{proofImg?"✅":"📎"}</span>
          <span style={{fontSize:12,color:proofImg?C.green:C.muted,fontWeight:600}}>{proofName||"Seleccionar imagen"}</span>
          <input type="file" accept="image/*" onChange={handleFile} style={{display:"none"}} />
        </label>
      </div>
      {proofImg && (
        <img src={proofImg} style={{maxHeight:150,maxWidth:"100%",borderRadius:7,objectFit:"contain",border:`1px solid ${C.border}`}} />
      )}
      <button className="hop" onClick={handleSend} disabled={sending||!ref.trim()||!proofImg}
        style={{...btn(C.red),padding:"11px",width:"100%",justifyContent:"center",opacity:(sending||!ref.trim()||!proofImg)?0.5:1,fontWeight:700}}>
        {sending?<><Spin/>Enviando…</>:"Enviar Comprobante ✓"}
      </button>
    </div>
  );
}

/* ORDER DETAIL */
function ProofImageCard({ paymentProofImg, paymentRef }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <div style={{...card,padding:14,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>🧾 Comprobante de Pago</div>
        <div style={{position:"relative",cursor:"zoom-in"}} onClick={()=>setZoomed(true)}>
          <img src={paymentProofImg} style={{maxWidth:"100%",maxHeight:260,borderRadius:8,border:`1px solid ${C.border}`,objectFit:"contain",display:"block"}} />
          <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.55)",color:"#fff",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,pointerEvents:"none"}}>🔍 Ampliar</div>
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>Ref: <strong style={{fontFamily:"monospace"}}>{paymentRef||"N/A"}</strong></span>
          <button className="hop" onClick={()=>setZoomed(true)} style={{...btn(C.navyL,C.navy),padding:"3px 10px",fontSize:11}}>Ver completo</button>
        </div>
      </div>

      {/* Zoom overlay */}
      {zoomed && (
        <div onClick={()=>setZoomed(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,cursor:"zoom-out"}}>
          <div style={{position:"relative",maxWidth:"95vw",maxHeight:"95vh"}} onClick={e=>e.stopPropagation()}>
            <img src={paymentProofImg} style={{maxWidth:"90vw",maxHeight:"85vh",borderRadius:10,objectFit:"contain",display:"block",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}} />
            <button onClick={()=>setZoomed(false)} style={{position:"absolute",top:-14,right:-14,width:32,height:32,borderRadius:"50%",background:"#fff",border:"none",cursor:"pointer",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}>✕</button>
            <div style={{color:"#fff",fontSize:12,textAlign:"center",marginTop:10,opacity:.7}}>Ref: {paymentRef||"N/A"} · Clic fuera para cerrar</div>
          </div>
        </div>
      )}
    </>
  );
}


/* VendorSection — one per vendor inside an order detail */
function VendorSection({ vendor, order, isMerchant, isBuyer, isAdmin, user, updateStatus, submitReview, users, nav, showT, completePayout }) {
  const [shipB64,       setShipB64]      = useState(null);
  const [shipName,      setShipName]     = useState("");
  const [rating,        setRating]       = useState(0);
  const [comment,       setComment]      = useState("");
  const [submRev,       setSubmRev]      = useState(false);
  const [buyerRating,   setBuyerRating]  = useState(0);
  const [buyerComment,  setBuyerComment] = useState("");
  const [submBuyerRev,  setSubmBuyerRev] = useState(false);
  const [confirmDlv,    setConfirmDlv]   = useState(false);
  const [showDispute,   setShowDispute]  = useState(false);
  const [dispReason,    setDispReason]   = useState("");
  const [dispDesc,      setDispDesc]     = useState("");
  const [dispSub,       setDispSub]      = useState(false);

  const isPickup  = order.deliveryType==="pickup";
  const FLOW      = isPickup ? FLOW_PICKUP : FLOW_DELIVERY;
  const FL        = isPickup ? FL_PICKUP   : FL_DELIVERY;
  const vStatus   = vendor.status || "verified";
  const st        = vendorST(vendor, order.deliveryType);
  const curr      = FLOW.indexOf(vStatus);

  const handleShipFile = async e => {
    const f=e.target.files[0]; if(!f) return;
    setShipName(f.name);
    setShipB64(await readB64(f));
  };

  const upV = (s,ex={}) => updateStatus(order.id, s, ex, vendor.merchantId);

  const merch = users?.find(u=>u.id===vendor.merchantId);
  const multi = order.vendors?.length > 1;

  return (
    <div style={{...card,padding:16,marginBottom:12}}>
      {/* Vendor header */}
      {(multi || isBuyer || isAdmin) && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:14,fontFamily:Fh}}>🏪 {vendor.merchantName}</div>
          <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{st.l}</span>
        </div>
      )}

      {/* Items */}
      {vendor.items.map(i => (
        <div key={i.productId} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
          <div style={{width:46,height:46,borderRadius:8,overflow:"hidden",background:C.light,flexShrink:0}}><Img src={i.product?.image} /></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13}}>{i.product?.name||i.productId}</div>
            <div style={{color:C.muted,fontSize:11}}>×{i.qty} · {fU(i.product?.salePrice||i.product?.price||0)} c/u</div>
          </div>
          <div style={{fontWeight:700,color:C.red,flexShrink:0}}>{fU((i.product?.salePrice||i.product?.price||0)*i.qty)}</div>
        </div>
      ))}

      {/* Totals */}
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:4}}>
        {isMerchant ? (
          <>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:2}}><span>Subtotal</span><span>{fU(vendor.subtotal)}</span></div>
            {vendor.shippingCost>0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:2}}><span>Envío</span><span>{fU(vendor.shippingCost)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#991B1B",marginBottom:2}}><span>Comisión VendeYApp</span><span>-{fU(vendor.platformFee)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:C.green,marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`}}><span>Tu ganancia</span><span>{fU(vendor.merchantAmount)}</span></div>
          </>
        ) : (
          <>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.muted,marginBottom:3}}><span>Productos</span><span>{fU(vendor.subtotal)}</span></div>
            {vendor.shippingCost>0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.muted,marginBottom:3}}><span>🚚 Envío</span><span>{fU(vendor.shippingCost)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`}}><span>Total tienda</span><span style={{color:C.red}}>{fU(vendor.subtotal+vendor.shippingCost)}</span></div>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!["disputed"].includes(vStatus) && (
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`,overflowX:"auto"}}>
          <div style={{display:"flex",alignItems:"flex-start",minWidth:isPickup?300:380}}>
            {FLOW.map((s,i,arr) => {
              const done=i<=curr, active=i===curr;
              return (
                <div key={s} style={{display:"flex",alignItems:"center",flex:i<arr.length-1?1:undefined}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,minWidth:isPickup?58:50}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:done?C.green:C.border,border:active?`3px solid ${C.green}`:"none",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,boxShadow:active?`0 0 0 3px ${C.green}33`:"none"}}>{done?"✓":i+1}</div>
                    <div style={{fontSize:8,color:done?C.green:C.muted,fontWeight:active?800:done?700:400,marginTop:3,textAlign:"center",lineHeight:1.2,maxWidth:56}}>{FL[s]}</div>
                  </div>
                  {i<arr.length-1 && <div style={{flex:1,height:2,background:i<curr?C.green:C.border,margin:"0 2px",marginBottom:18,borderRadius:2}} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disputed card */}
      {vStatus==="disputed" && (
        <div style={{marginTop:12,padding:12,borderRadius:9,background:"#FFF1F2",border:`1.5px solid ${C.red}44`}}>
          <div style={{fontWeight:700,fontSize:13,color:C.red,marginBottom:6}}>⚠️ Disputa Abierta</div>
          {vendor.disputeReason && <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{{no_llegó:"No llegó",diferente:"Producto diferente",dañado:"Llegó dañado",incompleto:"Incompleto",fraude:"Fraude",otro:"Otro"}[vendor.disputeReason]||vendor.disputeReason}</div>}
          {vendor.disputeDesc && <div style={{fontSize:12,color:C.text,lineHeight:1.5,background:"#fff",borderRadius:7,padding:"7px 10px",marginBottom:6}}>{vendor.disputeDesc}</div>}
          {vendor.disputeResolution && (
            <div style={{padding:"8px 10px",borderRadius:7,background:vendor.disputeResolution==="buyer"?C.greenL:C.navyL,fontWeight:700,fontSize:12,color:vendor.disputeResolution==="buyer"?C.green:C.navy,marginTop:6}}>
              {vendor.disputeResolution==="buyer"?"✅ Resuelta: reembolso al comprador":"✅ Resuelta: fondos liberados al vendedor"}
              {vendor.disputeNote && <div style={{fontWeight:400,marginTop:3}}>{vendor.disputeNote}</div>}
            </div>
          )}
        </div>
      )}

      {/* Pickup address reveal — buyer only when processing */}
      {isPickup && ["processing","released"].includes(vStatus) && isBuyer && (
        <div style={{marginTop:12,padding:12,borderRadius:9,background:"#F0FDF4",border:`1.5px solid ${C.green}44`}}>
          <div style={{fontWeight:700,fontSize:13,color:C.green,marginBottom:8}}>{vStatus==="processing"?"📦 Listo para retirar":"🏪 Info de Retiro"}</div>
          {merch?.pickupAddress
            ? <><div style={{fontSize:13,background:"#fff",borderRadius:7,padding:"9px 11px",marginBottom:6,border:`1px solid ${C.border}`}}>{merch.pickupAddress}</div>{merch.pickupSchedule&&<div style={{fontSize:12,color:C.muted}}>🕐 {merch.pickupSchedule}</div>}</>
            : <div style={{fontSize:12,color:C.muted}}>El vendedor coordinará el retiro contigo.</div>
          }
          <div style={{fontSize:11,color:C.muted,marginTop:8,fontStyle:"italic"}}>Lleva tu comprobante de pago al momento del retiro.</div>
        </div>
      )}

      {/* Payout info — merchant only */}
      {isMerchant && vStatus==="released" && (
        <div style={{marginTop:12,padding:12,borderRadius:9,background:C.greenL,border:`1px solid ${C.green}33`}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>💸 Liquidación</div>
          {vendor.payoutStatus==="pending_payout" && <div style={{fontSize:12,color:C.text}}>Programada: <strong>{fD(vendor.payoutScheduledAt)}</strong> · {fU(vendor.merchantAmount)}</div>}
          {vendor.payoutStatus==="paid_out" && <div style={{fontSize:12,fontWeight:600,color:"#065F46"}}>✅ Completada el {fD(vendor.payoutCompletedAt)} · {fU(vendor.merchantAmount)}</div>}
          {!vendor.payoutStatus && <div style={{fontSize:12,color:C.muted}}>Fondos en proceso de liquidación.</div>}
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:12}}>

        {/* MERCHANT actions */}
        {isMerchant && vStatus==="verified" && !isPickup && (
          <button className="hop" onClick={()=>upV("processing")} style={{...btn(C.navy),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>📦 Marcar "Preparando pedido"</button>
        )}
        {isMerchant && vStatus==="verified" && isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🏪 Preparar para Retiro</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>Cuando tengas el pedido listo, presiona el botón. El comprador recibirá tu dirección de retiro.</div>
            {!merch?.pickupAddress && (
              <div style={{background:C.amberL,borderRadius:7,padding:"7px 10px",fontSize:11,color:"#78350F",marginBottom:10}}>
                ⚠️ No tienes dirección de retiro. <button className="hop" onClick={()=>nav("bank-settings")} style={{background:"none",border:"none",color:C.navy,fontWeight:700,cursor:"pointer",fontSize:11,padding:0}}>Agrégala →</button>
              </div>
            )}
            <button className="hop" onClick={()=>upV("processing")} style={{...btn(C.red),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>📦 Marcar como Listo para Retirar</button>
          </div>
        )}
        {isMerchant && vStatus==="processing" && isPickup && (
          <div style={{padding:13,borderRadius:9,background:C.navyL,border:`1px solid ${C.navy}22`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:C.navy}}>⏳ Esperando confirmación del comprador</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>El pedido está listo. Los fondos se liberarán automáticamente cuando el comprador confirme que retiró el producto.</div>
          </div>
        )}
        {isMerchant && vStatus==="processing" && !isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>🚚 Confirmar Envío</div>
            <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,background:"#fff",border:`2px dashed ${shipB64?C.green:C.border}`,borderRadius:9,padding:14,textAlign:"center",cursor:"pointer",marginBottom:9}}>
              <div style={{fontSize:22}}>{shipB64?"✅":"📤"}</div>
              <div style={{fontSize:12,fontWeight:600,color:shipB64?C.green:C.text}}>{shipName||"Seleccionar guía de envío"}</div>
              <div style={{fontSize:11,color:C.muted}}>Foto de guía, sticker courier</div>
              <input type="file" accept="image/*" onChange={handleShipFile} style={{display:"none"}} />
            </label>
            <button className="hop" onClick={()=>shipB64&&upV("shipped",{shippingGuide:shipB64})}
              style={{...btn(shipB64?C.red:C.light,shipB64?"#fff":C.muted),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>
              {shipB64?"🚚 Confirmar Envío":"⚠️ Sube la guía para continuar"}
            </button>
          </div>
        )}

        {/* BUYER: confirm pickup */}
        {isBuyer && vStatus==="processing" && isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🏪 ¿Retiraste el pedido?</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>
              El pedido está listo en <strong>{merch?.pickupAddress||vendor.merchantName}</strong>. Confirma solo cuando tengas el producto en tus manos — esto libera los fondos al vendedor.
            </div>
            {!confirmDlv
              ? <button className="hop" onClick={()=>setConfirmDlv(true)} style={{...btn(C.green),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>✅ Confirmar que retiré el pedido</button>
              : <div>
                  <div style={{background:C.amberL,borderRadius:7,padding:"8px 10px",fontSize:12,marginBottom:9,color:"#78350F"}}>⚠️ Al confirmar, los fondos se liberan al vendedor. ¿Ya tienes el producto?</div>
                  <div style={{display:"flex",gap:9}}>
                    <button className="hop" onClick={()=>upV("released")} style={{...btn(C.green),padding:"10px",flex:1,justifyContent:"center",fontWeight:700}}>✅ Sí, ya lo tengo</button>
                    <button className="hop" onClick={()=>setConfirmDlv(false)} style={{...btn(C.light,C.muted),padding:"10px"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
        )}

        {/* BUYER: confirm delivery */}
        {isBuyer && vStatus==="shipped" && !isPickup && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>📦 ¿Recibiste este pedido?</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>Al confirmar, los fondos se liberan al vendedor <strong>{vendor.merchantName}</strong>.</div>
            {!confirmDlv
              ? <button className="hop" onClick={()=>setConfirmDlv(true)} style={{...btn(C.green),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>{isPickup?"✅ Confirmar retiro":"✅ Confirmar recepción"} — Liberar fondos</button>
              : <div>
                  <div style={{background:C.amberL,borderRadius:7,padding:"8px 10px",fontSize:12,marginBottom:9}}>⚠️ Esta acción libera fondos al vendedor. ¿Confirmas?</div>
                  <div style={{display:"flex",gap:9}}>
                    <button className="hop" onClick={()=>upV("released")} style={{...btn(C.green),padding:"10px",flex:1,justifyContent:"center",fontWeight:700}}>✅ Confirmar</button>
                    <button className="hop" onClick={()=>setConfirmDlv(false)} style={{...btn(C.light,C.muted),padding:"10px"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
        )}

        {/* BUYER: open dispute */}
        {isBuyer && vStatus==="shipped" && !isPickup && !showDispute && (
          <button className="hop" onClick={()=>setShowDispute(true)} style={{...btn(C.redL,"#991B1B"),padding:"9px",justifyContent:"center",fontSize:12,border:`1px solid ${C.red}22`}}>⚠️ Tengo un problema con {vendor.merchantName} — Abrir Disputa</button>
        )}
        {isBuyer && vStatus==="shipped" && !isPickup && showDispute && (
          <div style={{padding:14,borderRadius:9,border:`1.5px solid ${C.red}44`,background:"#FFF8F8"}}>
            <div style={{fontWeight:700,fontSize:13,color:C.red,marginBottom:8}}>⚠️ Abrir Disputa — {vendor.merchantName}</div>
            <select value={dispReason} onChange={e=>setDispReason(e.target.value)} style={{...inp,cursor:"pointer",marginBottom:9}}>
              <option value="">— Selecciona el motivo —</option>
              <option value="no_llegó">El producto no llegó</option>
              <option value="diferente">Producto diferente a lo descrito</option>
              <option value="dañado">Llegó dañado</option>
              <option value="incompleto">Pedido incompleto</option>
              <option value="fraude">Posible fraude</option>
              <option value="otro">Otro</option>
            </select>
            <textarea value={dispDesc} onChange={e=>setDispDesc(e.target.value)} placeholder="Describe el problema en detalle…" style={{...inp,minHeight:70,resize:"vertical",fontSize:13,lineHeight:1.5,marginBottom:9}} />
            <div style={{display:"flex",gap:8}}>
              <button className="hop" onClick={()=>setShowDispute(false)} style={{...btn(C.light,C.muted),padding:"9px",flex:1,justifyContent:"center"}}>Cancelar</button>
              <button className="hop" disabled={!dispReason||!dispDesc.trim()||dispSub}
                onClick={async()=>{if(!dispReason||!dispDesc.trim())return;setDispSub(true);await upV("disputed",{disputeReason:dispReason,disputeDesc:dispDesc,disputeAt:new Date().toISOString()});setDispSub(false);setShowDispute(false);}}
                style={{...btn(C.red),padding:"9px",flex:2,justifyContent:"center",fontWeight:700,opacity:(!dispReason||!dispDesc.trim()||dispSub)?0.5:1}}>
                {dispSub?<><Spin/>Enviando…</>:"⚠️ Confirmar Disputa"}
              </button>
            </div>
          </div>
        )}

        {/* BUYER: review */}
        {isBuyer && vStatus==="released" && !vendor.review && (
          <div style={{padding:14,borderRadius:9,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>⭐ Califica a {vendor.merchantName}</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <Stars v={rating} size={26} onChange={setRating} />
              {rating>0 && <span style={{fontSize:12,color:C.muted}}>{["","Malo","Regular","Bueno","Muy bueno","Excelente"][rating]}</span>}
            </div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comparte tu experiencia…" style={{...inp,minHeight:60,resize:"vertical",marginBottom:8}} />
            <button className="hop" onClick={async()=>{if(!rating)return;setSubmRev(true);await submitReview(order.id,rating,comment,vendor.merchantId);setSubmRev(false);}}
              disabled={submRev||!rating} style={{...btn(C.gold,C.navy),padding:"9px",width:"100%",justifyContent:"center",opacity:!rating?0.45:1,fontWeight:700}}>
              {submRev?<><Spin dark/>Enviando…</>:"Publicar Reseña ⭐"}
            </button>
          </div>
        )}
        {vendor.review && <div style={{background:C.greenL,borderRadius:9,padding:10,fontSize:12,color:"#065F46",display:"flex",alignItems:"center",gap:7}}><Stars v={vendor.review.rating} size={13} /><span>Reseña enviada ✓</span></div>}
        {isBuyer && vendor.buyerReview && vendor.review && (
          <div style={{background:C.navyL,borderRadius:9,padding:10,border:`1px solid ${C.navy}22`}}>
            <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:4}}>📝 El vendedor te calificó:</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <Stars v={vendor.buyerReview.rating} size={13} />
              {vendor.buyerReview.comment && <span style={{fontSize:11,color:C.muted}}>"{vendor.buyerReview.comment}"</span>}
            </div>
          </div>
        )}
        {isBuyer && vendor.buyerReview && !vendor.review && (
          <div style={{background:C.light,borderRadius:9,padding:10,border:`1px solid ${C.border}`,fontSize:12,color:C.muted}}>
            🔒 El vendedor ya te calificó — califica tú primero para ver su reseña.
          </div>
        )}

        {/* MERCHANT: review of buyer */}
        {isMerchant && vStatus==="released" && !vendor.buyerReview && (
          <div style={{padding:14,borderRadius:9,background:C.navyL,border:`1px solid ${C.navy}22`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:C.navy}}>⭐ Califica al comprador</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <Stars v={buyerRating} size={26} onChange={setBuyerRating} />
              {buyerRating>0 && <span style={{fontSize:12,color:C.muted}}>{["","Malo","Regular","Bueno","Muy bueno","Excelente"][buyerRating]}</span>}
            </div>
            <textarea value={buyerComment} onChange={e=>setBuyerComment(e.target.value)} placeholder="¿Cómo fue la experiencia con este comprador?" style={{...inp,minHeight:55,resize:"vertical",marginBottom:8}} />
            <button className="hop" onClick={async()=>{if(!buyerRating)return;setSubmBuyerRev(true);await submitReview(order.id,buyerRating,buyerComment,vendor.merchantId,"buyer");setSubmBuyerRev(false);}}
              disabled={submBuyerRev||!buyerRating} style={{...btn(C.navy),padding:"9px",width:"100%",justifyContent:"center",opacity:!buyerRating?0.45:1,fontWeight:700}}>
              {submBuyerRev?<><Spin dark/>Enviando…</>:"Publicar Reseña al Comprador ⭐"}
            </button>
          </div>
        )}
        {isMerchant && vendor.buyerReview && (
          <div style={{background:C.navyL,borderRadius:9,padding:10,fontSize:12,color:C.navy,display:"flex",alignItems:"center",gap:7}}>
            <Stars v={vendor.buyerReview.rating} size={13} />
            <span>Reseña al comprador enviada ✓</span>
          </div>
        )}

        {/* ADMIN: dispute resolution */}
        {isAdmin && vStatus==="disputed" && !vendor.disputeResolution && (
          <DisputeResolver order={{...order, ...vendor, id:order.id, merchantId:vendor.merchantId}} updateStatus={(id,s,ex)=>updateStatus(id,s,ex,vendor.merchantId)} showT={showT} />
        )}

        {/* ADMIN: payout completion */}
        {isAdmin && vStatus==="released" && vendor.payoutStatus==="pending_payout" && (
          <button className="hop" onClick={()=>completePayout&&completePayout(order.id,vendor.merchantId)} style={{...btn(C.green),padding:"11px",width:"100%",justifyContent:"center",fontWeight:700}}>💸 Confirmar Liquidación al Vendedor</button>
        )}
      </div>
    </div>
  );
}

function OrderDetailPage({ orders,users,params,updateStatus,user,nav,submitReview,showT,completePayout,rate,rateLabel }) {
  const order = orders.find(o => o.id===params.orderId);

  if(!order) return (
    <div style={{padding:40,textAlign:"center",color:C.muted}}>
      Orden no encontrada. <span style={{cursor:"pointer",color:C.red,marginLeft:6}} onClick={()=>nav("my-orders")}>Volver</span>
    </div>
  );

  const isBuyer    = user?.id===order.buyerId;
  const isMerchant = user?.role==="merchant" && order.vendors?.some(v=>v.merchantId===user?.id);
  const isAdmin    = user?.role==="admin";
  const isExpired  = order.status==="submitted" && order.deadline && new Date(order.deadline) < new Date();

  /* Determine which vendors to show */
  const allVendors   = order.vendors || [];
  const displayVendors = isMerchant
    ? allVendors.filter(v=>v.merchantId===user.id)
    : allVendors;

  /* Overall display status (for header badge — buyer/admin) */
  const overallST = orderDisplayST(order);

  /* Total shipping for display */
  const shippingTotal = order.shippingTotal ?? allVendors.reduce((s,v)=>s+(v.shippingCost||0),0);
  const grandTotal    = order.grandTotal    ?? allVendors.reduce((s,v)=>s+v.subtotal+(v.shippingCost||0),0);

  return (
    <div className="page-wrap">
      <button className="hop" onClick={()=>nav(isMerchant?"merchant-orders":isAdmin?"admin":"my-orders")}
        style={{...btn(C.light,C.muted),padding:"6px 12px",fontSize:12,marginBottom:16}}>← Volver</button>

      {/* Order header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:9,marginBottom:16}}>
        <div>
          <h1 style={{fontFamily:Fh,margin:"0 0 3px",fontSize:18,fontWeight:800}}>Orden #{order.id.slice(0,8).toUpperCase()}</h1>
          <div style={{color:C.muted,fontSize:12}}>{fD(order.createdAt)} · {order.buyerName} · {order.deliveryType==="pickup"?"🏪 Retiro":"🚚 Envío"}</div>
        </div>
        {!isMerchant && (
          <span style={{background:overallST.bg,color:overallST.c,fontSize:12,fontWeight:700,padding:"5px 13px",borderRadius:20}}>
            {isExpired?"⏰ Expirado":overallST.l}
          </span>
        )}
      </div>

      {/* Payment countdown */}
      {order.status==="submitted" && order.deadline && !isExpired && isBuyer && !(order.paymentRef && displayVendors[0]?.items?.length) && (
        <div style={{background:C.amberL,border:`1px solid ${C.amber}44`,borderRadius:9,padding:"12px 14px",marginBottom:13}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:C.amber,fontWeight:700}}>⏱ Tiempo para enviar tu comprobante:</span>
            <Countdown deadline={order.deadline} onExpire={()=>updateStatus(order.id,"expired")} />
          </div>
          <div style={{fontSize:12,color:C.amber}}>Tienes <strong>10 minutos</strong> para adjuntar tu referencia y comprobante de pago.</div>
        </div>
      )}

      {/* Bank payment instructions — buyer only */}
      {isBuyer && order.status==="submitted" && !isExpired && (order.paymentMethod==="pagomovil"||order.paymentMethod==="zelle") && (
        <div style={{...card,padding:16,marginBottom:13,border:`2px solid ${order.paymentMethod==="pagomovil"?C.navy:C.purple}33`}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:11,fontFamily:Fh,color:order.paymentMethod==="pagomovil"?C.navy:"#5B21B6"}}>
            {order.paymentMethod==="pagomovil"?"🏦 Datos para PagoMóvil":"💵 Datos para Zelle"}
          </div>
          {order.paymentMethod==="pagomovil" && (
            <div style={{background:C.navyL,borderRadius:8,padding:"11px 14px",fontFamily:"monospace",fontSize:12,lineHeight:2.2,marginBottom:10}}>
              🏦 <strong>Banco Venezuela</strong> · Cód. 0102<br/>
              📱 <strong>0412-123-4567</strong><br/>
              🪪 <strong>RIF J-12345678-9</strong><br/>
              👤 <strong>VendeYApp C.A.</strong><br/>
              💰 Monto exacto: <strong style={{color:C.red,fontSize:14}}>{fBs(grandTotal,rate)}</strong>
            </div>
          )}
          {order.paymentMethod==="zelle" && (
            <div style={{background:"#F3EEFF",borderRadius:8,padding:"11px 14px",fontFamily:"monospace",fontSize:12,lineHeight:2.2,marginBottom:10}}>
              📧 <strong>pagos@vendeya.app</strong><br/>
              👤 <strong>VendeYApp C.A.</strong><br/>
              💰 Monto exacto: <strong style={{color:C.red,fontSize:14}}>{fU(grandTotal)}</strong>
            </div>
          )}
          <BuyerProofUpload order={order} updateStatus={updateStatus} showT={showT} />
        </div>
      )}
      {order.status==="submitted" && !isExpired && isMerchant && (
        <div style={{background:C.navyL,border:`1px solid ${C.navy}22`,borderRadius:9,padding:"10px 14px",marginBottom:13,fontSize:12,color:C.navy}}>
          ⏳ Esperando que el comprador adjunte su comprobante de pago.
        </div>
      )}
      {isExpired && <div style={{background:C.light,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",marginBottom:13,fontSize:12,color:C.muted}}>⏰ Esta orden expiró porque no se envió el comprobante a tiempo.</div>}

      {/* Admin: payment verification */}
      {isAdmin && order.status==="submitted" && !isExpired && (
        <div style={{...card,padding:16,marginBottom:12,border:`2px solid ${C.red}22`}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:5,fontFamily:Fh}}>⚙️ Verificar Pago</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:11}}>{order.paymentProofImg?"✅ Comprobante adjuntado.":"⚠️ Sin comprobante."} Ref: <strong style={{fontFamily:"monospace"}}>{order.paymentRef||"—"}</strong></div>
          <div style={{display:"flex",gap:9}}>
            <button className="hop" onClick={()=>updateStatus(order.id,"verified")} style={{...btn(C.green),padding:"10px 16px",flex:1,justifyContent:"center",fontWeight:700}}>✅ Verificar y Aprobar</button>
            <button className="hop" onClick={()=>updateStatus(order.id,"rejected")} style={{...btn(C.redL,"#991B1B"),padding:"10px 16px",flex:1,justifyContent:"center",fontWeight:700}}>✕ Rechazar</button>
          </div>
        </div>
      )}

      {/* Proof image — admin only */}
      {order.paymentProofImg && isAdmin && (
        <ProofImageCard paymentProofImg={order.paymentProofImg} paymentRef={order.paymentRef} />
      )}

      {/* Shipping guide — visible to buyer and admin */}
      {displayVendors.filter(v=>v.shippingGuide).map(v=>(
        <div key={v.merchantId} style={{...card,padding:14,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>📦 Guía de Envío{allVendors.length>1?` — ${v.merchantName}`:""}</div>
          <img src={v.shippingGuide} style={{maxWidth:"100%",maxHeight:280,borderRadius:8,border:`1px solid ${C.border}`,objectFit:"contain",display:"block"}} />
        </div>
      ))}

      {/* Order totals summary — buyer and admin only */}
      {!isMerchant && (
        <div style={{...card,padding:16,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🧾 Resumen de pago</div>
          {allVendors.map(v=>(
            <div key={v.merchantId}>
              {allVendors.length>1 && <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>🏪 {v.merchantName}</div>}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}><span>Productos</span><span>{fU(v.subtotal)}</span></div>
              {v.shippingCost>0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}><span>🚚 Envío</span><span>{fU(v.shippingCost)}</span></div>}
            </div>
          ))}
          {shippingTotal>0 && allVendors.length<=1 && null /* already shown above */}
          <div style={{display:"flex",justifyContent:"space-between",fontFamily:Fh,fontWeight:900,fontSize:17,marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
            <span>Total pagado</span><span style={{color:C.red}}>{fU(grandTotal)}</span>
          </div>
          <div style={{fontSize:11,color:C.muted,textAlign:"right",marginTop:2}}>{fBs(grandTotal,rate)} · Pago: {PAY.find(m=>m.id===order.paymentMethod)?.label}</div>
          {order.address && order.deliveryType!=="pickup" && <div style={{fontSize:11,color:C.muted,marginTop:6}}>📍 {order.address}</div>}
        </div>
      )}

      {/* Buyer protection message */}
      {isBuyer && !["rejected","expired"].includes(order.status) && (
        <div style={{background:overallST.l===ST.released.l?C.greenL:C.navyL,border:`1px solid ${overallST.l===ST.released.l?C.green:C.navy}22`,borderRadius:9,padding:"11px 14px",marginBottom:12,display:"flex",gap:9,alignItems:"flex-start"}}>
          <span style={{fontSize:18}}>{overallST.l===ST.released.l?"✅":"🔒"}</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:overallST.l===ST.released.l?"#065F46":C.navy,marginBottom:2}}>{overallST.l===ST.released.l?"¡Compra completada!":"Tu compra está protegida"}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>
              {overallST.l===ST.released.l?"El vendedor recibió el pago. Gracias por comprar en VendeYApp."
                :order.deliveryType==="pickup"?"Pagas y el vendedor recibe el dinero solo cuando confirme que retiraste el pedido."
                :"Pagas y el vendedor recibe el dinero solo cuando confirmes que tu pedido llegó correctamente."}
            </div>
          </div>
        </div>
      )}

      {/* Vendor sections */}
      {displayVendors.map(vendor => (
        <VendorSection key={vendor.merchantId}
          vendor={vendor} order={order}
          isMerchant={isMerchant} isBuyer={isBuyer} isAdmin={isAdmin}
          user={user} updateStatus={updateStatus} submitReview={submitReview}
          users={users} nav={nav} showT={showT} completePayout={completePayout} />
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════ */
function NotificationsPage({ myNotifs,nav,markNotifDone,upN,user }) {
  const handleClick = (n) => {
    if(!n.link) return;
    if(n.link.startsWith("product:")) nav("product",{productId:n.link.replace("product:","")});
    else nav("order-detail",{orderId:n.link});
  };
  const active = myNotifs.filter(n => !n.done);
  const done   = myNotifs.filter(n => n.done);

  return (
    <div className="page-wrap">
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>🔔 Notificaciones</h1>
      {!myNotifs.length && (
        <div style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:44}}>🔔</div><div style={{marginTop:10,fontWeight:600}}>Sin notificaciones</div></div>
      )}
      {active.length > 0 && (
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Activas ({active.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>
            {active.map(n => (
              <div key={n.id} style={{...card,padding:13,borderLeft:`4px solid ${n.read?C.border:C.red}`,display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{flex:1,cursor:n.link?"pointer":"default"}} onClick={()=>handleClick(n)}>
                  <div style={{fontSize:13,fontWeight:n.read?400:600,lineHeight:1.6}}>{n.msg}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:3}}>{ago(n.createdAt)}</div>
                </div>
                <button className="hop" onClick={()=>markNotifDone(n.id)}
                  style={{...btn(C.greenL,C.green),padding:"4px 10px",fontSize:11,flexShrink:0}}>✓ Listo</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Completadas ({done.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {done.slice(0,8).map(n => (
              <div key={n.id} style={{...card,padding:13,opacity:0.55,display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,lineHeight:1.55}}>{n.msg}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{ago(n.createdAt)} · ✓ Completada</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MERCHANT SIDEBAR (shared layout)
═══════════════════════════════════════════════ */
const M_NAV = [
  {icon:"🏠",label:"Dashboard",    pg:"merchant-dash"},
  {icon:"🛍️",label:"Productos",    pg:"merchant-products"},
  {icon:"📋",label:"Pedidos",      pg:"merchant-orders"},
  {icon:"❓",label:"Preguntas",    pg:"merchant-qa"},
  {icon:"📊",label:"Analytics",   pg:"merchant-analytics"},
  {icon:"💸",label:"Liquidaciones",pg:"payouts"},
  {icon:"🏦",label:"Cuenta Bancaria",pg:"bank-settings"},
];

function MerchantShell({ user, page, nav, children, pendingQA=0 }) {
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

/* ═══════════════════════════════════════════════
   MERCHANT Q&A
═══════════════════════════════════════════════ */
function MerchantQA({ user, products, nav, answerQ, showT }) {
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
              <div key={q.id} style={{...card,padding:16,border:!q.answer?`2px solid ${C.amber}44`:`1px solid ${C.border}`}}>
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


/* ═══════════════════════════════════════════════
   MERCHANT DASH + PRODUCTS + ADD/EDIT + ORDERS
═══════════════════════════════════════════════ */
function MerchantDash({ user,users,products,orders,nav,upU,showT,setUser,reviews=[] }) {
  const [pickupAddr,  setPickupAddr]  = useState("");
  const [pickupSched, setPickupSched] = useState("");
  const [pickupSaving,setPickupSaving]= useState(false);
  const mp    = products.filter(p => p.merchantId===user?.id);
  const mo    = orders.filter(o => o.merchantId===user?.id);
  const pending = mo.filter(o => ["submitted","verified"].includes(o.status));
  const escrow  = mo.filter(o => ["submitted","verified","processing","shipped"].includes(o.status)).reduce((s,o)=>s+o.merchantAmount,0);
  const earned  = mo.filter(o => o.status==="released").reduce((s,o)=>s+o.merchantAmount,0);
  const mu = users?.find(u=>u.id===user?.id)||user;
  const walletBal = mu?.walletBalance||0;
  // sync pickup state from user data
  React.useEffect(()=>{ setPickupAddr(mu?.pickupAddress||""); setPickupSched(mu?.pickupSchedule||""); },[mu?.pickupAddress,mu?.pickupSchedule]);
  const savePickup = async () => {
    setPickupSaving(true);
    const updated = users.map(u=>u.id===user.id?{...u,pickupAddress:pickupAddr.trim(),pickupSchedule:pickupSched.trim()}:u);
    await upU(updated);
    const nu = updated.find(u=>u.id===user.id);
    setUser(nu);
    setPickupSaving(false);
    showT("Datos de retiro guardados ✓");
  };
  const myReviews = reviews.filter(r=>r.merchantId===user?.id);
  const avgR    = myReviews.length ? (myReviews.reduce((s,r)=>s+r.rating,0)/myReviews.length).toFixed(1) : "—";

  const pendingQA = mp.flatMap(p =>
    (p.questions||[]).filter(q=>!q.answer).map(q=>({...q,productId:p.id,productName:p.name,productImage:p.image||p.images?.[0]}))
  );

  const STATS = [
    {ic:"🛍️",l:"Productos activos",v:mp.filter(p=>p.active).length,c:C.navy,action:()=>nav("merchant-products")},
    {ic:"📦",l:"Órdenes totales",v:mo.length,c:C.red,action:()=>nav("merchant-orders")},
    {ic:"⏳",l:"Pedidos pendientes",v:pending.length,c:C.amber,action:()=>nav("merchant-orders")},
    {ic:"🔒",l:"En custodia",v:`$${escrow.toFixed(0)}`,c:C.purple,action:null},
    {ic:"💰",l:"Ganado total",v:`$${earned.toFixed(0)}`,c:C.green,action:()=>nav("payouts")},
    {ic:"👛",l:"En billetera",v:`$${walletBal.toFixed(0)}`,c:C.gold,action:()=>nav("payouts")},
    {ic:"⭐",l:"Rating promedio",v:avgR,c:C.amber,action:null},
    {ic:"👁️",l:"Vistas totales",v:mp.reduce((s,p)=>s+(p.views||0),0),c:C.muted,action:()=>nav("merchant-analytics")},
  ];

  return (
    <MerchantShell user={user} page="merchant-dash" nav={nav} pendingQA={pendingQA.length}>
    <div style={{maxWidth:860}}>

      {/* ── HEADER ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <label title="Clic para cambiar logo" style={{position:"relative",width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:C.navy}}>
            {user?.storeLogo
              ? <img src={user.storeLogo} style={{width:"100%",height:"100%",objectFit:"cover"}} />
              : <span style={{fontFamily:Fh,fontWeight:900,fontSize:22,color:"#fff"}}>{user?.storeName?.[0]||"🏪"}</span>}
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",opacity:0}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>📷</div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const b=await compressImg(f,400);if(b){const nu=users.map(u=>u.id===user.id?{...u,storeLogo:b}:u);await upU(nu);const nu2=nu.find(u=>u.id===user.id);setUser(nu2);showT("Logo actualizado ✓");}e.target.value="";}} />
          </label>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <h1 style={{fontFamily:Fh,margin:0,fontSize:"clamp(16px,3vw,20px)",fontWeight:800}}>{user?.storeName||"Mi Tienda"}</h1>
              {user?.merchantVerified && <Pill label="✓ Verificado" c={C.green} sx={{fontSize:10}} />}
            </div>
            <div style={{color:C.muted,fontSize:12,marginTop:2}}>{user?.location||"Sin ubicación"} · Miembro desde {new Date(user?.joinedAt||Date.now()).toLocaleDateString("es-VE",{month:"short",year:"numeric"})}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:1}}>Clic en el logo para cambiarlo</div>
          </div>
        </div>
        <button className="hop" onClick={()=>nav("merchant-add")} style={{...btn(C.red),padding:"10px 18px",fontSize:13,fontWeight:700,flexShrink:0}}>+ Nuevo Producto</button>
      </div>

      {/* ── VERIFICATION ALERT ── */}
      {!user?.merchantVerified && (
        <div style={{background:C.amberL,border:`1px solid ${C.amber}55`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:20,flexShrink:0}}>⚠️</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:C.amber}}>Verificación pendiente</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Tu tienda está en revisión. Podrás publicar y vender una vez aprobada.</div>
          </div>
        </div>
      )}

      {/* ── PENDING Q&A ALERT ── */}
      {pendingQA.length > 0 && (
        <div style={{background:C.redL,border:`1.5px solid ${C.red}33`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:16}}>❓</span>
            <span style={{fontWeight:700,fontSize:13,color:C.red}}>{pendingQA.length} pregunta{pendingQA.length!==1?"s":""} sin responder</span>
            <button className="hop" onClick={()=>nav("merchant-qa")} style={{...btn(C.red),padding:"3px 10px",fontSize:11,marginLeft:"auto"}}>Responder →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {pendingQA.slice(0,3).map(q => (
              <div key={q.id} onClick={()=>nav("merchant-qa")}
                style={{background:"#fff",borderRadius:8,padding:"8px 11px",cursor:"pointer",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9}}
                onMouseEnter={e=>e.currentTarget.style.background=C.light}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                {q.productImage && <img src={q.productImage} style={{width:30,height:30,borderRadius:5,objectFit:"cover",flexShrink:0}} />}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.productName}</div>
                  <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.question}</div>
                </div>
                <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{ago(q.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATS GRID ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
        {STATS.map(s => (
          <div key={s.l} onClick={s.action||undefined}
            style={{...card,padding:"14px 16px",cursor:s.action?"pointer":"default",transition:"all .15s"}}
            onMouseEnter={e=>{if(s.action)e.currentTarget.style.transform="translateY(-2px)"}}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{fontSize:22,marginBottom:6}}>{s.ic}</div>
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:"clamp(17px,2.5vw,22px)",color:s.c,lineHeight:1}}>{s.v}</div>
            <div style={{color:C.muted,fontSize:11,marginTop:4,lineHeight:1.3}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── 2-COL CONTENT ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>

        {/* Recent products */}
        <div style={{...card,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:14}}>🛍️ Mis productos</span>
            <button className="hop" onClick={()=>nav("merchant-products")} style={{...btn(C.navyL,C.navy),padding:"3px 10px",fontSize:11}}>Ver todos →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {mp.slice(0,5).map(p => (
              <div key={p.id} style={{display:"flex",gap:9,alignItems:"center",cursor:"pointer",padding:"4px 6px",borderRadius:7}}
                onClick={()=>nav("product",{productId:p.id})}
                onMouseEnter={e=>e.currentTarget.style.background=C.light}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:36,height:36,borderRadius:7,overflow:"hidden",background:C.light,flexShrink:0}}><Img src={p.image} /></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:11,color:C.red,fontWeight:700}}>{fU(p.salePrice||p.price)}</div>
                </div>
                <Pill label={p.active?"ON":"OFF"} c={p.active?C.green:C.red} sx={{fontSize:9,padding:"1px 6px"}} />
              </div>
            ))}
            {!mp.length && <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>Sin productos aún</div>}
          </div>
        </div>

        {/* Recent orders */}
        <div style={{...card,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:14}}>📋 Pedidos recientes</span>
            <button className="hop" onClick={()=>nav("merchant-orders")} style={{...btn(C.navyL,C.navy),padding:"3px 10px",fontSize:11}}>Ver todos →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {mo.slice(0,5).map(o => {
              const myV = o.vendors?o.vendors.find(v=>v.merchantId===user?.id):null;
              const st  = vendorST(myV||{status:o.status}, o.deliveryType);
              const mAmt= myV?myV.merchantAmount:o.merchantAmount;
              return (
                <div key={o.id} onClick={()=>nav("order-detail",{orderId:o.id})}
                  style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 8px",borderRadius:7,border:`1px solid ${C.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.light}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700}}>#{o.id.slice(0,6).toUpperCase()}</div>
                    <div style={{fontSize:10,color:C.muted}}>{o.buyerName} · {fU(o.merchantAmount)}</div>
                  </div>
                  <span style={{background:st.bg,color:st.c,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,whiteSpace:"nowrap"}}>{st.l}</span>
                </div>
              );
            })}
            {!mo.length && <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>Sin órdenes aún</div>}
          </div>
        </div>

        {/* Pickup address card */}
        <div style={{...card,padding:16,marginTop:0}}>
          <div style={{fontWeight:700,fontSize:14,fontFamily:Fh,marginBottom:4}}>🏪 Retiro en Tienda</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Esta dirección la verá el comprador cuando su pedido esté listo para retirar.</div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Dirección de retiro</label>
              <textarea value={pickupAddr} onChange={e=>setPickupAddr(e.target.value)}
                placeholder="Ej: CC Sambil, Nivel Feria, Local 142, Chacao, Caracas."
                style={{...inp,minHeight:60,resize:"vertical",fontFamily:Fb,fontSize:13,lineHeight:1.5}} />
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:4}}>Horario de atención</label>
              <input value={pickupSched} onChange={e=>setPickupSched(e.target.value)}
                placeholder="Ej: Lunes a Sábado, 10:00am – 7:00pm" style={inp} />
            </div>
            <button className="hop" onClick={savePickup} disabled={pickupSaving}
              style={{...btn(C.navy),padding:"10px",justifyContent:"center",fontSize:13,fontWeight:700,opacity:pickupSaving?0.6:1}}>
              {pickupSaving?<><Spin/>Guardando…</>:"Guardar datos de retiro ✓"}
            </button>
          </div>
        </div>

      </div>
    </div>
    </MerchantShell>
  );
}


function MerchantProducts({ user,products,upP,nav,showT }) {
  const mp = products.filter(p => p.merchantId===user?.id);
  const toggle = async id => {
    const prod = products.find(p=>p.id===id);
    if(prod?.adminDisabledPermanent) { showT("Este producto fue deshabilitado permanentemente por el admin",true); return; }
    if(prod?.adminDisabled) { showT("Pausado por el admin. Contacta soporte para reactivarlo.",true); return; }
    if(prod && !prod.active && prod.stock<=0) { showT("Sin stock: recarga el inventario antes de activar",true); return; }
    await upP(products.map(p=>p.id===id?{...p,active:!p.active}:p));
    showT("Actualizado ✓");
  };
  const del    = async id => { if(!confirm("¿Eliminar?")) return; await upP(products.filter(p=>p.id!==id)); showT("Eliminado"); };
  return (
    <MerchantShell user={user} page="merchant-products" nav={nav}>
    <div style={{maxWidth:900}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h1 style={{fontFamily:Fh,margin:0,fontSize:20,fontWeight:800}}>Mis Productos ({mp.length})</h1>
        <button className="hop" onClick={()=>nav("merchant-add")} style={{...btn(C.red),padding:"9px 16px",fontSize:13,fontWeight:700}}>+ Nuevo</button>
      </div>
      {!mp.length
        ? <div style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:44}}>🛍️</div><div style={{marginTop:10,fontWeight:600}}>Sin productos</div><button className="hop" onClick={()=>nav("merchant-add")} style={{...btn(C.red),padding:"10px 20px",marginTop:13,justifyContent:"center"}}>Publicar</button></div>
        : <div className="vy-grid">
            {mp.map(p => (
              <div key={p.id} style={{...card,overflow:"hidden"}}>
                <div style={{height:130,overflow:"hidden",position:"relative",background:C.light}}>
                  <Img src={p.image} />
                  <div style={{position:"absolute",top:6,left:6}}><Pill label={p.condition==="new"?"Nuevo":"Usado"} c={p.condition==="new"?C.navy:C.slate} solid /></div>
                  <div style={{position:"absolute",top:6,right:6,display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                    <Pill label={p.active&&!p.adminDisabled?"ON":p.adminDisabledPermanent?"🚫 Bloqueado":"PAUSADO"} c={p.active&&!p.adminDisabled?C.green:C.red} />
                  </div>
                  {p.adminDisabled && (
                    <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.65)",color:"#fff",fontSize:9,padding:"3px 7px",fontWeight:600,lineHeight:1.4}}>
                      {p.adminDisabledPermanent?"🚫":"⚠️"} {p.adminDisabledReason||"Bloqueado por admin"}
                    </div>
                  )}
                  {p.stock===0 && <div style={{position:"absolute",bottom:6,left:6}}><Pill label="Sin stock" c="#fff" bg="rgba(0,0,0,.55)" /></div>}
                </div>
                <div style={{padding:11}}>
                  <div style={{fontWeight:600,fontSize:12,marginBottom:4,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                    {p.salePrice && <span style={{fontSize:10,color:C.muted,textDecoration:"line-through"}}>{fU(p.price)}</span>}
                    <span style={{color:C.red,fontWeight:800,fontSize:14,fontFamily:Fh}}>{fU(p.salePrice||p.price)}</span>
                  </div>
                  <div style={{fontSize:10,color:C.muted,marginBottom:9}}>Stock: {p.stock} · Vistas: {p.views||0}</div>
                  <div style={{display:"flex",gap:5}}>
                    <button className="hop" onClick={()=>toggle(p.id)} style={{...btn(C.light,C.muted),padding:"5px 7px",fontSize:10,flex:1,justifyContent:"center"}}>{p.active?"Pausar":"Activar"}</button>
                    <button className="hop" onClick={()=>nav("merchant-add",{editId:p.id})} style={{...btn(C.navyL,C.navy),padding:"5px 8px",fontSize:11}}>✏️</button>
                    <button className="hop" onClick={()=>del(p.id)} style={{...btn(C.redL,"#991B1B"),padding:"5px 8px",fontSize:11}}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
    </MerchantShell>
  );
}

/* MERCHANT ADD/EDIT */
function MerchantAddEdit({ user,products,upP,nav,showT,params }) {
  const ep = params?.editId ? products.find(p=>p.id===params.editId) : null;
  const [name,         setName]        = useState(ep?.name||"");
  const [price,        setPrice]       = useState(ep?.price||"");
  const [salePrice,    setSalePrice]   = useState(ep?.salePrice||"");
  const [cat,          setCat]         = useState(ep?.category||"Tecnología");
  const [cond,         setCond]        = useState(ep?.condition||"new");
  const [desc,         setDesc]        = useState(ep?.description||"");
  const [images,       setImages]      = useState(ep?.images || (ep?.image ? [ep.image] : []));
  const [uploading,    setUploading]   = useState(false);
  const [stock,        setStock]       = useState(ep?.stock||"");
  const [allowsPickup, setPickup]      = useState(ep?.allowsPickup??true);
  const [allowsDelivery,setDelivery]   = useState(ep?.allowsDelivery??true);
  const [deliveryDays, setDays]        = useState(ep?.deliveryDays||"3-5");
  const [shippingCost, setShippingCost]= useState(ep?.shippingCost??5);
  const [freeShipping, setFreeShip]   = useState(ep?.freeShipping??false);
  const [saving,       setSaving]      = useState(false);
  const handleFiles = async e => {
    const files = Array.from(e.target.files);
    if(!files.length) return;
    if(images.length + files.length > 8) { showT("Máximo 8 fotos por producto",true); return; }
    setUploading(true);
    const newImgs = [];
    for(const file of files) {
      const b = await compressImg(file, 900);
      if(b) newImgs.push(b);
    }
    setImages(prev => [...prev, ...newImgs]);
    showT(`${newImgs.length} foto${newImgs.length>1?"s":""} agregada${newImgs.length>1?"s":""} ✓`);
    setUploading(false);
    e.target.value = "";
  };
  const moveImg = (from, to) => {
    if(to < 0 || to >= images.length) return;
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setImages(arr);
  };
  const removeImg = idx => setImages(prev => prev.filter((_,i)=>i!==idx));
  const handleSave = async () => {
    if(!name.trim()||!price||!images.length||!stock) { showT("Completa los campos * y sube al menos 1 imagen",true); return; }
    if(salePrice && +salePrice >= +price) { showT("El precio de oferta debe ser menor al precio normal",true); return; }
    if(!allowsPickup && !allowsDelivery) { showT("Debes activar al menos una opción de entrega",true); return; }
    if(allowsDelivery && !freeShipping && (!shippingCost || +shippingCost <= 0)) { showT("Indica el costo de envío o activa Envío GRATIS",true); return; }
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));
    const data = {
      name:censorContact(name),price:+price,
      salePrice:salePrice&&+salePrice<+price ? +salePrice : null,
      category:cat,condition:cond,description:censorContact(desc),
      image:images[0]||"", images:[...images],
      stock:+stock,allowsPickup,allowsDelivery,deliveryDays,
      shippingCost:freeShipping?0:(+shippingCost||0),freeShipping:!!freeShipping,
      merchantLoc:user.location||"Venezuela"
    };
    if(ep) {
      await upP(products.map(p => p.id===ep.id ? {...p,...data,active:+stock>0?p.active:false} : p));
      showT("Actualizado ✓");
    } else {
      const np = {id:uid(),merchantId:user.id,merchantName:user.storeName||user.name,merchantLoc:user.location||"Venezuela",active:true,views:0,questions:[],createdAt:new Date().toISOString(),...data};
      await upP([...products,np]);
      showT("Publicado 🎉");
    }
    setSaving(false);
    nav("merchant-products");
  };
  const disc = salePrice&&price&&+salePrice<+price ? Math.round((1-+salePrice/+price)*100) : 0;

  return (
    <div style={{maxWidth:580,margin:"0 auto",padding:"20px 14px"}}>
      <button className="hop" onClick={()=>nav("merchant-products")} style={{...btn(C.light,C.muted),padding:"6px 12px",fontSize:12,marginBottom:16}}>← Volver</button>
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>{ep?"Editar":"Nuevo"} Producto</h1>
      <div style={{...card,padding:24,display:"flex",flexDirection:"column",gap:13}}>

        {/* Multi-image upload */}
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:4}}>📸 Fotos del producto <span style={{color:C.red}}>*</span></label>
          <div style={{fontSize:11,color:C.muted,marginBottom:9}}>La 1ª foto es el thumbnail de portada · ← → para reordenar · Máx. 8 fotos</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-start"}}>
            {images.map((img,i) => (
              <div key={i} style={{position:"relative",width:86,height:86,borderRadius:9,overflow:"hidden",border:`3px solid ${i===0?C.red:C.border}`,flexShrink:0,background:C.light}}>
                <img src={img} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                {i===0 && <div style={{position:"absolute",top:2,left:2,background:C.red,color:"#fff",fontSize:8,fontWeight:800,padding:"2px 5px",borderRadius:4,lineHeight:1}}>PORTADA</div>}
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.6)",display:"flex",justifyContent:"center",gap:0,padding:"3px 0"}}>
                  {i>0 && <button onClick={()=>moveImg(i,i-1)} style={{background:"none",border:"none",color:"#fff",fontSize:12,cursor:"pointer",padding:"0 6px",lineHeight:1}}>←</button>}
                  {i<images.length-1 && <button onClick={()=>moveImg(i,i+1)} style={{background:"none",border:"none",color:"#fff",fontSize:12,cursor:"pointer",padding:"0 6px",lineHeight:1}}>→</button>}
                  <button onClick={()=>removeImg(i)} style={{background:"none",border:"none",color:"#ff8888",fontSize:12,cursor:"pointer",padding:"0 6px",lineHeight:1}}>✕</button>
                </div>
              </div>
            ))}
            {images.length < 8 && (
              <label style={{width:86,height:86,borderRadius:9,background:C.light,border:`2px dashed ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:uploading?"wait":"pointer",gap:4,flexShrink:0}}>
                {uploading ? <><Spin/><span style={{fontSize:9,color:C.muted}}>Subiendo…</span></> : <><span style={{fontSize:24,lineHeight:1}}>＋</span><span style={{fontSize:10,color:C.muted,fontWeight:600}}>Foto</span></>}
                <input type="file" accept="image/*" multiple onChange={handleFiles} style={{display:"none"}} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Nombre del producto <span style={{color:C.red}}>*</span></label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: iPhone 14 Pro 256GB Negro" style={inp} />
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Precio USD <span style={{color:C.red}}>*</span></label>
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" style={inp} min="0" step="0.01" />
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Precio oferta (opcional)</label>
            <input type="number" value={salePrice} onChange={e=>setSalePrice(e.target.value)} placeholder="Menor al precio" style={inp} min="0" step="0.01" />
          </div>
        </div>
        {disc > 0 && <div style={{background:C.greenL,border:`1px solid ${C.green}22`,borderRadius:8,padding:"7px 11px",fontSize:12,color:C.green,fontWeight:700}}>✓ Descuento: -{disc}% · De {fU(+price)} a {fU(+salePrice)}</div>}
        {salePrice && +salePrice >= +price && price && <div style={{background:C.redL,borderRadius:8,padding:"7px 11px",fontSize:12,color:"#991B1B",fontWeight:600}}>⚠️ El precio de oferta debe ser menor al precio normal</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Categoría</label>
            <select value={cat} onChange={e=>setCat(e.target.value)} style={{...inp,cursor:"pointer"}}>
              {CATS.filter(c=>c!=="Todo").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Stock <span style={{color:C.red}}>*</span></label>
            <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="0" style={inp} min="0" />
          </div>
        </div>

        {stock=="0" && <div style={{background:C.amberL,borderRadius:8,padding:"7px 11px",fontSize:12,color:C.amber}}>⚠️ Con stock 0, la publicación se pausará automáticamente.</div>}

        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:7}}>Condición</label>
          <div style={{display:"flex",gap:8}}>
            {[["new","✨ Nuevo"],["used","Usado / Seminuevo"]].map(([v,l]) => (
              <div key={v} onClick={()=>setCond(v)}
                style={{flex:1,padding:"10px 12px",textAlign:"center",borderRadius:9,cursor:"pointer",border:`2px solid ${cond===v?C.red:C.border}`,background:cond===v?C.redL:"#fff",fontSize:13,fontWeight:cond===v?700:400,color:cond===v?C.red:C.text,transition:"all .15s"}}>{l}</div>
            ))}
          </div>
        </div>

        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Descripción</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Detalles, estado, especificaciones, qué incluye…" style={{...inp,minHeight:85,resize:"vertical",fontFamily:Fb}} />
        </div>

        {/* Delivery options — shipping cost is part of the delivery option */}
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:9}}>Opciones de Entrega</label>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>

            {/* ENVÍO A DOMICILIO */}
            <div style={{borderRadius:9,border:`2px solid ${allowsDelivery?C.green:C.border}`,background:allowsDelivery?C.greenL:"#fff",overflow:"hidden"}}>
              <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"10px 12px"}}>
                <input type="checkbox" checked={allowsDelivery} onChange={e=>setDelivery(e.target.checked)} style={{width:15,height:15,accentColor:C.green}} />
                <div><div style={{fontWeight:600,fontSize:13}}>🚚 Envío a domicilio</div><div style={{fontSize:11,color:C.muted}}>Envías el producto al comprador</div></div>
              </label>
              {allowsDelivery && (
                <div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:8}}>
                  <input value={deliveryDays} onChange={e=>setDays(e.target.value)} placeholder="Días de entrega (ej: 3-5)" style={{...inp,fontSize:12}} />
                  {/* Shipping cost inside delivery */}
                  <div style={{display:"flex",gap:8}}>
                    <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"8px 11px",borderRadius:8,border:`1.5px solid ${freeShipping?C.teal:C.border}`,background:freeShipping?"#fff":"transparent",flex:1}}>
                      <input type="checkbox" checked={freeShipping} onChange={e=>{setFreeShip(e.target.checked);if(e.target.checked)setShippingCost(0);}} style={{accentColor:C.teal}} />
                      <div style={{fontWeight:700,fontSize:12,color:C.teal}}>🚚 Envío GRATIS</div>
                    </label>
                  </div>
                  {!freeShipping && (
                    <div>
                      <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Costo de envío (USD) <span style={{color:C.red}}>*</span></label>
                      <input type="number" value={shippingCost} onChange={e=>setShippingCost(e.target.value)} placeholder="Ej: 5.00" style={{...inp,borderColor:!freeShipping&&(!shippingCost||+shippingCost<=0)?C.red:C.border}} min="0.01" step="0.01" />
                      {!freeShipping && (!shippingCost || +shippingCost <= 0) && (
                        <div style={{fontSize:11,color:C.red,marginTop:3,fontWeight:600}}>⚠️ Requerido: ingresa el costo o activa Envío GRATIS</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"10px 12px",borderRadius:9,border:`2px solid ${allowsPickup?C.navy:C.border}`,background:allowsPickup?C.navyL:"#fff"}}>
              <input type="checkbox" checked={allowsPickup} onChange={e=>setPickup(e.target.checked)} style={{width:15,height:15,accentColor:C.navy}} />
              <div><div style={{fontWeight:600,fontSize:13}}>🏪 Retiro en tienda</div><div style={{fontSize:11,color:C.muted}}>El comprador retira en {user?.location||"tu ciudad"}</div></div>
            </label>
          </div>
        </div>

        <button className="hop" onClick={handleSave} disabled={saving}
          style={{...btn(C.red),padding:"13px",width:"100%",justifyContent:"center",fontSize:15,opacity:saving?0.7:1,fontWeight:700,marginTop:4}}>
          {saving ? <><Spin />Guardando…</> : ep ? "Actualizar Producto ✓" : "Publicar Producto 🚀"}
        </button>
      </div>
    </div>
  );
}

/* MERCHANT ORDERS */
function MerchantOrders({ user,orders,nav }) {
  const mo = orders.filter(o =>
    o.vendors ? o.vendors.some(v=>v.merchantId===user?.id) : o.merchantId===user?.id
  ).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const [filter,setFilter] = useState("all");

  /* filter by vendor status for this merchant */
  const f = mo.filter(o => {
    if(filter==="all") return true;
    const myV = o.vendors?.find(v=>v.merchantId===user?.id);
    const vs = myV?.status || o.status;
    return vs===filter;
  });

  return (
    <MerchantShell user={user} page="merchant-orders" nav={nav}>
    <div style={{maxWidth:860}}>
      <h1 style={{fontFamily:Fh,margin:"0 0 16px",fontSize:20,fontWeight:800}}>Pedidos Recibidos ({mo.length})</h1>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","Todos"],["submitted","Por Verificar"],["verified","Verificados"],["processing","Preparando"],["shipped","En Camino"],["released","Completados"]].map(([v,l]) => (
          <button key={v} className="hop" onClick={()=>setFilter(v)}
            style={{...btn(filter===v?C.navy:C.light,filter===v?"#fff":C.muted),padding:"5px 11px",fontSize:11}}>{l}</button>
        ))}
      </div>
      {!f.length
        ? <div style={{textAlign:"center",padding:44,color:C.muted}}><div style={{fontSize:36}}>📋</div><div style={{marginTop:9,fontWeight:600}}>Sin pedidos</div></div>
        : <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {f.map(o => {
              const myV   = o.vendors?.find(v=>v.merchantId===user?.id);
              const st    = vendorST(myV||{status:o.status}, o.deliveryType);
              const mTotal = myV ? myV.subtotal + myV.shippingCost : (o.grandTotal||o.subtotal||0);
              const mItems = myV?.items || o.items || [];
              const vStatus = myV?.status || o.status;
              const needsAction = ["submitted","processing"].includes(o.status) || ["verified","processing"].includes(vStatus);
              return (
                <div key={o.id} style={{...card,padding:14,cursor:"pointer"}} onClick={()=>nav("order-detail",{orderId:o.id})}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:8}}>
                    <div>
                      <span style={{fontWeight:700,fontFamily:Fh}}>#{o.id.slice(0,8).toUpperCase()}</span>
                      <span style={{color:C.muted,fontSize:12,marginLeft:9}}>{fD(o.createdAt)} · {o.buyerName}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{st.l}</span>
                      <span style={{fontFamily:Fh,fontWeight:800,fontSize:15,color:C.red}}>{fU(mTotal)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {mItems.slice(0,4).map(i => <div key={i.productId} style={{width:36,height:36,borderRadius:6,overflow:"hidden",background:C.light,flexShrink:0}}><Img src={i.product?.image} /></div>)}
                    <span style={{fontSize:11,color:C.muted,marginLeft:3}}>{mItems.reduce((s,i)=>s+i.qty,0)} art. · {o.deliveryType==="pickup"?"🏪":"🚚"}</span>
                    {needsAction && <div style={{marginLeft:"auto"}}><Pill label="⚡ Acción requerida" c={C.amber} bg={C.amberL} sx={{fontSize:10}} /></div>}
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
    </MerchantShell>
  );
}


/* ═══════════════════════════════════════════════
   MERCHANT ANALYTICS
═══════════════════════════════════════════════ */
function MerchantAnalytics({ user, products, orders, nav, reviews=[] }) {
  const mp = products.filter(p => p.merchantId===user?.id);
  const mo = orders.filter(o => o.merchantId===user?.id);

  const released     = mo.filter(o => o.status==="released");
  const totalRevenue = released.reduce((s,o)=>s+o.merchantAmount,0);
  const totalSales   = released.reduce((s,o)=>s+o.items.reduce((a,i)=>a+i.qty,0),0);
  const pendingEscrow= mo.filter(o=>["submitted","verified","processing","shipped"].includes(o.status)).reduce((s,o)=>s+o.subtotal,0);
  const totalViews   = mp.reduce((s,p)=>s+(p.views||0),0);
  const myReviews    = reviews.filter(r=>r.merchantId===user?.id);
  const avgR         = myReviews.length ? (myReviews.reduce((s,r)=>s+r.rating,0)/myReviews.length) : 0;
  const convRate     = totalViews > 0 ? ((totalSales/totalViews)*100).toFixed(1) : "0.0";

  /* top products by revenue */
  const prodRevenue = mp.map(p => {
    const sales = released.filter(o => o.items.some(i=>i.productId===p.id));
    const rev   = sales.reduce((s,o)=>{const item=o.items.find(i=>i.productId===p.id);return s+(item?(p.salePrice||p.price)*item.qty:0);},0);
    const qty   = sales.reduce((s,o)=>{const item=o.items.find(i=>i.productId===p.id);return s+(item?item.qty:0);},0);
    return {...p,rev,qty};
  }).sort((a,b)=>b.rev-a.rev);

  /* monthly breakdown (last 6 months) */
  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    return {month:d.toLocaleString("es-VE",{month:"short",year:"2-digit"}), key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`};
  }).reverse();
  const monthlyData = months.map(m => ({
    ...m,
    revenue: released.filter(o=>o.createdAt?.startsWith(m.key)).reduce((s,o)=>s+o.merchantAmount,0),
    orders:  released.filter(o=>o.createdAt?.startsWith(m.key)).length
  }));
  const maxRev = Math.max(...monthlyData.map(m=>m.revenue),1);

  /* ratings distribution */
  const ratingDist = [5,4,3,2,1].map(r => ({r,count:reviews.filter(rv=>rv.rating===r).length}));
  const maxRatingCount = Math.max(...ratingDist.map(d=>d.count),1);

  return (
    <MerchantShell user={user} page="merchant-analytics" nav={nav}>
    <div style={{maxWidth:860}}>
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>📈 Analytics de Tienda</h1>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:20}}>
        {[
          {ic:"💰",l:"Ingresos Totales",v:`$${totalRevenue.toFixed(0)}`,c:C.green},
          {ic:"📦",l:"Ventas",v:released.length,c:C.navy},
          {ic:"🛍️",l:"Artículos vendidos",v:totalSales,c:C.red},
          {ic:"👁️",l:"Vistas totales",v:totalViews,c:C.muted},
          {ic:"🔄",l:"Conversión",v:`${convRate}%`,c:C.amber},
          {ic:"⭐",l:"Rating promedio",v:avgR?avgR.toFixed(1):"—",c:C.gold},
          {ic:"🔒",l:"En custodia",v:`$${pendingEscrow.toFixed(0)}`,c:C.purple},
          {ic:"📝",l:"Reseñas",v:myReviews.length,c:C.muted}
        ].map(s => (
          <div key={s.l} style={{...card,padding:13}}>
            <div style={{fontSize:20,marginBottom:4}}>{s.ic}</div>
            <div style={{fontFamily:Fh,fontWeight:900,fontSize:17,color:s.c}}>{s.v}</div>
            <div style={{color:C.muted,fontSize:10,lineHeight:1.3}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Revenue chart */}
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>📊 Ingresos mensuales</h3>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120}}>
            {monthlyData.map(m => (
              <div key={m.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:9,color:C.muted,fontWeight:600}}>{m.revenue>0?`$${m.revenue.toFixed(0)}`:""}</div>
                <div style={{width:"100%",background:C.red,borderRadius:"4px 4px 0 0",minHeight:4,height:`${Math.max(4,(m.revenue/maxRev)*90)}px`,transition:"height .3s"}} />
                <div style={{fontSize:9,color:C.muted}}>{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ratings distribution */}
        <div style={{...card,padding:18}}>
          <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>⭐ Distribución de reseñas</h3>
          {myReviews.length===0 ? <div style={{color:C.muted,fontSize:13,textAlign:"center",paddingTop:20}}>Sin reseñas aún</div> : (
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {ratingDist.map(d => (
                <div key={d.r} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:12,color:C.muted,width:16,textAlign:"right"}}>{d.r}★</div>
                  <div style={{flex:1,height:14,background:C.light,borderRadius:7,overflow:"hidden"}}>
                    <div style={{height:"100%",background:C.gold,borderRadius:7,width:`${Math.max(0,(d.count/maxRatingCount)*100)}%`,transition:"width .4s"}} />
                  </div>
                  <div style={{fontSize:11,color:C.muted,width:18,textAlign:"right"}}>{d.count}</div>
                </div>
              ))}
              <div style={{marginTop:8,textAlign:"center"}}><Stars v={Math.round(avgR)} size={16} /><span style={{fontSize:13,color:C.amber,fontWeight:700,marginLeft:6}}>{avgR.toFixed(1)}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Top products table */}
      <div style={{...card,padding:18}}>
        <h3 style={{fontFamily:Fh,margin:"0 0 14px",fontSize:14,fontWeight:800}}>🏆 Productos por rendimiento</h3>
        {prodRevenue.length===0 ? <div style={{color:C.muted,fontSize:13}}>Sin datos aún</div> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.light}}>
                  {["Producto","Categoría","Precio","Stock","Vistas","Ventas","Ingresos"].map(h => (
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:C.muted,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prodRevenue.map((p,i) => (
                  <tr key={p.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":C.bg}}>
                    <td style={{padding:"9px 10px",display:"flex",gap:7,alignItems:"center"}}>
                      <div style={{width:30,height:30,borderRadius:6,overflow:"hidden",flexShrink:0,background:C.light}}><Img src={p.image} /></div>
                      <span style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:150}}>{p.name}</span>
                    </td>
                    <td style={{padding:"9px 10px",color:C.muted}}>{p.category}</td>
                    <td style={{padding:"9px 10px",fontWeight:700,color:C.red}}>{fU(p.salePrice||p.price)}</td>
                    <td style={{padding:"9px 10px",color:p.stock===0?"#991B1B":p.stock<=3?C.amber:C.green,fontWeight:700}}>{p.stock}</td>
                    <td style={{padding:"9px 10px"}}>{p.views||0}</td>
                    <td style={{padding:"9px 10px",fontWeight:600}}>{p.qty}</td>
                    <td style={{padding:"9px 10px",fontWeight:700,color:C.green}}>{p.rev>0?`$${p.rev.toFixed(0)}`:"-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </MerchantShell>
  );
}

/* PAYOUTS PAGE - Wallet Model */
function PayoutsPage({ user, users, orders, nav, requestPayout, payReqs, setPayReqs, appCfg }) {
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
    </MerchantShell>
  );
}

/* ═══════════════════════════════════════════════
   BANK SETTINGS PAGE
═══════════════════════════════════════════════ */
function BankSettingsPage({ user, users, upU, nav, showT }) {
  const mu = users?.find(u => u.id === user?.id) || user;
  const [bank,         setBank]    = useState(mu?.bankData?.bank || "");
  const [account,      setAccount] = useState(mu?.bankData?.account || "");
  const [holder,       setHolder]  = useState(mu?.bankData?.accountHolder || "");
  const [rif,          setRif]     = useState(mu?.bankData?.rif || "");
  const [phone,        setPhone]   = useState(mu?.bankData?.phone || "");

  const [saving,       setSaving]  = useState(false);
  const [confirmed,    setConfirmed]= useState(false);

  const BANKS = ["Banesco","Mercantil","Provincial","Venezuela","Bicentenario","Tesoro","Activo","Sofitasa","Bancrecer","BFC","Del Sur","Exterior","Fondo Común","Industrial","Mi Banco","Otro"];

  const handle = async () => {
    if(!bank||!account||!holder||!rif) { showT("Completa todos los campos obligatorios",true); return; }
    if(!confirmed) { showT("Debes confirmar que los datos son correctos",true); return; }
    setSaving(true);
    const bankData = { bank, account, accountHolder:holder, rif, phone };
    const updated = users.map(u => u.id===user.id ? {...u, bankData} : u);
    await upU(updated);
    setSaving(false);
    showT("Datos guardados ✓");
    nav("payouts");
  };

  return (
    <MerchantShell user={user} page="bank-settings" nav={nav}>
    <div style={{maxWidth:760}}>
      <button className="hop" onClick={()=>nav("payouts")} style={{...btn(C.light,C.muted),padding:"6px 12px",fontSize:12,marginBottom:16}}>← Mis Liquidaciones</button>
      <h1 style={{fontFamily:Fh,margin:"0 0 6px",fontSize:20,fontWeight:800}}>🏦 Cuenta Bancaria</h1>
      <p style={{color:C.muted,fontSize:13,margin:"0 0 18px"}}>Para recibir tus liquidaciones</p>

      <div style={{background:C.amberL,border:`1px solid ${C.amber}44`,borderRadius:10,padding:13,marginBottom:18,fontSize:12,color:C.amber,lineHeight:1.7}}>
        ⚠️ <strong>Importante:</strong> VendeYApp no se hace responsable por errores en el registro de datos bancarios. Verifica cuidadosamente que la información sea correcta antes de guardar. Las transferencias realizadas a cuentas incorrectas no son reversibles.
      </div>

      <div style={{...card,padding:22,display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Banco <span style={{color:C.red}}>*</span></label>
          <select value={bank} onChange={e=>setBank(e.target.value)} style={{...inp,cursor:"pointer"}}>
            <option value="">— Selecciona tu banco —</option>
            {BANKS.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Número de cuenta <span style={{color:C.red}}>*</span></label>
          <input value={account} onChange={e=>setAccount(e.target.value.replace(/\D/g,"").slice(0,20))}
            placeholder="0000-0000-0000-0000-0000" style={{...inp,fontFamily:"monospace",letterSpacing:1}} />
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>20 dígitos sin guiones</div>
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Titular de la cuenta <span style={{color:C.red}}>*</span></label>
          <input value={holder} onChange={e=>setHolder(e.target.value)} placeholder="Nombre completo como aparece en el banco" style={inp} />
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>RIF o Cédula <span style={{color:C.red}}>*</span></label>
          <input value={rif} onChange={e=>setRif(e.target.value)} placeholder="J-12345678-9 o V-12345678" style={inp} />
        </div>
        <div>
          <label style={{fontSize:13,fontWeight:700,display:"block",marginBottom:5}}>Teléfono PagoMóvil (opcional)</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="04XX-XXXXXXX" style={inp} />
        </div>

        {/* Preview */}
        {bank && account && holder && (
          <div style={{background:C.navyL,borderRadius:9,padding:13,border:`1px solid ${C.navy}22`}}>
            <div style={{fontWeight:700,fontSize:12,color:C.navy,marginBottom:7}}>Vista previa · Así recibirás tus pagos:</div>
            <div style={{fontSize:12,lineHeight:2,color:C.text}}>
              🏦 <strong>{bank}</strong><br/>
              🔢 <span style={{fontFamily:"monospace"}}>{account}</span><br/>
              👤 <strong>{holder}</strong><br/>
              📋 {rif}
              {phone && <><br/>📱 {phone}</>}
            </div>
          </div>
        )}

        <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer",padding:"12px",borderRadius:9,border:`2px solid ${confirmed?C.green:C.border}`,background:confirmed?C.greenL:"#fff"}}>
          <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{width:16,height:16,accentColor:C.green,flexShrink:0,marginTop:1}} />
          <div style={{fontSize:12,lineHeight:1.6,color:C.text}}>
            <strong>Confirmo que los datos bancarios son correctos.</strong> Entiendo que VendeYApp no se hace responsable por transferencias realizadas a cuentas incorrectas por error en el registro.
          </div>
        </label>

        <button className="hop" onClick={handle} disabled={saving||!confirmed}
          style={{...btn(C.red),padding:"13px",width:"100%",justifyContent:"center",fontSize:14,opacity:(saving||!confirmed)?0.5:1,fontWeight:700}}>
          {saving?<><Spin/>Guardando…</>:"Guardar cuenta bancaria ✓"}
        </button>
      </div>
    </div>
    </MerchantShell>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════ */
function DisputeResolver({ order, updateStatus, showT }) {
  const [note, setNote] = useState(order.disputeNote||"");
  const [resolving, setResolving] = useState(false);

  const resolve = async (favor) => {
    if(!note.trim()) { showT("Agrega una nota explicando la resolución",true); return; }
    setResolving(true);
    const extra = {
      disputeResolution: favor,
      disputeNote: note.trim(),
      disputeResolvedAt: new Date().toISOString(),
    };
    // favor==="buyer" → refund (status "rejected"), favor==="merchant" → release funds
    const newStatus = favor==="buyer" ? "rejected" : "released";
    await updateStatus(order.id, newStatus, extra);
    setResolving(false);
    showT(favor==="buyer" ? "Disputa resuelta a favor del comprador ✓" : "Disputa resuelta a favor del vendedor ✓");
  };

  return (
    <div>
      <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:5}}>Nota de resolución (visible para ambas partes) *</label>
      <textarea value={note} onChange={e=>setNote(e.target.value)}
        placeholder="Ej: Revisadas las evidencias, se determina que el producto no fue entregado conforme a lo pactado…"
        style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,resize:"vertical",minHeight:65,fontFamily:"inherit",outline:"none",marginBottom:10,lineHeight:1.5}} />
      <div style={{display:"flex",gap:8}}>
        <button className="hop" disabled={resolving} onClick={()=>resolve("buyer")}
          style={{...btn(C.green),padding:"9px 14px",fontSize:12,flex:1,justifyContent:"center",fontWeight:700,opacity:resolving?0.6:1}}>
          {resolving?<Spin/>:"✅ Favor del comprador (reembolso)"}
        </button>
        <button className="hop" disabled={resolving} onClick={()=>resolve("merchant")}
          style={{...btn(C.navy),padding:"9px 14px",fontSize:12,flex:1,justifyContent:"center",fontWeight:700,opacity:resolving?0.6:1}}>
          {resolving?<Spin/>:"💰 Favor del vendedor (liberar fondos)"}
        </button>
      </div>
    </div>
  );
}


function AdminProductCard({ p, nav, adminDisableProduct, adminEnableProduct }) {
  const [showDisable, setShowDisable] = useState(false);
  const [reason,      setReason]      = useState("");
  const [permanent,   setPermanent]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  const handleDisable = async () => {
    if(!reason.trim()) return;
    setSaving(true);
    await adminDisableProduct(p.id, reason.trim(), permanent);
    setSaving(false);
    setShowDisable(false);
    setReason("");
  };

  const isAdminOff = p.adminDisabled;
  const isPermanent = p.adminDisabledPermanent;

  return (
    <div style={{...card,overflow:"hidden",opacity:(!p.active||isAdminOff)?.75:1}}>
      {/* Image */}
      <div style={{height:110,background:C.light,overflow:"hidden",position:"relative"}}>
        <Img src={p.image} />
        <div style={{position:"absolute",top:5,right:5,display:"flex",gap:4,flexDirection:"column",alignItems:"flex-end"}}>
          <Pill label={p.active&&!isAdminOff?"ON":"OFF"} c={p.active&&!isAdminOff?C.green:C.red} solid sx={{fontSize:9}} />
          {isAdminOff && <Pill label={isPermanent?"🚫 Perm":"⚠️ Admin"} c={C.red} solid sx={{fontSize:9}} />}
        </div>
      </div>
      {/* Info */}
      <div style={{padding:"9px 10px"}}>
        <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.name}</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{p.merchantName}</div>
        {isAdminOff && p.adminDisabledReason && (
          <div style={{fontSize:10,color:C.red,background:C.redL,borderRadius:5,padding:"3px 7px",marginBottom:6,lineHeight:1.4}}>
            {isPermanent?"🚫":"⚠️"} {p.adminDisabledReason}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <span style={{fontWeight:700,color:C.red,fontSize:12}}>{fU(p.salePrice||p.price)}</span>
          <button className="hop" onClick={()=>nav("product",{productId:p.id})} style={{...btn(C.light,C.muted),padding:"3px 7px",fontSize:10}}>Ver →</button>
        </div>
        {/* Admin actions */}
        {!showDisable ? (
          <div style={{display:"flex",gap:5}}>
            {isAdminOff && !isPermanent && (
              <button className="hop" onClick={()=>adminEnableProduct(p.id)}
                style={{...btn(C.greenL,C.green),padding:"4px 8px",fontSize:10,flex:1,justifyContent:"center"}}>✅ Reactivar</button>
            )}
            {!isPermanent && (
              <button className="hop" onClick={()=>setShowDisable(true)}
                style={{...btn(C.redL,"#991B1B"),padding:"4px 8px",fontSize:10,flex:1,justifyContent:"center"}}>🚫 Deshabilitar</button>
            )}
          </div>
        ) : (
          <div>
            <select value={reason} onChange={e=>setReason(e.target.value)}
              style={{...inp,fontSize:11,marginBottom:6,padding:"5px 8px"}}>
              <option value="">— Motivo —</option>
              <option value="Contenido inapropiado o engañoso">Contenido inapropiado o engañoso</option>
              <option value="Precio incorrecto o abusivo">Precio incorrecto o abusivo</option>
              <option value="Imágenes de baja calidad o incorrectas">Imágenes incorrectas o baja calidad</option>
              <option value="Producto prohibido en la plataforma">Producto prohibido</option>
              <option value="Descripción incompleta o incorrecta">Descripción incompleta</option>
              <option value="Duplicado o spam">Duplicado / spam</option>
            </select>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,marginBottom:8,cursor:"pointer",color:C.red,fontWeight:600}}>
              <input type="checkbox" checked={permanent} onChange={e=>setPermanent(e.target.checked)} style={{accentColor:C.red}} />
              Deshabilitar permanentemente
            </label>
            <div style={{display:"flex",gap:6}}>
              <button className="hop" onClick={()=>{setShowDisable(false);setReason("");setPermanent(false);}}
                style={{...btn(C.light,C.muted),padding:"5px 8px",fontSize:10}}>Cancelar</button>
              <button className="hop" disabled={!reason||saving} onClick={handleDisable}
                style={{...btn(permanent?C.red:C.amberL,permanent?"#fff":"#78350F"),padding:"5px 8px",fontSize:10,flex:1,justifyContent:"center",opacity:!reason?0.5:1}}>
                {saving?<><Spin dark/>...</>:permanent?"🚫 Deshabilitar perm.":"⚠️ Pausar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function AdminPanel({ users,products,orders,nav,updateStatus,verifyMerchant,showT,upU,upP,upO,completePayout,payReqs,setPayReqs,appCfg,setAppCfg,toggleDisable,adminDisableProduct,adminEnableProduct }) {
  const [tab,setTab] = useState("orders");
  const [merchantQ,setMerchantQ] = useState("");
  const [buyerQ,   setBuyerQ]    = useState("");
  const [productQ, setProductQ]  = useState("");
  const pending   = orders.filter(o=>o.status==="submitted" && !(o.deadline && new Date(o.deadline) < new Date()));
  const disputed  = orders.filter(o=>o.vendors?o.vendors.some(v=>v.status==="disputed"):o.status==="disputed");
  const adminPayReqs = (payReqs||[]).filter(r=>r.status==="pending");
  const merchants = users.filter(u=>u.role==="merchant");
  const buyers    = users.filter(u=>u.role==="buyer");
  const filteredMerchants = merchantQ ? merchants.filter(m=>(m.storeName||m.name||"").toLowerCase().includes(merchantQ.toLowerCase())||m.email.toLowerCase().includes(merchantQ.toLowerCase())) : merchants;
  const filteredBuyers    = buyerQ    ? buyers.filter(u=>u.name.toLowerCase().includes(buyerQ.toLowerCase())||u.email.toLowerCase().includes(buyerQ.toLowerCase())) : buyers;
  const filteredProducts  = productQ  ? products.filter(p=>(p.name||"").toLowerCase().includes(productQ.toLowerCase())||(p.merchantName||"").toLowerCase().includes(productQ.toLowerCase())) : products;
  const revenue   = orders.filter(o=>o.status==="released").reduce((s,o)=>{
    const v = o.vendors?.reduce((vs,v)=>vs+(+v.platformFee||0),0);
    return s + (v ?? (+o.platformFee||0));
  },0);
  const escrow    = orders.filter(o=>["submitted","verified","processing","shipped"].includes(o.status)).reduce((s,o)=>{
    return s + (+o.grandTotal || o.vendors?.reduce((vs,v)=>vs+v.subtotal+(v.shippingCost||0),0) || +o.subtotal || 0);
  },0);
  const tabs = [[`orders`,`📋 Órdenes${disputed.length>0?" ⚠️":""}`],[`payouts`,`💸 Liquidaciones${adminPayReqs.length>0?" ("+adminPayReqs.length+")":""}`],["merchants","🏪 Vendedores"],["users","👥 Compradores"],["products","🛍️ Productos"],["analytics","📊 Analytics"],["config","⚙️ Config"]];
  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 14px"}}>
      <h1 style={{fontFamily:Fh,margin:"0 0 18px",fontSize:20,fontWeight:800}}>⚙️ Panel Administrador</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:9,marginBottom:18}}>
        {[{l:"Por verificar",v:pending.length,ic:"⏳",c:C.amber},{l:"Disputas",v:disputed.length,ic:"⚠️",c:"#991B1B"},{l:"Liquidaciones",v:adminPayReqs.length,ic:"💸",c:C.purple},{l:"Vendedores",v:merchants.length,ic:"🏪",c:C.navy},{l:"Compradores",v:buyers.length,ic:"👥",c:C.green},{l:"Revenue plat.",v:`$${revenue.toFixed(0)}`,ic:"💰",c:C.green},{l:"En escrow",v:`$${escrow.toFixed(0)}`,ic:"🔒",c:C.amber}].map(s=>(
          <div key={s.l} style={{...card,padding:12}}><div style={{fontSize:18,marginBottom:3}}>{s.ic}</div><div style={{fontFamily:Fh,fontWeight:900,fontSize:16,color:s.c}}>{s.v}</div><div style={{color:C.muted,fontSize:10,lineHeight:1.3}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {tabs.map(([v,l])=><button key={v} className="hop" onClick={()=>setTab(v)} style={{...btn(tab===v?C.navy:C.light,tab===v?"#fff":C.muted),padding:"7px 14px",fontSize:12}}>{l}</button>)}
      </div>

      {tab==="orders" && (
        <div>
          {pending.length > 0 && (
            <div style={{marginBottom:18}}>
              <h3 style={{fontFamily:Fh,margin:"0 0 11px",fontSize:14,fontWeight:800,color:C.amber}}>⏳ Por verificar ({pending.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {pending.map(o=>{
                  const pm=PAY.find(m=>m.id===o.paymentMethod);
                  return (
                    <div key={o.id} style={{...card,padding:15,border:`2px solid ${C.amber}33`}}>
                      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:7}}>
                        <div><span style={{fontWeight:700,fontFamily:Fh}}>#{o.id.slice(0,8).toUpperCase()}</span><span style={{color:C.muted,fontSize:12,marginLeft:8}}>{o.buyerName} → {o.merchantName||"Tienda"} · {fD(o.createdAt)}</span></div>
                        <div style={{textAlign:"right"}}><div style={{fontFamily:Fh,fontWeight:800,fontSize:16,color:C.red}}>{fU(o.subtotal)}</div><div style={{fontSize:11,color:C.muted}}>{pm?.icon} {pm?.label}</div></div>
                      </div>
                      {o.paymentRef && <div style={{fontSize:11,color:C.muted,marginBottom:9,fontFamily:"monospace",background:C.light,padding:"4px 8px",borderRadius:5}}>Ref: {o.paymentRef}</div>}
                      {o.paymentProofImg && <img src={o.paymentProofImg} style={{maxHeight:130,maxWidth:"100%",borderRadius:7,border:`1px solid ${C.border}`,objectFit:"contain",display:"block",marginBottom:9}} />}
                      <div style={{display:"flex",gap:8}}>
                        <button className="hop" onClick={()=>nav("order-detail",{orderId:o.id})} style={{...btn(C.light,C.muted),padding:"7px 12px",fontSize:12,flex:1,justifyContent:"center"}}>Ver detalle</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {disputed.length > 0 && (
            <div style={{marginBottom:18}}>
              <h3 style={{fontFamily:Fh,margin:"0 0 11px",fontSize:14,fontWeight:800,color:"#991B1B"}}>⚠️ Disputas Activas ({disputed.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {disputed.map(o=>{
                  const buyer = users?.find(u=>u.id===o.buyerId);
                  const merch = users?.find(u=>u.id===o.merchantId);
                  return (
                    <div key={o.id} style={{...card,padding:16,border:`2px solid ${C.red}44`}}>
                      {/* Header */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                        <div>
                          <div style={{fontWeight:700,fontFamily:Fh,fontSize:14}}>#{o.id.slice(0,8).toUpperCase()}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                            Comprador: <strong>{o.buyerName}</strong> · Vendedor: <strong>{o.merchantName}</strong>
                          </div>
                          <div style={{fontSize:11,color:C.muted}}>Monto: <strong>{fU(o.subtotal)}</strong> · {new Date(o.disputeAt||o.createdAt).toLocaleDateString("es-VE")}</div>
                        </div>
                        <button className="hop" onClick={()=>nav("order-detail",{orderId:o.id})} style={{...btn(C.navyL,C.navy),padding:"5px 12px",fontSize:11}}>Ver orden →</button>
                      </div>
                      {/* Dispute info */}
                      {o.disputeReason && (
                        <div style={{background:C.redL,borderRadius:8,padding:"9px 12px",marginBottom:10}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:3}}>MOTIVO: {
                            {no_llegó:"El producto no llegó",diferente:"Producto diferente a lo descrito",dañado:"Producto llegó dañado",incompleto:"Pedido incompleto",fraude:"Posible fraude",otro:"Otro"}[o.disputeReason]||o.disputeReason
                          }</div>
                          {o.disputeDesc && <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{o.disputeDesc}</div>}
                        </div>
                      )}
                      {/* Resolution buttons */}
                      <DisputeResolver order={o} updateStatus={updateStatus} showT={showT} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!pending.length && !disputed.length && <div style={{textAlign:"center",padding:44,color:C.muted}}><div style={{fontSize:36}}>✅</div><div style={{marginTop:9,fontWeight:600}}>Todo al día</div></div>}
        </div>
      )}

      {tab==="payouts" && (
        <div>
          <h3 style={{fontFamily:Fh,margin:"0 0 13px",fontSize:14,fontWeight:800}}>💸 Solicitudes de liquidación ({adminPayReqs.length})</h3>
          {!adminPayReqs.length ? <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:30}}>Sin solicitudes pendientes</div> : (
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {adminPayReqs.map(r=>{
                const merchant = users.find(u=>u.id===r.merchantId);
                return (
                  <div key={r.id} style={{...card,padding:14,border:`2px solid ${C.purple}28`}}>
                    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:7,marginBottom:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{merchant?.storeName||merchant?.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>#{r.id.slice(0,8).toUpperCase()} · {fD(r.requestedAt)}</div>
                      </div>
                      <span style={{fontFamily:Fh,fontWeight:900,fontSize:16,color:C.green}}>{fU(r.amount)}</span>
                    </div>
                    {merchant?.bankData?.bank && (
                      <div style={{background:C.navyL,borderRadius:7,padding:"8px 11px",fontSize:11,color:C.navy,marginBottom:9,lineHeight:1.8}}>
                        🏦 {merchant.bankData.bank}<br/>
                        🔢 <span style={{fontFamily:"monospace"}}>{merchant.bankData.account}</span><br/>
                        👤 {merchant.bankData.accountHolder} · {merchant.bankData.rif}
                        {merchant.bankData.phone && <><br/>📱 {merchant.bankData.phone}</>}
                      </div>
                    )}
                    <button className="hop" onClick={()=>completePayout(r.id)} style={{...btn(C.green),padding:"9px",width:"100%",justifyContent:"center",fontSize:13,fontWeight:700}}>✓ Confirmar transferencia enviada</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab==="merchants" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,gap:10}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:14,fontWeight:800}}>Vendedores ({filteredMerchants.length}{merchantQ?` de ${merchants.length}`:""})</h3>
            <input value={merchantQ} onChange={e=>setMerchantQ(e.target.value)} placeholder="🔍 Buscar vendedor…"
              style={{...inp,fontSize:12,padding:"5px 10px",maxWidth:220,flex:1}} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {filteredMerchants.map(m=>{
              const mRev=orders.filter(o=>o.vendors?o.vendors.some(v=>v.merchantId===m.id):o.merchantId===m.id).reduce((s,o)=>{
                if(o.vendors){const v=o.vendors.find(v=>v.merchantId===m.id);return s+(v?.merchantAmount||0);}
                return o.status==="released"?s+(o.merchantAmount||0):s;
              },0);
              return (
                <div key={m.id} style={{...card,padding:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
                    <div style={{width:40,height:40,borderRadius:11,background:`linear-gradient(135deg,${C.red},#FF6B4A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:900,flexShrink:0}}>{m.storeName?m.storeName[0].toUpperCase():"🏪"}</div>
                    <div style={{flex:1,minWidth:140}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:13}}>{m.storeName||m.name}</span>{m.merchantVerified?<Pill label="✓ Verificado" c={C.green} bg={C.greenL} sx={{fontSize:10}} />:<Pill label="No verificado" c={C.amber} bg={C.amberL} sx={{fontSize:10}} />}</div>
                      <div style={{fontSize:11,color:C.muted}}>{m.email} · 📍{m.location}</div>
                      <div style={{fontSize:11,color:C.muted}}>${mRev.toFixed(0)} vendido</div>
                    </div>
                    <div style={{display:"flex",gap:7}}>
                      {!m.merchantVerified && <button className="hop" onClick={()=>verifyMerchant(m.id)} style={{...btn(C.green),padding:"6px 12px",fontSize:12}}>✓ Verificar</button>}
                      <button className="hop" onClick={()=>nav("merchant-profile",{merchantId:m.id})} style={{...btn(C.light,C.muted),padding:"6px 11px",fontSize:12}}>Ver →</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="users" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,gap:10}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:14,fontWeight:800}}>Compradores ({filteredBuyers.length}{buyerQ?` de ${buyers.length}`:""})</h3>
            <input value={buyerQ} onChange={e=>setBuyerQ(e.target.value)} placeholder="🔍 Buscar comprador…"
              style={{...inp,fontSize:12,padding:"5px 10px",maxWidth:220,flex:1}} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filteredBuyers.map(u=>{
              const uo=orders.filter(o=>o.buyerId===u.id);
              return (
                <div key={u.id} style={{...card,padding:13}}>
                  <div style={{display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:700,flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{u.name}</div><div style={{fontSize:11,color:C.muted}}>{u.email} · 📍{u.location} · {uo.length} órdenes</div></div>
                    {u.disabled && <Pill label="Deshabilitada" c="#991B1B" />}
                    <button onClick={()=>toggleDisable(u.id)}
                      style={{...btn(u.disabled?C.green:C.redL,u.disabled?"#fff":"#991B1B"),padding:"4px 10px",fontSize:11,fontWeight:700}}>
                      {u.disabled?"Habilitar":"Deshabilitar"}
                    </button>
                    <Pill label={u.emailVerified?"✓ Verificado":"Sin verificar"} c={u.emailVerified?C.green:C.amber} sx={{fontSize:10}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="products" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,gap:10}}>
            <h3 style={{fontFamily:Fh,margin:0,fontSize:14,fontWeight:800}}>Productos ({filteredProducts.length}{productQ?` de ${products.length}`:""})</h3>
            <input value={productQ} onChange={e=>setProductQ(e.target.value)} placeholder="🔍 Buscar producto o vendedor…"
              style={{...inp,fontSize:12,padding:"5px 10px",maxWidth:250,flex:1}} />
          </div>
          <div className="vy-grid">
            {filteredProducts.map(p=>(
              <AdminProductCard key={p.id} p={p} nav={nav} adminDisableProduct={adminDisableProduct} adminEnableProduct={adminEnableProduct} />
            ))}
          </div>
        </div>
      )}

      {tab==="analytics" && (
        <PlatformAnalytics orders={orders} users={users} products={products} />
      )}
      {tab==="config" && (
        <AdminConfig appCfg={appCfg} setAppCfg={setAppCfg} showT={showT} />
      )}
    </div>
  );
}

/* PLATFORM ANALYTICS */
function PlatformAnalytics({ orders, users, products }) {
  const merchants = users.filter(u => u.role==="merchant");
  const buyers    = users.filter(u => u.role==="buyer");
  const released  = orders.filter(o => o.status==="released");
  const allOrders = orders;

  const totalRevenue   = released.reduce((s,o) => s+o.subtotal, 0);
  const platformEarned = released.reduce((s,o) => s+o.platformFee, 0);
  const avgOrderValue  = released.length ? totalRevenue/released.length : 0;
  const convRate       = allOrders.length && buyers.length ? (released.length/buyers.length*100).toFixed(1) : 0;

  // Last 6 months
  const now = new Date();
  const months = Array.from({length:6},(_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    return { label: d.toLocaleString("es-VE",{month:"short"}), year:d.getFullYear(), month:d.getMonth() };
  });
  const monthlyData = months.map(m => {
    const mo = released.filter(o => { const d=new Date(o.createdAt); return d.getFullYear()===m.year && d.getMonth()===m.month; });
    return { ...m, revenue: mo.reduce((s,o)=>s+o.subtotal,0), orders: mo.length, fee: mo.reduce((s,o)=>s+o.platformFee,0) };
  });
  const maxRev = Math.max(...monthlyData.map(m=>m.revenue), 1);

  // Top merchants
  const merchantRevenue = merchants.map(m => {
    const mo = released.filter(o => o.merchantId===m.id);
    return { name: m.storeName||m.name, revenue: mo.reduce((s,o)=>s+o.merchantAmount,0), orders: mo.length };
  }).sort((a,b)=>b.revenue-a.revenue).slice(0,5);

  // Status breakdown
  const statusCounts = {};
  const ST_LABELS = {submitted:"Por pagar",verified:"Verificado",processing:"Preparando",shipped:"Enviado",released:"Completado",expired:"Expirado",rejected:"Rechazado",disputed:"Disputa"};
  allOrders.forEach(o => { statusCounts[o.status]=(statusCounts[o.status]||0)+1; });

  // Category revenue
  const catRevenue = {};
  released.forEach(o => o.items.forEach(i => {
    const p = products.find(p=>p.id===i.productId);
    const cat = p?.category||"Otro";
    catRevenue[cat]=(catRevenue[cat]||0)+(p?.salePrice||p?.price||0)*i.qty;
  }));
  const catArr = Object.entries(catRevenue).sort((a,b)=>b[1]-a[1]);

  const KPI = ({ic,label,val,sub,c}) => (
    <div style={{...card,padding:"14px 16px",border:`2px solid ${c||C.border}22`}}>
      <div style={{fontSize:22,marginBottom:4}}>{ic}</div>
      <div style={{fontFamily:Fh,fontWeight:900,fontSize:20,color:c||C.text}}>{val}</div>
      <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2}}>{label}</div>
      {sub && <div style={{fontSize:11,color:C.muted}}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <h3 style={{fontFamily:Fh,margin:"0 0 16px",fontSize:15,fontWeight:800}}>📊 Rendimiento de VendeYApp</h3>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
        <KPI ic="💰" label="Ingresos totales" val={fU(totalRevenue)} sub={`${released.length} ventas completadas`} c={C.green} />
        <KPI ic="🏷️" label="Comisiones ganadas" val={fU(platformEarned)} sub={`${(platformEarned/Math.max(totalRevenue,1)*100).toFixed(1)}% del GMV`} c={C.purple} />
        <KPI ic="📦" label="Órdenes totales" val={allOrders.length} sub={`${released.length} completadas`} c={C.navy} />
        <KPI ic="🏪" label="Vendedores" val={merchants.length} sub={`${merchants.filter(m=>m.merchantVerified).length} verificados`} c={C.red} />
        <KPI ic="👥" label="Compradores" val={buyers.length} sub={`Conv. ${convRate}%`} c={C.amber} />
        <KPI ic="💵" label="Ticket promedio" val={fU(avgOrderValue)} sub="por orden completada" c={C.gold} />
      </div>

      {/* Monthly revenue chart */}
      <div style={{...card,padding:18,marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Ingresos mensuales (últimos 6 meses)</div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end",height:130}}>
          {monthlyData.map((m,i) => (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{fontSize:9,color:C.muted,fontWeight:600}}>{m.revenue>0?fU(m.revenue):""}</div>
              <div style={{width:"100%",background:`linear-gradient(to top,${C.red},${C.red}88)`,borderRadius:"4px 4px 0 0",minHeight:3,transition:"height .3s"}}
                title={`${m.revenue.toFixed(2)}`}
                style2={{height:m.revenue>0?`${Math.round(m.revenue/maxRev*100)}%`:"4px"}}
              >
                <div style={{width:"100%",borderRadius:"4px 4px 0 0",minHeight:3,background:`linear-gradient(to top,${C.red},${C.red}88)`,height:`${Math.round(m.revenue/maxRev*100)}%`,minHeight:4}} />
              </div>
              <div style={{fontSize:9,color:C.muted,fontWeight:600,textTransform:"capitalize"}}>{m.label}</div>
              <div style={{fontSize:9,color:C.muted}}>{m.orders}p</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
        {/* Top merchants */}
        <div style={{...card,padding:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🏆 Top vendedores</div>
          {merchantRevenue.length ? merchantRevenue.map((m,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<merchantRevenue.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontFamily:Fh,fontWeight:900,fontSize:12,color:i===0?C.gold:C.muted,width:16,textAlign:"center"}}>{i+1}</span>
                <span style={{fontSize:12,fontWeight:600}}>{m.name}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.green}}>{fU(m.revenue)}</div>
                <div style={{fontSize:10,color:C.muted}}>{m.orders} venta{m.orders!==1?"s":""}</div>
              </div>
            </div>
          )) : <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:16}}>Sin ventas aún</div>}
        </div>

        {/* Order status breakdown */}
        <div style={{...card,padding:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Estado de órdenes</div>
          {Object.entries(statusCounts).map(([st,cnt]) => (
            <div key={st} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:12}}>{ST_LABELS[st]||st}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:70,height:6,background:C.light,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${cnt/allOrders.length*100}%`,height:"100%",background:st==="released"?C.green:st==="expired"||st==="rejected"?C.red:C.amber,borderRadius:3}} />
                </div>
                <span style={{fontSize:11,fontWeight:700,color:C.text,minWidth:16,textAlign:"right"}}>{cnt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by category */}
      {catArr.length > 0 && (
        <div style={{...card,padding:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Ventas por categoría</div>
          {catArr.map(([cat,rev],i) => (
            <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600}}>{cat}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:90,height:7,background:C.light,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${rev/catArr[0][1]*100}%`,height:"100%",background:C.navy,borderRadius:3}} />
                </div>
                <span style={{fontSize:12,fontWeight:700,minWidth:55,textAlign:"right"}}>{fU(rev)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ADMIN CONFIG */
function AdminConfig({ appCfg, setAppCfg, showT }) {
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