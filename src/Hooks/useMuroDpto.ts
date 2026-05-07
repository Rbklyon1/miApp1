import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cargarDepartamentos,
  Departamento,
} from "../Services/departamentosService";
import {
  agregarComentario,
  agregarReaccion,
  crearPublicacion,
  editarPublicacion,
  eliminarComentario,
  eliminarPublicacion,
  obtenerMuroDepartamento,
  Publicacion,
} from "../Services/publicacionesService";

type UserLike = {
  uid: string;
  nombre: string;
  rol?: string;
  empresaId?: string | null;
  idDepartamento?: string | null;
  nombreDepartamento?: string | null;
};

export function useMuroDpto(user: UserLike | null | undefined) {
  const [posts, setPosts] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(false);

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptoSeleccionado, setDeptoSeleccionado] =
    useState<Departamento | null>(null);

  const esAdmin = user?.rol === "Administrador";
  const esJefe = user?.rol === "Jefe";
  const puedePublicar = esAdmin || esJefe;

  const departamentoActual = useMemo(() => {
    if (esAdmin) return deptoSeleccionado?.nombre ?? null;
    return user?.nombreDepartamento ?? null;
  }, [esAdmin, deptoSeleccionado, user?.nombreDepartamento]);

  const departamentoIdActual = useMemo(() => {
    if (esAdmin) return deptoSeleccionado?.id ?? null;
    return user?.idDepartamento ?? null;
  }, [esAdmin, deptoSeleccionado, user?.idDepartamento]);

  const cargarDeptos = useCallback(async () => {
    if (!esAdmin || !user?.empresaId) return;

    const data = await cargarDepartamentos(user.empresaId);
    setDepartamentos(data);

    if (data.length > 0 && !deptoSeleccionado) {
      setDeptoSeleccionado(data[0]);
    }
  }, [esAdmin, user?.empresaId, deptoSeleccionado]);

  const cargarMuro = useCallback(async () => {
    if (!user?.empresaId || !departamentoIdActual) return;

    setLoading(true);
    try {
      const data = await obtenerMuroDepartamento(
        user.empresaId,
        departamentoIdActual
      );
      setPosts(data);
    } finally {
      setLoading(false);
    }
  }, [user?.empresaId, departamentoIdActual]);

  useEffect(() => {
    cargarDeptos();
  }, [cargarDeptos]);

  useEffect(() => {
    cargarMuro();
  }, [cargarMuro]);

  const publicar = async (contenido: string) => {
    if (
      !contenido.trim() ||
      !user?.empresaId ||
      !departamentoActual ||
      !user?.uid
    ) {
      throw new Error("Datos incompletos para publicar");
    }

    await crearPublicacion({
      contenido: contenido.trim(),
      empresaId: user.empresaId,
      tipoMuro: "departamento",
      departamentoId: departamentoIdActual || undefined,
      nombreDepartamento: departamentoActual,
      creadaPor: user.uid,
      nombreUsuario: user.nombre,
      rolUsuario: user.rol || "Empleado",
    });

    await cargarMuro();
  };

  const editar = async (postId: string, contenido: string) => {
    await editarPublicacion(postId, contenido.trim());
    await cargarMuro();
  };

  const eliminar = async (postId: string) => {
    await eliminarPublicacion(postId);
    await cargarMuro();
  };

  const reaccionar = async (
    postId: string,
    tipo: "me_gusta" | "importante" | "celebrar"
  ) => {
    if (!user?.uid || !user?.nombre) return;
    await agregarReaccion(postId, user.uid, user.nombre, tipo);
    await cargarMuro();
  };

  const comentar = async (postId: string, texto: string) => {
    if (!texto.trim() || !user?.uid || !user?.nombre) return;

    await agregarComentario(postId, {
      texto: texto.trim(),
      autorUid: user.uid,
      autorNombre: user.nombre,
    });

    await cargarMuro();
  };

  const eliminarComentarioPost = async (
    postId: string,
    comentarioId: string
  ) => {
    await eliminarComentario(postId, comentarioId);
    await cargarMuro();
  };

  const puedeModificar = (post: Publicacion) => {
    return post.creadaPor === user?.uid || esAdmin;
  };

  return {
    posts,
    loading,
    departamentos,
    deptoSeleccionado,
    setDeptoSeleccionado,

    esAdmin,
    esJefe,
    puedePublicar,
    departamentoActual,
    departamentoIdActual,

    refetch: cargarMuro,
    publicar,
    editar,
    eliminar,
    reaccionar,
    comentar,
    eliminarComentarioPost,
    puedeModificar,
  };
}