import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { addUser , loginUser , getUserById , deleteUser} from './queries/queries.js';
import dotenv from 'dotenv';
import { pool } from './database/pool.js';

dotenv.config();
const app = express();
const PORT = 3000;

// Configurar CORS y el middleware para parsear JSON no se le agrega ruta a mi cors ya que tengo varios dominios locales y me da error si le agrego una ruta

app.use(cors());
app.use(express.json());

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Middleware para verificar el JWT 

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
    const { id_usuarios } = req.user; // viene del token

    if (!id_usuarios) {
      return res.status(400).json({ message: 'Token inválido: falta el ID del usuario' });
    }

    const result = await pool.query(
      'SELECT admin FROM usuarios WHERE id_usuarios = $1',
      [id_usuarios]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { admin } = result.rows[0];

    if (!admin) {
      return res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
    }
    next();

  } catch (err) {
    console.error('Error en checkAdmin:', err);
    return res.status(500).json({ message: 'Error interno en autenticación', error: err.message });
  }
};

// RUTA POST

app.post('/usuarios', async (req, res) => {
  const { email, password, nombre, apellido } = req.body;
  try {
    await addUser(email, password, nombre, apellido);
    res.status(201).json({ message: 'Usuario agregado con éxito' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta POST para login

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const token = await loginUser(email, password); // Usar la función de login
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta GET

app.get('/usuarios', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.user; // El userId viene del JWT

    // Obtener el usuario de la base de datos por el ID

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Responder con los datos del usuario
    res.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta GET por ID

app.get('/usuarios/:id', authenticateJWT, async (req, res) => {
  const userId = req.params.id;
  const loggedUserId = req.user.userId;


  //validar que el userId del token sea igual al userId de la ruta
  if (userId !== loggedUserId) {
    return res.status(403).json({ message: 'No tienes permiso para acceder a este usuario' }); 
  }

  try {
      const user = await getUserById(userId);
      if (!user) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json(user);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Ruta DELETE

app.delete('/usuarios/:id', authenticateJWT, checkAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const result = await deleteUser(id);

    if (result === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario eliminado con éxito' });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});