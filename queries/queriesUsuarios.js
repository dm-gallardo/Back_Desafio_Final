import { pool } from '../database/pool.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabaseClient.js';

// Función para agregar un usuario

const addUser = async (email, password, nombre) => {
  if (!email || !password || !nombre) {
    throw new Error('Todos los campos son requeridos');
  }

  try {
    // 1️⃣ Verificar si el correo ya existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado en la DB');
    }

    // 2️⃣ Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3️⃣ Insertar el nuevo usuario
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert([
        {
          email,
          password: hashedPassword,
          nombre
        }
      ])
      .select('*')
      .single();

    if (insertError) throw insertError;

    // 4️⃣ Devolver el usuario creado
    return newUser;

  } catch (error) {
    throw new Error('Error al agregar usuario: ' + error.message);
  }
};

//-------------------------------------------------------------------------------------------------------------

// Función para autenticar un usuario y generar un token JWT

const loginUser = async (email, password) => {

    // Validar que se proporcionen email y password

    if (!email || !password) {
        throw new Error('El correo electrónico y la contraseña son requeridos');
    }

    // Buscar el usuario por email

    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const values = [email];

    try {
        const result = await pool.query(query, values);
        const user = result.rows[0]; // Obtener usuario encontrado (ya que el email es único)

        // Verificar si el usuario existe

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // Comparar la contraseña proporcionada con la almacenada (usando bcrypt)

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Contraseña incorrecta');
        }

        // Generar el token JWT

        const token = jwt.sign(
        { id_usuarios: user.id_usuarios, 
            email: user.email, 
            nombre: user.nombre, 
            admin: user.admin 
        },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        return token; // Devuelve el token JWT generado

    } catch (error) {
        throw new Error('Error al iniciar sesión: ' + error.message);
    }
};

//-------------------------------------------------------------------------------------------------------------
// Función rapida para obtener los datos del usuario por su ID

const getUserById = async (userId) => {
    const query = 'SELECT id, email, nombre FROM usuarios WHERE id = $1';
    const values = [userId];

    try {
        const result = await pool.query(query, values);
        return result.rows[0]; // Retorna el usuario encontrado
    } catch (error) {
        throw new Error('Error al obtener los datos del usuario: ' + error.message);
    }
};

//-------------------------------------------------------------------------------------------------------------

const deleteUser = async (id_usuarios) => {
    
    const query = 'DELETE FROM usuarios WHERE id_usuarios = $1';
    const values = [id_usuarios];
    
    try {
        const result = await pool.query(query, values);
        return result.rowCount;
    } catch (error) {
        throw new Error('Error al eliminar el usuario: ' + error.message);
    }
};

export { addUser, loginUser, getUserById, deleteUser };