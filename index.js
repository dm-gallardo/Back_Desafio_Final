import express from 'express';
import cors from 'cors';
import { addUser , loginUser , getUserById , deleteUser} from './queries/queriesUsuarios.js';
import { addBook , getBookById , deleteBook, getAllBooks} from './queries/queriesLibros.js';
import dotenv from 'dotenv';
import { authenticateJWT , checkAdmin } from './middlewares/middleware.js';
import { newOrder , getOrderById , getAllOrders, getOrderByUser, deleteOrder} from './queries/pedidos.js';
import 'dotenv/config';
import { supabase } from './supabaseClient.js';

dotenv.config();
const app = express();
const PORT = 3000;

// falta la configuracion de el cors

app.use(cors());
app.use(express.json());

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.post('/usuarios', async (req, res) => {
  const { email, password, nombre, apellido} = req.body;
  try {
    await addUser(email, password, nombre, apellido);
    res.status(201).json({ message: 'Usuario agregado con éxito' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const token = await loginUser(email, password);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/usuarios', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/usuarios/:id', authenticateJWT, async (req, res) => {
  const userId = req.params.id;
  const loggedUserId = req.user.id;
  if (parseInt(userId) !== parseInt(loggedUserId)) {
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

app.post('/libros', authenticateJWT, checkAdmin, async (req, res) => {
  const { titulo, autor, editorial, anio_publicacion, genero, descripcion, precio, url_img} = req.body;
  const usuario_id = req.user.id_usuarios || req.user.id;
  try {
    const { error } = await supabase
      .from('libros')
      .insert([{ titulo, autor, editorial, anio_publicacion, genero, descripcion, precio, url_img, usuario_id }]);
    if (error) {
      console.error('Error al insertar libro:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ message: 'Libro agregado con éxito' });
  } catch (error) {
    console.error('Error en /libros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/libros', authenticateJWT, async (req, res) => {
    try {
        const books = await getAllBooks();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/libros/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    try {
        const book = await getBookById(id);
        if (!book) {
            return res.status(404).json({ message: 'Libro no encontrado' });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/libros/:id', authenticateJWT, checkAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de libro inválido' });
    }
    const result = await deleteBook(id);
    if (result === 0) {
      return res.status(404).json({ message: 'libro no encontrado' });
    }
    res.status(200).json({ message: 'libro eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar libro:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.post('/pedidos', authenticateJWT, async (req, res) => {
  const { monto_total, libros } = req.body;
  const usuario_id = req.user.id;
  try {
    const nuevoPedido = await newOrder(monto_total, usuario_id, libros);
    res.status(201).json({
      message: 'Pedido agregado con éxito',
      pedido: nuevoPedido
    });
  } catch (error) {
    console.error('Error al crear pedido:', error.message);
    res.status(500).json({ error: 'Error al crear el pedido.' });
  }
});

app.get('/pedidos', authenticateJWT, checkAdmin, async (req, res) => {
    try {
        const books = await getAllOrders();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.get('/pedidos/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    try {
        const order = await getOrderById(id);
        if (!order) {
            return res.status(404).json({ message: 'pedido no encontrado' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/pedidosUsuario/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    try {
        const order = await getOrderByUser(id);
        if (!order) {
            return res.status(404).json({ message: 'pedido no encontrado' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/pedidos/:id', authenticateJWT, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de pedido inválido' });
    }
    const result = await deleteOrder(id);
    if (result === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.status(200).json({ message: 'Pedido eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    console.error('Error al eliminar pedido:', error);
  }
});

export default app;