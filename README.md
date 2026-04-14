# Proceso Tutorías


Sistema web para la gestión de tutorías académicas, que permite administrar sesiones, justificantes y seguimiento de alumnos mediante una plataforma centralizada.


---
## EQUIPO 2
Integrantes
- AVALOS ZENDEJAS JOSE RAMON
- Covarrubias García Dayron Antonio
- González Ruelas Fernanda
- Mora Yañez Jonathan Alexis




## Requisitos


Antes de ejecutar el proyecto, asegúrate de tener instalado:


- Node.js
- npm
- .NET SDK
- Visual Studio 2022
- SQL Server Express
- SQL Server Management Studio (SSMS)
- Git
- MUI
- Framer motion


---


## Instalación y ejecución del proyecto


1. Clonar el repositorio del proyecto.


2. Abrir una terminal y ubicarse en la carpeta principal del proyecto (ProcesoTutorias).


3. Ejecutar el backend (.NET):


   - Entrar a la carpeta del servidor:
     ```bash
     cd ProcesoTutorias.Server
     ```


   - Restaurar dependencias:
     ```bash
     dotnet restore
     ```


   - Ejecutar el servidor:
     ```bash
     dotnet run
     ```


   - Verificar el puerto en el que se ejecuta (por ejemplo: http://localhost:5016).


4. Configurar la base de datos (si es necesario):


   - Revisar la cadena de conexión en:
     - ProcesoTutorias.Server/Models/SistemaTutoriasContext.cs
     - ProcesoTutorias.Server/appsettings.json


   - Ejemplo:
     ```json
     "Server=.\\SQLEXPRESS;Database=SistemaTutorias;Trusted_Connection=True;"
     ```


   - Asegurarse de que el servidor SQL coincida con la configuración local.


5. Ejecutar el frontend (React):


   - Regresar a la carpeta principal y entrar al cliente:
     ```bash
     cd procesotutorias.client
     ```


   - Instalar dependencias:
     ```bash
     npm install
     ```


   - Ejecutar la aplicación:
     ```bash
     npm run dev
     ```


---


## Notas


- El backend debe estar en ejecución antes de iniciar el frontend.
- Si el puerto del backend cambia, puede ser necesario actualizar la configuración en el frontend.
- Verificar que SQL Server esté activo y correctamente configurado.
- En caso de errores, revisar la cadena de conexión a la base de datos.


---


## Funcionalidades principales


- Autenticación de usuarios por roles
- Gestión de tutorías
- Registro y validación de justificantes
- Consulta de historial
- Administración de usuarios y roles
