"use client";
import React, { useEffect, useState } from 'react';
import './Page.css';
//import Dialog from '@mui/material/Dialog';

const Page = () => {
  const [asesores, setAsesores] = useState(Array(15).fill({ Usuario_ID: "", Usuario_Nombre: "", Rol_ID: "", Usuario_Documento: "", Usuario_Correo: "" }));
  const [traidosDeBD, setTraidosDeBD] = useState([]); // Almacenar los datos originales
  const apiEndpoint = "https://td-g-production.up.railway.app/usuario/GetAsesor";
  const getAllUsers = "https://td-g-production.up.railway.app/usuario";

  useEffect(() => {
    fetch(apiEndpoint)
      .then(response => response.json())
      .then(data => {
        const fetchedData = data.slice(0, 15);
        const filledData = fetchedData.concat(Array(15 - fetchedData.length).fill({ Usuario_ID: "", Usuario_Nombre: "", Rol_ID: "", Usuario_Documento: "", Usuario_Correo: "" }));
        setAsesores(filledData);
        // Almacenar los datos originales
        setTraidosDeBD(fetchedData);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleDelete = (index, asesores) => {
    const updatedAsesores = [...asesores];
    updatedAsesores[index] = { Usuario_ID: "", Usuario_Nombre: "", Rol_ID: "", Usuario_Documento: "", Usuario_Correo: "" };
    setAsesores(updatedAsesores);
  };

  const handleInputChange = (index, field, value) => {
    const updatedAsesores = [...asesores];
    updatedAsesores[index] = { ...updatedAsesores[index], [field]: value || null };

    /* Si asesor.Usuario_Documento === null || asesor.Usuario_Nombre === null || asesor.Usuario_Correo === null, volver Usuario_ID: "", Usuario_Nombre: "", Rol_ID: "", Usuario_Documento: "", Usuario_Correo: "" */
    if (updatedAsesores[index].Usuario_Documento === null && updatedAsesores[index].Usuario_Nombre === null && updatedAsesores[index].Usuario_Correo === null) {
      updatedAsesores[index] = { Usuario_ID: "", Usuario_Nombre: "", Rol_ID: "", Usuario_Documento: "", Usuario_Correo: "" };
    }

    setAsesores(updatedAsesores);
  };

  const handleSave = async () => {
    // Identficar registros modificados, para eso, si el asesor tiene Usuario_ID !== "", se comparan los datos originales con los actuales
    const asesoresModificados = asesores.filter((asesor) => {
      if (asesor.Usuario_ID !== "") {
        const asesorOriginal = traidosDeBD.find((asesorOriginal) => asesorOriginal.Usuario_ID === asesor.Usuario_ID);
        return asesor.Usuario_Documento !== asesorOriginal.Usuario_Documento || asesor.Usuario_Nombre !== asesorOriginal.Usuario_Nombre || asesor.Usuario_Correo !== asesorOriginal.Usuario_Correo;
      }
      return true;
    });

    // Identificar registros nuevos
    const asesoresNuevos = asesores.filter(asesor => asesor.Usuario_ID === "" && asesor.Usuario_Documento && asesor.Usuario_Nombre && asesor.Usuario_Correo);

    /* Asesores Eliminados */
    const asesoresEliminados = traidosDeBD.filter((asesorOriginal) => !asesores.some((asesor) => asesor.Usuario_ID === asesorOriginal.Usuario_ID));
    asesoresEliminados.forEach(asesor => {
      if (asesor.Rol_ID === 5) {
        asesor.Rol_ID = 2;
      } else if (asesor.Rol_ID === 3) {
        asesor.Rol_ID = 6;
      }
    });

    const dataToSend = {
      asesoresModificados,
      asesoresNuevos,
      asesoresEliminados
    };

    console.log('Datos enviados al backend:', dataToSend);

    try {
      const response = await fetch('https://backend.dbcpolijic2024.online/usuario/updateUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asesoresModificados: asesoresModificados,
          asesoresNuevos: asesoresNuevos,
          asesoresEliminados: asesoresEliminados
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar cambios');
      }

      console.log('Cambios guardados correctamente');
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  return (


    <div className="ml-6 mr-6 mt-6 border   bg-white border-b flex justify-between">
      <div className='pt-8  pb-8 w-full'>

        <div className='w-full border-b-2 flex items-center sm:items-start justify-center sm:justify-start sm:pl-8 sm:h-22 pb-5 text-center sm:text-left'>
          <h1 className='text-4xl font-bold text-gray-600'>Asesores PPI</h1>
        </div>
        <div className='p-10'>
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-1 px-4 bg-transparent border-gray-200"></th>
                <th className="py-1 px-2 border-b border-gray-200 bg-green-500">Cédula</th>
                <th className="py-1 px-2 border-b border-gray-200 bg-green-500">Nombre</th>
                <th className="py-1 px-2 border-b border-gray-200 bg-green-500">Correo</th>
              </tr>
            </thead>
            <tbody>
              {asesores.map((asesor, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="py-1 px-0.5 border-gray-200 text-center text-sm">
                    {console.log(asesor.Usuario_ID, asesor.Usuario_Documento, asesor.Usuario_Nombre, asesor.Usuario_Correo)}
                    {(asesor.Usuario_ID !== ("" && null) && asesor.Usuario_Documento !== ("" && null) || asesor.Usuario_Nombre !== ("" && null) || asesor.Usuario_Correo !== ("" && null)) ? (
                      <button onClick={() => handleDelete(index, asesores)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-700 text-sm">X</button>
                    )
                      : null
                    }
                  </td>
                  <td className="p-0 border-gray-200">
                    <input
                      type="text"
                      value={asesor.Usuario_Documento || ''}
                      onChange={(e) => handleInputChange(index, 'Usuario_Documento', e.target.value)}
                      className="w-full py-1 px-2 border-gray-200"
                    />
                  </td>
                  <td className="p-0 border-gray-200" style={{ width: "35%" }}>
                    <input
                      type="text"
                      value={asesor.Usuario_Nombre || ''}
                      onChange={(e) => handleInputChange(index, 'Usuario_Nombre', e.target.value)}
                      className="w-full py-1 px-2 border-gray-200"
                    />
                  </td>
                  <td className="p-0 border-gray-200" style={{ width: "45%" }}>
                    <input
                      type="email"
                      value={asesor.Usuario_Correo || ''}
                      onChange={(e) => handleInputChange(index, 'Usuario_Correo', e.target.value)}
                      className="w-full py-1 px-2 border-gray-200"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave} className="mt-2 px-4 py-1 bg-green-500 text-white rounded hover:bg-green-700">Guardar Cambios</button>

        </div>
      </div>
    </div>

  );
};

export default Page;
