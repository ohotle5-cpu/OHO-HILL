'use strict';
(() => {
  const $ = (sel) => document.querySelector(sel);
  const key = 'oho-demo-entries';
  const motionKey = 'oho-hill-reduced-motion';
  const format = new Intl.NumberFormat('th-TH', {style:'currency',currency:'THB'});
  const types = ['รายรับ','รายจ่าย'];
  const motionPref = () => {try{return localStorage.getItem(motionKey)==='1'}catch{return false}};
  const storageRows = () => {
    try {
      const result=JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(result) ? result : [];
    } catch { return []; }
  };
  const valid = (x) => x && types.includes(x.type) && typeof x.name==='string' &&
      Number.isFinite(Number(x.amount)) && Number(x.amount)>0 && Number(x.amount)<=1e9;
  const rows = () => storageRows().filter(valid);
  const status = (node,value) => { if(node) node.textContent=value; };
  const row = (cells) => {
    const tr=document.createElement('tr');
    for(const text of cells){const td=document.createElement('td');td.textContent=text;tr.append(td);}
    return tr;
  };
  const empty = (target,msg) => {const tr=row([msg]);tr.firstChild.colSpan=3;target.replaceChildren(tr);};
  function paint() {
    const data=rows();
    const [a,b]=types.map((kind)=>data.reduce((s,x)=>s+(x.type===kind?Math.round(Number(x.amount)*100):0),0)/100);
    status($('[data-income]'),format.format(a));status($('[data-expense]'),format.format(b));
    status($('[data-net]'),format.format(Math.round(a*100-b*100)/100));
    const max=Math.max(a,b,1);
    for(const [el,v] of [[$('[data-income-meter]'),a],[$('[data-expense-meter]'),b]]) {
      if(el){el.max=max;el.value=v;el.setAttribute('aria-label', (el.hasAttribute('data-income-meter')?'รายรับ ':'รายจ่าย ')+format.format(v));}
    }
    const target=$('[data-rows]');
    if(target){
      const filter=$('[data-ledger-filter]').value;
      const visible=data.filter(x=>!filter||filter===x.type);
      if(!visible.length) empty(target,'ยังไม่มีรายการในมุมมองนี้');
      else target.replaceChildren(...visible.map(x=>row([x.type,x.name,format.format(Number(x.amount))])));
    }
  }
  const ledger=$('[data-ledger]');
  ledger?.addEventListener('submit',(e) => {
    e.preventDefault();
    const form=new FormData(ledger);
    const item={type:form.get('type'),name:String(form.get('name')||'').trim().slice(0,100),amount:String(form.get('amount')||'')};
    if(!item.name || !valid(item)){status($('[data-status]'),'กรอกชื่อและจำนวนเงินมากกว่า 0 บาท');return;}
    try {
      const raw=localStorage.getItem(key);
      const old=raw===null?[]:JSON.parse(raw);
      if(!Array.isArray(old)) throw Error('invalid old rows');
      localStorage.setItem(key,JSON.stringify([item,...old]));
    } catch {status($('[data-status]'),'บันทึกไม่ได้ เบราว์เซอร์อาจไม่อนุญาตให้จัดเก็บข้อมูล');return;}
    ledger.reset();paint();status($('[data-status]'),'บันทึกรายการทดลองในเบราว์เซอร์นี้แล้ว');
  });
  $('[data-ledger-filter]')?.addEventListener('change',paint);
  window.addEventListener('storage', (e) => {if(e.key===key)paint();});
  const sample=[
    ['สตูดิโอ ตัวอย่างเมฆ','วิดีโอแนะนำทีม','กำลังคุยงาน'],
    ['บริษัท ตัวอย่างโปรดักชัน','บันทึกงานอีเวนต์','รอเอกสาร'],
    ['บ้านแสง ตัวอย่าง','ถ่ายภาพสินค้า','ส่งมอบแล้ว']
  ];
  const client=$('[data-client-filter]');
  function paintClients(){
    const shown=sample.filter(entry=>entry.join(' ').includes(client.value.trim()));
    const target=$('[data-client-rows]');
    if(shown.length)target.replaceChildren(...shown.map(row));else empty(target,'ไม่พบรายชื่อตัวอย่าง');
    status($('[data-client-status]'),shown.length+' รายการ');
  }
  if(client){client.addEventListener('input',paintClients);paintClients();}
  const motion=$('[data-motion]');
  function setMotion(no){
    document.documentElement.dataset.motion=no?'off':'system';
    if(motion) motion.checked=no;
  }
  setMotion(motionPref());
  motion?.addEventListener('change',() => {
    setMotion(motion.checked);
    try {localStorage.setItem(motionKey,motion.checked?'1':'0');
      status($('[data-motion-status]'),'บันทึกการแสดงผลในเครื่องนี้แล้ว');
    } catch {status($('[data-motion-status]'),'ปรับได้ในหน้านี้ แต่บันทึกค่าไม่ได้');}
  });
  $('[data-print]')?.addEventListener('click',()=>window.print());
  const menu=$('.menu');
  document.addEventListener('click',(event)=>{if(menu?.open&&!menu.contains(event.target))menu.open=false;});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}});
  if(location.pathname==='/'){
    const legacy={ '#docs':'/#rooms', '#entry':'/ledger/#entry', '#rows':'/ledger/#rows' }[location.hash];
    if(legacy)location.replace(legacy);
  }
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches && !motionPref()){
    const enter=new IntersectionObserver((items,obs)=>items.forEach((item)=>{
      if(item.isIntersecting){item.target.classList.add('entered');obs.unobserve(item.target);}
    }),{threshold:.08});
    document.querySelectorAll('.section').forEach(el=>enter.observe(el));
  }
  paint();
})();
