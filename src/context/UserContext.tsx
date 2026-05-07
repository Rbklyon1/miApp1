import React, { createContext, ReactNode, useContext, useState } from "react";
import { obtenerUsuarioPorUid } from "../Services/usuarioService";

export interface User {
  uid: string;
  nombre: string;
  correo: string;
  rol?: string;
  empresaId?: string;
  empresaNombre?: string;
  empresaSeleccionada?: string;
  idDepartamento?: string;
  nombreDepartamento?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  limpiarEmpresa: () => void;
  limpiarUsuario: () => void;
  recargarUsuario: (uid: string) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  updateUser: () => {},
  limpiarEmpresa: () => {},
  limpiarUsuario: () => {},
  recargarUsuario: async () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const limpiarEmpresa = () => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            empresaId: undefined,
            empresaNombre: undefined,
          }
        : prev
    );
  };

  const limpiarUsuario = () => {
    setUser(null);
  };

  const recargarUsuario = async (uid: string) => {
    try {
      const data = await obtenerUsuarioPorUid(uid);
      if (!data) {
        return;
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              nombre: data.nombre || prev.nombre,
              correo: data.correo || prev.correo,
              rol: data.rol || prev.rol,
              empresaId: data.empresaId || prev.empresaId,
              empresaNombre: data.empresaNombre || prev.empresaNombre,
              idDepartamento: data.idDepartamento,
              nombreDepartamento: data.nombreDepartamento,
            }
          : prev
      );

      console.log(
        "✅ Usuario recargado con departamento:",
        data.nombreDepartamento
      );
    } catch (error) {
      console.error("❌ Error recargando usuario:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        limpiarEmpresa,
        limpiarUsuario,
        recargarUsuario,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
