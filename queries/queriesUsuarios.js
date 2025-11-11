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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

  } catch (error) {
    throw new Error('Error al agregar usuario: ' + error.message);
  }
};

//-------------------------------------------------------------------------------------------------------------

// Función para autenticar un usuario y generar un token JWT

const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error('El correo electrónico y la contraseña son requeridos');
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Contraseña incorrecta');
    }
    const token = jwt.sign(
      {
        id: user.id_usuarios,
        email: user.email,
        nombre: user.nombre,
        admin: user.admin || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return { token };

  } catch (error) {
    throw new Error('Error al iniciar sesión: ' + error.message);
  }
};

//-------------------------------------------------------------------------------------------------------------
// Función rapida para obtener los datos del usuario por su ID

const getUserById = async (userId) => {
  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id_usuarios, email, nombre')
      .eq('id_usuarios', userId)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;

  } catch (error) {
    throw new Error('Error al obtener los datos del usuario: ' + error.message);
  }
};

//-------------------------------------------------------------------------------------------------------------

const deleteUser = async (id_usuarios) => {
  try {
    const { error, count } = await supabase
      .from('usuarios')
      .delete({ count: 'exact' })
      .eq('id_usuarios', id_usuarios);
    if (error) throw error;
    return count;
  } catch (error) {
    throw new Error('Error al eliminar el usuario: ' + error.message);
  }
};

export { addUser, loginUser, getUserById, deleteUser };