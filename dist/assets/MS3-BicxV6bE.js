import{S as W,P as C,W as H,o as G,p as P,q as R,m as $,M as T,G as B,u as v,a as I,A as F,D as X,v as M}from"./three.module-8Oc40bl9.js";import{C as j,a as q}from"./CSS2DRenderer-C93wpHdk.js";const s=document.createElement("div");s.style.position="fixed";s.style.top="0";s.style.left="0";s.style.width="100%";s.style.height="100%";s.style.backgroundColor="#000";s.style.zIndex="9999";s.style.transition="opacity 1.5s ease-out";document.body.appendChild(s);const S=new W,a=new C(75,window.innerWidth/window.innerHeight,.1,1e3),u=new H({antialias:!0});u.setSize(window.innerWidth,window.innerHeight);u.shadowMap.enabled=!0;document.body.appendChild(u.domElement);const A=new G;a.add(A);const g=new P(A),O=new R;O.load("/sound/MS3.mp3",function(e){g.setBuffer(e),g.setLoop(!0),g.setVolume(1),g.play()});const c=new j;c.setSize(window.innerWidth,window.innerHeight);c.domElement.style.position="absolute";c.domElement.style.top="0px";c.domElement.style.pointerEvents="none";document.body.appendChild(c.domElement);a.position.set(0,5,0);a.lookAt(0,5,-10);const h=20,k=18,L=.5,N=new $,V=new T({color:139,roughness:.7,metalness:.2});let y=V;function Y(e){return new Promise((n,o)=>{N.load(e,t=>{console.log(`Texture loaded successfully: ${e}`),t.wrapS=M,t.wrapT=M,t.repeat.set(1,1),n(t)},t=>{console.log(`Texture ${e} loading: ${t.loaded/t.total*100}%`)},t=>{console.error(`Error loading texture ${e}:`,t),o(t)})})}const J=["/photos/MSimages/MStexture.png"];async function K(){for(const e of J)try{const n=await Y(e);y=new T({map:n,roughness:.7,metalness:.2}),console.log(`Successfully loaded texture from path: ${e}`),U();break}catch{console.warn(`Failed to load texture from path: ${e}`)}}let i;function Q(){const e=new B,n=new v(h,L,h),o=new I(n,y);o.position.y=-.5/2,o.receiveShadow=!0,e.add(o);const t=new v(h,k,L),r=new I(t,y);r.position.set(0,k/2,-20/2),r.receiveShadow=!0,r.castShadow=!0,r.userData={wallId:"front"},e.add(r);const w=r.clone();w.position.z=h/2,w.userData={wallId:"back"},e.add(w);const l=new v(L,k,h),d=new I(l,y);d.position.set(-20/2,k/2,0),d.receiveShadow=!0,d.castShadow=!0,d.userData={wallId:"left"},e.add(d);const f=d.clone();f.position.x=h/2,f.userData={wallId:"right"},e.add(f);const z=new F(16777215,.08);e.add(z);const m=new X(16777215,.08);return m.position.set(0,15,0),m.castShadow=!0,m.shadow.mapSize.width=2048,m.shadow.mapSize.height=2048,e.add(m),{group:e,walls:{front:r,back:w,left:d,right:f}}}function U(){i&&(i.group.children.forEach(e=>{e.isMesh&&(e.material=y)}),u.render(S,a))}function p(e,n){const o=document.createElement("div");o.className="wall-text",o.style.width="1000px",o.style.padding="20px",o.style.color="white",o.style.borderRadius="10px",o.style.fontFamily="Arial, sans-serif",o.style.fontSize="20px",o.style.pointerEvents="auto",o.innerHTML=n,setTimeout(()=>{o.querySelectorAll("a").forEach(l=>{l.style.color="#0808fc",l.style.textDecoration="none",l.style.cursor="pointer",l.addEventListener("click",d=>{console.log(`Link clicked: ${l.getAttribute("href")}`),console.log(`Link text: ${l.textContent}`)})})},100);const t=new q(o);switch(e.userData.wallId){case"front":t.position.set(0,0,0);break;case"back":t.position.set(0,0,0);break;case"left":t.position.set(0,0,0),t.rotation.y=Math.PI/2;break;case"right":t.position.set(0,0,0),t.rotation.y=-Math.PI/2;break}return e.add(t),t}i=Q();S.add(i.group);K();p(i.walls.front,`
  <p>▆er.-.,</p>
  <p>You thought you could hide this from me. I saw the e▆▆▆▆ stowed in your cupboard.</p>
  <p>The jewels and the pocket mirror. Then came the remnants of some fragrance in your apartment.</p>
  <p>I suppose I should have expected this day would come. I just can't make sense of it.</p>
  <p>Of her. Of you c▆osing her. After everything you told me - how you de▆▆d them, how</p>
  <p>they fucked you over too, how you swore you'd get ▆▆ at them some▆, somehow. And now</p>
  <p>you're ▆▆ h▆? I want to be angry. I should be. But I can't even ▆▆ my▆f. This is</p>
  <p>exactly what I dese▆. But tell me this - when you look at her, do you feel anything real?</p>
  <p>Have you lost your mind and convinced yourse▆ that you can rewrite the past?</p>
  <p>Don't even bother trying to call me. F▆get me. Forget us.</p>
`);p(i.walls.front,`
  <p>.. -- / .-.. --- ... .. -. --. / --- ..- - / --- -. / -.-- --- ..-</p>
  <p>.. -- / .-.. --- ... . ..-</p>
  <p>.. -- / .-.. --- ... .- / .-.. --- ... .- / .-.. --- ... . ..-</p>
`);p(i.walls.back,`
<p>I meet many of his friends all toge▆▆
there was a girl there I forget her name
she told me she liked my hair
she seemed to have a gentle per▆▆lity that I liked
how do you kn▆ her
I used to ▆▆ with her
where did you two used to ▆▆
she lost her ▆▆ it's a long story
where does she ▆▆ now
he didn't answer those questions and put his hand around my shoulder patt▆ it
like I said it's a lo▆ story
I'm laying here in bed staring at the ceiling
<a href="MS4.html">who is she</a>
I can't shake the thoug▆ of ▆▆</p>
`);p(i.walls.back,`
  <p>.... . / -.- .. .-.. .-.. . -.. / .... . .-. / .- -. -.. / -.- .. .-.. .-.. . -.. / .-- .... .- - / .-- . / .... .- -.. / - --- --. . - .... . .-.</p>
  `);p(i.walls.left,`
  <p>.. -- / .-.. --- ... .. -. --. / --- ..- - / --- -. / -.-- --- ..-</p>
  <p> the cicada's cry drills into the husk then silence </p>
  <p> the cicada's cry drills into the hu▆ then ..- - / --- -. / -.-- - silence </p>
  <p> the cicada's cry drills into the husk then sil▆▆ the cicada's cry drills into the husk then silence the cicada's cry then silence</p>
  <p> the cicad▆▆ cry drills into the husk then silence </p>
  <p> the cicada's ..- - / --- -. / -.-- - cry ..- - / --- -. / -.-- - dril▆ into the husk then silence </p>
`);p(i.walls.right,`
  <p>.. -- / .-.. --- ... .. -. --. / --- ..- - / --- -. / -.-- --- ..-</p>
  <p> such stillness the cries of the cicadas sink into the rocks into the rocks into the rocks into the rocks </p>
  <p> such still▆▆ the cries of the cicadas sink into the rocks such stilln▆▆ the cries of the cicadas sink into the rocks 
  <p> such stillness the cries of the cicad▆ ..- - / --- -. / -.-- - sink ..- - / --- -. / -.-- - into the rocks </p>
  <p> such stillness the cries of the cicadas sink into the rocks </p>
  <p> such stillness ..- - / --- -. / -.-- - the cries of the     she is a lotus blossoming in the <a href="MS5.html">sun</a>     cicadas sink into the rocks </p>
  <p> such stillness the cries of the cicadas sink into the rocks such stillness..- - / --- -. / -.-- -  the cries of the cicad▆ sink into the rocks 
  such stillness the cries of the cicadas sink into the rocks </p>
`);let b=!1,x=!1,E=0,Z=.01;document.addEventListener("keydown",e=>{e.key==="Alt"&&(b=!0)});document.addEventListener("keyup",e=>{e.key==="Alt"&&(b=!1,x=!1)});document.addEventListener("mousedown",e=>{b&&(x=!0,E=e.clientX)});document.addEventListener("mouseup",()=>{x=!1});document.addEventListener("mousemove",e=>{if(x&&b){const n=e.clientX-E;a.rotation.y+=n*Z,E=e.clientX}});window.addEventListener("resize",()=>{a.aspect=window.innerWidth/window.innerHeight,a.updateProjectionMatrix(),u.setSize(window.innerWidth,window.innerHeight),c.setSize(window.innerWidth,window.innerHeight)});function D(){requestAnimationFrame(D),u.render(S,a),c.render(S,a)}function _(){D(),setTimeout(()=>{s.style.opacity="0",setTimeout(()=>{s.style.display="none"},5e3)},5e3)}_();
