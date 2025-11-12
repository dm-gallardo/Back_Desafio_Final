import jwt from 'jsonwebtoken';
import { pool } from '../database/pool.js';
import { supabase } from '../supabaseClient.js';

//middleware para verificar el JWT

authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader)
      return res.status(403).json({ message: 'Token requerido' });

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    // Verificar token con Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(403).json({ message: 'Token no válido', error: error?.message });
    }

    // Guardamos el usuario en la request
    req.user = data.user;

    next();
  } catch (err) {
    console.error('Error en authenticateSupabase:', err);
    return res.status(500).json({ message: 'Error interno en autenticación', error: err.message });
  }
};


// Middleware para verificar si el usuario es admin

checkAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id; // ID del usuario autenticado desde Supabase

    if (!userId) {
      return res.status(400).json({ message: 'Token inválido: falta el ID del usuario' });
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('admin')
      .eq('id_usuarios', userId)
      .maybeSingle();

    if (error) throw error;
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.admin) {
      return res.status(403).json({
        message: 'Acceso denegado: se requieren privilegios de administrador',
      });
    }

    next();
  } catch (err) {
    console.error('Error en checkAdmin:', err);
    return res.status(500).json({ message: 'Error interno en autenticación', error: err.message });
  }
};

export { authenticateJWT, checkAdmin };