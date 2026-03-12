import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';

// Componente principal
const PrivacyManagement = () => {
  return (
    <Fragment>
      <Container>
        <h1>Política de Privacidad</h1>
        <p>
          Esta política de privacidad describe cómo recopilamos, usamos y protegemos la información
          de los usuarios de nuestra aplicación.
        </p>
        <h2>1. Introducción</h2>
        <p>
          Nos comprometemos a proteger la privacidad de nuestros usuarios. Esta política se aplica a
          todos los datos recopilados a través de nuestra aplicación.
        </p>
        <p>
          Al utilizar nuestra aplicación, usted acepta la recopilación y uso de su información de
          acuerdo con esta política.
        </p>
        <h2>2. Datos Recopilados</h2>
        <p>Nuestra aplicación solo recopila los siguientes datos de los usuarios:</p>
        <ul>
          <li>Nombre de usuario</li>
          <li>Contraseña</li>
        </ul>
        <p>Estos datos son necesarios para la autenticación y acceso a la aplicación.</p>

        <h2>3. Uso de la Información</h2>
        <p>La información recopilada se utiliza exclusivamente para:</p>
        <ul>
          <li>Permitir el inicio de sesión y acceso a la aplicación.</li>
          <li>Mantener la seguridad de la cuenta del usuario.</li>
        </ul>

        <h2>4. Seguridad de los Datos</h2>
        <p>
          Implementamos medidas de seguridad adecuadas para proteger la información de los usuarios
          y evitar accesos no autorizados.
        </p>

        <h2>5. Compartición de Datos</h2>
        <p>No compartimos, vendemos ni transferimos la información del usuario a terceros.</p>

        <h2>6. Derechos del Usuario</h2>
        <p>
          Los usuarios pueden solicitar la eliminación de su cuenta y datos en cualquier momento,
          contactando con el soporte de la aplicación.
        </p>

        <h2>7. Cambios en la Política de Privacidad</h2>
        <p>
          Nos reservamos el derecho de modificar esta política en cualquier momento. Cualquier
          cambio será notificado a los usuarios a través de la aplicación.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Para cualquier consulta sobre esta política, los usuarios pueden comunicarse con nuestro
          equipo de soporte.
        </p>
      </Container>
    </Fragment>
  );
};

export { PrivacyManagement };
