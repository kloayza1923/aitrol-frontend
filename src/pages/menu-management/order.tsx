import { Container } from '@/components/container';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FetchData } from '@/utils/FetchData';
import {
  Button,
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as MuiIcons from '@mui/icons-material';
import {
  DragIndicator,
  Save,
  ArrowBack,
  ExpandMore,
  ChevronRight,
  FolderOpen,
  Folder
} from '@mui/icons-material';

interface MenuItem {
  id: number;
  parent_menu_id: number | null;
  title: string;
  icon?: string;
  path?: string;
  heading?: string;
  status: number;
  orden: number;
  children?: MenuItem[];
}

interface SortableItemProps {
  item: MenuItem;
  level: number;
  children?: MenuItem[];
  expanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
}

const SortableItem = ({
  item,
  level,
  children,
  expanded,
  onToggle,
  hasChildren
}: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (MuiIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent fontSize="small" />;
  };

  // Calcular borde izquierdo basado en el nivel
  const getLeftBorder = () => {
    if (level === 0) return 'none';
    if (level === 1) return '3px solid';
    if (level === 2) return '3px solid';
    return '3px solid';
  };

  const getBorderColor = () => {
    if (level === 1) return 'primary.main';
    if (level === 2) return 'secondary.main';
    return 'info.main';
  };

  // Calcular etiqueta de nivel
  const getLevelLabel = () => {
    if (level === 0) return null;
    if (level === 1) return 'Submenú';
    if (level === 2) return 'Sub-submenú';
    return `Nivel ${level + 1}`;
  };

  return (
    <Box style={style}>
      <Paper
        ref={setNodeRef}
        elevation={isDragging ? 4 : 0}
        sx={{
          p: 2,
          mb: 1,
          ml: level * 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: isDragging ? 'grabbing' : 'grab',
          border: '1px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderLeft: getLeftBorder(),
          borderLeftColor: level > 0 ? getBorderColor() : 'divider',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          position: 'relative',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.light',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transform: 'translateX(4px)'
          }
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            sx={{ p: 0.5 }}
          >
            {expanded ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        ) : (
          <Box
            sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {level === 0 ? (
              <Folder fontSize="small" sx={{ color: 'text.disabled' }} />
            ) : (
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'divider' }} />
            )}
          </Box>
        )}

        <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', p: 0.5 }}>
          <DragIndicator />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          {item.icon && (
            <Box
              sx={{
                color: level === 0 ? 'primary.main' : level === 1 ? 'secondary.main' : 'info.main',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {renderIcon(item.icon)}
            </Box>
          )}
          <Typography
            variant="body1"
            sx={{ fontWeight: level === 0 ? 600 : level === 1 ? 500 : 400 }}
          >
            {item.title}
          </Typography>
          {item.heading && (
            <Chip label={item.heading} size="small" variant="outlined" color="info" />
          )}
          {getLevelLabel() && (
            <Chip
              label={getLevelLabel()}
              size="small"
              variant="filled"
              color={level === 1 ? 'primary' : level === 2 ? 'secondary' : 'default'}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
            Orden: {item.orden}
          </Typography>
          <Chip
            label={item.status === 1 ? 'Activo' : 'Inactivo'}
            size="small"
            color={item.status === 1 ? 'success' : 'default'}
          />
        </Box>
      </Paper>
    </Box>
  );
};

const OrderMenu = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    setLoading(true);
    try {
      const data = await FetchData('/menu', 'GET', {
        limit: 1000
      });
      if (data) {
        // Ordenar por orden descendente
        const sorted = [...data].sort((a, b) => (b.orden || 0) - (a.orden || 0));
        setMenuItems(sorted);

        // Expandir todos los menús que tienen hijos (recursivamente)
        const itemsWithChildren = sorted
          .filter((item: MenuItem) =>
            sorted.some((child: MenuItem) => child.parent_menu_id === item.id)
          )
          .map((item: MenuItem) => item.id);
        setExpandedItems(new Set(itemsWithChildren));
      }
    } catch (error) {
      console.error('Error cargando menús:', error);
      setMessage({ type: 'error', text: 'Error al cargar los menús' });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (itemId: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Construir árbol jerárquico
  const buildMenuTree = (): MenuItem[] => {
    const parentMenus = menuItems.filter((item) => !item.parent_menu_id);
    return parentMenus.sort((a, b) => (b.orden || 0) - (a.orden || 0));
  };

  const getChildren = (parentId: number): MenuItem[] => {
    return menuItems
      .filter((item) => item.parent_menu_id === parentId)
      .sort((a, b) => (b.orden || 0) - (a.orden || 0));
  };

  const hasChildren = (itemId: number): boolean => {
    return menuItems.some((item) => item.parent_menu_id === itemId);
  };

  // Función recursiva para renderizar el árbol completo
  const renderMenuTree = (items: MenuItem[], level: number = 0): React.ReactNode => {
    return items.map((item) => {
      const children = getChildren(item.id);
      const isExpanded = expandedItems.has(item.id);
      const itemHasChildren = children.length > 0;

      return (
        <Box key={item.id}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <SortableItem
              item={item}
              level={level}
              expanded={isExpanded}
              onToggle={() => toggleExpand(item.id)}
              hasChildren={itemHasChildren}
            />
          </SortableContext>

          {/* Renderizar hijos recursivamente */}
          {itemHasChildren && (
            <Collapse in={isExpanded} timeout="auto">
              <Box sx={{ ml: 2, mt: 1 }}>{renderMenuTree(children, level + 1)}</Box>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setMenuItems((items) => {
      const activeItem = items.find((item) => item.id === active.id);
      const overItem = items.find((item) => item.id === over.id);

      if (!activeItem || !overItem) return items;

      // Solo permitir reorganizar entre items del mismo nivel (mismo parent)
      if (activeItem.parent_menu_id !== overItem.parent_menu_id) {
        console.log('⚠️ No se puede mover entre diferentes niveles');
        return items;
      }

      console.log(`🔄 Moviendo "${activeItem.title}" (orden: ${activeItem.orden})`);

      // Obtener items del mismo nivel
      const sameLevel = items.filter((item) => item.parent_menu_id === activeItem.parent_menu_id);
      const otherItems = items.filter((item) => item.parent_menu_id !== activeItem.parent_menu_id);

      const oldIndex = sameLevel.findIndex((item) => item.id === active.id);
      const newIndex = sameLevel.findIndex((item) => item.id === over.id);

      console.log(`Índice: ${oldIndex} → ${newIndex}`);

      const reorderedSameLevel = arrayMove(sameLevel, oldIndex, newIndex);

      // Recalcular orden para items del mismo nivel
      // Usar un número base alto para evitar colisiones
      const baseOrden = 10000 + (activeItem.parent_menu_id || 0) * 1000;
      const updatedSameLevel = reorderedSameLevel.map((item, index) => {
        const newOrden = baseOrden + (reorderedSameLevel.length - index) * 10;
        console.log(`  - ${item.title}: orden ${item.orden} → ${newOrden}`);
        return {
          ...item,
          orden: newOrden
        };
      });

      // Combinar y devolver
      const result = [...otherItems, ...updatedSameLevel].sort(
        (a, b) => (b.orden || 0) - (a.orden || 0)
      );
      console.log(
        '✅ Nuevo estado de menús:',
        result.map((m) => `${m.title} (${m.orden})`)
      );
      return result;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Preparar datos para enviar
      const updates = menuItems.map((item) => ({
        id: item.id,
        orden: item.orden
      }));

      console.log('📤 Enviando actualizaciones:', updates);
      console.log('Total de items a actualizar:', updates.length);

      // Llamar al endpoint para actualizar el orden
      const response = await FetchData('/menu/batch-update-orden', 'PUT', { updates });

      console.log('✅ Respuesta del servidor:', response);

      setMessage({
        type: 'success',
        text: `Orden actualizado correctamente (${updates.length} items)`
      });

      // Recargar menús después de 1.5 segundos
      setTimeout(() => {
        console.log('🔄 Recargando menús...');
        loadMenus();
      }, 1500);
    } catch (error) {
      console.error('❌ Error guardando orden:', error);
      setMessage({ type: 'error', text: 'Error al guardar el orden: ' + (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Ordenar Menús
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Arrastra y suelta los elementos para cambiar su orden
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/menu-management')}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Orden'}
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: 'transparent',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Box>{renderMenuTree(buildMenuTree())}</Box>
        </DndContext>

        {menuItems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No hay menús disponibles
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          <Typography variant="body2">
            💡 <strong>Tips:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • Los elementos con mayor orden aparecen primero en el menú
            <br />
            • Solo puedes reordenar elementos del mismo nivel (mismo padre)
            <br />
            • Soporta múltiples niveles: Menú → Submenú → Sub-submenú, etc.
            <br />
            • Haz clic en las flechas (▶/▼) para expandir/colapsar los submenús
            <br />
            • Arrastra un elemento hacia arriba para darle mayor prioridad
            <br />• Los colores y etiquetas indican el nivel de profundidad
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default OrderMenu;
