
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
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

    // Student's selected answers for quiz questions.
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

    // Student's written assignment answer.
    submissionText: {
      type: String,
      default: '',
    },

    // URL of uploaded assignment file, if any.
    attachmentUrl: {
      type: String,
      default: null,
    },

    marksObtained: {
      type: Number,
      default: null,
      min: 0,
    },

    feedback: {
      type: String,
      default: '',
    },

    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted',
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    gradedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One submission per student per assessment for the first version.
submissionSchema.index(
  { assessmentId: 1, studentId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
