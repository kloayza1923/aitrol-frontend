// src/components/ai/HorizonAiChat.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
  Avatar,
  CircularProgress,
  Fab,
  Collapse,
  useTheme
} from '@mui/material';
import { Send, SmartToy, Close, AutoAwesome, ContentCopy } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSendChatMessageMutation } from '@/store/api/ai/aiChatApi';

// Reutilizamos el tipo
type QuickModule = {
  id: string;
  title: string;
  path?: string;
  icon?: string;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  relatedPath?: string;
}

interface HorizonAiChatProps {
  modules: QuickModule[];
  reportData?: Record<string, any>; // Datos opcionales de reportes para análisis
}

export const HorizonAiChat = ({ modules, reportData }: HorizonAiChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      text: reportData
        ? '¡Hola! He cargado los datos del reporte. Pregúntame sobre tendencias, análisis o recomendaciones para mejorar el negocio.'
        : '¡Hola! Soy Horizon AI. Pregúntame sobre navegación o envíame datos de reportes para análisis.'
    }
  ]);

  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // RTK Query mutation hook
  const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Agregar mensaje del usuario
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      // 2. Preparar payload dinámico
      const payload: any = {
        query: currentInput
      };

      // Si hay datos de reporte, priorizarlos para análisis
      if (reportData) {
        payload.report_data = reportData;
      } else {
        // Solo enviar contexto de menú si no hay datos de reporte
        payload.context = modules.map((m) => ({ title: m.title, path: m.path }));
      }

      // 3. Llamada usando RTK Query
      const result = await sendChatMessage(payload).unwrap();

      // 4. Agregar respuesta de la IA
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.text,
        relatedPath: result.suggested_path
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error AI:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: 'Lo siento, tuve un problema conectando con el servidor. Intenta nuevamente.'
        }
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1300] flex flex-col items-end gap-2">
      <Collapse in={isOpen} orientation="vertical">
        <Paper
          elevation={24}
          sx={{
            width: { xs: 380, md: 440 },
            height: 650,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '20px',
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Header estilo Mac */}
          <div
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
              padding: '16px 20px',
              borderBottom: isDark
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                <AutoAwesome sx={{ fontSize: 20, color: 'white' }} />
              </div>
              <div>
                <Typography
                  sx={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isDark ? '#e5e7eb' : '#1f2937',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Horizon AI
                </Typography>
                <Typography
                  sx={{
                    fontSize: '11px',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    marginTop: '-2px'
                  }}
                >
                  {reportData ? 'Análisis de datos' : 'Asistente virtual'}
                </Typography>
              </div>
            </div>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                color: isDark ? '#9ca3af' : '#6b7280',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#e5e7eb' : '#1f2937'
                }
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </div>

          {/* Area de Mensajes */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: '24px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              background: isDark ? '#1a1a1a' : '#fafafa'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: '12px',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                    }}
                  >
                    <SmartToy sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxWidth: '80%',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius:
                        msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      background:
                        msg.role === 'user'
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : isDark
                            ? '#2a2a2a'
                            : 'white',
                      color: msg.role === 'user' ? 'white' : isDark ? '#e5e7eb' : '#1f2937',
                      boxShadow:
                        msg.role === 'user'
                          ? '0 2px 8px rgba(99, 102, 241, 0.25)'
                          : isDark
                            ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                            : '0 1px 3px rgba(0, 0, 0, 0.08)',
                      border:
                        msg.role === 'assistant'
                          ? isDark
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.06)'
                          : 'none'
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong style="font-weight: 600">$1</strong>'
                        )
                      }}
                    />
                  </div>

                  {/* Navegación */}
                  {msg.relatedPath && (
                    <button
                      onClick={() => navigate(msg.relatedPath!)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <ContentCopy sx={{ fontSize: 14 }} />
                      <span>Ir a: {msg.relatedPath}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    flexShrink: 0
                  }}
                >
                  <SmartToy sx={{ fontSize: 18 }} />
                </Avatar>
                <div
                  style={{
                    background: isDark ? '#2a2a2a' : 'white',
                    padding: '12px 18px',
                    borderRadius: '18px 18px 18px 4px',
                    display: 'flex',
                    gap: '6px',
                    boxShadow: isDark
                      ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: isDark
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#9ca3af',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0s'
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#9ca3af',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.16s'
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#9ca3af',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.32s'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '16px 20px 20px',
              background: isDark ? '#1e1e1e' : 'white',
              borderTop: isDark
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Escribe tu consulta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: isDark ? '#2a2a2a' : '#f9fafb',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  color: isDark ? '#e5e7eb' : '#1f2937',
                  '& fieldset': { border: 'none' },
                  '&:hover': {
                    backgroundColor: isDark ? '#333333' : '#f3f4f6',
                    border: isDark
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid rgba(0, 0, 0, 0.12)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: isDark ? '#2a2a2a' : 'white',
                    border: '1px solid #6366f1',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      sx={{
                        width: 32,
                        height: 32,
                        background:
                          input.trim() && !isLoading
                            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                            : '#e5e7eb',
                        color: 'white',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background:
                            input.trim() && !isLoading
                              ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                              : '#e5e7eb',
                          transform: input.trim() && !isLoading ? 'scale(1.05)' : 'none'
                        },
                        '&:disabled': {
                          background: '#e5e7eb'
                        }
                      }}
                    >
                      <Send sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '12px'
              }}
            >
              <Typography
                sx={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AutoAwesome sx={{ fontSize: 12 }} />
                Powered by Anthony Chilan
              </Typography>
            </div>
          </div>
        </Paper>
      </Collapse>

      {/* FAB mejorado */}
      <Fab
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          width: 60,
          height: 60,
          background: isOpen
            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: isOpen
            ? '0 8px 24px rgba(107, 114, 128, 0.35)'
            : '0 8px 24px rgba(99, 102, 241, 0.35)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: isOpen
              ? '0 12px 32px rgba(107, 114, 128, 0.45)'
              : '0 12px 32px rgba(99, 102, 241, 0.45)'
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        {isOpen ? <Close sx={{ fontSize: 28 }} /> : <SmartToy sx={{ fontSize: 28 }} />}
      </Fab>

      {/* Agregar animaciones CSS */}
      <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
    </div>
  );
};
