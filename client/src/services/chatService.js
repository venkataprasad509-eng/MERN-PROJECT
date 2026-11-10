
import api from './api';

const chatService = {
  // Create a new conversation
  createChat: () =>
    api.post('/chats').then((response) => response.data),

  // Get all previous conversations
  getChats: () =>
    api.get('/chats').then((response) => response.data),

  // Get messages from a particular conversation
  getChat: (chatId) =>
    api.get(`/chats/${chatId}`).then((response) => response.data),

  // Send a message and receive Gemini's answer
  sendMessage: (chatId, message) =>
    api.post(`/chats/${chatId}/messages`, { message })
      .then((response) => response.data),

  // Rename a conversation
  renameChat: (chatId, title) =>
    api.patch(`/chats/${chatId}`, { title })
      .then((response) => response.data),

  // Delete a conversation
  deleteChat: (chatId) =>
    api.delete(`/chats/${chatId}`).then((response) => response.data),
};

export default chatService;
