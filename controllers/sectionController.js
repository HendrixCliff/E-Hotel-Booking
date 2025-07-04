const Section = require('../models/adminSectionSchema');
const asyncErrorHandler = require('../utils/asyncErrorHandler');


exports.createOrUpdateSection = async (req, res) => {
  try {
    const { key, title, type, visible } = req.body;
    let content;

   if (type === 'image') {
  if (req.files && req.files.length > 0) {
    content = {
      url: req.files[0].path,
      alt: req.body.alt || title
    };
  } else if (req.body.content) {
    content = typeof req.body.content === 'string'
      ? JSON.parse(req.body.content)
      : req.body.content;

    if (!content.url) {
      return res.status(400).json({ message: 'Missing image URL in content' });
    }
  } else {
    return res.status(400).json({ message: 'Image required (file or content)' });
  }
}
 else if (type === 'carousel') {
      if (req.files && req.files.length > 0) {
        // ✅ Multiple files uploaded
        content = req.files.map(file => ({
          url: file.path,
          alt: req.body.alt || ''
        }));
      } else if (req.body.content) {
        content = typeof req.body.content === 'string'
          ? JSON.parse(req.body.content)
          : req.body.content;

        if (!Array.isArray(content) || content.length === 0) {
          return res.status(400).json({ message: 'Carousel content must be an array' });
        }
      } else {
        return res.status(400).json({ message: 'Carousel images required (file or content)' });
      }

    } else {
      // text, html, or custom section types
      content = req.body.content;
    }

    const section = await Section.findOneAndUpdate(
      { key },
      {
        title,
        type,
        content,
        visible,
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Section saved', section });
  } catch (err) {
    console.error('❌ Error saving section:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllSections = asyncErrorHandler(async (req, res) => {
  const sections = await Section.find().sort({ updatedAt: -1 });
  res.json(sections);
});

exports.getSectionByKey = asyncErrorHandler(async (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'Key is required in request body.' });
  }

  const section = await Section.findOne({ key });

  if (!section) {
    return res.status(404).json({ error: `Section '${key}' not found.` });
  }
  

  res.status(200).json(section);
});


exports.deleteSection = asyncErrorHandler(async (req, res) => {
  await Section.findOneAndDelete({ key: req.params.key });
  res.json({ message: 'Section deleted' });
});






    