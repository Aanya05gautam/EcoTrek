import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createHouseholdDisposal, listHouseholdDisposals } from '../controllers/householdDisposalController.js';

const router = Router();
router.get('/', auth, listHouseholdDisposals);
router.post('/', auth, createHouseholdDisposal);

export default router;