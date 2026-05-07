import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  cargarDepartamentos,
  crearDepartamento,
  Departamento,
} from "../Services/departamentosService";
import {
  actualizarRolUsuario,
  eliminarUsuarioDeEmpresa,
  obtenerUsuariosDeEmpresa,
  asignarDepartamentoUsuario,
  quitarDepartamentoUsuario,
} from "../Services/empresaService";

export type UsuarioItem = {
  uid: string;
  nombre: string;
  correo: string;
  rol: string;
  idDepartamento?: string;
  nombreDepartamento?: string;
};

export function useGestionUsuarios(user: any, recargarUsuario: any) {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  const [modalDeptoVisible, setModalDeptoVisible] = useState(false);
  const [modalCrearDeptoVisible, setModalCrearDeptoVisible] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioItem | null>(null);

  const [nombreDepto, setNombreDepto] = useState("");
  const [creandoDepto, setCreandoDepto] = useState(false);

  const empresaActiva = useMemo(
    () =>  user?.empresaId || null,
    [ user?.empresaId]
  );

  const esAdmin = user?.rol === "Administrador";

  const cargarUsuarios = useCallback(async () => {
    if (!empresaActiva) return;

    try {
      setLoading(true);

      const data = await obtenerUsuariosDeEmpresa(empresaActiva);

      setUsuarios(
        data.map((u: any) => ({
          uid: u.uid,
          nombre: u.nombre,
          correo: u.correo,
          rol: u.rol,
          idDepartamento: u.idDepartamento,
          nombreDepartamento: u.nombreDepartamento,
        }))
      );
    } catch {
      Alert.alert("Error", "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [empresaActiva]);

  const obtenerDeptos = useCallback(async () => {
    if (!empresaActiva) return;

    try {
      const data = await cargarDepartamentos(empresaActiva);
      setDepartamentos(data);
    } catch {
      setDepartamentos([]);
    }
  }, [empresaActiva]);

  useEffect(() => {
    if (empresaActiva) {
      cargarUsuarios();
      obtenerDeptos();
    }
  }, [empresaActiva, cargarUsuarios, obtenerDeptos]);

  const cambiarRol = (usuario: UsuarioItem) => {
    const nuevoRol = usuario.rol === "Empleado" ? "Jefe" : "Empleado";

    Alert.alert(
      "Cambiar rol",
      `¿Deseas cambiar el rol de ${usuario.nombre} a ${nuevoRol}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await actualizarRolUsuario(usuario.uid, nuevoRol);
              await cargarUsuarios();
              Alert.alert("Éxito", "Rol actualizado correctamente");
            } catch {
              Alert.alert("Error", "No se pudo actualizar el rol");
            }
          },
        },
      ]
    );
  };

  const eliminarUsuario = (usuario: UsuarioItem) => {
    Alert.alert(
      "Eliminar usuario",
      `¿Deseas eliminar a ${usuario.nombre} de esta empresa?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarUsuarioDeEmpresa(usuario.uid);
              await cargarUsuarios();
              Alert.alert("Éxito", "Usuario eliminado");
            } catch {
              Alert.alert("Error", "No se pudo eliminar el usuario");
            }
          },
        },
      ]
    );
  };

  const abrirSelectorDepto = (usuario: UsuarioItem) => {
    if (!esAdmin) {
      Alert.alert(
        "Sin permiso",
        "Solo un Administrador puede asignar departamentos."
      );
      return;
    }

    setUsuarioSeleccionado(usuario);
    setModalDeptoVisible(true);
  };

  const asignarDepartamento = async (depto: Departamento) => {
    if (!usuarioSeleccionado) return;

    try {
      await asignarDepartamentoUsuario(
        usuarioSeleccionado.uid,
        depto.id,
        depto.nombre
      );

      setUsuarios((prev) =>
        prev.map((u) =>
          u.uid === usuarioSeleccionado.uid
            ? {
                ...u,
                idDepartamento: depto.id,
                nombreDepartamento: depto.nombre,
              }
            : u
        )
      );

      if (usuarioSeleccionado.uid === user?.uid) {
        await recargarUsuario(usuarioSeleccionado.uid);
      }

      setModalDeptoVisible(false);
      setUsuarioSeleccionado(null);

      Alert.alert("Listo", "Departamento asignado correctamente");
    } catch {
      Alert.alert("Error", "No se pudo asignar el departamento.");
    }
  };

  const quitarDepartamento = async () => {
    if (!usuarioSeleccionado) return;

    try {
      await quitarDepartamentoUsuario(usuarioSeleccionado.uid);

      setUsuarios((prev) =>
        prev.map((u) =>
          u.uid === usuarioSeleccionado.uid
            ? {
                ...u,
                idDepartamento: undefined,
                nombreDepartamento: undefined,
              }
            : u
        )
      );

      if (usuarioSeleccionado.uid === user?.uid) {
        await recargarUsuario(usuarioSeleccionado.uid);
      }

      setModalDeptoVisible(false);
      setUsuarioSeleccionado(null);

      Alert.alert("Listo", "Departamento removido");
    } catch {
      Alert.alert("Error", "No se pudo remover el departamento.");
    }
  };

  const abrirModalCrearDepto = () => {
    setNombreDepto("");
    setModalCrearDeptoVisible(true);
  };

  const crearDepto = async () => {
    if (!nombreDepto.trim() || !empresaActiva) {
      Alert.alert("Error", "Escribe un nombre válido");
      return;
    }

    setCreandoDepto(true);

    try {
      await crearDepartamento(empresaActiva, nombreDepto.trim());
      await obtenerDeptos();

      setModalCrearDeptoVisible(false);
      setNombreDepto("");

      Alert.alert("Éxito", "Departamento creado correctamente");
    } catch {
      Alert.alert("Error", "No se pudo crear el departamento");
    } finally {
      setCreandoDepto(false);
    }
  };

  const cerrarModalDepto = () => {
    setModalDeptoVisible(false);
    setUsuarioSeleccionado(null);
  };

  const cerrarModalCrearDepto = () => {
    setModalCrearDeptoVisible(false);
    setNombreDepto("");
  };

  return {
    usuarios,
    loading,
    departamentos,

    modalDeptoVisible,
    setModalDeptoVisible,
    modalCrearDeptoVisible,
    setModalCrearDeptoVisible,
    usuarioSeleccionado,

    nombreDepto,
    setNombreDepto,
    creandoDepto,

    esAdmin,

    cargarUsuarios,
    cambiarRol,
    eliminarUsuario,
    abrirSelectorDepto,
    asignarDepartamento,
    quitarDepartamento,
    abrirModalCrearDepto,
    crearDepto,
    cerrarModalDepto,
    cerrarModalCrearDepto,
  };
}