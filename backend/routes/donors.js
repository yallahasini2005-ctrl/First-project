const express = require('express');
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const { BLOOD_GROUPS, clean, validPhone } = require('../utils/validation');
const router = express.Router();
router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('donor_profiles').select('*').eq('user_id', req.user.id).maybeSingle();
    if (error) throw error;
    res.json({ donor: data });
  } catch (err) { next(err); }
});
router.put('/me', async (req, res, next) => {
  try {
    const blood_group = clean(req.body.blood_group);
    const city = clean(req.body.city);
    const phone = clean(req.body.phone);
    const available = req.body.available === true;
    const last_donation_date = req.body.last_donation_date || null;
    if (!BLOOD_GROUPS.includes(blood_group)) return res.status(400).json({ error: 'Choose a valid blood group.' });
    if (city.length < 2 || city.length > 80) return res.status(400).json({ error: 'City must contain 2 to 80 characters.' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Enter a valid phone number.' });
    if (last_donation_date && !/^\d{4}-\d{2}-\d{2}$/.test(last_donation_date)) return res.status(400).json({ error: 'Last donation date must be a valid date.' });
    const { data, error } = await supabase.from('donor_profiles').upsert({ user_id: req.user.id, blood_group, city, phone, available, last_donation_date }, { onConflict: 'user_id' }).select('*').single();
    if (error) throw error;
    res.json({ donor: data, message: 'Donor profile saved.' });
  } catch (err) { next(err); }
});
router.get('/', async (req, res, next) => {
  try {
    const bloodGroup = clean(req.query.blood_group);
    const city = clean(req.query.city);
    const availableOnly = req.query.available !== 'false';
    let query = supabase.from('donor_profiles').select('id, user_id, blood_group, city, available, last_donation_date, updated_at, app_users!inner(full_name)').order('updated_at', { ascending: false }).limit(100);
    if (BLOOD_GROUPS.includes(bloodGroup)) query = query.eq('blood_group', bloodGroup);
    if (city) query = query.ilike('city', `%${city.replace(/[%_,]/g, '')}%`);
    if (availableOnly) query = query.eq('available', true);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ donors: (data || []).map(d => ({ id: d.id, user_id: d.user_id, full_name: d.app_users.full_name, blood_group: d.blood_group, city: d.city, available: d.available, last_donation_date: d.last_donation_date, updated_at: d.updated_at })) });
  } catch (err) { next(err); }
});
module.exports = router;
