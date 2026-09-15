const copy={hi:{home:"होम",products:"उत्पाद",features:"मुख्य विशेषताएँ",selectSize:"साइज़ चुनें",enquire:"WhatsApp पर पूछें",relatedLabel:"और देखें",relatedTitle:"संबंधित उत्पाद",details:"विवरण देखें",unavailable:"उत्पाद उपलब्ध नहीं है।",loading:"उत्पाद लोड हो रहा है…",error:"उत्पाद लोड नहीं हो सका। कृपया बाद में फिर कोशिश करें।",message:"नमस्ते, मुझे {product} के बारे में जानकारी चाहिए। चुना गया साइज़: {size}। मात्रा: {quantity} नग। कुल MRP: {total}।",mrp:"MRP",mrpPerPiece:"प्रति नग MRP"},en:{home:"Home",products:"Products",features:"Key Features",selectSize:"Select size",enquire:"Enquire on WhatsApp",relatedLabel:"More to explore",relatedTitle:"Related Products",details:"View Details",unavailable:"Product unavailable.",loading:"Loading product…",error:"Unable to load this product. Please try again later.",message:"Hello, I would like to enquire about {product}. Selected size: {size}. Quantity: {quantity} pcs. Total MRP: {total}.",mrp:"MRP",mrpPerPiece:"MRP per piece"}};
const language=()=>document.documentElement.lang==="en"?"en":"hi";
const escapeHTML=value=>String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const formatMrp=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?`₹${n.toLocaleString("en-IN",{maximumFractionDigits:2})}`:""};
const fallbackImage="images/shop3.jpeg";
function safeImage(value){return value||fallbackImage}
function showState(target,text){target.innerHTML=`<p class="empty-state">${text}</p>`}
function updateLabels(){const text=copy[language()],links=document.querySelectorAll(".breadcrumb a");if(links[0])links[0].textContent=text.home;if(links[1])links[1].textContent=text.products;const rl=document.getElementById("related-label"),rt=document.getElementById("related-title");if(rl)rl.textContent=text.relatedLabel;if(rt)rt.textContent=text.relatedTitle}
function dispatchProductLoaded(product){document.dispatchEvent(new CustomEvent("productLoaded",{detail:{product,url:location.href.split("#")[0]}}))}
function dispatchProductVariantChanged(product,index){document.dispatchEvent(new CustomEvent("productVariantChanged",{detail:{product,sizeIndex:index}}))}
function sizeName(size){return typeof size==="object"?String(size.name??size.size??""):String(size??"")}
function sizeMrp(size,product){const value=typeof size==="object"?Number(size.mrp):Number(product?.mrp);return Number.isFinite(value)&&value>0?value:Number(product?.mrp)||0}

