const asyncHandler = require('../utils/asyncHandler');
const { getProfile, login, register, updateProfile } = require('../services/authService');
const { required } = require('../validators/validate');

const signup = (role) =>
  asyncHandler(async (req, res) => {
    required(req.body, ['fullName', 'email', 'password']);
    const result = await register(req.body, role, req);
    res.status(201).json({ success: true, data: result });
  });

const signin = (role) =>
  asyncHandler(async (req, res) => {
    required(req.body, ['email', 'password']);
    const result = await login({ ...req.body, role });
    res.json({ success: true, data: result });
  });

const me = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user.id);
  res.json({ success: true, data: user });
});

const patchMe = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, req.body, req.user.id, req);
  res.json({ success: true, data: user });
});

module.exports = { me, patchMe, signin, signup };
