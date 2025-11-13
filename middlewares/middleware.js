import jwt from 'jsonwebtoken';
import { pool } from '../database/pool.js';
import { supabase } from '../supabaseClient.js';

const authenticateJWT = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).json({ message: 'Token requerido' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token no válido', error: err.message });
    }

    req.user = decoded;
    next();
  });

};

const checkAdmin = async (req, res, next) => {
  try {
    // Toma el ID del token, sea 'id_usuarios' o 'id'
    const id_usuarios = req.user.id_usuarios || req.user.id;

    if (!id_usuarios) {
      return res.status(400).json({ message: 'Token inválido: falta el ID del usuario' });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('admin')
      .eq('id_usuarios', id_usuarios)
      .maybeSingle();

    if (error) {
      console.error('Error consultando Supabase:', error);
      return res.status(500).json({ message: 'Error al consultar Supabase', error: error.message });
    }

    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!data.admin) {
      return res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
    }

    next();
  } catch (err) {
    console.error('Error en checkAdmin:', err);
    return res.status(500).json({ message: 'Error interno en autenticación', error: err.message });
  }
};

export { authenticateJWT, checkAdmin };