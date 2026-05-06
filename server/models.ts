import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'sachiv', 'dm'], 
    default: 'citizen' 
  },
  panchayatId: { type: Schema.Types.ObjectId, ref: 'Panchayat' },
  createdAt: { type: Date, default: Date.now }
});

export const User = model('User', userSchema);

const panchayatSchema = new Schema({
  name: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  stats: {
    totalComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 }
  }
});

export const Panchayat = model('Panchayat', panchayatSchema);

const complaintSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  location: {
    address: String,
    coordinates: [Number] // [longitude, latitude]
  },
  media: [{ type: String }],
  citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  panchayatId: { type: Schema.Types.ObjectId, ref: 'Panchayat', required: true },
  assignedTo: String,
  status: { 
    type: String, 
    enum: ['Submitted', 'Verified', 'Rejected', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Submitted'
  },
  slaDeadline: Date,
  resolutionProof: {
    imageUrl: String,
    comment: String,
    completedAt: Date
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String
  },
  resolutionVotes: {
    resolved: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    unresolved: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  isDirectToDM: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

complaintSchema.index({ location: '2dsphere' });
export const Complaint = model('Complaint', complaintSchema);
