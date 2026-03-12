type ClinicalBadgeNode = {
  type: "clinicalBadge";
  attrs?: {
    kind?: string;
    refId?: number | null;
    label?: string;
    meta?: Record<string, unknown> | null;
  };
};

type DocNode = {
  type?: string;
  content?: DocNode[];
  attrs?: Record<string, unknown>;
};

export type ExtractedClinicalData = {
  diagnosticos: Array<{
    diagnostico_id: number;
    tipo_diagnostico?: string | null;
    observaciones?: string | null;
  }>;
  receta_detalle: Array<{
    producto_id: number;
    medicamento_id?: number | null;
    dosis?: string | null;
    via?: string | null;
    frecuencia?: string | null;
    duracion?: string | null;
    cantidad?: number | null;
    indicaciones?: string | null;
  }>;
  ordenes_laboratorio: Array<{
    tipo_solicitud?: string | null;
    prioridad?: string | null;
    observaciones?: string | null;
  }>;
  ordenes_imagenologia: Array<{
    estudio: string;
    prioridad?: string | null;
    observaciones?: string | null;
  }>;
};

export function extractClinicalData(doc: DocNode): ExtractedClinicalData {
  const data: ExtractedClinicalData = {
    diagnosticos: [],
    receta_detalle: [],
    ordenes_laboratorio: [],
    ordenes_imagenologia: [],
  };

  const walk = (node: DocNode) => {
    if (node.type === "clinicalBadge") {
      const badge = node as ClinicalBadgeNode;
      const kind = badge.attrs?.kind;
      if (kind === "cie" && badge.attrs?.refId) {
        data.diagnosticos.push({
          diagnostico_id: badge.attrs.refId,
          tipo_diagnostico: (badge.attrs.meta?.tipo_diagnostico as string) || "PRINCIPAL",
          observaciones: (badge.attrs.meta?.observaciones as string) || null,
        });
      }
      if (kind === "med" && badge.attrs?.meta) {
        const meta = badge.attrs.meta as Record<string, unknown>;
        data.receta_detalle.push({
          producto_id: (meta.producto_id as number) || 0,
          medicamento_id: (meta.medicamento_id as number) || null,
          dosis: (meta.dosis as string) || null,
          via: (meta.via as string) || null,
          frecuencia: (meta.frecuencia as string) || null,
          duracion: (meta.duracion as string) || null,
          cantidad: (meta.cantidad as number) || null,
          indicaciones: (meta.indicaciones as string) || null,
        });
      }
      if (kind === "lab" && badge.attrs?.meta) {
        const meta = badge.attrs.meta as Record<string, unknown>;
        data.ordenes_laboratorio.push({
          tipo_solicitud: (meta.tipo_solicitud as string) || null,
          prioridad: (meta.prioridad as string) || null,
          observaciones: (meta.observaciones as string) || null,
        });
      }
      if (kind === "rx" && badge.attrs?.meta) {
        const meta = badge.attrs.meta as Record<string, unknown>;
        data.ordenes_imagenologia.push({
          estudio: (meta.estudio as string) || "",
          prioridad: (meta.prioridad as string) || null,
          observaciones: (meta.observaciones as string) || null,
        });
      }
    }

    if (node.content) {
      node.content.forEach(walk);
    }
  };

  walk(doc);
  return data;
}
