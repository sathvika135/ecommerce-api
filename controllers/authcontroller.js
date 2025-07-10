const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({ username, password, role });
    await user.save();

    res.json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  console.log(' Login attempt:', username);
  console.log(' Found user in DB:', user);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  console.log(' Password matches:', isMatch);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token, user: { username: user.username, role: user.role } });
};
