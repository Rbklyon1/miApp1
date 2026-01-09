// import { useEffect, useState } from "react";
// import { useOffline } from "./useOffline";
// import {
//   sincronizarEmpresasPendientes,
//   sincronizarDepartamentosPendientes,
//   hayEmpresasODeptosPendientes,
//   obtenerCantidadEmpresasPendientes,
//   obtenerCantidadDeptosPendientes,
// } from "../api/offlineEmpresaService";
// import { Alert } from "react-native";

// export const useOfflineEmpresas = () => {
//   const { isOnline, isSyncing } = useOffline();
//   const [empresasPending, setEmpresasPending] = useState(0);
//   const [deptosPending, setDeptosPending] = useState(0);
//   const [isSyncingEmpresas, setIsSyncingEmpresas] = useState(false);

//   useEffect(() => {
//     cargarPendientes();

//     if (isOnline && !isSyncing) {
//       sincronizarEmpresas();
//     }
//   }, [isOnline]);

//   const cargarPendientes = async () => {
//     const empresas = await obtenerCantidadEmpresasPendientes();
//     const deptos = await obtenerCantidadDeptosPendientes();
//     setEmpresasPending(empresas);
//     setDeptosPending(deptos);
//   };

//   const sincronizarEmpresas = async () => {
//     if (isSyncingEmpresas) return;

//     try {
//       const hayPendientes = await hayEmpresasODeptosPendientes();
      
//       if (hayPendientes) {
//         console.log("🔄 Iniciando sincronización de empresas y departamentos...");
//         setIsSyncingEmpresas(true);

//         const resultadoEmpresas = await sincronizarEmpresasPendientes();
//         const resultadoDeptos = await sincronizarDepartamentosPendientes();

//         const totalExitosos = resultadoEmpresas.exitosos + resultadoDeptos.exitosos;
//         const totalFallidos = resultadoEmpresas.fallidos + resultadoDeptos.fallidos;

//         if (totalExitosos > 0) {
//           Alert.alert(
//             "✅ Sincronización completada",
//             `${totalExitosos} elemento(s) sincronizado(s).${
//               totalFallidos > 0
//                 ? `\n${totalFallidos} no pudieron sincronizarse.`
//                 : ""
//             }`
//           );
//         }

//         await cargarPendientes();
//       }
//     } catch (error) {
//       console.error("❌ Error sincronizando empresas:", error);
//     } finally {
//       setIsSyncingEmpresas(false);
//     }
//   };

//   return {
//     isOnline,
//     empresasPending,
//     deptosPending,
//     totalPending: empresasPending + deptosPending,
//     isSyncingEmpresas,
//     sincronizarEmpresas,
//   };
// };
import { useEffect, useState } from "react";
import { useOffline } from "./useOffline";
import {
  sincronizarEmpresasPendientes,
  sincronizarDepartamentosPendientes,
  hayEmpresasODeptosPendientes,
  obtenerCantidadEmpresasPendientes,
  obtenerCantidadDeptosPendientes,
} from "../api/offlineEmpresaService";
import { Alert } from "react-native";

export const useOfflineEmpresas = () => {
  const { isOnline, isSyncing } = useOffline();
  const [empresasPending, setEmpresasPending] = useState(0);
  const [deptosPending, setDeptosPending] = useState(0);
  const [isSyncingEmpresas, setIsSyncingEmpresas] = useState(false);

  useEffect(() => {
    cargarPendientes();

    if (isOnline && !isSyncing) {
      sincronizarEmpresas();
    }
  }, [isOnline]);

  const cargarPendientes = async () => {
    const empresas = await obtenerCantidadEmpresasPendientes();
    const deptos = await obtenerCantidadDeptosPendientes();
    setEmpresasPending(empresas);
    setDeptosPending(deptos);
  };

  const sincronizarEmpresas = async () => {
    if (isSyncingEmpresas) return;

    try {
      const hayPendientes = await hayEmpresasODeptosPendientes();
      
      if (hayPendientes) {
        console.log("🔄 Iniciando sincronización de empresas y departamentos...");
        setIsSyncingEmpresas(true);

        const resultadoEmpresas = await sincronizarEmpresasPendientes();
        const resultadoDeptos = await sincronizarDepartamentosPendientes();

        const totalExitosos = resultadoEmpresas.exitosos + resultadoDeptos.exitosos;
        const totalFallidos = resultadoEmpresas.fallidos + resultadoDeptos.fallidos;

        if (totalExitosos > 0) {
          Alert.alert(
            "✅ Sincronización completada",
            `${totalExitosos} elemento(s) sincronizado(s).${
              totalFallidos > 0
                ? `\n${totalFallidos} no pudieron sincronizarse.`
                : ""
            }`
          );
        }

        await cargarPendientes();
      }
    } catch (error) {
      console.error("❌ Error sincronizando empresas:", error);
    } finally {
      setIsSyncingEmpresas(false);
    }
  };

  return {
    isOnline,
    empresasPending,
    deptosPending,
    totalPending: empresasPending + deptosPending,
    isSyncingEmpresas,
    sincronizarEmpresas,
  };
};