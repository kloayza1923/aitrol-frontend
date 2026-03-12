import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';

// Componente principal
const FormUser = () => {
  return (
    <Fragment>
      <Container>
        <h1>Formulario de eliminación de cuenta</h1>
        <p>Si deseas eliminar tu cuenta, por favor completa el siguiente formulario:</p>
        <form action="/api/delete-account" method="POST">
          <label htmlFor="username">Nombre de usuario:</label>
          <input type="text" id="username" name="username" required />

          <label htmlFor="password">Contraseña:</label>
          <input type="password" id="password" name="password" required />

          <button type="submit">Eliminar cuenta</button>
        </form>
        <p>Al eliminar tu cuenta, se borrarán todos tus datos y no podrás recuperarlos.</p>
      </Container>
    </Fragment>
  );
};

export { FormUser };
