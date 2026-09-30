import User from '../models/User.js';
import { memoryStore } from '../services/store.js';

const mongo = () => User.db?.readyState === 1;

export async function listUsers(req, res) {
  if (mongo()) {
    const users = await User.find({}, 'name email role ecoPoints createdAt').sort({ createdAt: -1 }).lean();
    return res.json(users);
  }

  res.json(memoryStore.users.map(({ password, ...user }) => user));
}

export async function updateUserRole(req, res) {
  const { role } = req.body;
  if (!['Citizen', 'Admin'].includes(role)) {
    return res.status(400).json({ message: 'Role must be Citizen or Admin.' });
  }
  if (req.params.id === req.user.id && role !== 'Admin') {
    return res.status(400).json({ message: 'You cannot remove your own administrator access.' });
  }

  if (mongo()) {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, projection: 'name email role ecoPoints createdAt' }).lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json(user);
  }

  const user = memoryStore.users.find(item => item.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.role = role;
  const { password, ...safeUser } = user;
  res.json(safeUser);
}
