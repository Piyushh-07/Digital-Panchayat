import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Panchayat, Complaint } from './models';
import { authMiddleware, roleMiddleware } from './middleware';
import * as turf from '@turf/turf';

const router = Router();

// Middleware to check DB connection - Updated for fallback
const dbCheck = (req: any, res: any, next: any) => {
  next();
};

router.use(dbCheck);

// --- Auth Routes ---
router.post('/auth/signup', async (req: any, res) => {
  try {
    const { name, email, password, role, panchayatId } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, role, panchayatId: panchayatId || undefined });
      await user.save();
      const populatedUser = await User.findById(user._id).populate('panchayatId');
      const token = jwt.sign({ 
        id: user._id.toString(), 
        role: user.role,
        panchayatId: user.panchayatId?.toString() 
      }, process.env.JWT_SECRET || 'secret');
      return res.status(201).json({ token, user: { id: user._id.toString(), name, email, role, panchayat: populatedUser?.panchayatId } });
    } else {
      if (req.mockDB.users.find((u: any) => u.email === email)) return res.status(400).json({ message: 'User already exists in demo' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { id: 'u'+Date.now(), name, email, password: hashedPassword, role, panchayat: req.mockDB.panchayats.find((p: any) => p._id === panchayatId) || null };
      req.mockDB.users.push(newUser);
      return res.status(201).json({ token: jwt.sign({id: newUser.id, role: newUser.role, panchayatId: panchayatId}, process.env.JWT_SECRET || 'secret'), user: newUser });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Signup failed', details: err.message });
  }
});

router.post('/auth/login', async (req: any, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).populate('panchayatId');
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ 
        id: user._id.toString(), 
        role: user.role,
        panchayatId: user.panchayatId ? (user.panchayatId as any)._id?.toString() || user.panchayatId.toString() : undefined 
      }, process.env.JWT_SECRET || 'secret');
      return res.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, panchayat: user.panchayatId } });
    } else {
      const user = req.mockDB.users.find((u: any) => u.email === email);
      if (!user) return res.status(400).json({ message: 'User not found in demo' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
      const token = jwt.sign({
        id: user.id || user._id, 
        role: user.role,
        panchayatId: user.panchayat?._id 
      }, process.env.JWT_SECRET || 'secret');
      return res.json({ token, user });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// --- Complaint Routes ---
router.post('/complaints', authMiddleware, async (req: any, res) => {
  try {
    const { title, description, category, location, media, priority, isAnonymous, isDirectToDM } = req.body;
    const user = (req as any).user;

    // SLA Logic: Resolution within 7 days by default
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + 7);

    if (mongoose.connection.readyState === 1) {
      const complaint = new Complaint({
        title, description, category, location, media,
        priority: isDirectToDM ? 'High' : (priority || 'Medium'),
        citizenId: user.id,
        panchayatId: user.panchayatId,
        status: 'Submitted',
        isAnonymous,
        isDirectToDM,
        slaDeadline
      });
      await complaint.save();
      return res.status(201).json(complaint);
    } else {
      // Demo Mode Fallback
      const newComplaint = {
        _id: 'c_' + Date.now(),
        title, description, category, location, media,
        priority: isDirectToDM ? 'High' : (priority || 'Medium'),
        citizenId: { _id: user.id, name: user.name || 'Demo Citizen' },
        panchayatId: user.panchayat || req.mockDB.panchayats[0],
        status: 'Submitted',
        isAnonymous,
        isDirectToDM,
        createdAt: new Date().toISOString(),
        slaDeadline: slaDeadline.toISOString()
      };
      req.mockDB.complaints.unshift(newComplaint);
      return res.status(201).json(newComplaint);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/complaints', authMiddleware, async (req: any, res) => {
  try {
    const user = (req as any).user;
    
    if (mongoose.connection.readyState === 1) {
      const query: any = {};
      if (user.role === 'citizen') {
        // Citizens see their own AND resolved complaints from their village for verification
        query.$or = [
          { citizenId: user.id },
          { panchayatId: user.panchayatId, status: 'Resolved' }
        ];
      } else if (user.role === 'sachiv') {
        query.panchayatId = user.panchayatId;
      }
      // DM sees all
      const complaints = await Complaint.find(query)
        .populate('citizenId', 'name')
        .sort({ createdAt: -1 });
      return res.json(complaints);
    } else {
      // Demo Mode Fallback
      if (user.role === 'citizen') {
        return res.json(req.mockDB.complaints.filter((c: any) => c.citizenId._id === user.id));
      }
      return res.json(req.mockDB.complaints);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/complaints/:id', authMiddleware, async (req: any, res) => {
  const { status, assignedTo, priority, resolutionProof, feedback, isFlagged, vote } = req.body;
  const user = (req as any).user;

  try {
    if (mongoose.connection.readyState === 1) {
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

      // Handle community voting
      if (vote && complaint.status === 'Resolved') {
        const voteType = vote === 'resolved' ? 'resolved' : 'unresolved';
        if (!complaint.resolutionVotes) {
          complaint.resolutionVotes = { resolved: [], unresolved: [] };
        }
        complaint.resolutionVotes.resolved = (complaint.resolutionVotes.resolved as any).filter((id: any) => id.toString() !== user.id);
        complaint.resolutionVotes.unresolved = (complaint.resolutionVotes.unresolved as any).filter((id: any) => id.toString() !== user.id);
        (complaint.resolutionVotes as any)[voteType].push(user.id);
        await complaint.save();
        return res.json(complaint);
      }

      // Permissions check: Citizens only feedback/voting
      if (user.role === 'citizen' && (status || assignedTo || isFlagged)) {
        return res.status(403).json({ message: 'Insufficient permissions for this action' });
      }

      if (status) complaint.status = status;
      if (assignedTo) complaint.assignedTo = assignedTo;
      if (priority) complaint.priority = priority;
      if (resolutionProof) complaint.resolutionProof = resolutionProof;
      if (feedback) complaint.feedback = feedback;
      if (isFlagged !== undefined) complaint.isFlagged = isFlagged;

      await complaint.save();
      res.json(complaint);
    } else {
      // Demo
      const complaint = req.mockDB.complaints.find((c: any) => c._id === req.params.id);
      if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
      
      Object.assign(complaint, req.body);
      res.json(complaint);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Panchayat Routes ---
router.get('/panchayats', async (req: any, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const panchayats = await Panchayat.find({}, 'name district state');
      return res.json(panchayats);
    }
    res.json(req.mockDB.panchayats);
  } catch (err: any) {
    res.json(req.mockDB.panchayats);
  }
});

router.post('/panchayats', authMiddleware, roleMiddleware(['dm']), async (req, res) => {
  try {
    const panchayat = new Panchayat(req.body);
    await panchayat.save();
    res.status(201).json(panchayat);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
