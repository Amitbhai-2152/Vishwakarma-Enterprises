const CATALOGUE_URL="https://raw.githubusercontent.com/Amitbhai-2152/Vishwakarma-Enterprises-Admin/main/data/products.json";
const DEFAULT_IMAGE="images/shop3.jpeg";
const CATALOGUE_TTL=30000;
let catalogueCache=null;
let catalogueCacheTime=0;
let catalogueRequest=null;
function localizedValue(value,fallback=""){if(value&&typeof value==="object"&&!Array.isArray(value))return{hi:value.hi||value.en||fallback,en:value.en||value.hi||fallback};return{hi:fallback||value||"",en:value||fallback||""}}
function normalizeSizes(data){const raw=Array.isArray(data.sizes)?data.sizes:[];return raw.map(size=>typeof size==="object"?{name:String(size.name??size.size??"").trim(),mrp:Number(size.mrp)||0}:{name:String(size||"").trim(),mrp:Number(data.mrp)||0}).filter(size=>size.name)}
function normalizeProduct(id,data){const images=Array.isArray(data.gallery)&&data.gallery.length?data.gallery:Array.isArray(data.images)&&data.images.length?data.images:data.image?[data.image]:[DEFAULT_IMAGE];const sizes=normalizeSizes(data);return{...data,id:String(data.id||id).trim(),image:images[0]||DEFAULT_IMAGE,gallery:images.length?images:[DEFAULT_IMAGE],name:data.name||localizedValue(data.nameEn,data.nameHi),description:data.description||localizedValue(data.descriptionEn,data.descriptionHi),features:data.features||{hi:[],en:[]},specifications:data.specifications||{hi:{},en:{}},sizes,mrp:Number(data.mrp)||0,featured:Boolean(data.featured),status:data.status==='hidden'?'hidden':'active'}}
async function requestCatalogue(){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(`${CATALOGUE_URL}?v=${Date.now()}`,{cache:"no-store",signal:controller.signal});if(!response.ok)throw new Error(`Catalogue request failed: ${response.status}`);const data=await response.json();if(!Array.isArray(data))throw new Error("Catalogue data is invalid.");return data.map((item,index)=>normalizeProduct(item?.id||`P${index+1}`,item||{})).filter(product=>product.status!=='hidden')}finally{clearTimeout(timeout)}}
async function loadCatalogue(force=false){const now=Date.now();if(!force&&catalogueCache&&now-catalogueCacheTime<CATALOGUE_TTL)return catalogueCache;if(catalogueRequest)return catalogueRequest;catalogueRequest=requestCatalogue().then(data=>{catalogueCache=data;catalogueCacheTime=Date.now();return data}).finally(()=>{catalogueRequest=null});return catalogueRequest}
export async function getProducts(){return loadCatalogue(false)}
export async function getProductById(id){const wanted=String(id??"").trim();if(!wanted)return null;const products=await loadCatalogue(false);return products.find(product=>String(product.id).trim()===wanted)||null}
export function refreshProducts(){return loadCatalogue(true)}
