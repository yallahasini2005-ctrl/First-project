const express = require('express');
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const { BLOOD_GROUPS, clean, validPhone } = require('../utils/validation');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const status = clean(req.query.status);
    let query = supabase.from('emergency_requests').select('id, requester_id, patient_name, blood_group, units_needed, hospital, city, contact_phone, needed_by, notes, status, created_at, app_users!emergency_requests_requester_id_fkey(full_name)').order('created_at', { ascending: false }).limit(100);
    if (['open', 'fulfilled', 'cancelled'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ requests: (data || []).map(r => ({ ...r, requester_name: r.app_users?.full_name || 'Community member', app_users: undefined })) });
  } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const patient_name = clean(req.body.patient_name);
    const blood_group = clean(req.body.blood_group);
    const units_needed = Number(req.body.units_needed);
    const hospital = clean(req.body.hospital);
    const city = clean(req.body.city);
    const contact_phone = clean(req.body.contact_phone);
    const needed_by = clean(req.body.needed_by);
    const notes = clean(req.body.notes);
    if (patient_name.length < 2 || patient_name.length > 80) return res.status(400).json({ error: 'Patient name must contain 2 to 80 characters.' });
    if (!BLOOD_GROUPS.includes(blood_group)) return res.status(400).json({ error: 'Choose a valid blood group.' });
    if (!Number.isInteger(units_needed) || units_needed < 1 || units_needed > 10) return res.status(400).json({ error: 'Units needed must be a whole number from 1 to 10.' });
    if (hospital.length < 2 || hospital.length > 120 || city.length < 2 || city.length > 80) return res.status(400).json({ error: 'Enter a valid hospital and city.' });
    if (!validPhone(contact_phone)) return res.status(400).json({ error: 'Enter a valid contact phone number.' });
    if (!needed_by || Number.isNaN(Date.parse(needed_by))) return res.status(400).json({ error: 'Enter a valid date and time needed.' });
    if (Date.parse(needed_by) < Date.now() - 60000) return res.status(400).json({ error: 'Needed-by time cannot be in the past.' });
    if (notes.length > 500) return res.status(400).json({ error: 'Notes must be 500 characters or fewer.' });
    const { data, error } = await supabase.from('emergency_requests').insert({ requester_id: req.user.id, patient_name, blood_group, units_needed, hospital, city, contact_phone, needed_by: new Date(needed_by).toISOString(), notes: notes || null }).select('*').single();
    if (error) throw error;
    res.status(201).json({ request: data, message: 'Emergency request published.' });
  } catch (err) { next(err); }
});
router.patch('/:id/status', async (req, res, next) => {
  try {
    const status = clean(req.body.status);
    if (!['open', 'fulfilled', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid request status.' });
    const { data, error } = await supabase.from('emergency_requests').update({ status }).eq('id', req.params.id).eq('requester_id', req.user.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Request not found, or you do not have permission to update it.' });
    res.json({ request: data, message: 'Request status updated.' });
  } catch (err) { next(err); }
});
module.exports = router;
