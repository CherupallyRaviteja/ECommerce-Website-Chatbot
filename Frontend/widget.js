/**
 * widget.js - ShopMart AI Assistant
 * Opens as an inline 70/30 sidebar panel (no floating button, no popup, no modal).
 * Activated by clicking "Open Chat Bot" / "AI Assistant" buttons on the page.
 * Behaves like ChatGPT: type questions, get answers. No PDF features.
 */

(function () {
  "use strict";

  const API_URL = window.SHOPMART_BOT_API || "http://localhost:8000";
  const SESSION_ID = "session_" + Math.random().toString(36).substr(2, 9);

  let isChatOpen = false;
  let messageHistory = [];

  // ─── INJECT STYLES ──────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* ── LAYOUT: 70/30 SPLIT ───────────────────────────────────── */
    body.chat-open #app-shell {
      display: flex;
      min-height: 100vh;
    }
    body.chat-open #main-content {
      width: 70%;
      flex: none;
      overflow-x: hidden;
    }

    /* ── CHAT SIDEBAR ──────────────────────────────────────────── */
    #sm-chat-sidebar {
      display: none;
      width: 30%;
      min-width: 300px;
      height: 100vh;
      position: sticky;
      top: 0;
      flex-direction: column;
      background: #fff;
      border-left: 1px solid #E5E7EB;
      box-shadow: -4px 0 24px rgba(0,0,0,0.08);
      z-index: 200;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }
    body.chat-open #sm-chat-sidebar {
      display: flex;
    }

    /* ── SIDEBAR HEADER ────────────────────────────────────────── */
    #sm-sidebar-header {
      background: linear-gradient(135deg, #FF6B35 0%, #FF8C00 100%);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    #sm-sidebar-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.38);
    }
    #sm-sidebar-info { flex: 1; min-width: 0; }
    #sm-sidebar-title {
      color: white;
      font-weight: 700;
      font-size: 15px;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #sm-sidebar-sub {
      color: rgba(255,255,255,0.82);
      font-size: 11px;
      margin: 2px 0 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .sm-online-dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4ADE80;
      box-shadow: 0 0 0 2px rgba(74,222,128,0.3);
      animation: sm-blink 2s infinite;
      flex-shrink: 0;
    }
    @keyframes sm-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
    #sm-sidebar-close {
      background: rgba(255,255,255,0.18);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      line-height: 1;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    #sm-sidebar-close:hover { background: rgba(255,255,255,0.32); }

    /* ── QUICK REPLIES ─────────────────────────────────────────── */
    #sm-quick-bar {
      padding: 10px 12px 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      flex-shrink: 0;
      border-bottom: 1px solid #F0F0F0;
      background: #FAFAFA;
    }
    .sm-qr {
      background: white;
      border: 1.5px solid #E5E5E5;
      color: #444;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.18s;
      white-space: nowrap;
      font-family: 'Inter', sans-serif;
    }
    .sm-qr:hover { background: #FFF3ED; border-color: #FF6B35; color: #FF6B35; }

    /* ── MESSAGES ──────────────────────────────────────────────── */
    #sm-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    #sm-messages::-webkit-scrollbar { width: 4px; }
    #sm-messages::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 4px; }

    .sm-msg {
      display: flex;
      gap: 8px;
      animation: sm-fadeIn 0.25s ease;
    }
    @keyframes sm-fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .sm-msg.user { flex-direction: row-reverse; }

    .sm-msg-av {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      margin-top: 2px;
    }
    .sm-msg.bot .sm-msg-av { background: #FFF3ED; border: 1.5px solid #FFCCAA; }
    .sm-msg.user .sm-msg-av { background: linear-gradient(135deg,#FF6B35,#FF8C00); }

    .sm-bubble-wrap { display: flex; flex-direction: column; max-width: 82%; }
    .sm-msg.user .sm-bubble-wrap { align-items: flex-end; }

    .sm-bubble {
      padding: 10px 13px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.55;
      word-wrap: break-word;
      font-family: 'Inter', sans-serif;
    }
    .sm-msg.bot .sm-bubble {
      background: #F4F4F5;
      color: #1A1A1A;
      border-bottom-left-radius: 4px;
    }
    .sm-msg.user .sm-bubble {
      background: linear-gradient(135deg,#FF6B35,#FF8C00);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .sm-time { font-size: 10px; color: #BBBBBB; margin-top: 3px; padding: 0 3px; }

    .sm-follow-ups { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
    .sm-chip {
      background: #FFF3ED;
      border: 1px solid #FFCCAA;
      color: #CC4400;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 16px;
      cursor: pointer;
      transition: background 0.18s;
      white-space: nowrap;
      font-family: 'Inter', sans-serif;
    }
    .sm-chip:hover { background: #FFE5D0; }

    /* ── TYPING ────────────────────────────────────────────────── */
    #sm-typing { display: none; }
    #sm-typing.show { display: flex; }
    .sm-typing-bubble {
      background: #F4F4F5;
      padding: 12px 14px;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .sm-typing-bubble span {
      width: 7px;
      height: 7px;
      background: #FF6B35;
      border-radius: 50%;
      animation: sm-bounce 1.3s infinite;
    }
    .sm-typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
    .sm-typing-bubble span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes sm-bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }

    /* ── INPUT AREA ────────────────────────────────────────────── */
    #sm-input-area {
      padding: 10px 12px 12px;
      border-top: 1px solid #F0F0F0;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
      background: white;
    }
    #sm-input {
      flex: 1;
      border: 1.5px solid #E5E5E5;
      border-radius: 12px;
      padding: 9px 12px;
      font-size: 13px;
      resize: none;
      outline: none;
      font-family: 'Inter', sans-serif;
      max-height: 80px;
      min-height: 40px;
      line-height: 1.45;
      transition: border-color 0.2s, box-shadow 0.2s;
      color: #1A1A1A;
    }
    #sm-input:focus {
      border-color: #FF6B35;
      box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
    }
    #sm-input::placeholder { color: #ABABAB; }
    #sm-send-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      background: linear-gradient(135deg, #FF6B35, #FF8C00);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s, transform 0.15s;
      box-shadow: 0 2px 8px rgba(255,107,53,0.35);
    }
    #sm-send-btn:hover { opacity: 0.9; transform: scale(1.06); }
    #sm-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
    #sm-send-btn svg { width: 16px; height: 16px; fill: white; }

      .sm-product-list{
      margin-top:12px;
      display:flex;
      flex-direction:column;
      gap:10px;
  }

  .sm-product-card{
      display:flex;
      gap:10px;
      background:white;
      border:1px solid #e5e7eb;
      border-radius:12px;
      overflow:hidden;
  }

  .sm-product-image{
      width:90px;
      height:90px;
      object-fit:cover;
  }

  .sm-product-info{
      padding:8px;
      flex:1;
  }

  .sm-product-name{
      font-weight:600;
      font-size:13px;
  }

  .sm-product-brand{
      color:#666;
      font-size:12px;
      margin-top:2px;
  }

  .sm-product-price{
      color:#FF6B35;
      font-weight:bold;
      margin-top:6px;
  }

  .sm-product-stock{
      margin-top:5px;
      font-size:11px;
      color:green;
  }
  .sm-product-list{

    margin-top:12px;

    display:flex;

    flex-direction:column;

    gap:12px;

}

.sm-product-list .product-card{

    width:100%;

    transform:scale(.85);

    transform-origin:top left;

    margin-bottom:-30px;

}
#sm-upload-btn{
    width:40px;
    height:40px;

    display:flex;
    align-items:center;
    justify-content:center;

    flex-shrink:0;

    border:none;
    background:white;

    border:1px solid #ddd;
    border-radius:10px;

    cursor:pointer;
}
    /* ── FOOTER ────────────────────────────────────────────────── */
    #sm-sidebar-footer {
      padding: 4px 12px 8px;
      text-align: center;
      font-size: 10px;
      color: #C0C0C0;
      flex-shrink: 0;
      background: white;
      font-family: 'Inter', sans-serif;
    }
    #sm-sidebar-footer strong { color: #FF8C00; }

    /* ── RESPONSIVE ────────────────────────────────────────────── */
    @media (max-width: 900px) {
      body.chat-open #main-content { display: none; }
      #sm-chat-sidebar { width: 100% !important; min-width: unset; }
    }
  `;
  document.head.appendChild(style);

  // ─── BUILD SIDEBAR DOM ────────────────────────────────────────────────────
  const sidebar = document.createElement("div");
  sidebar.id = "sm-chat-sidebar";
  sidebar.innerHTML = `
    <div id="sm-sidebar-header">
      <div id="sm-sidebar-avatar">🛒</div>
      <div id="sm-sidebar-info">
        <p id="sm-sidebar-title">ShopMart Assistant</p>
        <p id="sm-sidebar-sub">
          <span class="sm-online-dot"></span> Online · AI shopping help
        </p>
      </div>
      <button id="sm-sidebar-close" title="Close chat">✕</button>
    </div>

    <div id="sm-quick-bar">
      <span class="sm-qr">Latest Mobiles</span>
      <span class="sm-qr">Best Laptops</span>
      <span class="sm-qr">Today's Offers</span>
      <span class="sm-qr">Track Order</span>
      <span class="sm-qr">Return Policy</span>
      <span class="sm-qr">Shipping Charges</span>
      <span class="sm-qr">Warranty Info</span>
      <span class="sm-qr">Clear Chat</span>
    </div>

    <div id="sm-messages">
      <div class="sm-msg bot">
        <div class="sm-msg-av">🛒</div>
        <div class="sm-bubble-wrap">
          <div class="sm-bubble">
            👋 Hi! I'm ShopMart's AI assistant.<br><br>
            I can help you find products, compare specs, check prices, and answer questions about shipping, returns, and warranties.<br><br>
            <strong>Just type your question!</strong>
          </div>
          <span class="sm-time">Just now</span>
        </div>
      </div>
      <div class="sm-msg bot" id="sm-typing">
        <div class="sm-msg-av">🛒</div>
        <div class="sm-bubble-wrap">
          <div class="sm-typing-bubble">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

  <div id="sm-input-area">

    <input
        type="file"
        id="sm-file-input"
        accept=".pdf"
        style="display:none">

    <button id="sm-upload-btn" type="button" title="Upload PDF">
    <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M16.5 6.5l-7.8 7.8a3 3 0 104.2 4.2l8.5-8.5a5 5 0 10-7.1-7.1L5.8 11.4a7 7 0 109.9 9.9l6.4-6.4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"/>
    </svg>
</button>

    <textarea
        id="sm-input"
        placeholder="Ask me anything about products..."
        rows="1"></textarea>

    <button id="sm-send-btn" title="Send">
        <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
    </button>

</div>
    <div id="sm-sidebar-footer">
      Team <strong>Gryffindor</strong> · GENAI Internship · Powered by RAG
    </div>
  `;

  // Insert sidebar into #app-shell (after #main-content)
  const appShell = document.getElementById("app-shell");
  if (appShell) {
    appShell.appendChild(sidebar);
  } else {
    document.body.appendChild(sidebar);
  }

  // ─── REFS ─────────────────────────────────────────────────────────────────
  const closeBtn   = document.getElementById("sm-sidebar-close");
  const messages   = document.getElementById("sm-messages");
  const typing     = document.getElementById("sm-typing");
  const input      = document.getElementById("sm-input");
  const sendBtn    = document.getElementById("sm-send-btn");
  const quickReplies = document.querySelectorAll(".sm-qr");
  const uploadBtn = document.getElementById("sm-upload-btn");
  const fileInput = document.getElementById("sm-file-input");

  // ─── OPEN / CLOSE ─────────────────────────────────────────────────────────
  function openChat() {
    if (isChatOpen) return;
    isChatOpen = true;
    document.body.classList.add("chat-open");
    setTimeout(() => { input.focus(); scrollToBottom(); }, 100);
  }

  function closeChat() {
    if (!isChatOpen) return;
    isChatOpen = false;
    document.body.classList.remove("chat-open");
  }

  closeBtn.addEventListener("click", closeChat);

  // ─── INTERCEPT ALL EXISTING TRIGGER BUTTONS ────────────────────────────────
  // Patch any onclick that references sm-toggle-btn click or openChat
  function patchTriggers() {
    // Replace all buttons/elements that try to click sm-toggle-btn
    document.querySelectorAll("[onclick]").forEach(el => {
      const oc = el.getAttribute("onclick") || "";
      if (oc.includes("sm-toggle-btn") || oc.includes("openChat")) {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openChat();
        });
        el.setAttribute("onclick", "");
      }
    });
  }
  // Run after DOM fully ready
  document.addEventListener("DOMContentLoaded", patchTriggers);
  // Also run immediately (scripts load after body usually)
  patchTriggers();

  // Expose global open/close for inline onclick handlers in HTML
  window.openShopMartChat = openChat;
  window.closeShopMartChat = closeChat;

    
  // ─── QUICK REPLIES ────────────────────────────────────────────────────────
  quickReplies.forEach(qr => {
    qr.addEventListener("click", () => {
      const label = qr.textContent.trim();
      if (label === "Clear Chat") { clearChat(); return; }
      input.value = label;
      sendMessage();
    });
  });

  function clearChat() {
    const msgs = messages.querySelectorAll(".sm-msg:not(#sm-typing)");
    msgs.forEach(m => m.remove());
    messageHistory = [];
    addBotBubble("Chat cleared! How can I help you? 😊");
  }

  function addUserFileBubble(fileName) {

    const msg = document.createElement("div");
    msg.className = "sm-msg user";

    msg.innerHTML = `
        <div class="sm-bubble-wrap">
            <div class="sm-bubble">
                📄 ${esc(fileName)}
            </div>
            <span class="sm-time">${getTime()}</span>
        </div>
    `;

    messages.insertBefore(msg, typing);
    scrollToBottom();
}
  // ─── SEND MESSAGE ─────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.style.height = "auto";
    addUserBubble(text);
    showTyping();
    sendBtn.disabled = true;

    messageHistory.push({ role: "user", content: text });

    try {
      const resp = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: text,
        }),
      });
      if (!resp.ok) throw new Error(`API error ${resp.status}`);
      const data = await resp.json();
      console.log(data);
      hideTyping();
      
if (data.tool === "order") {

    const orders = JSON.parse(
        localStorage.getItem("shopmart_orders") || "[]"
    );

    if (orders.length === 0) {

        data.answer = "You haven't placed any orders yet.";

    } else {

        data.answer =
            "Here are your recent orders. Your items are expected to be delivered within 4 working days.";

        data.orders = orders;   // <-- Inject orders into the response
    }
}
if (data.tool === "cart") {

    const cart = JSON.parse(
        localStorage.getItem("sm_cart") || "[]"
    );

    if (cart.length === 0) {

        data.answer =
            "Your shopping cart is currently empty.";

    } else {

        data.answer =
            `You currently have ${cart.length} item${cart.length > 1 ? "s" : ""} in your cart.`;

        data.cart = cart;
    }
}
      const answerText = data.answer || data.response || data.message || "I'm here to help!";
      messageHistory.push({ role: "assistant", content: answerText });
      addBotMessage(data, answerText);
    } catch (err) {
    console.error("Fetch Error:", err);

    hideTyping();

    addBotBubble(`
        <b>Fetch Failed</b><br>
        ${err.message}<br><br>
        API URL: ${API_URL}
    `);
}
    sendBtn.disabled = false;
    scrollToBottom();
  }

  function getTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function addUserBubble(text) {
    const msg = document.createElement("div");
    msg.className = "sm-msg user";
    msg.innerHTML = `
      <div class="sm-msg-av" style="color:white;font-size:13px">👤</div>
      <div class="sm-bubble-wrap">
        <div class="sm-bubble">${esc(text).replace(/\n/g, "<br>")}</div>
        <span class="sm-time">${getTime()}</span>
      </div>`;
    messages.insertBefore(msg, typing);
    scrollToBottom();
  }

  function addBotBubble(html) {
    const msg = document.createElement("div");
    msg.className = "sm-msg bot";
    msg.innerHTML = `
      <div class="sm-msg-av">🛒</div>
      <div class="sm-bubble-wrap">
        <div class="sm-bubble">${html}</div>
        <span class="sm-time">${getTime()}</span>
      </div>`;
    messages.insertBefore(msg, typing);
    scrollToBottom();
  }

  function createCartCard(item) {

    return `
        <div class="cart-item">

            <div class="cart-item-emoji">
                ${item.emoji || "🛒"}
            </div>

            <div class="cart-item-info">

                <div class="cart-item-name">
                    ${escapeHtml(item.name)}
                </div>

                <div class="cart-item-price">
                    ₹${item.price.toLocaleString("en-IN")}
                </div>

                <div class="cart-qty">

                    <button
                        class="qty-btn"
                        onclick="changeQty(${item.id}, -1)">

                        −

                    </button>

                    <span class="qty-val">
                        ${item.qty}
                    </span>

                    <button
                        class="qty-btn"
                        onclick="changeQty(${item.id}, 1)">

                        +

                    </button>

                </div>

            </div>

            <button
                class="cart-remove"
                onclick="removeFromCart(${item.id})">

                🗑

            </button>

        </div>
    `;
}

  function createOrderCard(o, index) {

    const d = new Date(o.date);

    const dateStr = d.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

    const productLines = o.products.map(p =>
        `• ${escapeHtml(p.name)} ×${p.qty}`
    ).join("<br>");

    return `
        <div class="order-card">

            <div class="order-card-header">

                <div>

                    <div class="order-id">
                        ${escapeHtml(o.orderId)}
                    </div>

                    <div class="order-date">
                        Placed: ${dateStr}
                    </div>

                </div>

                <div class="order-status-badge">
                    🟠 ${escapeHtml(o.status)}
                </div>

            </div>

            <div class="order-card-body">

                <div class="order-products">

                    <strong>Products</strong>

                    ${productLines}

                </div>

                <div class="order-meta">

                    <div class="order-total">
                        ₹${o.total.toLocaleString("en-IN")}
                    </div>

                    <button
                        class="order-view-btn"
                        onclick="showOrderDetail(${index})">

                        View Details

                    </button>

                </div>

            </div>

        </div>
    `;
}

  function createProductCard(p) {
    const inCart = cart.find(c => c.id === p.id);

    return `
        <div class="product-card" onclick="showProductDetail(${p.id})">
            <div class="product-img">
                <img src="${p.img || 'assets/images/no-image.png'}"
                     alt="${p.name}"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='assets/images/no-image.png'">
            </div>

            <div class="product-info">
                <div class="product-cat">${p.category}</div>
                <div class="product-name">${escapeHtml(p.name)}</div>
                <div class="product-brand">${p.brand}</div>
                <div class="product-desc">${escapeHtml(p.desc)}</div>
                <div class="product-price">₹${p.price.toLocaleString('en-IN')}</div>
                <div class="product-stock">✓ ${p.stock} in stock</div>

                <div class="product-actions" onclick="event.stopPropagation()">
                    <button
                        class="btn-cart ${inCart ? 'added' : ''}"
                        id="cart-btn-${p.id}"
                        onclick="addToCart(${p.id})">

                        ${inCart ? '✓ Added' : '+ Add to Cart'}

                    </button>

                    <button
                        class="btn-wish"
                        onclick="wishlist(${p.id})">

                        ♥

                    </button>
                </div>
            </div>
        </div>
    `;
}
  function addBotMessage(data, answerText) {
    const msg = document.createElement("div");
    msg.className = "sm-msg bot";

    let chips = "";
    let productsHTML = "";
    console.log("addBotMessage called");
    console.log(data);
    console.log(answerText);
  if (
      data.tool === "products" &&
      data.products &&
      data.products.length
  ) {

      productsHTML =
          '<div class="sm-product-list">';

      data.products.forEach(product => {

          productsHTML += createProductCard(product);

      });

      productsHTML += '</div>';
  }

  let ordersHTML = "";

if (
    data.tool === "order" &&
    data.orders &&
    data.orders.length
){

    ordersHTML =
        '<div class="sm-order-list">';

    data.orders.forEach((order,index)=>{

        ordersHTML +=
            createOrderCard(order,index);

    });

    ordersHTML += "</div>";

}

let cartHTML = "";

if (
    data.tool === "cart" &&
    data.cart &&
    data.cart.length
) {

    cartHTML =
        `<div class="sm-cart-list">`;

    data.cart.forEach(item => {

        cartHTML += createCartCard(item);

    });

    cartHTML += "</div>";
}

    if (data.follow_up_questions && data.follow_up_questions.length) {
      const chipsHTML = data.follow_up_questions
        .map(q => `<span class="sm-chip" onclick="(function(){document.getElementById('sm-input').value=${JSON.stringify(q)};document.getElementById('sm-send-btn').click();})()">${esc(q)}</span>`)
        .join("");
      chips = `<div class="sm-follow-ups">${chipsHTML}</div>`;
    }
    
    msg.innerHTML = `
      <div class="sm-msg-av">🛒</div>
      <div class="sm-bubble-wrap">
        <div class="sm-bubble">
            ${esc(answerText).replace(/\n/g,"<br>")}
            ${productsHTML}
            ${ordersHTML}
            ${cartHTML}
        </div>
        <span class="sm-time">${getTime()}</span>
        ${chips}
      </div>`;
    messages.insertBefore(msg, typing);
    console.log("HTML created");
    scrollToBottom();
  }

  function showTyping() { typing.classList.add("show"); scrollToBottom(); }
  function hideTyping() { typing.classList.remove("show"); }
  function scrollToBottom() { setTimeout(() => { messages.scrollTop = messages.scrollHeight; }, 60); }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ─── INPUT AUTO-RESIZE ────────────────────────────────────────────────────
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 80) + "px";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener("click", sendMessage);
  
uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", async () => {

    const file = fileInput.files[0];
    if (!file) return;

    // Show the uploaded PDF as a user message
    addUserBubble(`📄 ${file.name}`);

    showTyping();

    const formData = new FormData();
    formData.append("file", file);

    try {

        const resp = await fetch(`${API_URL}/upload-pdf`, {
            method: "POST",
            body: formData
        });
        const data = await resp.json();

        hideTyping();

        addBotMessage(data,data.answer);

    } catch (err) {

        hideTyping();

        addBotMessage(
            {
                tool: "website",
                products: []
            },
            "Failed to upload the PDF."+ err.message
        );

    }

    // Allow selecting the same PDF again
    fileInput.value = "";

});
})();
