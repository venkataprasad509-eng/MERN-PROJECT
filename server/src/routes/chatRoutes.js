
const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');

const {
  createChat,
  getChats,
  getChatById,
  renameChat,
  deleteChat,
  sendMessage,
} = require('../controllers/chatController');

const router = express.Router();

// Protect all chat routes
router.use(requireAuth);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:chatId', getChatById);
router.patch('/:chatId', renameChat);
router.delete('/:chatId', deleteChat);
router.post('/:chatId/messages', sendMessage);

module.exports = router;
