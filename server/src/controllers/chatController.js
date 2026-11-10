
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const { askGemini } = require('../services/geminiService');

// Create a new conversation
async function createChat(req, res) {
  try {
    const chat = await Chat.create({
      userId: req.user.id,
      title: 'New Chat',
      messages: [],
    });

    res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Create chat error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to create conversation.',
    });
  }
}

// Get all conversations of the logged-in user
async function getChats(req, res) {
  try {
    const chats = await Chat.find({
      userId: req.user.id,
    })
      .select('title createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      chats: chats.map((chat) => ({
        _id: chat._id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messageCount: chat.messages?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Get chats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to load conversations.',
    });
  }
}

// Get one conversation
async function getChatById(req, res) {
  try {
    const { chatId } = req.params;

    if (!mongoose.isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Get chat error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to load conversation.',
    });
  }
}

// Rename a conversation
async function renameChat(req, res) {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!mongoose.isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.trim().length > 80
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 1 and 80 characters.',
      });
    }

    const chat = await Chat.findOneAndUpdate(
      {
        _id: chatId,
        userId: req.user.id,
      },
      { title: title.trim() },
      { new: true, runValidators: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Rename chat error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to rename conversation.',
    });
  }
}

// Delete a conversation
async function deleteChat(req, res) {
  try {
    const { chatId } = req.params;

    if (!mongoose.isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const chat = await Chat.findOneAndDelete({
      _id: chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (error) {
    console.error('Delete chat error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to delete conversation.',
    });
  }
}

// Send a message and get Gemini's response
async function sendMessage(req, res) {
  try {
    const { message } = req.body;
    const { chatId } = req.params;

    if (!mongoose.isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.trim().length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Message must be between 1 and 10000 characters.',
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const userMessage = message.trim();

    // Save the user's question in memory temporarily
    const previousMessages = chat.messages
      .slice(-20)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    // Generate Gemini's response with previous conversation history
    const answer = await askGemini(userMessage, previousMessages);

    if (!answer || typeof answer !== 'string') {
      throw new Error('Gemini returned an empty response.');
    }

    // Save both messages after successful AI response
    chat.messages.push(
      {
        role: 'user',
        content: userMessage,
      },
      {
        role: 'assistant',
        content: answer,
      }
    );

    // Automatically generate a title from the first question
    if (chat.messages.length === 2 && chat.title === 'New Chat') {
      chat.title =
        userMessage.length > 40
          ? `${userMessage.substring(0, 40)}...`
          : userMessage;
    }

    await chat.save();

    res.json({
      success: true,
      chat,
      answer,
    });
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to generate an AI response. Please try again.',
    });
  }
}

module.exports = {
  createChat,
  getChats,
  getChatById,
  renameChat,
  deleteChat,
  sendMessage,
};
