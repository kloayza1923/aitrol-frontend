import { KeenIcon } from '@/components';

import { CardAddNew, CardRole } from '@/partials/cards';
import { FetchData } from '@/utils/FetchData';
import { ReactNode, useEffect, useState } from 'react';

interface Badge {
  size: string;
  badge: ReactNode;
  fill: string;
  stroke: string;
}

interface IRolesItem {
  id: number;
  badge: Badge;
  title: string;
  subTitle: string;
  description: string;
  team: string;
  path: string;
}
interface IRolesItems extends Array<IRolesItem> {}

const Roles = () => {
  /*   const items: IRolesItems = [
    {
      badge: {
        size: 'size-[44px]',
        badge: <KeenIcon icon="setting" className="text-1.5xl text-primary" />,
        fill: 'fill-primary-light',
        stroke: 'stroke-primary-clarity'
      },
      title: 'Administrador',
      subTitle: 'Rol predeterminado',
      description: 'Gestiona la configuración del sistema y el acceso de usuarios, asegura la estabilidad del sistema.',
      team: '1 persona',
      path: '/public-profile/profiles/creator'
    },
    {
      badge: {
        size: 'size-[44px]',
        badge: <KeenIcon icon="eye" className="text-1.5xl text-brand" />,
        fill: 'fill-brand-light',
        stroke: 'stroke-brand-clarity'
      },
      title: 'Visor',
      subTitle: 'Rol predeterminado',
      description: 'Puede ver los datos pero no tiene privilegios de edición.',
      team: '32 personas',
      path: '/public-profile/profiles/company'
    },
    {
      badge: {
        size: 'size-[44px]',
        badge: <KeenIcon icon="face-id" className="text-1.5xl text-success" />,
        fill: 'fill-success-light',
        stroke: 'stroke-success-clarity'
      },
      title: 'Desarrollador Remoto',
      subTitle: 'Rol remoto',
      description: 'Brinda asistencia y resuelve consultas e incidencias de los clientes.',
      team: '6 personas',
      path: '/public-profile/profiles/nft'
    },
    {
      badge: {
        size: 'size-[44px]',
        badge: <KeenIcon icon="delivery-24" className="text-1.5xl text-danger" />,
        fill: 'fill-danger-light',
        stroke: 'stroke-danger-clarity'
      },
      title: 'Soporte al Cliente',
      subTitle: 'Rol predeterminado',
      description: 'Brinda asistencia y resuelve consultas e incidencias de los clientes.',
      team: '32 personas',
      path: '/public-profile/profiles/blogger'
    },
    {
      badge: {
        size: 'size-[44px]',
        badge: <KeenIcon icon="chart-line-up-2" className="text-1.5xl text-info" />,
        fill: 'fill-info-light',
        stroke: 'stroke-info-clarity'
      },
      title: 'Gerente de Proyecto',
      subTitle: 'Rol predeterminado',
      description: 'Supervisa los proyectos, asegurando que se entreguen a tiempo y dentro del presupuesto.',
      team: '6 personas',
      path: '/public-profile/profiles/crm'
    },
    {
      badge: {
        size: 'size-[44px]',
        badge: <KeenIcon icon="design-1" className="text-1.5xl text-gray-500" />,
        fill: 'fill-gray-100',
        stroke: 'stroke-gray-300'
      },
      title: 'Diseñador Remoto',
      subTitle: 'Rol remoto',
      description: 'Crea diseños visuales de forma remota para diversos proyectos.',
      team: '6 personas',
      path: '/public-profile/profiles/gamer'
    },
    {
      badge: {
        size: 'size-[44px]',
        badge: <KeenIcon icon="people" className="text-1.5xl text-success" />,
        fill: 'fill-success-light',
        stroke: 'stroke-success-clarity'
      },
      title: 'Gerente de RRHH',
      subTitle: 'Rol predeterminado',
      description: 'Gestiona los recursos humanos, la contratación y las relaciones laborales.',
      team: '1 persona',
      path: '/public-profile/profiles/feeds'
    }
  ]; */
  const [items, setItems] = useState<IRolesItems>([]);
  const fetch_data = async () => {
    const data = await FetchData('roles', 'GET', null);
    const data_formated = data.map((item: any) => {
      return {
        badge: {
          size: 'size-[44px]',
          badge: <KeenIcon icon={item.icono} className="text-1.5xl text-primary" />,
          fill: 'fill-primary-light',
          stroke: 'stroke-primary-clarity'
        },
        title: item.titulo,
        subTitle: item.subtitulo,
        description: item.descripcion,
        team: item.team,
        id: item.id
      };
    });
    console.log(data_formated);
    setItems(data_formated);
  };
  useEffect(() => {
    fetch_data();
  }, []);
  const renderItem = (item: IRolesItem, index: number) => {
    return (
      <CardRole
        key={index}
        title={item.title}
        subTitle={item.subTitle}
        description={item.description}
        team={item.team}
        path={item.path}
        badge={item.badge}
        id={item.id}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
      {items.map((item, index) => {
        return renderItem(item, index);
      })}

      <CardAddNew
        path="/account/members/roles/create"
        size="size-[60px]"
        iconSize="text-2xl"
        title="Agregar Nuevo Rol"
        subTitle="Crear un nuevo rol"
      />
    </div>
  );
};

export { Roles, type IRolesItem, type IRolesItems };
