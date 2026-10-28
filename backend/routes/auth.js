const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { clean, validEmail, validPhone } = require('../utils/validation');
const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.full_name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
}
router.post('/register', async (req, res, next) => {
  try {
    const full_name = clean(req.body.full_name);
    const email = clean(req.body.email).toLowerCase();
    const phone = clean(req.body.phone);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (full_name.length < 2 || full_name.length > 80) return res.status(400).json({ error: 'Name must contain 2 to 80 characters.' });
    if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Enter a valid contact number (at least 7 characters).'});
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ error: 'Password must be 8+ characters and include uppercase, lowercase, number, and special character.' });
    const password_hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase.from('app_users').insert({ full_name, email, phone, password_hash }).select('id, full_name, email, phone, created_at').single();
    if (error?.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    if (error) throw error;
    res.status(201).json({ token: makeToken(data), user: data });
  } catch (err) { next(err); }
});
router.post('/login', async (req, res, next) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!validEmail(email) || !password) return res.status(400).json({ error: 'Enter your email and password.' });
    const { data: user, error } = await supabase.from('app_users').select('id, full_name, email, phone, password_hash, created_at').eq('email', email).maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Incorrect email or password.' });
    const safeUser = { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone, created_at: user.created_at };
    res.json({ token: makeToken(safeUser), user: safeUser });
  } catch (err) { next(err); }
});
module.exports = router;
