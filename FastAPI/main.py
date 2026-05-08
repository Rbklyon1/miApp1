# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Optional
# from datetime import datetime

# app = FastAPI(title="WorkStation API")

# # CORS — permite peticiones desde la app móvil (Expo)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# # ─────────────────────────────────────────────────────────────
# #  MODELOS
# # ─────────────────────────────────────────────────────────────

# class Comentario(BaseModel):
#     id: Optional[str] = None
#     texto: str
#     autorUid: str
#     autorNombre: str
#     fecha: Optional[str] = None

# class Adjunto(BaseModel):
#     id: Optional[str] = None
#     nombre: str
#     url: str
#     subidoPor: str
#     nombreSubidor: str
#     fechaSubida: Optional[str] = None

# class Tarea(BaseModel):
#     id: Optional[int] = None
#     titulo: str
#     descripcion: Optional[str] = ""
#     prioridad: Optional[str] = "Media"
#     estado: Optional[str] = "Pendiente"
#     creadaPor: Optional[str] = ""
#     nombreCreador: Optional[str] = ""
#     empresaId: Optional[str] = ""
#     empresaNombre: Optional[str] = ""
#     asignadoA: Optional[List[str]] = []
#     nombresAsignados: Optional[List[str]] = []
#     etiquetas: Optional[List[str]] = []
#     comentarios: Optional[List[dict]] = []
#     adjuntos: Optional[List[dict]] = []
#     tipoAsignacion: Optional[str] = "usuarios"
#     departamentoAsignado: Optional[str] = None
#     fechaCreacion: Optional[str] = None
#     fechaVencimiento: Optional[str] = None
#     fechaCompletada: Optional[str] = None

# class EstadoUpdate(BaseModel):
#     estado: str

# class AsistentesUpdate(BaseModel):
#     asistentes: List[dict]

# class ReaccionesUpdate(BaseModel):
#     reacciones: List[dict]

# class ContenidoUpdate(BaseModel):
#     contenido: str

# class Publicacion(BaseModel):
#     id: Optional[int] = None
#     contenido: str
#     empresaId: str
#     tipoMuro: Optional[str] = "general"
#     departamentoId: Optional[str] = None
#     nombreDepartamento: Optional[str] = None
#     creadaPor: str
#     nombreUsuario: str
#     rolUsuario: str
#     comentarios: Optional[List[dict]] = []
#     reacciones: Optional[List[dict]] = []
#     fechaCreacion: Optional[str] = None

# class Evento(BaseModel):
#     id: Optional[int] = None
#     titulo: str
#     descripcion: Optional[str] = ""
#     tipo: Optional[str] = ""
#     fechaInicio: str
#     horaInicio: str
#     fechaFin: Optional[str] = None
#     horaFin: Optional[str] = None
#     ubicacion: Optional[str] = None
#     esVirtual: Optional[bool] = False
#     linkVirtual: Optional[str] = None
#     asistentes: Optional[List[dict]] = []
#     capacidadMaxima: Optional[int] = None
#     creadoPor: str
#     nombreCreador: str
#     empresaId: str
#     empresaNombre: str
#     notas: Optional[str] = ""
#     tipoAsignacion: Optional[str] = "usuarios"
#     departamentoAsignado: Optional[str] = None
#     fechaCreacion: Optional[str] = None

# # ─────────────────────────────────────────────────────────────
# #  ALMACENAMIENTO EN MEMORIA (temporal para la actividad)
# #  En producción conectar a PostgreSQL de Railway
# # ─────────────────────────────────────────────────────────────

# tareas: List[Tarea] = []
# publicaciones: List[Publicacion] = []
# eventos: List[Evento] = []

# # ─────────────────────────────────────────────────────────────
# #  HEALTH CHECK
# # ─────────────────────────────────────────────────────────────

# @app.get("/health")
# def health():
#     return {"status": "ok", "servicio": "WorkStation API", "timestamp": datetime.now().isoformat()}

