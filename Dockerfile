# Build the React client separately, then serve it from ASP.NET Core.
FROM node:22-bookworm-slim AS client-build
WORKDIR /src/procesotutorias.client

COPY procesotutorias.client/package*.json ./
RUN npm ci

COPY procesotutorias.client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS server-build
WORKDIR /src

COPY ProcesoTutorias.Server/ProcesoTutorias.Server.csproj ProcesoTutorias.Server/
RUN dotnet restore ProcesoTutorias.Server/ProcesoTutorias.Server.csproj

COPY ProcesoTutorias.Server/ ProcesoTutorias.Server/
RUN dotnet publish ProcesoTutorias.Server/ProcesoTutorias.Server.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=server-build /app/publish ./
COPY --from=client-build /src/procesotutorias.client/dist ./wwwroot

ENTRYPOINT ["dotnet", "ProcesoTutorias.Server.dll"]
