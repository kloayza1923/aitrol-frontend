import React, { useState } from 'react';
import { clsx } from 'clsx'; // O tu utilidad de clases

interface AccountNode {
  id: number;
  codigo: string;
  nombre: string;
  saldo_total: number;
  hijos: AccountNode[];
  nivel: number;
}

const AccountRow = ({ node }: { node: AccountNode }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.hijos && node.hijos.length > 0;

  // Formateador de moneda (ajusta a tu locale)
  const currency = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

  return (
    <>
      <tr
        className={clsx('border-b hover:bg-gray-50', node.nivel === 1 && 'font-bold bg-gray-100')}
      >
        <td className="py-2 px-4" style={{ paddingLeft: `${node.nivel * 1.5}rem` }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button onClick={() => setExpanded(!expanded)} className="text-gray-500 text-xs">
                {expanded ? '▼' : '▶'}
              </button>
            )}
            <span>
              {node.codigo} - {node.nombre}
            </span>
          </div>
        </td>
        <td className="py-2 px-4 text-right">{currency.format(node.saldo_total)}</td>
      </tr>
      {expanded &&
        hasChildren &&
        node.hijos.map((child) => <AccountRow key={child.id} node={child} />)}
    </>
  );
};

export default AccountRow;
