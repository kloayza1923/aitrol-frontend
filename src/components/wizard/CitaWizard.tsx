import { useState, useEffect } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNotification } from '@/hooks';
import { FetchData } from '@/utils/FetchData';
import { PersonaStep } from '@/components/wizard/steps/PersonaStep';
import { PacienteStep } from '@/components/wizard/steps/PacienteStep';
import { CitaStep } from '@/components/wizard/steps/CitaStep';

interface PersonaData {
  tipo_identificacion: string;
  identificacion: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  lugar_nacimiento?: string;
  nacionalidad?: string;
  estado_civil?: string;
  direccion?: string;
  telefono_local?: string;
  telefono_movil?: string;
  email?: string;
  grupo_etnico?: string;
}

interface PacienteData {
  tipo_sangre?: string;
  alergias?: any;
  antecedentes?: any;
  nombre_contacto_legal?: string;
  telefono_contacto_legal?: string;
}

interface CitaData {
  personal_id: number;
  fecha_hora: string;
  duracion_minutos: number;
  motivo?: string;
  tipo: string;
  estado: string;
}

interface DoctorOption {
  id: number;
  codigo_personal?: string;
  especialidad?: string;
  disponibilidad?: any;
  raw?: any;
  persona?: {
    nombre_completo?: string;
    identificacion?: string;
    disponibilidad?: any;
  } | null;
}

const STEPS = ['Crear Persona', 'Crear Paciente', 'Programar Cita'];

interface CitaWizardProps {
  onCancel: () => void;
  onSuccess: () => void;
  selectedDateTime?: { start: Date; end: Date } | null;
  doctores: DoctorOption[];
}

export function CitaWizard({ onCancel, onSuccess, selectedDateTime, doctores }: CitaWizardProps) {
  const notification = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePersonaCreate = async (data: PersonaData) => {
    setLoading(true);
    setError(null);
    try {
      await FetchData('/salud/personas', 'POST', data);
      setPersonaData(data);
      setActiveStep(1);
      notification.success('Éxito', 'Persona creada exitosamente');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error al crear la persona';
      setError(errorMsg);
      notification.error('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePacienteCreate = async (data: PacienteData) => {
    if (!personaData) {
      setError('Datos de persona no disponibles');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // First, get the persona ID by identificacion
      const personasResponse = await FetchData('/salud/personas', 'GET', {
        search: personaData.identificacion,
        page: 1,
        limit: 10
      });

      const createdPersona = personasResponse.items?.find(
        (p: any) => p.identificacion === personaData.identificacion
      );

      if (!createdPersona) {
        throw new Error('No se encontró la persona creada');
      }

      const pacientePayload = {
        persona_id: createdPersona.id,
        ...data
      };

      const response = await FetchData('/salud/pacientes', 'POST', pacientePayload);
      setPacienteId(response.id || response.paciente_id);
      setActiveStep(2);
      notification.success('Éxito', 'Paciente creado exitosamente');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error al crear el paciente';
      setError(errorMsg);
      notification.error('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCitaCreate = async (citaData: CitaData) => {
    if (!pacienteId) {
      setError('ID de paciente no disponible');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        paciente_id: pacienteId,
        ...citaData
      };

      await FetchData('/salud/citas', 'POST', payload);
      notification.success('Éxito', 'Cita creada exitosamente');
      onSuccess();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error al crear la cita';
      setError(errorMsg);
      notification.error('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError(null);
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Crear Cita Médica - Nuevo Paciente
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ minHeight: '400px' }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px'
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeStep === 0 && (
              <PersonaStep onCreatePersona={handlePersonaCreate} isLoading={loading} />
            )}
            {activeStep === 1 && personaData && (
              <PacienteStep
                personaData={personaData}
                onCreatePaciente={handlePacienteCreate}
                isLoading={loading}
              />
            )}
            {activeStep === 2 && (
              <CitaStep
                onCreateCita={handleCitaCreate}
                isLoading={loading}
                selectedDateTime={selectedDateTime}
                doctores={doctores}
              />
            )}
          </>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          mt: 4,
          pt: 2,
          borderTop: '1px solid #eee'
        }}
      >
        <Button onClick={onCancel} variant="outlined">
          Cancelar
        </Button>
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            disabled={loading}
          >
            Atrás
          </Button>
        )}
      </Box>
    </Paper>
  );
}
