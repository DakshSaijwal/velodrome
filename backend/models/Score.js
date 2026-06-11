import mongoose from 'mongoose'

const scoreSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true, maxlength: 30 },
    wpm:        { type: Number, required: true, min: 0 },
    accuracy:   { type: Number, required: true, min: 0, max: 100 },
    mode:       { type: String, enum: ['solo', 'multi'], default: 'solo' },
  },
  { timestamps: true }
)

// Index for fast leaderboard queries
scoreSchema.index({ wpm: -1 })

export default mongoose.model('Score', scoreSchema)
