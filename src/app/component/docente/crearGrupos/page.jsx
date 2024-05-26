"use client";
import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import CryptoJS from 'crypto-js';

function Page() {
  const [asignaturas, setAsignaturas] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {

        const usuarioNest = localStorage.getItem('U2FsdGVkX1');
        const bytes = CryptoJS.AES.decrypt(usuarioNest, 'PPIITYTPIJC');
        const NestOriginal = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
        const asignaturasResponse = await fetch(
          "https://td-g-production.up.railway.app/usuario-asignatura/GroupsDocente/" + NestOriginal.id
        ).then((res) => res.json());
        setAsignaturas(asignaturasResponse);
        setLoading(false);

        console.log(asignaturasResponse);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setError("Error al obtener datos.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (selectedGrupo) {
    return (
      <GrupoDetail grupo={selectedGrupo} setSelectedGrupo={setSelectedGrupo} />
    );
  }

  return (
    <div className="ml-6 mr-6 mt-6 border   bg-white border-b flex justify-between">
      <div className='pt-8  pb-8 w-full'>
        <div className='  h-22 pb-2 flex-col  border-b-2 flex justify-between items-center'>
          <div className='text-center'>
            <h1 className='ml-5 text-4xl font-bold text-gray-600'>Asignaturas</h1>
          </div>
        </div>
        <div className='p-10'>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {asignaturas.map((asignatura, index) => (
              <div
                key={index}
                className="border-2 rounded-lg p-4 shadow-lg cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedGrupo(asignatura)}
              >
                <h2 className="text-lg font-semibold">
                  {asignatura.Asignatura_Nombre}
                </h2>
                <p className="text-gray-600">Grupo: {asignatura.Grupo_Codigo}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >


  );
}

function GrupoDetail({ grupo, setSelectedGrupo }) {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [repeatedTeams, setRepeatedTeams] = useState({});
  const [teamList, setTeamList] = useState([]);
  const [showAddStudentPopup, setShowAddStudentPopup] = useState(false);
  const [otherStudents, setOtherStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          "https://td-g-production.up.railway.app/usuario/StudentSemester"
        );
        const data = await response.json();

        const filteredStudents = data
          .filter(
            (student) =>
              student.Asignatura_Nombre === grupo.Asignatura_Nombre &&
              student.Grupo_Codigo === grupo.Grupo_Codigo
          )
          .map((student) => ({
            ...student,
            Usuario_Nombre: formatStudentName(student.Usuario_Nombre),
          }));

        // Fetch consecutivos for students
        const consecutivosResponse = await fetch(
          "https://td-g-production.up.railway.app/usuario-asignatura/Consecutivos"
        );
        const consecutivosData = await consecutivosResponse.json();

        const studentsWithConsecutivos = filteredStudents.map((student) => {
          const consecutivo = consecutivosData.find(
            (con) => con.Usuario_Documento === student.Usuario_Documento
          );
          return {
            ...student,
            equipo: consecutivo ? consecutivo.Consecutivo : null,
          };
        });

        setStudents(studentsWithConsecutivos);
      } catch (error) {
        console.error("Error al obtener estudiantes:", error);
        setError("Error al obtener estudiantes.");
      }
    };
    fetchStudents();
  }, [grupo]);

  const handleSort = () => {
    const sortedStudents = [...students].sort((a, b) => {
      const equipoA = isNaN(parseInt(a.equipo)) ? Infinity : parseInt(a.equipo);
      const equipoB = isNaN(parseInt(b.equipo)) ? Infinity : parseInt(b.equipo);

      if (equipoA === Infinity && equipoB === Infinity) {
        return 0;
      }
      if (equipoA === Infinity) {
        return 1;
      }
      if (equipoB === Infinity) {
        return -1;
      }
      return equipoA - equipoB;
    });
    setStudents(sortedStudents);
  };

  const handleEquipoChange = (index, value) => {
    if (value !== "" && parseInt(value) === 0) {
      alert("El número de equipo no puede ser 0.");
      return;
    }

    const newStudents = [...students];
    newStudents[index].equipo = value === "" ? null : value;
    setStudents(newStudents);

    const equipoCounts = newStudents.reduce((acc, student) => {
      if (
        student.equipo !== null &&
        student.equipo !== "" &&
        !isNaN(student.equipo)
      ) {
        acc[student.equipo] = (acc[student.equipo] || 0) + 1;
      }
      return acc;
    }, {});

    const newRepeatedTeams = {};
    for (const [equipo, count] of Object.entries(equipoCounts)) {
      if (count > 3) {
        newRepeatedTeams[equipo] = true;
      }
    }
    setRepeatedTeams(newRepeatedTeams);
  };

  const validateTeams = () => {
    for (const student of students) {
      if (!student.equipo || parseInt(student.equipo) === 0) {
        alert(
          "Todos los campos de equipo deben estar llenos y no pueden ser 0."
        );
        return false;
      }
    }

    const equipoCounts = students.reduce((acc, student) => {
      if (
        student.equipo !== null &&
        student.equipo !== "" &&
        !isNaN(student.equipo)
      ) {
        acc[student.equipo] = (acc[student.equipo] || 0) + 1;
      }
      return acc;
    }, {});
    for (const count of Object.values(equipoCounts)) {
      if (count > 3) {
        alert("Un número de equipo no puede repetirse más de 3 veces.");
        return false;
      }
    }

    return true;
  };

  const handleReportTeams = () => {
    setShowPopup(true);
  };

  async function handleConfirm(confirmed) {
    setShowPopup(false);
    if (confirmed) {
      if (validateTeams()) {
        try {
          const response = await fetch(
            "https://td-g-production.up.railway.app/equipo-usuarios/GetAllGroups"
          );
          const data = await response.json();

          let maxEquipoCodigo = 0;
          const asignaturaSemestrePrefix = parseInt(grupo.Asignatura_Semestre);
          for (const team of data) {
            const codigoEquipo = parseInt(team.Codigo_Equipo);
            if (
              codigoEquipo
                .toString()
                .startsWith(asignaturaSemestrePrefix.toString())
            ) {
              if (codigoEquipo > maxEquipoCodigo) {
                maxEquipoCodigo = codigoEquipo;
              }
            }
          }

          let newEquipoCodigo;
          if (maxEquipoCodigo === 0) {
            newEquipoCodigo = asignaturaSemestrePrefix * 100;
          } else {
            newEquipoCodigo = maxEquipoCodigo + 1;
          }

          const equiposList = {};
          students.forEach((student) => {
            if (student.equipo) {
              if (!equiposList[student.equipo]) {
                equiposList[student.equipo] = [];
              }
              equiposList[student.equipo].push(student.Usuario_ID);
            }
          });

          const newTeams = Object.entries(equiposList).map(
            ([codigoEquipo, usuarios]) => ({
              Codigo_Equipo: newEquipoCodigo++,
              Usuario_ID: usuarios,
            })
          );

          const createResponse = await fetch(
            "https://td-g-production.up.railway.app/equipo-usuarios/CreateGroups",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(newTeams),
            }
          );

          if (createResponse.ok) {
            setTeamList(newTeams);
          } else {
            alert("Error al crear los equipos:", error);
          }
        } catch (error) {
          console.error("Error al crear los equipos:", error);
          alert("Error al crear los equipos.");
        }
      }
    } else {
      console.log("No se confirmaron los equipos");
    }
  }

  const handleSaveTable = async () => {
    const dataToSend = students.map((student) => ({
      Usuario_ID: student.Usuario_ID,
      Consecutivo: student.equipo || null,
    }));

    try {
      const response = await fetch(
        "https://td-g-production.up.railway.app/usuario-asignatura/update-consecutivos",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (response.ok) {
        alert("Tabla guardada exitosamente.");
      } else {
        alert("Error al guardar la tabla.");
      }
    } catch (error) {
      console.error("Error al guardar la tabla:", error);
      alert("Error al guardar la tabla.");
    }
  };

  const handleAddStudent = async () => {
    setShowAddStudentPopup(true);
    try {
      const response = await fetch(
        "https://td-g-production.up.railway.app/usuario/StudentSemester"
      );
      const data = await response.json();

      const otherGroupStudents = data
        .filter(
          (student) =>
            student.Asignatura_Nombre === grupo.Asignatura_Nombre &&
            student.Grupo_Codigo !== grupo.Grupo_Codigo
        )
        .map((student) => ({
          ...student,
          Usuario_Nombre: formatStudentName(student.Usuario_Nombre),
        }));

      setOtherStudents(otherGroupStudents);
    } catch (error) {
      console.error("Error al obtener estudiantes de otros grupos:", error);
      setError("Error al obtener estudiantes de otros grupos.");
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  const handleConfirmAddStudent = async () => {
    if (selectedStudent) {
      try {
        // Agregar el estudiante al grupo
        const addStudentResponse = await fetch(
          "https://td-g-production.up.railway.app/usuario-asignatura/update-grupo",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              Usuario_ID: selectedStudent.Usuario_ID,
              Grupo_Codigo: grupo.Grupo_Codigo,
            }),
          }
        );

        if (!addStudentResponse.ok) {
          throw new Error("Error al agregar el estudiante al grupo.");
        }

        const updateData = [
          { Usuario_ID: selectedStudent.Usuario_ID, Consecutivo: null },
        ];

        // Actualizar el consecutivo del estudiante
        const updateConsecutivoResponse = await fetch(
          "https://td-g-production.up.railway.app/usuario-asignatura/update-consecutivos",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }
        );

        if (!updateConsecutivoResponse.ok) {
          throw new Error("Error al actualizar el consecutivo del estudiante.");
        }

        // Si todo fue exitoso
        setShowAddStudentPopup(false);
        setSelectedStudent(null);
        // Refresh the student list
        const fetchStudents = async () => {
          try {
            const response = await fetch(
              "https://td-g-production.up.railway.app/usuario/StudentSemester"
            );
            const data = await response.json();

            const filteredStudents = data
              .filter(
                (student) =>
                  student.Asignatura_Nombre === grupo.Asignatura_Nombre &&
                  student.Grupo_Codigo === grupo.Grupo_Codigo
              )
              .map((student) => ({
                ...student,
                Usuario_Nombre: formatStudentName(student.Usuario_Nombre),
              }));

            setStudents(filteredStudents);
          } catch (error) {
            console.error("Error al obtener estudiantes:", error);
            setError("Error al obtener estudiantes.");
          }
        };
        fetchStudents();
      } catch (error) {
        console.error("Error:", error.message);
        alert("Error: " + error.message);
      }
    }
  };
  const handleCancelAddStudent = () => {
    setShowAddStudentPopup(false);
    setSelectedStudent(null);
  };

  return (


    <div className="ml-6 mr-6 mt-6 border   bg-white border-b flex justify-between">
      <div className='pt-8  pb-8 w-full'>
        <div className='  h-22 pb-2 flex-col  border-b-2 flex justify-between items-center'>
          <div className="flex items-center mb-4">
            <button
              onClick={() => setSelectedGrupo(null)}
              className="p-2 bg-red-500 text-white rounded mr-2"
            >
              <FiArrowLeft />
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              Grupo {grupo.Grupo_Codigo} - {grupo.Asignatura_Nombre}
            </h1>
          </div>
        </div>
        <div className='p-10'>
          <div className="flex items-center mb-4">
            Numere los integrantes de un mismo equipo, por ejemplo:<br />
            Estudiantes A, B, C como Equipo 1.<br />Estudiantes D, E, F como Equipo 2.
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <table className="min-w-full bg-white border border-collapse">
            <thead>
              <tr>
                <th className="py-1 px-2 border">Cédula</th>
                <th className="py-1 px-2 border">Estudiante</th>
                <th className="py-1 px-2 border" style={{ width: "20%" }}>
                  Numeración de Equipos
                  <svg
                    onClick={handleSort}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    color="#000000"
                    fill="none"
                    className="cursor-pointer inline-block ml-1"
                  >
                    <path d="M6 20L18 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    <path d="M12 16V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M16 12C16 12 13.054 16 12 16C10.9459 16 8 12 8 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.Usuario_ID}>
                  <td className="py-1 text-xs px-2 border text-center">
                    {student.Usuario_Documento}
                  </td>
                  <td className="py-1 text-xs px-2 border" style={{ width: "55%" }}>
                    {student.Usuario_Nombre}
                  </td>
                  <td
                    className={`py-1 text-xs px-2 border ${repeatedTeams[student.equipo] ? "bg-red-200" : ""
                      }`}
                  >
                    <input
                      type="number"
                      value={student.equipo || ""}
                      onChange={(e) => handleEquipoChange(index, e.target.value)}
                      className="border rounded p-1 text-xs w-full text-center"
                      min="1"
                      style={{
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-start mt-4">
            <button
              onClick={handleAddStudent}
              className="bg-blue-500 text-xs text-white py-2 px-4 rounded flex items-center"
            >
              <FiPlus className="mr-2" />
              Agregar Estudiante
            </button>
          </div>
          {showAddStudentPopup && (
            <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-500 bg-opacity-50">
              <div className="bg-white p-6 rounded shadow-md max-h-80 overflow-y-auto">
                <h2 className="text-lg font-bold mb-4">Seleccionar Estudiante</h2>
                <table className="min-w-full bg-white border border-collapse mb-4">
                  <thead>
                    <tr>
                      <th className="py-1 px-2 border">Cédula</th>
                      <th className="py-1 px-2 border">Nombre</th>
                      <th className="py-1 px-2 border">Grupo</th>
                      <th className="py-1 px-2 border">Seleccionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherStudents.map((student) => (
                      <tr key={student.Usuario_ID}>
                        <td className="py-1 text-xs px-2 border text-center">
                          {student.Usuario_Documento}
                        </td>
                        <td className="py-1 text-xs px-2 border">
                          {student.Usuario_Nombre}
                        </td>
                        <td className="py-1 text-xs px-2 border text-center">
                          {student.Grupo_Codigo}
                        </td>
                        <td className="py-1 text-xs px-2 border text-center">
                          <button
                            onClick={() => handleSelectStudent(student)}
                            className={`py-1 px-2 rounded ${selectedStudent &&
                              selectedStudent.Usuario_ID === student.Usuario_ID
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200"
                              }`}
                          >
                            {selectedStudent &&
                              selectedStudent.Usuario_ID === student.Usuario_ID
                              ? "Seleccionado"
                              : "Seleccionar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-center">
                  <button
                    onClick={handleConfirmAddStudent}
                    className="bg-green-500 text-white py-2 px-4 rounded mr-2"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={handleCancelAddStudent}
                    className="bg-red-500 text-white py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSaveTable}
              className="bg-green-500 text-white py-2 px-4 rounded mr-2"
            >
              Guardar Tabla
            </button>
            <button
              onClick={handleReportTeams}
              className="bg-red-800 text-white py-2 px-4 rounded"
            >
              Reportar Equipos
            </button>
          </div>
          {showPopup && (
            <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-500 bg-opacity-50">
              <div className="bg-white p-6 rounded shadow-md">
                <p className="mb-4">Una vez reportados los equipos, no tendrás forma realizar modificaciones. ¿Estás seguro de querer reportar los equipos?</p>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleConfirm(true)}
                    className="bg-green-500 text-white py-2 px-4 rounded mr-2"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => handleConfirm(false)}
                    className="bg-red-500 text-white py-2 px-4 rounded"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}

function formatStudentName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default Page;
