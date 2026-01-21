'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

function parseMessageWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline hover:text-blue-700 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

interface ChatWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function ChatWidget({ open: controlledOpen, onOpenChange, hideTrigger }: ChatWidgetProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [businessName, setBusinessName] = useState('Don Negro Comercial');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadWebhookUrl();
    loadChatSettings();
    loadBusinessName();

    const channel = supabase
      .channel('admin_settings_chat_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings' },
        () => {
          loadChatSettings();
          loadWebhookUrl();
        }
      )
      .subscribe();

    const savedSessionId = localStorage.getItem('chat_session_id');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadChatSession(savedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem('chat_session_id', newSessionId);
    }

    const dismissed = localStorage.getItem('chatTooltipDismissed');
    if (!dismissed) {
      setTimeout(() => setShowTooltip(true), 3000);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_chats',
          filter: `session_id=eq.${sessionId}`
        },
        (payload: any) => {
          if (payload.new.messages) {
            setMessages(payload.new.messages);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadChatSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('chat_enabled')
        .single();

      if (error) {
        console.error('Error loading chat settings:', error);
        return;
      }

      if (data) {
        console.log('Chat enabled status:', data.chat_enabled);
        setChatEnabled(data.chat_enabled);
      }
    } catch (error) {
      console.error('Error loading chat settings:', error);
    }
  };

  const loadWebhookUrl = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('chat_webhook_url')
        .single();

      if (data?.chat_webhook_url) {
        setWebhookUrl(data.chat_webhook_url);
      }
    } catch (error) {
      console.error('Error loading webhook URL:', error);
    }
  };

  const loadBusinessName = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('business_name')
        .single();

      if (data?.business_name) {
        setBusinessName(data.business_name);
      }
    } catch (error) {
      console.error('Error loading business name:', error);
    }
  };

  const loadChatSession = async (sid: string) => {
    try {
      const { data } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('session_id', sid)
        .maybeSingle();

      if (data) {
        setMessages(data.messages || []);
        if (data.visitor_name) {
          setCustomerName(data.visitor_name);
          setShowNamePrompt(false);
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputMessage]);

  const saveChatSession = async (updatedMessages: any[]) => {
    try {
      const { data: existing } = await supabase
        .from('ai_chats')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ai_chats')
          .update({
            messages: updatedMessages,
            visitor_name: customerName,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);
      } else {
        await supabase.from('ai_chats').insert({
          session_id: sessionId,
          visitor_name: customerName,
          messages: updatedMessages
        });
      }
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  };

  const sendMessageToAI = async (userMessage: string) => {
    if (!webhookUrl) {
      console.error('No webhook URL configured');
      return {
        role: 'assistant',
        content: 'Error: No hay webhook configurado.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      console.log('Sending message to webhook:', webhookUrl);

      const payload = {
        action: 'sendMessage',
        sessionId: sessionId,
        chatInput: userMessage
      };

      console.log('Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`Webhook returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Webhook response data:', data);

      const assistantMessage = data.output || data.response || data.message || data.text || data.chatResponse || data.result || 'Sin respuesta';

      return {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error sending message to AI:', error);
      return {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const messageToSend = inputMessage;
    setInputMessage('');
    setLoading(true);

    await saveChatSession(updatedMessages);

    const aiResponse = await sendMessageToAI(messageToSend);
    const finalMessages = [...updatedMessages, aiResponse];
    setMessages(finalMessages);
    await saveChatSession(finalMessages);

    setLoading(false);
  };

  // Fixed React namespace error by importing React
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem('chatTooltipDismissed', 'true');
  };

  if (!chatEnabled) return null;

  return (
    <>
      {!isOpen && !hideTrigger && (
        <div className="hidden md:block fixed bottom-28 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-cyan-400 hover:bg-cyan-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          >
            <MessageCircle className="w-7 h-7" />
          </button>

          {showTooltip && (
            <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 animate-fade-in">
              <div className="relative bg-white border-2 text-black px-6 py-4 rounded-xl shadow-2xl w-64" style={{ borderColor: '#D91E7A' }}>
                <button
                  onClick={dismissTooltip}
                  className="absolute -top-3 -right-3 text-white rounded-full p-1.5 hover:opacity-90 transition-all shadow-lg hover:scale-110"
                  style={{ backgroundColor: '#D91E7A' }}
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-base font-semibold leading-relaxed">
                  Pregunta lo que sea, este chat funciona 24/7
                </p>
                <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-0 h-0 border-l-8 border-t-8 border-b-8 border-t-transparent border-b-transparent" style={{ borderLeftColor: '#D91E7A' }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] w-full h-full md:rounded-lg bg-white shadow-2xl flex flex-col z-50 md:border-2 md:border-cyan-400">
          <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 text-white p-4 md:rounded-t-lg flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold text-base">{businessName}</h3>
                <p className="text-xs opacity-90">Asistente Virtual</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0"
              aria-label="Cerrar chat"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-[#f5ebe4]">
            {messages.length === 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-700">
                  ¡Bienvenido a {businessName}! ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi;
              const hasImage = msg.role === 'assistant' && imageUrlRegex.test(msg.content);
              const parts = hasImage ? msg.content.split(imageUrlRegex) : [msg.content];

              return (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm break-words ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {hasImage ? (
                      <div className="space-y-2">
                        {parts.map((part, i) => {
                          if (part.match(imageUrlRegex)) {
                            return (
                              <img
                                key={i}
                                src={part}
                                alt="Imagen"
                                className="rounded-lg max-w-full h-auto"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            );
                          } else if (part.trim()) {
                            return (
                              <p key={i} className="text-sm whitespace-pre-wrap break-words">
                                {parseMessageWithLinks(part)}
                              </p>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {parseMessageWithLinks(msg.content)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 md:p-4 border-t bg-white md:rounded-b-lg shrink-0">
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Escribe tu mensaje...'
                rows={1}
                className="flex-1 px-4 py-3 border border-cyan-400 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm resize-none overflow-hidden"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                className="px-4 py-3 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