# # ─────────────────────────────────────────────────────────────
# #  TAREAS
# # ─────────────────────────────────────────────────────────────

# @app.post("/tareas")
# def crear_tarea(tarea: Tarea):
#     nueva = Tarea(
#         id=len(tareas) + 1,
#         fechaCreacion=datetime.now().isoformat(),
#         **tarea.model_dump(exclude={"id", "fechaCreacion"})
#     )
#     tareas.append(nueva)
#     return {"mensaje": "Tarea creada desde FastAPI", "tarea": nueva}


# @app.get("/tareas")
# def obtener_tareas(
#     empresaId: Optional[str] = None,
#     creadaPor: Optional[str] = None,
#     asignadoA: Optional[str] = None,
# ):
#     resultado = tareas

#     if empresaId:
#         resultado = [t for t in resultado if t.empresaId == empresaId]
#     if creadaPor:
#         resultado = [t for t in resultado if t.creadaPor == creadaPor]
#     if asignadoA:
#         resultado = [t for t in resultado if asignadoA in (t.asignadoA or [])]

#     return {"total": len(resultado), "tareas": resultado}


# @app.patch("/tareas/{tarea_id}/estado")
# def actualizar_estado_tarea(tarea_id: int, body: EstadoUpdate):
#     for t in tareas:
#         if t.id == tarea_id:
#             t.estado = body.estado
#             if body.estado == "Completada":
#                 t.fechaCompletada = datetime.now().isoformat()
#             return {"ok": True, "tarea": t}
#     raise HTTPException(status_code=404, detail="Tarea no encontrada")


# @app.patch("/tareas/{tarea_id}")
# def editar_tarea(tarea_id: int, datos: dict):
#     for t in tareas:
#         if t.id == tarea_id:
#             for key, value in datos.items():
#                 if hasattr(t, key):
#                     setattr(t, key, value)
#             return {"ok": True, "tarea": t}
#     raise HTTPException(status_code=404, detail="Tarea no encontrada")


# @app.post("/tareas/{tarea_id}/comentarios")
# def agregar_comentario_tarea(tarea_id: int, comentario: Comentario):
#     for t in tareas:
#         if t.id == tarea_id:
#             nuevo = comentario.model_dump()
#             nuevo["id"] = str(int(datetime.now().timestamp() * 1000))
#             nuevo["fecha"] = datetime.now().isoformat()
#             t.comentarios = t.comentarios or []
#             t.comentarios.append(nuevo)
#             return {"ok": True, "comentario": nuevo}
#     raise HTTPException(status_code=404, detail="Tarea no encontrada")


# @app.post("/tareas/{tarea_id}/adjuntos")
# def agregar_adjunto_tarea(tarea_id: int, adjunto: Adjunto):
#     for t in tareas:
#         if t.id == tarea_id:
#             nuevo = adjunto.model_dump()
#             nuevo["id"] = str(int(datetime.now().timestamp() * 1000))
#             nuevo["fechaSubida"] = datetime.now().isoformat()
#             t.adjuntos = t.adjuntos or []
#             t.adjuntos.append(nuevo)
#             return {"ok": True, "adjunto": nuevo}
#     raise HTTPException(status_code=404, detail="Tarea no encontrada")


# @app.delete("/tareas/{tarea_id}/adjuntos/{adjunto_id}")
# def eliminar_adjunto_tarea(tarea_id: int, adjunto_id: str):
#     for t in tareas:
#         if t.id == tarea_id:
#             t.adjuntos = [a for a in (t.adjuntos or []) if a.get("id") != adjunto_id]
#             return {"ok": True}
#     raise HTTPException(status_code=404, detail="Tarea no encontrada")


# @app.delete("/tareas/{tarea_id}")
# def eliminar_tarea(tarea_id: int):
#     global tareas
#     original = len(tareas)
#     tareas = [t for t in tareas if t.id != tarea_id]
#     if len(tareas) == original:
#         raise HTTPException(status_code=404, detail="Tarea no encontrada")
#     return {"ok": True}

