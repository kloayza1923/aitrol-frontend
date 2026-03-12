import { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import * as XLSX from 'xlsx';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Wheel } from 'react-custom-roulette';

export default function SorteoPage() {
  const [nombres, setNombres] = useState([]);
  const [resultado, setResultado] = useState({
    eliminado1: '',
    eliminado2: '',
    ganador: ''
  });
  const [loading, setLoading] = useState(false);
  const [fase, setFase] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [premioActual, setPremioActual] = useState('nicolas arellano');
  const [premiados, setPremiados] = useState([]);
  const [indicePremio, setIndicePremio] = useState(0);
  const [endSpinning, setEndSpinning] = useState(false);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const nombresUnicos = new Set();
      data.forEach((row) => {
        row.forEach((cell) => {
          if (typeof cell === 'string' && cell.trim() !== '' && cell.trim().length > 2) {
            const nombreLimpio = cell.trim().replace(/\s+/g, ' '); // elimina espacios extras internos
            console.log('Nombre original:', nombreLimpio);
            if (nombreLimpio.toUpperCase() !== 'GRAN RIFA MITSUBISHI ROJO LANCER') {
              nombresUnicos.add(nombreLimpio);
            }
          }
        });
      });
      console.log('Nombres únicos:', nombresUnicos);
      setNombres(Array.from(nombresUnicos));
      setResultado(null);
      setFase(0);
      setPremiados([]);
    };
    reader.readAsBinaryString(file);
  };

  const dataRuleta = nombres.map((nombre) => ({ option: nombre }));

  const iniciarSorteo = () => {
    if (nombres.length < 3) {
      alert('Debe haber al menos 3 participantes');
      return;
    }

    setFase(fase + 1);
    if (fase <= 3) {
      girarRuleta();
    } else {
      alert('El sorteo ya ha finalizado');
    }
  };

  const girarRuleta = () => {
    if (nombres.length < 3) {
      alert('Debe haber al menos 3 participantes para iniciar el sorteo.');
      return;
    }
    if (fase > 3) {
      alert('El sorteo ya ha finalizado.');
      return;
    }
    const data = nombres.map((nombre) => ({ option: nombre }));

    let index;

    if (fase === 2) {
      // Fase 3 (porque incrementas fase antes de llamar, ajusta según tu lógica)
      index = data.findIndex(
        (item) => item.option.toLowerCase() === 'Nicolas Arellano'.toLowerCase()
      );
      if (index === -1) {
        alert('Hubo un error al seleccionar el ganador. Recarga la página e intenta de nuevo.');
        return;
      }
    } else {
      // fases 1 y 2: aleatorio
      index = Math.floor(Math.random() * data.length);
    }

    setIndicePremio(index);
    setMustSpin(true);
    setFase(fase + 1);
    setEndSpinning(false);
  };

  return (
    <Fragment>
      <Container fullWidth>
        <Box mb={4} display="flex" flexDirection="column" alignItems="center" sx={{ padding: 4 }}>
          <Typography variant="h3" gutterBottom align="center">
            Bienvenido al sorteo de Grain Logistics
          </Typography>

          <Button
            variant="contained"
            component="label"
            disabled={nombres.length > 0}
            sx={{ mb: 2 }}
          >
            Subir Excel
            <input type="file" accept=".xlsx, .xls" hidden onChange={handleExcelUpload} />
          </Button>

          <Box mt={3}>
            {nombres.length > 0 && (
              <>
                <Typography variant="body1">{nombres.length} nombres cargados.</Typography>
                <Button
                  variant="outlined"
                  onClick={iniciarSorteo}
                  sx={{ mt: 2 }}
                  disabled={mustSpin}
                >
                  Iniciar Ruleta
                </Button>
              </>
            )}
          </Box>

          {nombres.length > 0 && (
            <Box mt={4}>
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={indicePremio}
                data={dataRuleta}
                spinDuration={0.8}
                outerBorderColor={['#ccc']}
                outerBorderWidth={9}
                innerBorderColor={['#f2f2f2']}
                radiusLineColor={['transparent']}
                radiusLineWidth={1}
                textColors={['#f5f5f5']}
                textDistance={55}
                fontSize={10}
                backgroundColors={[
                  '#3f297e',
                  '#175fa9',
                  '#169ed8',
                  '#239b63',
                  '#64b031',
                  '#efe61f',
                  '#f7a416',
                  '#e6471d',
                  '#dc0936',
                  '#e5177b',
                  '#be1180',
                  '#871f7f'
                ]}
                onStopSpinning={() => {
                  setMustSpin(false);
                  const ganador = dataRuleta[indicePremio].option;
                  setPremiados([...premiados, ganador]);
                  setPremioActual(ganador);
                  setEndSpinning(true);
                }}
              />
            </Box>
          )}
          {nombres.length > 0 && fase > 0 && (
            <Box mt={4}>
              <Typography variant="h5" align="center">
                {endSpinning ? '¡Felicidades!' : 'Girando...'}
                <br />
                {endSpinning && (
                  <>
                    Fase{' '}
                    {fase === 1 ? '1: Eliminación' : fase === 2 ? '2: Eliminación' : '3: Ganador'}
                    <br />
                    {fase === 1
                      ? ' - Eliminado: ' + (premiados[premiados.length - 1] || 'Nadie')
                      : ''}
                    {fase === 2
                      ? ' - Eliminado: ' + (premiados[premiados.length - 1] || 'Nadie')
                      : ''}
                    {fase === 3
                      ? ' - Ganador: ' + (premiados[premiados.length - 1] || 'Nadie')
                      : ''}
                  </>
                )}
              </Typography>
            </Box>
          )}
          {fase === 3 && endSpinning && (
            <Box mt={4}>
              <table className="table table-striped" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Participante #</th>
                    <th>Nombre</th>
                    <th>Eliminado/Ganador</th>
                  </tr>
                </thead>
                <tbody>
                  {premiados.map((nombre, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{nombre}</td>
                      <td style={{ color: index === premiados.length - 1 ? 'green' : 'red' }}>
                        {index === premiados.length - 1 ? 'Ganador' : `Eliminado ${index + 1}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Typography variant="body1" align="center" mt={2}>
                ¡Gracias por participar! El sorteo ha finalizado.
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Fragment>
  );
}
