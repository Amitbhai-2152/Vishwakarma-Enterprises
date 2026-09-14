(()=>{
  let currentProduct=null;
  let quantity=1;
  const lang=()=>document.documentElement.lang==="en"?"en":"hi";
  const labels={hi:{quantity:"मात्रा",unit:"प्रति नग एमआरपी",total:"कुल एमआरपी",minus:"मात्रा घटाएँ",plus:"मात्रा बढ़ाएँ",pcs:"नग"},en:{quantity:"Quantity",unit:"MRP per piece",total:"Total MRP",minus:"Decrease quantity",plus:"Increase quantity",pcs:"pcs"}};
  const money=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?`₹${n.toLocaleString("en-IN",{maximumFractionDigits:2})}`:"—"};
  const safeQuantity=value=>Math.max(1,Math.floor(Number(value)||1));
  const selectedSize=()=>document.querySelector(".size-option.active")?.dataset.size||"-";
  const refreshMessage=()=>{
    const link=document.getElementById("product-enquiry");
    if(!link||!currentProduct)return;
    const size=selectedSize();
    const total=money(Number(currentProduct.mrp)*quantity);
    const text=lang()==="en"?`Hello, I would like to enquire about ${currentProduct.name?.en||"this product"}. Selected size: ${size}. Quantity: ${quantity} ${labels.en.pcs}. Total MRP: ${total}.`:`नमस्ते, मुझे ${currentProduct.name?.hi||"इस उत्पाद"} के बारे में जानकारी चाहिए। चुना गया साइज़: ${size}। मात्रा: ${quantity} ${labels.hi.pcs}। कुल एमआरपी: ${total}।`;
    link.href=`https://wa.me/918709820193?text=${encodeURIComponent(text)}`;
  };
  const render=product=>{
    currentProduct=product;
    const text=labels[lang()];
    const card=document.querySelector(".product-info-card");
    if(!card)return;
    const mrpBox=card.querySelector(".product-detail-mrp");
    const mrp=Number(product.mrp);
    if(mrpBox){
      mrpBox.innerHTML=`<span>${text.total}</span><strong>${money(mrp*quantity)}</strong>`;
      mrpBox.setAttribute("aria-live","polite");
    }
    let control=card.querySelector(".quantity-control");
    if(!control){
      control=document.createElement("div");
      control.className="quantity-control";
      (mrpBox||card.querySelector(".product-meta"))?.insertAdjacentElement("afterend",control);
    }
    control.innerHTML=`<span class="quantity-label">${text.quantity}</span><div class="quantity-stepper"><button type="button" class="quantity-btn quantity-minus" aria-label="${text.minus}">−</button><input class="quantity-input" type="number" min="1" step="1" inputmode="numeric" value="${quantity}" aria-label="${text.quantity}"><button type="button" class="quantity-btn quantity-plus" aria-label="${text.plus}">+</button></div><span class="quantity-unit">${text.unit}: <strong>${money(mrp)}</strong> / ${text.pcs}</span>`;
    const input=control.querySelector(".quantity-input");
    control.querySelector(".quantity-minus").addEventListener("click",()=>{quantity=safeQuantity(quantity-1);render(currentProduct)});
    control.querySelector(".quantity-plus").addEventListener("click",()=>{quantity=safeQuantity(quantity+1);render(currentProduct)});
    input.addEventListener("input",()=>{quantity=safeQuantity(input.value);render(currentProduct)});
    refreshMessage();
  };
  document.addEventListener("productLoaded",event=>{
    const product=event.detail?.product;
    if(!product)return;
    if(!currentProduct||currentProduct.id!==product.id)quantity=1;
    render(product);
  });
})();
