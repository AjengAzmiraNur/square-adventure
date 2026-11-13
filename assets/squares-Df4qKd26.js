import{c as o}from"./index-BMSD0CoF.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=o("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=o("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]),t=r=>r*r,m=(r,a=1)=>Array.from({length:r},(e,i)=>t(a+i)),d=r=>r.slice(1).map((a,e)=>a-r[e]),l="₀₁₂₃₄₅₆₇₈₉",s=r=>String(r).replace(/[0-9]/g,a=>l[Number(a)]),n=r=>Number(r).toLocaleString("id-ID"),u=1e3;function h(r){const a=String(r??"").trim();if(a==="")return{ok:!1,error:"Masukkan nomor suku terlebih dahulu."};if(/^-/.test(a))return{ok:!1,error:"Nomor suku tidak boleh negatif. Mulailah dari 1."};if(/^[0-9]+[.,][0-9]*$/.test(a))return{ok:!1,error:"Nomor suku harus bilangan bulat, bukan desimal."};if(!/^[0-9]+$/.test(a))return{ok:!1,error:"Nomor suku hanya boleh berisi angka."};const e=Number(a);return e===0?{ok:!1,error:"Nomor suku dimulai dari 1, bukan 0."}:e>u?{ok:!1,error:`Masukkan nomor suku dari 1 sampai ${n(u)}.`}:{ok:!0,value:e}}function b(r){return[`Diketahui nomor suku n = ${r}.`,`Rumus pola bilangan persegi: U${s("n")} = n².`,`U${s(r)} = ${r}² = ${r} × ${r}.`,`${r} × ${r} = ${n(t(r))}.`]}export{c as M,f as P,s as a,m as b,b as c,d,n as f,t as s,h as v};
