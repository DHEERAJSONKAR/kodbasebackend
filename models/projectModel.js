const mongoose = require("mongoose");

let projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  projLanguage: {
    type: String,
    required: true,
    enum: ["python", "javascript", "cpp", "c", "java", "bash", "dart", "swift", "php", "go", "ruby"]
  },
  code: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  version: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("Project", projectSchema);