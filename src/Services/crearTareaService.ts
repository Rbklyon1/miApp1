import {
  obtenerUsuariosDeEmpresa,
  obtenerUsuariosPorDepartamento,
} from "./empresaService";
import { cargarDepartamentos } from "./departamentosService";
import { crearTarea } from "./tareasService";

export const crearTareaService = {
  obtenerUsuariosDeEmpresa,
  obtenerUsuariosPorDepartamento,
  cargarDepartamentos,
  crearTarea,
};