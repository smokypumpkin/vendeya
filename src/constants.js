/* ═══════════════════════════════════════════════
   BRAND TOKENS
═══════════════════════════════════════════════ */
export const C = {
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
export const Fh = "'Sora',sans-serif";
export const Fb = "'Plus Jakarta Sans',sans-serif";

/* ── Memory cache (solo para el tipo de cambio) ── */
export const MEM = {};

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
export const CATS = ["Todo","Tecnología","Moda","Hogar y Deco","Electrodomésticos","Alimentos y Bebidas","Deportes y Fitness","Autos y Motos","Belleza y Cuidado Personal","Bebés y Niños","Libros y Educación","Arte y Manualidades","Mascotas","Herramientas y Construcción","Joyas y Accesorios","Juguetes y Videojuegos","Salud y Bienestar","Oficina y Papelería","Servicios","Otros"];

export const STATES = [
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
];
export const ALL_LOCS = STATES.flatMap(s => s.cs.map(c => `${c}, ${s.s}`));

export const PAY = [
  {id:"pagomovil",label:"PagoMóvil",icon:"🏦",desc:"Transferencia VES interbancaria",color:C.navy},
  {id:"zelle",    label:"Zelle",    icon:"💵",desc:"USD desde banca americana",      color:"#5A24DB"},
  {id:"card",     label:"Tarjeta",  icon:"💳",desc:"Visa/Mastercard USD",            color:C.red}
];
export const ST = {
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
export const ST_PICKUP = {...ST,
  processing:{...ST.processing, l:"Listo p/ Retirar 🏪", c:"#065F46", bg:C.greenL},
};
// Delivery flow: pending → submitted → verified → processing → shipped → released
export const FLOW_DELIVERY = ["pending","submitted","verified","processing","shipped","released"];
export const FL_DELIVERY   = {pending:"Esperando pago",submitted:"Pago enviado",verified:"Verificado",processing:"Preparando",shipped:"En camino 🚚",released:"Completado"};
// Pickup flow:   pending → submitted → verified → processing → released  (no "shipped" — merchant confirms pickup → funds released directly)
export const FLOW_PICKUP   = ["pending","submitted","verified","processing","released"];
export const FL_PICKUP     = {pending:"Esperando pago",submitted:"Pago enviado",verified:"Verificado",processing:"Listo p/ Retirar 🏪",released:"Completado ✅"};
export const KW   = ["iPhone","Samsung","PlayStation","AirPods","Laptop","Zapatos","Nike","Adidas","Bolso","Nevera","Televisor","Café","Reloj","Bicicleta","Ropa","Mueble","Perfume","Bicicleta"];

export const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
export const PAYOUT_HOURS_MIN = 48;
export const PAYOUT_HOURS_MAX = 72;
export const PLATFORM_FEE_PCT = 0.03; // 3% platform commission
export const DEFAULT_MIN_PAYOUT = 10; // $10 minimum, configurable from admin

/* ═══════════════════════════════════════════════
   SEO CONSTANTS
═══════════════════════════════════════════════ */
export const APP_URL  = "https://vendeya.app";
export const APP_NAME = "VendeYApp";
export const APP_DESC = "Marketplace venezolano de compra y venta online. Productos nuevos y usados con pago seguro en Bolívares, PagoMóvil y Zelle.";
export const APP_LOGO = `${APP_URL}/logo.png`;
export const APP_GEO  = { country:"VE", region:"Caracas, Venezuela", lat:10.4806, lng:-66.9036 };

/* ═══════════════════════════════════════════════
   SEED DATA
═══════════════════════════════════════════════ */
export const SU = [
  {id:"admin1",name:"Admin VendeYApp",email:"admin@vendeya.com",password:"admin2024",role:"admin",emailVerified:true,merchantVerified:false,joinedAt:"2023-01-01",following:[],followers:[],storeName:"",storeDesc:"",location:"Caracas, Distrito Capital"},
  {id:"m2",name:"María Rodríguez",email:"maria@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:true,joinedAt:"2023-07-05",storeName:"ModaCaracas",storeDesc:"Moda, calzado y accesorios originales para toda Venezuela. Envíos desde Valencia.",location:"Valencia, Carabobo",pickupAddress:"Av. Bolívar Norte, C.C. Prebo, Local 45-B, Valencia. Mar-Dom 9am-7pm",pickupSchedule:"Martes a Domingo, 9:00am – 7:00pm",following:[],followers:["u1"],bankData:{bank:"Mercantil",account:"01050987654321098765",rif:"J-98765432-1",phone:"0414-9876543",accountHolder:"María Rodríguez"},walletBalance:42.00},
  {id:"m3",name:"Alejandro Fuentes",email:"alex@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:true,joinedAt:"2023-05-20",storeName:"HogarVzla",storeDesc:"Todo para el hogar y la cocina. Electrodomésticos, decoración y más.",location:"Maracaibo, Zulia",following:[],followers:[],bankData:{bank:"Venezuela",account:"01020456789012345678",rif:"J-44444444-4",phone:"0261-1234567",accountHolder:"Alejandro Fuentes"},walletBalance:88.50},
  {id:"m4",name:"Gabriela Torres",email:"gabi@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:true,joinedAt:"2023-09-01",storeName:"SportLife VE",storeDesc:"Ropa deportiva, suplementos y equipos fitness. ¡Vive activo!",location:"Barquisimeto, Lara",following:[],followers:[],bankData:{bank:"Banesco",account:"01340987654321012345",rif:"J-55555555-5",phone:"0251-7654321",accountHolder:"Gabriela Torres"},walletBalance:22.00},
  {id:"m5",name:"Roberto Salcedo",email:"roberto@demo.com",password:"1234",role:"merchant",emailVerified:true,merchantVerified:false,joinedAt:"2024-01-10",storeName:"LibrosVE",storeDesc:"Libros nuevos y usados, papelería y artículos educativos.",location:"Mérida, Mérida",following:[],followers:[],bankData:{bank:"Provincial",account:"01080123456789012345",rif:"J-66666666-6",phone:"0274-1234567",accountHolder:"Roberto Salcedo"},walletBalance:0},
  {id:"u1",name:"Pedro López",email:"pedro@demo.com",password:"1234",role:"buyer",emailVerified:true,merchantVerified:false,joinedAt:"2023-09-20",storeName:"",storeDesc:"",location:"Caracas, Distrito Capital",following:["m1","m2"],followers:[]},
  {id:"u2",name:"Ana Martínez",email:"ana@demo.com",password:"1234",role:"buyer",emailVerified:true,merchantVerified:false,joinedAt:"2023-11-05",storeName:"",storeDesc:"",location:"Valencia, Carabobo",following:["m1"],followers:[]},
];
export const SP = [
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
export const SO = [{
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

export const BANKS = ["Banesco","Mercantil","Provincial","Venezuela","Bicentenario","Tesoro","Activo","Sofitasa","Bancrecer","BFC","Del Sur","Exterior","Fondo Común","Industrial","Mi Banco","Otro"];