# # ─────────────────────────────────────────────────────────────
# #  PUBLICACIONES
# # ─────────────────────────────────────────────────────────────

# @app.post("/publicaciones")
# def crear_publicacion(pub: Publicacion):
#     nueva = Publicacion(
#         id=len(publicaciones) + 1,
#         fechaCreacion=datetime.now().isoformat(),
#         **pub.model_dump(exclude={"id", "fechaCreacion"})
#     )
#     publicaciones.append(nueva)
#     return {"publicacion": nueva}


# @app.get("/publicaciones")
# def obtener_publicaciones(
#     empresaId: Optional[str] = None,
#     tipoMuro: Optional[str] = None,
#     departamentoId: Optional[str] = None,
# ):
#     resultado = publicaciones
#     if empresaId:
#         resultado = [p for p in resultado if p.empresaId == empresaId]
#     if tipoMuro:
#         resultado = [p for p in resultado if p.tipoMuro == tipoMuro]
#     if departamentoId:
#         resultado = [p for p in resultado if p.departamentoId == departamentoId]
#     return {"total": len(resultado), "publicaciones": resultado}


# @app.patch("/publicaciones/{pub_id}")
# def editar_publicacion(pub_id: int, body: ContenidoUpdate):
#     for p in publicaciones:
#         if p.id == pub_id:
#             p.contenido = body.contenido
#             return {"ok": True}
#     raise HTTPException(status_code=404, detail="Publicación no encontrada")


# @app.post("/publicaciones/{pub_id}/reacciones")
# def actualizar_reacciones(pub_id: int, body: ReaccionesUpdate):
#     for p in publicaciones:
#         if p.id == pub_id:
#             p.reacciones = body.reacciones
#             return {"ok": True}
#     raise HTTPException(status_code=404, detail="Publicación no encontrada")


# @app.delete("/publicaciones/{pub_id}")
# def eliminar_publicacion(pub_id: int):
#     global publicaciones
#     publicaciones = [p for p in publicaciones if p.id != pub_id]
#     return {"ok": True}

# # ─────────────────────────────────────────────────────────────
# #  EVENTOS
# # ─────────────────────────────────────────────────────────────

# @app.post("/eventos")
# def crear_evento(evento: Evento):
#     nuevo = Evento(
#         id=len(eventos) + 1,
#         fechaCreacion=datetime.now().isoformat(),
#         **evento.model_dump(exclude={"id", "fechaCreacion"})
#     )
#     eventos.append(nuevo)
#     return {"evento": nuevo}


# @app.get("/eventos")
# def obtener_eventos(empresaId: Optional[str] = None):
#     resultado = eventos
#     if empresaId:
#         resultado = [e for e in resultado if e.empresaId == empresaId]
#     return {"total": len(resultado), "eventos": resultado}


# @app.patch("/eventos/{evento_id}/asistentes")
# def actualizar_asistentes(evento_id: int, body: AsistentesUpdate):
#     for e in eventos:
#         if e.id == evento_id:
#             e.asistentes = body.asistentes
#             return {"ok": True}
#     raise HTTPException(status_code=404, detail="Evento no encontrado")


# @app.delete("/eventos/{evento_id}")
# def eliminar_evento(evento_id: int):
#     global eventos
#     eventos = [e for e in eventos if e.id != evento_id]
#     return {"ok": True}
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import psycopg2
import json

