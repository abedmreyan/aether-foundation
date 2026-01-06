(function() {
  'use strict';

  // Widget configuration
  let widgetConfig = {
    widgetKey: '',
    apiUrl: '',
    primaryColor: '#3b82f6',
    position: 'bottom-right',
    size: 'medium',
    welcomeMessage: 'Hello! How can we help you today?',
    enableChat: true,
    enableVoice: true
  };

  // Widget state
  let isOpen = false;
  let messages = [];
  let sessionId = null;
  let socket = null;
  let typingTimeout = null;
  let visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Create widget container
  function createWidget() {
    // Check if widget already exists
    if (document.getElementById('saas-comm-widget')) {
      return;
    }

    // Create widget container
    const container = document.createElement('div');
    container.id = 'saas-comm-widget';
    container.innerHTML = `
      <style>
        #saas-comm-widget {
          position: fixed;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        #saas-comm-widget * {
          box-sizing: border-box;
        }

        .saas-widget-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .saas-widget-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .saas-widget-button:active {
          transform: scale(0.95);
        }

        .saas-widget-button svg {
          width: 28px;
          height: 28px;
          fill: white;
        }

        .saas-widget-window {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }

        .saas-widget-window.open {
          display: flex;
        }

        /* Size variants */
        .saas-widget-window.small {
          width: 320px;
          height: 400px;
        }

        .saas-widget-window.medium {
          width: 380px;
          height: 520px;
        }

        .saas-widget-window.large {
          width: 450px;
          height: 600px;
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .saas-widget-window {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
            max-width: none !important;
            max-height: none !important;
          }

          .saas-widget-button {
            width: 56px;
            height: 56px;
          }
        }

        /* Position variants */
        .saas-widget-position-bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .saas-widget-position-bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .saas-widget-position-top-right {
          top: 20px;
          right: 20px;
        }

        .saas-widget-position-top-left {
          top: 20px;
          left: 20px;
        }

        .saas-widget-header {
          padding: 16px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .saas-widget-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .saas-widget-close {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .saas-widget-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .saas-widget-close svg {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .saas-widget-content {
          flex: 1;
          padding: 16px;
          background: #f8fafc;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .saas-widget-message {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .saas-widget-message.agent {
          background: white;
          color: #1e293b;
          align-self: flex-start;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .saas-widget-message.user {
          align-self: flex-end;
          color: white;
        }

        .saas-widget-message.system {
          background: #fef3c7;
          color: #92400e;
          align-self: center;
          font-size: 12px;
          padding: 6px 12px;
        }

        .saas-widget-welcome {
          background: white;
          padding: 14px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          font-size: 14px;
          color: #475569;
          margin-bottom: 8px;
        }

        .saas-widget-actions {
          padding: 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
        }

        .saas-widget-input-container {
          flex: 1;
          display: flex;
          gap: 8px;
        }

        .saas-widget-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .saas-widget-input:focus {
          border-color: #3b82f6;
        }

        .saas-widget-button-action {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          gap: 6px;
          whitespace: nowrap;
        }

        .saas-widget-button-action:hover {
          opacity: 0.9;
        }

        .saas-widget-button-action:active {
          transform: scale(0.98);
        }

        .saas-widget-button-action.primary {
          color: white;
        }

        .saas-widget-button-action.secondary {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .saas-widget-button-action svg {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }

        .saas-widget-typing {
          padding: 8px 14px;
          background: white;
          border-radius: 12px;
          align-self: flex-start;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .saas-widget-typing-dots {
          display: flex;
          gap: 4px;
        }

        .saas-widget-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #94a3b8;
          animation: typing 1.4s infinite;
        }

        .saas-widget-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .saas-widget-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }

        .saas-widget-empty {
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
          margin-top: 20px;
        }
      </style>

      <div class="saas-widget-position-${widgetConfig.position}">
        <button class="saas-widget-button" id="saas-widget-toggle" style="background-color: ${widgetConfig.primaryColor};">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </button>

        <div class="saas-widget-window ${widgetConfig.size}" id="saas-widget-window">
          <div class="saas-widget-header" style="background-color: ${widgetConfig.primaryColor};">
            <h3>Support</h3>
            <button class="saas-widget-close" id="saas-widget-close">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
              </svg>
            </button>
          </div>

          <div class="saas-widget-content" id="saas-widget-messages">
            <div class="saas-widget-welcome">${widgetConfig.welcomeMessage}</div>
            <div class="saas-widget-empty">Start a conversation</div>
          </div>

          <div class="saas-widget-actions">
            ${widgetConfig.enableChat ? `
              <div class="saas-widget-input-container">
                <input type="text" class="saas-widget-input" id="saas-widget-input" placeholder="Type a message..." />
                <button class="saas-widget-button-action primary" id="saas-widget-send" style="background-color: ${widgetConfig.primaryColor};">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            ` : ''}
            ${widgetConfig.enableVoice ? `
              <button class="saas-widget-button-action secondary" id="saas-widget-call">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                Call
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    attachEventListeners();
  }

  // Attach event listeners
  function attachEventListeners() {
    const toggleBtn = document.getElementById('saas-widget-toggle');
    const closeBtn = document.getElementById('saas-widget-close');
    const sendBtn = document.getElementById('saas-widget-send');
    const input = document.getElementById('saas-widget-input');
    const callBtn = document.getElementById('saas-widget-call');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleWidget);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeWidget);
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    if (input) {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });

      input.addEventListener('input', function() {
        if (socket && sessionId) {
          socket.emit('typing:start', { sessionId, senderType: 'visitor' });
          
          clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => {
            socket.emit('typing:stop', { sessionId, senderType: 'visitor' });
          }, 2000);
        }
      });
    }

    if (callBtn) {
      callBtn.addEventListener('click', initiateCall);
    }
  }

  // Toggle widget
  function toggleWidget() {
    const window = document.getElementById('saas-widget-window');
    isOpen = !isOpen;
    
    if (isOpen) {
      window.classList.add('open');
      if (!sessionId) {
        createSession();
      }
    } else {
      window.classList.remove('open');
    }
  }

  // Close widget
  function closeWidget() {
    const window = document.getElementById('saas-widget-window');
    window.classList.remove('open');
    isOpen = false;
  }

  // Create session
  async function createSession() {
    try {
      const response = await fetch(`${widgetConfig.apiUrl}/api/trpc/session.create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetKey: widgetConfig.widgetKey })
      });
      
      const data = await response.json();
      sessionId = data.result.data.sessionId;
      console.log('[Widget] Session created:', sessionId);
      
      // Initialize Socket.io
      initializeSocket();
    } catch (error) {
      console.error('[Widget] Failed to create session:', error);
    }
  }

  // Initialize Socket.io
  function initializeSocket() {
    if (!sessionId || socket) return;
    
    // Load Socket.io client
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.8.1/socket.io.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      socket = io(widgetConfig.apiUrl, { path: '/socket.io' });
      
      socket.on('connect', () => {
        console.log('[Widget] Socket connected');
        socket.emit('join:visitor', { sessionId });
      });
      
      socket.on('message:received', (message) => {
        if (message.senderType === 'agent') {
          hideTypingIndicator();
          addMessage(message.content, 'agent', message.senderName);
        }
      });
      
      socket.on('session:started', () => {
        addMessage('An agent has joined the chat', 'system');
      });
      
      socket.on('session:ended', () => {
        addMessage('The agent has ended this session', 'system');
      });
      
      socket.on('typing:start', (data) => {
        if (data.senderType === 'agent') {
          showTypingIndicator();
        }
      });
      
      socket.on('typing:stop', (data) => {
        if (data.senderType === 'agent') {
          hideTypingIndicator();
        }
      });

      socket.on('disconnect', () => {
        console.log('[Widget] Socket disconnected');
      });
    };
    document.head.appendChild(script);
  }

  // Send message
  function sendMessage() {
    const input = document.getElementById('saas-widget-input');
    const message = input.value.trim();
    
    if (!message || !sessionId || !socket) return;

    // Add message to UI
    addMessage(message, 'user');
    input.value = '';

    // Stop typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    socket.emit('typing:stop', { sessionId, senderType: 'visitor' });

    // Send via Socket.io
    socket.emit('message:send', {
      sessionId,
      content: message,
      senderType: 'visitor',
      senderId: visitorId,
      senderName: 'Visitor'
    });
  }

  // Add message to UI
  function addMessage(text, sender, senderName) {
    const messagesContainer = document.getElementById('saas-widget-messages');
    const emptyState = messagesContainer.querySelector('.saas-widget-empty');
    
    if (emptyState) {
      emptyState.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `saas-widget-message ${sender}`;
    
    if (sender === 'agent' && senderName) {
      const nameSpan = document.createElement('div');
      nameSpan.style.fontSize = '11px';
      nameSpan.style.opacity = '0.7';
      nameSpan.style.marginBottom = '4px';
      nameSpan.textContent = senderName;
      messageDiv.appendChild(nameSpan);
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    messageDiv.appendChild(textSpan);
    
    if (sender === 'user') {
      messageDiv.style.backgroundColor = widgetConfig.primaryColor;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    messages.push({ text, sender, timestamp: Date.now() });
  }

  // Show typing indicator
  function showTypingIndicator() {
    const messagesContainer = document.getElementById('saas-widget-messages');
    
    // Remove existing indicator
    const existing = document.getElementById('saas-widget-typing-indicator');
    if (existing) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'saas-widget-typing';
    typingDiv.id = 'saas-widget-typing-indicator';
    typingDiv.innerHTML = `
      <div class="saas-widget-typing-dots">
        <div class="saas-widget-typing-dot"></div>
        <div class="saas-widget-typing-dot"></div>
        <div class="saas-widget-typing-dot"></div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  function hideTypingIndicator() {
    const indicator = document.getElementById('saas-widget-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Initiate call
  function initiateCall() {
    console.log('[Widget] Initiating call...');
    alert('Voice call feature will be implemented with VoIP integration.');
  }

  // Initialize widget
  window.SaaSCommWidget = {
    init: function(config) {
      widgetConfig = Object.assign(widgetConfig, config);
      
      if (!widgetConfig.widgetKey) {
        console.error('[Widget] widgetKey is required');
        return;
      }

      if (!widgetConfig.apiUrl) {
        console.error('[Widget] apiUrl is required');
        return;
      }

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
      } else {
        createWidget();
      }
    },

    open: function() {
      const window = document.getElementById('saas-widget-window');
      if (window) {
        window.classList.add('open');
        isOpen = true;
        if (!sessionId) {
          createSession();
        }
      }
    },

    close: function() {
      closeWidget();
    },

    sendMessage: function(text) {
      if (text && text.trim()) {
        addMessage(text.trim(), 'user');
      }
    }
  };
})();
