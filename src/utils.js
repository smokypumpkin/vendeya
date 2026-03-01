import { C } from "./constants.js"

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */
export const uid  = () => Math.random().toString(36).slice(2,9);
export const fU   = p  => `$${(+p).toFixed(2)}`;
export const fBs  = (p, r) => {
  const bs = (+p) * (+r);
  return "Bs. " + bs.toLocaleString("es-VE", {minimumFractionDigits:2, maximumFractionDigits:2});
};
export const fD   = d  => new Date(d).toLocaleDateString("es-VE",{day:"2-digit",month:"short",year:"numeric"});
export const ago  = d  => {
  const s = (Date.now()-new Date(d))/1000;
  if(s<60)   return "ahora";
  if(s<3600) return `${~~(s/60)}m`;
  if(s<86400) return `${~~(s/3600)}h`;
  return fD(d);
};
export const gC  = () => Math.floor(100000+Math.random()*900000).toString();
export const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r.toISOString(); };

export const censorContact = (text) => {
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
   IMAGE COMPRESS
═══════════════════════════════════════════════ */
export function readB64(file) {
  return new Promise(res => {
    if(!file) return res(null);
    const fr = new FileReader();
    fr.onload = e => res(e.target.result);
    fr.onerror = () => res(null);
    fr.readAsDataURL(file);
  });
}
export async function compressImg(file, max=800) {
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
