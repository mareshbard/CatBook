const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  // Obtém o token do cabeçalho Authorization
  const token = req.header('Authorization');

  if (!token) return res.status(401).json({ msg: 'Nenhum token, autorização negada' });

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token não é válido' });
  }
};

module.exports = auth;
