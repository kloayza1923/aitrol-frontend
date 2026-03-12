#!/usr/bin/env node

/**
 * Script para generar automáticamente routes.config.ts desde AppRoutingSetup.tsx
 * 
 * Uso: node scripts/generate-routes.js
 * 
 * El script:
 * 1. Lee AppRoutingSetup.tsx
 * 2. Extrae todos los <Route path="/..." /> 
 * 3. Genera un archivo routes.config.ts actualizado
 */

const fs = require('fs');
const path = require('path');

const ROUTING_FILE = path.join(__dirname, '../src/routing/AppRoutingSetup.tsx');
const OUTPUT_FILE = path.join(__dirname, '../src/config/routes.config.ts');

function extractRoutes() {
  try {
    // Leer el archivo de routing
    const content = fs.readFileSync(ROUTING_FILE, 'utf8');

    // Regex para encontrar: <Route path="/..." element={<Component />} />
    const routeRegex = /<Route\s+path=["']([^"']+)["']/g;
    
    const routes = new Set();
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      const path = match[1];
      // Ignorar rutas especiales
      if (!path.includes(':') && path !== '*') {
        routes.add(path);
      }
    }

    return Array.from(routes).sort();
  } catch (error) {
    console.error('❌ Error leyendo archivo:', error.message);
    process.exit(1);
  }
}

function generateRouteConfigObject(paths) {
  const routeObjects = paths.map(routePath => {
    // Generar título desde el path
    const title = routePath
      .split('/')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Determinar ícono basado en keywords
    let icon = '';
    if (routePath.includes('order')) icon = 'book';
    else if (routePath.includes('client')) icon = 'user';
    else if (routePath.includes('inventory') || routePath.includes('products')) icon = 'package';
    else if (routePath.includes('vehicle')) icon = 'car';
    else if (routePath.includes('financial') || routePath.includes('cash')) icon = 'money';
    else if (routePath.includes('employee') || routePath.includes('rh') || routePath.includes('user')) icon = 'user';
    else if (routePath.includes('accounting') || routePath.includes('diario')) icon = 'chart';
    else if (routePath.includes('health')) icon = 'heart';

    const obj = `  {
    path: '${routePath}',
    title: '${title}'${icon ? `,\n    icon: '${icon}'` : ''}
  }`;

    return obj;
  });

  return routeObjects.join(',\n');
}

function generateConfigFile(routeObjects) {
  const template = `/**
 * AUTO-GENERADA POR: scripts/generate-routes.js
 * 
 * Generada: ${new Date().toISOString()}
 * 
 * ⚠️ NOTA: Este archivo es auto-generado
 * Para cambios manuales, edita AppRoutingSetup.tsx y ejecuta nuevamente:
 * node scripts/generate-routes.js
 */

export const APP_ROUTES: Array<{
  path: string;
  title: string;
  icon?: string;
  parent_path?: string;
}> = [
${routeObjects}
];

/**
 * Para actualizar después de agregar nuevas rutas:
 * 1. Agrega la ruta en AppRoutingSetup.tsx
 * 2. Ejecuta: node scripts/generate-routes.js
 * 3. Revisa los cambios (especialmente los parent_path que requieren ajuste manual)
 */
`;

  return template;
}

function main() {
  console.log('🔍 Extrayendo rutas de AppRoutingSetup.tsx...');
  
  const paths = extractRoutes();
  
  if (paths.length === 0) {
    console.error('❌ No se encontraron rutas');
    process.exit(1);
  }

  console.log(`✅ Se encontraron ${paths.length} rutas`);
  
  const routeObjects = generateRouteConfigObject(paths);
  const configContent = generateConfigFile(routeObjects);

  try {
    fs.writeFileSync(OUTPUT_FILE, configContent);
    console.log(`✅ Archivo generado: ${OUTPUT_FILE}`);
    console.log('\n📝 Rutas generadas:');
    paths.slice(0, 10).forEach(p => console.log(`   - ${p}`));
    if (paths.length > 10) {
      console.log(`   ... y ${paths.length - 10} más`);
    }
    
    console.log('\n⚠️  NOTA: Revisa parent_path manualmente si es necesario');
    
  } catch (error) {
    console.error('❌ Error escribiendo archivo:', error.message);
    process.exit(1);
  }
}

main();
