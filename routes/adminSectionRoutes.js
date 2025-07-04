const express = require('express');
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const {
  createOrUpdateSection,
  getAllSections,
  getSectionByKey,
  deleteSection
} = require('../controllers/sectionController');
const parser = require('../config/multer');
const router = express.Router();
router.use(isAuth, isAdmin); // all below ro


router.get('/', getAllSections);
router.post('/specifiedSection', getSectionByKey);
// routes/sectionRoutes.js

router.post('/', parser.array('files'), createOrUpdateSection);

router.delete('/:key', deleteSection);

module.exports = router;