app = FastAPI(title="WorkStation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
#  BASE DE DATOS
# ─────────────────────────────────────────────────────────────

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tareas (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            descripcion TEXT DEFAULT '',
            prioridad TEXT DEFAULT 'Media',
            estado TEXT DEFAULT 'Pendiente',
            creada_por TEXT DEFAULT '',
            nombre_creador TEXT DEFAULT '',
            empresa_id TEXT DEFAULT '',
            empresa_nombre TEXT DEFAULT '',
            asignado_a TEXT DEFAULT '[]',
            nombres_asignados TEXT DEFAULT '[]',
            etiquetas TEXT DEFAULT '[]',
            comentarios TEXT DEFAULT '[]',
            adjuntos TEXT DEFAULT '[]',
            tipo_asignacion TEXT DEFAULT 'usuarios',
            departamento_asignado TEXT,
            fecha_creacion TEXT,
            fecha_vencimiento TEXT,
            fecha_completada TEXT
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS eventos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            descripcion TEXT DEFAULT '',
            tipo TEXT DEFAULT 'Reunión',
            fecha_inicio TEXT NOT NULL,
            hora_inicio TEXT DEFAULT '',
            fecha_fin TEXT,
            hora_fin TEXT,
            ubicacion TEXT,
            es_virtual BOOLEAN DEFAULT FALSE,
            link_virtual TEXT,
            asistentes TEXT DEFAULT '[]',
            capacidad_maxima INTEGER,
            creada_por TEXT DEFAULT '',
            nombre_creador TEXT DEFAULT '',
            empresa_id TEXT DEFAULT '',
            empresa_nombre TEXT DEFAULT '',
            fecha_creacion TEXT,
            recordatorio_enviado BOOLEAN DEFAULT FALSE,
            notas TEXT DEFAULT '',
            adjuntos TEXT DEFAULT '[]',
            tipo_asignacion TEXT DEFAULT 'usuarios',
            departamento_asignado TEXT
        );
    """)

    conn.commit()
    cur.close()
    conn.close()

@app.on_event("startup")
def startup():
    init_db()

# ─────────────────────────────────────────────────────────────
#  MODELOS
# ─────────────────────────────────────────────────────────────

class Tarea(BaseModel):
    id: Optional[int] = None
    titulo: str
    descripcion: Optional[str] = ""
    prioridad: Optional[str] = "Media"
    estado: Optional[str] = "Pendiente"
    creadaPor: Optional[str] = ""
    nombreCreador: Optional[str] = ""
    empresaId: Optional[str] = ""
    empresaNombre: Optional[str] = ""
    asignadoA: Optional[List[str]] = []
    nombresAsignados: Optional[List[str]] = []
    etiquetas: Optional[List[str]] = []
    comentarios: Optional[List[dict]] = []
    adjuntos: Optional[List[dict]] = []
    tipoAsignacion: Optional[str] = "usuarios"
    departamentoAsignado: Optional[str] = None
    fechaCreacion: Optional[str] = None
    fechaVencimiento: Optional[str] = None
    fechaCompletada: Optional[str] = None

class EstadoUpdate(BaseModel):
    estado: str

class Comentario(BaseModel):
    texto: str
    autorUid: str
    autorNombre: str

class Evento(BaseModel):
    id: Optional[int] = None
    titulo: str
    descripcion: Optional[str] = ""
    tipo: Optional[str] = "Reunión"
    fechaInicio: str
    horaInicio: str
    fechaFin: Optional[str] = None
    horaFin: Optional[str] = None
    ubicacion: Optional[str] = None
    esVirtual: Optional[bool] = False
    linkVirtual: Optional[str] = None
    asistentes: Optional[List[dict]] = []
    capacidadMaxima: Optional[int] = None
    creadoPor: str
    nombreCreador: str
    empresaId: str
    empresaNombre: str
    fechaCreacion: Optional[str] = None
    recordatorioEnviado: Optional[bool] = False
    notas: Optional[str] = ""
    adjuntos: Optional[List[dict]] = []
    tipoAsignacion: Optional[str] = "usuarios"
    departamentoAsignado: Optional[str] = None

class AsistentesUpdate(BaseModel):
    asistentes: List[dict]

# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────

def row_to_tarea(row) -> dict:
    return {
        "id": row[0], "titulo": row[1], "descripcion": row[2],
        "prioridad": row[3], "estado": row[4], "creadaPor": row[5],
        "nombreCreador": row[6], "empresaId": row[7], "empresaNombre": row[8],
        "asignadoA": json.loads(row[9] or "[]"),
        "nombresAsignados": json.loads(row[10] or "[]"),
        "etiquetas": json.loads(row[11] or "[]"),
        "comentarios": json.loads(row[12] or "[]"),
        "adjuntos": json.loads(row[13] or "[]"),
        "tipoAsignacion": row[14], "departamentoAsignado": row[15],
        "fechaCreacion": row[16], "fechaVencimiento": row[17], "fechaCompletada": row[18],
    }

def row_to_evento(row) -> dict:
    return {
        "id": row[0], "titulo": row[1], "descripcion": row[2], "tipo": row[3],
        "fechaInicio": row[4], "horaInicio": row[5], "fechaFin": row[6], "horaFin": row[7],
        "ubicacion": row[8], "esVirtual": row[9], "linkVirtual": row[10],
        "asistentes": json.loads(row[11] or "[]"),
        "capacidadMaxima": row[12], "creadoPor": row[13], "nombreCreador": row[14],
        "empresaId": row[15], "empresaNombre": row[16], "fechaCreacion": row[17],
        "recordatorioEnviado": row[18], "notas": row[19],
        "adjuntos": json.loads(row[20] or "[]"),
        "tipoAsignacion": row[21], "departamentoAsignado": row[22],
    }

# ─────────────────────────────────────────────────────────────
#  HEALTH
# ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "servicio": "WorkStation API"}

# ─────────────────────────────────────────────────────────────
#  TAREAS
# ─────────────────────────────────────────────────────────────

@app.post("/tareas")
def crear_tarea(tarea: Tarea):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO tareas (titulo,descripcion,prioridad,estado,creada_por,nombre_creador,
        empresa_id,empresa_nombre,asignado_a,nombres_asignados,etiquetas,comentarios,adjuntos,
        tipo_asignacion,departamento_asignado,fecha_creacion,fecha_vencimiento,fecha_completada)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (
        tarea.titulo, tarea.descripcion, tarea.prioridad, tarea.estado,
        tarea.creadaPor, tarea.nombreCreador, tarea.empresaId, tarea.empresaNombre,
        json.dumps(tarea.asignadoA), json.dumps(tarea.nombresAsignados),
        json.dumps(tarea.etiquetas), json.dumps(tarea.comentarios),
        json.dumps(tarea.adjuntos), tarea.tipoAsignacion, tarea.departamentoAsignado,
        datetime.now().isoformat(), tarea.fechaVencimiento, tarea.fechaCompletada
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"mensaje": "Tarea creada", "tarea": {**tarea.model_dump(), "id": new_id}}

@app.get("/tareas")
def obtener_tareas(
    empresaId: Optional[str] = None,
    creadaPor: Optional[str] = None,
    asignadoA: Optional[str] = None,
):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tareas WHERE empresa_id=%s ORDER BY fecha_creacion DESC", (empresaId,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    tareas = [row_to_tarea(r) for r in rows]
    if creadaPor:
        tareas = [t for t in tareas if t["creadaPor"] == creadaPor]
    if asignadoA:
        tareas = [t for t in tareas if asignadoA in t["asignadoA"]]
    return {"total": len(tareas), "tareas": tareas}

@app.patch("/tareas/{tarea_id}/estado")
def actualizar_estado_tarea(tarea_id: int, body: EstadoUpdate):
    conn = get_db()
    cur = conn.cursor()
    fecha_completada = datetime.now().isoformat() if body.estado == "Completada" else None
    cur.execute("UPDATE tareas SET estado=%s, fecha_completada=%s WHERE id=%s",
                (body.estado, fecha_completada, tarea_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.post("/tareas/{tarea_id}/comentarios")
def agregar_comentario_tarea(tarea_id: int, comentario: Comentario):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT comentarios FROM tareas WHERE id=%s", (tarea_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    comentarios = json.loads(row[0] or "[]")
    comentarios.append({
        "id": str(int(datetime.now().timestamp() * 1000)),
        "texto": comentario.texto,
        "autorUid": comentario.autorUid,
        "autorNombre": comentario.autorNombre,
        "fecha": datetime.now().isoformat(),
    })
    cur.execute("UPDATE tareas SET comentarios=%s WHERE id=%s",
                (json.dumps(comentarios), tarea_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.patch("/tareas/{tarea_id}")
def editar_tarea(tarea_id: int, datos: dict):
    conn = get_db()
    cur = conn.cursor()
    campos = {"titulo": "titulo", "descripcion": "descripcion",
              "prioridad": "prioridad", "estado": "estado"}
    for campo_api, campo_db in campos.items():
        if campo_api in datos:
            cur.execute(f"UPDATE tareas SET {campo_db}=%s WHERE id=%s",
                        (datos[campo_api], tarea_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.delete("/tareas/{tarea_id}")
def eliminar_tarea(tarea_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM tareas WHERE id=%s", (tarea_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

# ─────────────────────────────────────────────────────────────
#  EVENTOS
# ─────────────────────────────────────────────────────────────

@app.post("/eventos")
def crear_evento(evento: Evento):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO eventos (titulo,descripcion,tipo,fecha_inicio,hora_inicio,fecha_fin,hora_fin,
        ubicacion,es_virtual,link_virtual,asistentes,capacidad_maxima,creada_por,nombre_creador,
        empresa_id,empresa_nombre,fecha_creacion,recordatorio_enviado,notas,adjuntos,
        tipo_asignacion,departamento_asignado)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (
        evento.titulo, evento.descripcion, evento.tipo,
        evento.fechaInicio, evento.horaInicio, evento.fechaFin, evento.horaFin,
        evento.ubicacion, evento.esVirtual, evento.linkVirtual,
        json.dumps(evento.asistentes), evento.capacidadMaxima,
        evento.creadoPor, evento.nombreCreador,
        evento.empresaId, evento.empresaNombre,
        datetime.now().isoformat(), evento.recordatorioEnviado,
        evento.notas, json.dumps(evento.adjuntos),
        evento.tipoAsignacion, evento.departamentoAsignado,
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"evento": {**evento.model_dump(), "id": new_id}}

@app.get("/eventos")
def obtener_eventos(
    empresaId: Optional[str] = None,
    creadoPor: Optional[str] = None,
):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM eventos WHERE empresa_id=%s ORDER BY fecha_inicio ASC", (empresaId,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    eventos = [row_to_evento(r) for r in rows]
    if creadoPor:
        eventos = [e for e in eventos if e["creadoPor"] == creadoPor]
    return {"total": len(eventos), "eventos": eventos}

@app.get("/eventos/{evento_id}")
def obtener_evento(evento_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM eventos WHERE id=%s", (evento_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return {"evento": row_to_evento(row)}

@app.patch("/eventos/{evento_id}/asistentes")
def actualizar_asistentes(evento_id: int, body: AsistentesUpdate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE eventos SET asistentes=%s WHERE id=%s",
                (json.dumps(body.asistentes), evento_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.patch("/eventos/{evento_id}")
def editar_evento(evento_id: int, datos: dict):
    conn = get_db()
    cur = conn.cursor()
    campos = {"titulo": "titulo", "descripcion": "descripcion",
              "tipo": "tipo", "notas": "notas"}
    for campo_api, campo_db in campos.items():
        if campo_api in datos:
            cur.execute(f"UPDATE eventos SET {campo_db}=%s WHERE id=%s",
                        (datos[campo_api], evento_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.delete("/eventos/{evento_id}")
def eliminar_evento(evento_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM eventos WHERE id=%s", (evento_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}