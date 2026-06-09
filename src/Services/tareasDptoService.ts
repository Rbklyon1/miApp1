import {
  obtenerTareasDepartamento,
  obtenerTareasAsignadasDepartamento,
  actualizarEstadoTarea,
  eliminarTarea,
} from "./tareasService";

import { cargarDepartamentos } from "./departamentosService";

export const tareasDptoService = {
  cargarDepartamentos,
  obtenerTareasDepartamento,
  obtenerTareasAsignadasDepartamento,
  actualizarEstadoTarea,
  eliminarTarea,
};