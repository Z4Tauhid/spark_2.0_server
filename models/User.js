const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Optional — Firebase/Google users have no plain-text password stored
    password:    { type: String },

    // Firebase UID — links this document to a Firebase auth account
    firebaseUid: { type: String, sparse: true },

    // How this account was created
    authMethod:  {
      type:    String,
      enum:    ['email', 'google'],
      default: 'email',
    },

    role: {
      type:    String,
      enum:    ['trainee', 'organization', 'admin'],
      default: 'trainee',
    },

    avatar:     { type: String },
    isActive:   { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    profile: {
      phone:     String,
      location:  String,
      bio:       String,
      skills:    [String],
      languages: [String],
      linkedin:  String,
      website:   String,
    },
  },
  { timestamps: true }
);

// Hash password before saving — only when it exists and was modified
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt   = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with stored hash
userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

// Never send password to the client
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
