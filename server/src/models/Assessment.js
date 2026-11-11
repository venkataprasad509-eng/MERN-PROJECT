
const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
    },

    options: {
      type: [optionSchema],
      default: [],
    },

    correctAnswer: {
      type: Number,
      default: null,
    },

    marks: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: true }
);

const assessmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      index: true,
    },

    instructorId: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    type: {
      type: String,
      enum: ['assignment', 'quiz'],
      required: true,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    dueDate: {
      type: Date,
      default: null,
    },

    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    timeLimit: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
