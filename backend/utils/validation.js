const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const clean = (value) => typeof value === 'string' ? value.trim() : '';
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value) => /^[0-9+()\-\s]{7,20}$/.test(value);
module.exports = { BLOOD_GROUPS, clean, validEmail, validPhone };
