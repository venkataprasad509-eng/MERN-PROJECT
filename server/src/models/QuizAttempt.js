
const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },

    courseId: {
      type: String,
      required: true,
      index: true,
    },

    studentId: {
      type: String,
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },

        selectedOption: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    marksObtained: {
      type: Number,
      default: 0,
      min: 0,
    },

    timeTaken: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'evaluated'],
      default: 'in-progress',
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

quizAttemptSchema.index(
  { assessmentId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
