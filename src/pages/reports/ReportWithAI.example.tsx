// Ejemplo: Cómo usar HorizonAiChat con datos de reportes
import { useState } from 'react';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';
import { useGetPurchaseVsSalesReportQuery } from '@/store/api/fin/reportApi';

export const PurchaseVsSalesWithAI = () => {
  const [dateRange, setDateRange] = useState({
    fecha_inicio: '2025-01-01',
    fecha_fin: '2025-12-31'
  });

  // Obtener datos del reporte (usamos el endpoint /fin/report/purchasevssales)
  const { data: reportData, isLoading } = useGetPurchaseVsSalesReportQuery({
    months: 12,
    end_date: dateRange.fecha_fin
  });

  // Preparar datos para la IA (adaptado al formato series)
  const aiReportData = reportData
    ? {
        report_type: 'purchase_vs_sales_series',
        period: `${dateRange.fecha_inicio} al ${dateRange.fecha_fin}`,
        labels: reportData.labels,
        sales: reportData.sales,
        purchases: reportData.purchases,
        summary: {
          total_periods: reportData.labels.length
        }
      }
    : undefined;

  return (
    <div>
      {/* Tu UI de reporte aquí */}
      <h1>Reporte Compras vs Ventas</h1>

      {/* Chat AI con datos del reporte */}
      {!isLoading && (
        <HorizonAiChat
          modules={[]} // Vacío si solo quieres análisis, no navegación
          reportData={aiReportData}
        />
      )}
    </div>
  );
};

// ====================================
// EJEMPLOS DE USO PARA DIFERENTES REPORTES
// ====================================

// 1️⃣ Reporte de Stock por Almacén
export const StockReportWithAI = () => {
  const stockData = [
    { almacen: 'Principal', producto: 'Laptop HP', stock: 15, minimo: 10 },
    { almacen: 'Secundario', producto: 'Mouse Logitech', stock: 5, minimo: 20 }
    // ... más datos
  ];

  const aiData = {
    report_type: 'stock_por_almacen',
    data: stockData,
    alerts: stockData.filter((item) => item.stock < item.minimo)
  };

  return <HorizonAiChat modules={[]} reportData={aiData} />;
};

// 2️⃣ Reporte de Empleados
export const EmployeeReportWithAI = () => {
  const employeeData = {
    report_type: 'empleados',
    total_empleados: 50,
    por_area: [
      { area: 'Ventas', cantidad: 15, salario_promedio: 2500 },
      { area: 'Producción', cantidad: 20, salario_promedio: 2000 },
      { area: 'Administración', cantidad: 15, salario_promedio: 3000 }
    ],
    rotacion_mensual: 0.05
  };

  return <HorizonAiChat modules={[]} reportData={employeeData} />;
};

// 3️⃣ Reporte de Ventas
export const SalesReportWithAI = () => {
  const salesData = {
    report_type: 'ventas',
    period: 'Diciembre 2025',
    total_ventas: 150000,
    total_transacciones: 320,
    ticket_promedio: 468.75,
    top_productos: [
      { nombre: 'Laptop Dell', ventas: 35000, unidades: 25 },
      { nombre: 'iPhone 15', ventas: 28000, unidades: 20 }
    ],
    comparacion_mes_anterior: {
      variacion_porcentaje: 12.5,
      tendencia: 'positiva'
    }
  };

  return <HorizonAiChat modules={[]} reportData={salesData} />;
};

// 4️⃣ Kardex de Producto
export const KardexWithAI = () => {
  const kardexData = {
    report_type: 'kardex',
    producto: 'Laptop HP EliteBook',
    movimientos: [
      { fecha: '2025-12-01', tipo: 'Entrada', cantidad: 20, saldo: 45 },
      { fecha: '2025-12-05', tipo: 'Salida', cantidad: 12, saldo: 33 },
      { fecha: '2025-12-10', tipo: 'Entrada', cantidad: 10, saldo: 43 }
    ],
    stock_actual: 43,
    stock_minimo: 15,
    promedio_salidas_diarias: 3.2
  };

  return <HorizonAiChat modules={[]} reportData={kardexData} />;
};

// ====================================
// PREGUNTAS SUGERIDAS PARA PROBAR
// ====================================

/*
COMPRAS VS VENTAS:
- "¿Qué productos tienen el mejor margen de ganancia?"
- "¿Hay productos con pérdidas?"
- "Dame recomendaciones para mejorar la rentabilidad"

STOCK:
- "¿Qué productos están por debajo del stock mínimo?"
- "¿Qué almacén necesita reabastecimiento urgente?"
- "Analiza los niveles de inventario y dame alertas"

EMPLEADOS:
- "¿Qué área tiene los costos de personal más altos?"
- "¿Es alta la rotación de personal?"
- "Dame recomendaciones para optimizar costos"

VENTAS:
- "¿Cuáles son las tendencias de venta?"
- "¿Qué productos debo promocionar más?"
- "Compara el desempeño con el mes anterior"

KARDEX:
- "¿Cuándo debo reabastecer este producto?"
- "¿El movimiento de inventario es saludable?"
- "Predice cuándo se agotará el stock"
*/
