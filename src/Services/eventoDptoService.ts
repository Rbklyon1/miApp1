import {
  obtenerEventosDepartamento,
  obtenerEventosAsignadosDepartamento,
  actualizarEstadoAsistencia,
  eliminarEvento,
} from "../Services/eventosService";
import { cargarDepartamentos } from "../Services/departamentosService";

export const eventosDeptoService = {
  cargarDepartamentos,
  obtenerEventosDepartamento,
  obtenerEventosAsignadosDepartamento,
  actualizarEstadoAsistencia,
  eliminarEvento,
};
