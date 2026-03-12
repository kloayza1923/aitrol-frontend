import { KeenIcon, MenuIcon, MenuItem, MenuLink, MenuSub, MenuTitle } from '@/components';
import { FetchData } from '@/utils/FetchData';
import { useNavigate } from 'react-router';

const DropdownCardItem1 = (id: number) => {
  const navigate = useNavigate();
  const handleDelete = async () => {
    if (!id) {
      return;
    }
    const data = await FetchData(`roles/${id}`, 'DELETE', null);
    console.log(data);
    window.location.reload();
  };
  return (
    <MenuSub className="menu-default" rootClassName="w-full max-w-[175px]">
      <MenuItem path="#">
        <MenuLink>
          <MenuIcon>
            <KeenIcon icon="document" />
          </MenuIcon>
          <MenuTitle>Editar</MenuTitle>
        </MenuLink>
      </MenuItem>
      <MenuItem path="#" onClick={handleDelete}>
        <MenuLink>
          <MenuIcon>
            <KeenIcon icon="share" />
          </MenuIcon>
          <MenuTitle>Eliminar</MenuTitle>
        </MenuLink>
      </MenuItem>
    </MenuSub>
  );
};

export { DropdownCardItem1 };
