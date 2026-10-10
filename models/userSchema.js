const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId;
      }
    },

    resetPasswordCode: {
      type: String,
      default: null
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true
    },

    avatar: {
      type: String,
      default: ""
    },

    role: {
      type: String,
      enum: ["admin", "user", "proctor"],
      default: "user"
    }
  },
  { timestamps: true }
);

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model("User", userSchema);