document.addEventListener("DOMContentLoaded",async()=>{
  const target=document.getElementById("product-detail");
  if(!target)return;
  updateLabels();
  showState(target,copy[language()].loading);
  try{
    const {getProducts}=await import("./product-repository.js");
    const products=await getProducts();
    if(!Array.isArray(products))throw new Error("Products data is not an array");
    const requestedId=new URLSearchParams(location.search).get("id");
    const normalizedRequestedId=requestedId==null?"":String(requestedId).trim();
    const product=(normalizedRequestedId?products.find(item=>String(item.id).trim()===normalizedRequestedId):products[0])||null;
    if(!product){showState(target,copy[language()].unavailable);return}

    const allProducts=products;
    const sizes=Array.isArray(product.sizes)?product.sizes:[];
    let selectedSizeIndex=0;
    let selectedImage=0;
    let currentQuantity=1;

    const selectedVariant=()=>sizes[selectedSizeIndex]||sizes[0]||null;
    const selectedSizeText=()=>sizeName(selectedVariant())||"-";
    const selectedMrp=()=>sizeMrp(selectedVariant(),product);
    const productNameForLanguage=()=>product.name?.[language()]||product.name?.en||product.name?.hi||product.id||"Product";

    const updateEnquiry=()=>{
      const link=target.querySelector("#product-enquiry");
      if(link){
        link.dataset.baseWhatsappMessage=copy[language()].message
          .replace("{product}",productNameForLanguage())
          .replace("{size}",selectedSizeText())
          .replace("{quantity}",String(currentQuantity))
          .replace("{total}",formatMrp(selectedMrp()*currentQuantity)||"—");
      }
    };

    const renderRelated=()=>{
      const text=copy[language()];
      const related=allProducts.filter(item=>String(item.id)!==String(product.id)&&item.category===product.category);
      const items=(related.length?related:allProducts.filter(item=>String(item.id)!==String(product.id))).slice(0,3);
      const relatedTarget=document.getElementById("related-products");
      if(!relatedTarget)return;
      relatedTarget.innerHTML=items.length?items.map(item=>{
        const values=(item.sizes||[]).map(s=>sizeMrp(s,item)).filter(v=>v>0);
        const display=values.length?Math.min(...values):Number(item.mrp)||0;
        const label=values.length>1?`${text.mrp} ${formatMrp(display)}+`:formatMrp(display);
        const image=safeImage(item.image);
        return `<article class="product-card"><img src="${escapeHTML(image)}" loading="lazy" decoding="async" alt="${escapeHTML(item.name?.[language()]||item.name?.en||item.name?.hi||item.id)}"><div class="product-card-content"><h3>${escapeHTML(item.name?.[language()]||item.name?.en||item.name?.hi||item.id)}</h3>${display?`<div class="product-mrp"><span>${values.length>1?(language()==="en"?"From":"से")+" ":""}${text.mrp}</span><strong>${label}</strong></div>`:""}<p>${escapeHTML(item.description?.[language()]||item.description?.en||item.description?.hi||"")}</p><a class="primary-btn" href="product.html?id=${encodeURIComponent(item.id)}">${text.details}</a></div></article>`;
      }).join(""): `<p class="empty-state">${text.unavailable}</p>`;
      relatedTarget.querySelectorAll("img").forEach(img=>img.addEventListener("error",()=>{img.src=fallbackImage;img.onerror=null},{once:true}));
    };

    let lightbox=null;
    const ensureLightbox=()=>{
      if(lightbox)return lightbox;
      lightbox=document.createElement("div");
      lightbox.id="product-lightbox";
      lightbox.className="lightbox";
      lightbox.innerHTML='<button type="button" aria-label="Close">×</button><img alt="">';
      document.body.appendChild(lightbox);
      const close=()=>{lightbox.classList.remove("open")};
      lightbox.querySelector("button").addEventListener("click",close);
      lightbox.addEventListener("click",event=>{if(event.target===lightbox)close()});
      document.addEventListener("keydown",event=>{if(event.key==="Escape")close()});
      return lightbox;
    };

    const render=()=>{
      const text=copy[language()];
      const name=productNameForLanguage();
      const mrp=formatMrp(selectedMrp());
      document.getElementById("breadcrumb-product").textContent=name;
      document.title=`${name} | Vishwakarma Enterprises`;

      const gallery=Array.isArray(product.gallery)&&product.gallery.length?product.gallery:[product.image];
      const mainImage=safeImage(gallery[selectedImage]||gallery[0]);
      const featureValues=(product.features?.[language()]||product.features?.en||product.features?.hi||[]);

      target.innerHTML=`<div class="product-detail-layout"><section class="product-gallery" aria-label="${escapeHTML(name)} gallery"><img class="product-main-image" id="main-product-image" src="${escapeHTML(mainImage)}" alt="${escapeHTML(name)}" tabindex="0" role="button" aria-label="Open ${escapeHTML(name)} image"><div class="thumbnail-list">${gallery.filter(Boolean).map((image,index)=>`<button type="button" class="thumbnail ${index===selectedImage?"active":""}" data-image-index="${index}" aria-pressed="${index===selectedImage}" aria-label="${escapeHTML(name)} image ${index+1}"><img src="${escapeHTML(safeImage(image))}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div></section><section class="product-info-card"><span class="product-meta">${escapeHTML(product.brand||"")}</span><h1>${escapeHTML(name)}</h1>${mrp?`<div class="product-detail-mrp"><span>${text.mrpPerPiece}</span><strong>${mrp}</strong></div>`:""}<p>${escapeHTML(product.description?.[language()]||product.description?.en||product.description?.hi||"")}</p>${sizes.length?`<h2 class="detail-heading">${text.selectSize}</h2><div class="size-options" role="group" aria-label="${escapeHTML(text.selectSize)}">${sizes.map((size,index)=>`<button type="button" class="size-option ${index===selectedSizeIndex?"active":""}" data-size-index="${index}" aria-pressed="${index===selectedSizeIndex}">${escapeHTML(sizeName(size))}${sizeMrp(size,product)>0?` <span class="size-option-mrp">(${formatMrp(sizeMrp(size,product))})</span>`:""}</button>`).join("")}</div>`:""}<h2 class="detail-heading">${text.features}</h2><ul class="feature-list">${featureValues.map(feature=>`<li>${escapeHTML(feature)}</li>`).join("")}</ul><a class="secondary-btn detail-enquiry" id="product-enquiry" target="_blank" rel="noopener" href="#">${text.enquire}</a></section></div>`;

      target.querySelectorAll(".thumbnail").forEach(button=>button.addEventListener("click",()=>{selectedImage=Math.max(0,Number(button.dataset.imageIndex)||0);render()}));
      target.querySelectorAll(".thumbnail img").forEach(img=>img.addEventListener("error",()=>{img.src=fallbackImage;img.onerror=null},{once:true}));
      target.querySelectorAll(".size-option").forEach(button=>button.addEventListener("click",()=>{const nextIndex=Math.max(0,Number(button.dataset.sizeIndex)||0);selectedSizeIndex=nextIndex;render();dispatchProductVariantChanged(product,selectedSizeIndex)}));
      const main=target.querySelector("#main-product-image");
      if(main){
        main.addEventListener("error",()=>{main.src=fallbackImage;main.onerror=null},{once:true});
        const open=()=>{const box=ensureLightbox();box.querySelector("img").src=safeImage(gallery[selectedImage]||gallery[0]);box.querySelector("img").alt=name;box.classList.add("open")};
        main.addEventListener("click",open);
        main.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open()}});
      }
      updateEnquiry();
    };

    render();
    renderRelated();
    dispatchProductLoaded(product);
    document.addEventListener("languageChanged",()=>{updateLabels();render();renderRelated();dispatchProductLoaded(product)});
  }catch(error){
    console.error("Product page load failed",error);
    showState(target,copy[language()].error);
  }
});
