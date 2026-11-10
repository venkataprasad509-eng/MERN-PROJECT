
import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  X,
  Loader2,
  Sparkles,
  Menu,
  GraduationCap,
} from 'lucide-react';

import chatService from '../services/chatService';

const Chatbot = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingChat, setEditingChat] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  // Load previous conversations
  useEffect(() => {
    let active = true;

    chatService.getChats()
      .then((response) => {
        if (active) {
          setChats(response.chats || []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Unable to load conversations.');
        }
      })
      .finally(() => {
        if (active) {
          setPageLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Create a new conversation
  const handleNewChat = async () => {
    try {
      setError('');
      const response = await chatService.createChat();
      const newChat = response.chat;

      setChats((previous) => [newChat, ...previous]);
      setActiveChat(newChat);
      setMessages([]);
      setInput('');

      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Unable to create a new chat.');
    }
  };

  // Open an existing conversation
  const handleSelectChat = async (chatId) => {
    try {
      setError('');
      setLoading(false);

      const response = await chatService.getChat(chatId);

      setActiveChat(response.chat);
      setMessages(response.chat.messages || []);
    } catch (err) {
      setError(err.message || 'Unable to open conversation.');
    }
  };

  // Send message to Gemini
  const handleSendMessage = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setError('');

    try {
      let currentChat = activeChat;

      // Automatically create a conversation if none is selected
      if (!currentChat) {
        const response = await chatService.createChat();
        currentChat = response.chat;

        setActiveChat(currentChat);
        setChats((previous) => [currentChat, ...previous]);
      }

      setInput('');
      setLoading(true);

      const userMessage = {
        role: 'user',
        content: message,
      };

      setMessages((previous) => [...previous, userMessage]);

      const response = await chatService.sendMessage(
        currentChat._id,
        message
      );

      const updatedChat = response.chat;

      setActiveChat(updatedChat);
      setMessages(updatedChat.messages || []);

      setChats((previous) => [
        updatedChat,
        ...previous.filter(
          (chat) => chat._id !== updatedChat._id
        ),
      ]);
    } catch (err) {
      setError(err.message || 'Unable to send message.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Delete a conversation
  const handleDeleteChat = async (chatId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this conversation?'
    );

    if (!confirmed) return;

    try {
      await chatService.deleteChat(chatId);

      setChats((previous) =>
        previous.filter((chat) => chat._id !== chatId)
      );

      if (activeChat?._id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to delete conversation.');
    }
  };

  // Start renaming a conversation
  const handleStartRename = (chat) => {
    setEditingChat(chat._id);
    setEditTitle(chat.title);
  };

  // Save renamed conversation
  const handleRenameChat = async (chatId) => {
    if (!editTitle.trim()) return;

    try {
      const response = await chatService.renameChat(
        chatId,
        editTitle.trim()
      );

      setChats((previous) =>
        previous.map((chat) =>
          chat._id === chatId ? response.chat : chat
        )
      );

      if (activeChat?._id === chatId) {
        setActiveChat(response.chat);
      }

      setEditingChat(null);
      setEditTitle('');
    } catch (err) {
      setError(err.message || 'Unable to rename conversation.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] flex bg-white">

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } shrink-0 bg-gray-950 text-white transition-all duration-300 overflow-hidden`}
      >
        <div className="w-72 h-full flex flex-col p-4">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Bot size={22} />
              </div>
              <span className="text-lg font-bold">LearnHub AI</span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-white"
              title="Close sidebar"
            >
              <X size={19} />
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 justify-center bg-indigo-600 hover:bg-indigo-700 rounded-xl py-3 font-medium transition"
          >
            <Plus size={19} />
            New Chat
          </button>

          <div className="mt-7 mb-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Recent Conversations
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">

            {pageLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No conversations yet.
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  className={`group flex items-center gap-2 rounded-lg p-2 ${
                    activeChat?._id === chat._id
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-900'
                  }`}
                >
                  <button
                    onClick={() => handleSelectChat(chat._id)}
                    className="flex-1 min-w-0 flex items-center gap-2 text-left text-sm"
                  >
                    <MessageSquare size={16} className="shrink-0 text-gray-400" />

                    {editingChat === chat._id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameChat(chat._id);
                          }
                          if (e.key === 'Escape') {
                            setEditingChat(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-gray-700 rounded px-2 py-1 outline-none"
                      />
                    ) : (
                      <span className="truncate">{chat.title}</span>
                    )}
                  </button>

                  {editingChat === chat._id ? (
                    <button
                      onClick={() => handleRenameChat(chat._id)}
                      className="text-green-400 text-xs"
                    >
                      Save
                    </button>
                  ) : (
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => handleStartRename(chat)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="Rename"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteChat(chat._id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <GraduationCap size={18} />
              Your AI Learning Assistant
            </div>
          </div>

        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Header */}
        <header className="h-16 border-b flex items-center px-5 gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Open sidebar"
            >
              <Menu size={21} />
            </button>
          )}

          <div>
            <h1 className="font-bold text-gray-800">LearnHub AI Assistant</h1>
            <p className="text-xs text-gray-500">
              Learn, explore and clarify your doubts
            </p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">

          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto min-h-full flex flex-col justify-center items-center text-center">

              <div className="bg-indigo-100 text-indigo-600 p-5 rounded-2xl mb-5">
                <Sparkles size={35} />
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                How can I help you today?
              </h2>

              <p className="text-gray-500 mb-8">
                Ask programming questions, clarify course doubts
                or have a general conversation.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 w-full">

                {[
                  'Explain JavaScript closures with examples',
                  'What is the MERN stack?',
                  'How does an API work?',
                  'Give me a roadmap to learn Python',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-left border rounded-xl p-4 text-sm text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 transition"
                  >
                    <Sparkles size={16} className="text-indigo-500 mb-2" />
                    {suggestion}
                  </button>
                ))}

              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-7">

              {messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex gap-3 ${
                    message.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="shrink-0 bg-indigo-600 text-white p-2 rounded-xl h-fit">
                      <Bot size={20} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap break-words ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.role === 'user' && (
                    <div className="shrink-0 bg-gray-200 text-gray-600 p-2 rounded-xl h-fit">
                      <MessageSquare size={20} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 text-white p-2 rounded-xl">
                    <Bot size={20} />
                  </div>

                  <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    LearnHub AI is thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {error && (
            <div className="max-w-3xl mx-auto mt-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex justify-between gap-3">
              {error}
              <button onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}

        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4 sm:px-8">
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto flex items-end gap-3 border rounded-2xl p-3 shadow-sm focus-within:border-indigo-500"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask LearnHub AI anything..."
              rows={1}
              maxLength={10000}
              className="flex-1 resize-none outline-none text-sm py-2 max-h-32"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition"
              title="Send message"
            >
              {loading ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Send size={19} />
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-3">
            LearnHub AI can make mistakes. Verify important information.
          </p>
        </div>

      </main>
    </div>
  );
};

export default Chatbot;
