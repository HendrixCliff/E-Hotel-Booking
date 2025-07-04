const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  key: {
     type: String, 
      unique: true 
    }, // e.g. "home-hero", "promo-banner"
  title: String,
  type: { 
    type: String, enum: ['text', 'image', 'carousel', 'html', 'custom'], default: 'text' },
  content: mongoose.Schema.Types.Mixed, // Can hold string, array, object, etc.
  visible: { 
    type: Boolean,
     default: true 
    },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, 
{ timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
