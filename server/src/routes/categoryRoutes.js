const { Router } = require('express');
const { mockCategories } = require('../data/mockCategories');

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, categories: mockCategories });
});

router.get('/:id', (req, res) => {
  const category = mockCategories.find((c) => c.id === req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category });
});

module.exports = router;
