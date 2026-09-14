(()=>{
  const css=`.product-mrp{display:flex;align-items:center;gap:8px;margin:7px 0 9px;font-size:12px;color:#667085}.product-mrp span{text-transform:uppercase;letter-spacing:.04em}.product-mrp strong{font-size:1.05rem;color:#c62828}.product-detail-mrp{display:flex;align-items:baseline;gap:10px;margin:10px 0 14px}.product-detail-mrp span{font-size:.78rem;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:.06em}.product-detail-mrp strong{font-size:1.55rem;color:#c62828}.product-mrp:empty,.product-detail-mrp:empty{display:none}@media(max-width:600px){.product-detail-mrp strong{font-size:1.35rem}}`;
  const style=document.createElement('style');style.id='mrp-display-styles';style.textContent=css;document.head.appendChild(style);
  const format=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?`₹${n.toLocaleString('en-IN',{maximumFractionDigits:2})}`:''};
  const refresh=()=>{
    document.querySelectorAll('.product-card').forEach(card=>{
      const link=card.querySelector('a[href*="product.html?id="]');
      const id=link?new URL(link.href,location.href).searchParams.get('id'):null;
      if(!id||!Array.isArray(window.productData))return;
      const product=window.productData.find(item=>item.id===id);if(!product)return;
      const value=format(product.mrp);if(!value)return;
      let slot=card.querySelector('.product-mrp');
      if(!slot){slot=document.createElement('div');slot.className='product-mrp';const title=card.querySelector('h3');if(title)title.insertAdjacentElement('afterend',slot)}
      const label=document.documentElement.lang==='en'?'MRP':'एमआरपी';slot.innerHTML=`<span>${label}</span><strong>${value}</strong>`;
    });
  };
  const observer=new MutationObserver(refresh);
  document.addEventListener('DOMContentLoaded',()=>{refresh();const targets=[document.getElementById('featured-products'),document.getElementById('products-grid')].filter(Boolean);targets.forEach(target=>observer.observe(target,{childList:true,subtree:true}));});
})();
