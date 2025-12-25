import express from 'express';
import FamilyController from '../controllers/FamilyController.js';

const router = express.Router();

// Family Management Routes
router.post('/add-member', FamilyController.addFamilyMember);
router.get('/members', FamilyController.getFamilyMembers);
router.delete('/remove-member', FamilyController.removeFamilyMember);
router.put('/settings', FamilyController.updateFamilySettings);
router.get('/sakhi-users', FamilyController.getSakhiUsers);
router.get('/dashboard-data', FamilyController.getFamilyDashboardData);
router.post('/verify-email', FamilyController.verifyFamilyEmail);

export default router;