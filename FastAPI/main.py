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

    cur.execute("""
        CREATE TABLE IF NOT EXISTS avisos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            contenido TEXT DEFAULT '',
            tipo_muro TEXT DEFAULT 'General',
            departamento TEXT,
            destacado BOOLEAN DEFAULT FALSE,
            creada_por TEXT DEFAULT '',
            nombre_creador TEXT DEFAULT '',
            rol_creador TEXT DEFAULT '',
            empresa_id TEXT DEFAULT '',
            empresa_nombre TEXT DEFAULT '',
            reacciones TEXT DEFAULT '[]',
            comentarios TEXT DEFAULT '[]',
            fecha_creacion TEXT,
            archivado BOOLEAN DEFAULT FALSE
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS agenda_personal (
            id SERIAL PRIMARY KEY,
            uid TEXT NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT DEFAULT '',
            tipo TEXT DEFAULT '',
            color TEXT DEFAULT '',
            fecha_inicio TEXT NOT NULL,
            hora_inicio TEXT DEFAULT '',
            fecha_fin TEXT,
            hora_fin TEXT,
            ubicacion TEXT,
            notas TEXT DEFAULT '',
            completado BOOLEAN DEFAULT FALSE,
            fecha_creacion TEXT,
            fecha_actualizacion TEXT
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

class Aviso(BaseModel):
    id: Optional[int] = None
    titulo: str
    contenido: str
    tipoMuro: Optional[str] = "General"
    departamento: Optional[str] = None
    destacado: Optional[bool] = False
    creadoPor: str
    nombreCreador: str
    rolCreador: Optional[str] = ""
    empresaId: str
    empresaNombre: str
    reacciones: Optional[List[dict]] = []
    comentarios: Optional[List[dict]] = []
    fechaCreacion: Optional[str] = None
    archivado: Optional[bool] = False

class ReaccionAviso(BaseModel):
    uid: str
    nombreUsuario: str
    tipo: str

class EventoPersonal(BaseModel):
    id: Optional[int] = None
    uid: str
    titulo: str
    descripcion: Optional[str] = ""
    tipo: Optional[str] = ""
    color: Optional[str] = ""
    fechaInicio: str
    horaInicio: str
    fechaFin: Optional[str] = None
    horaFin: Optional[str] = None
    ubicacion: Optional[str] = None
    notas: Optional[str] = ""
    completado: Optional[bool] = False
    fechaCreacion: Optional[str] = None
    fechaActualizacion: Optional[str] = None

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

def row_to_aviso(row) -> dict:
    return {
        "id": row[0], "titulo": row[1], "contenido": row[2],
        "tipoMuro": row[3], "departamento": row[4], "destacado": row[5],
        "creadoPor": row[6], "nombreCreador": row[7], "rolCreador": row[8],
        "empresaId": row[9], "empresaNombre": row[10],
        "reacciones": json.loads(row[11] or "[]"),
        "comentarios": json.loads(row[12] or "[]"),
        "fechaCreacion": row[13], "archivado": row[14],
    }

def row_to_agenda(row) -> dict:
    return {
        "id": row[0], "uid": row[1], "titulo": row[2], "descripcion": row[3],
        "tipo": row[4], "color": row[5], "fechaInicio": row[6], "horaInicio": row[7],
        "fechaFin": row[8], "horaFin": row[9], "ubicacion": row[10],
        "notas": row[11], "completado": row[12],
        "fechaCreacion": row[13], "fechaActualizacion": row[14],
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

# ─────────────────────────────────────────────────────────────
#  AVISOS
# ─────────────────────────────────────────────────────────────

@app.post("/avisos")
def crear_aviso(aviso: Aviso):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO avisos (titulo,contenido,tipo_muro,departamento,destacado,
        creada_por,nombre_creador,rol_creador,empresa_id,empresa_nombre,
        reacciones,comentarios,fecha_creacion,archivado)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (
        aviso.titulo, aviso.contenido, aviso.tipoMuro, aviso.departamento,
        aviso.destacado, aviso.creadoPor, aviso.nombreCreador, aviso.rolCreador,
        aviso.empresaId, aviso.empresaNombre,
        json.dumps(aviso.reacciones), json.dumps(aviso.comentarios),
        datetime.now().isoformat(), aviso.archivado,
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"aviso": {**aviso.model_dump(), "id": new_id}}

@app.get("/avisos")
def obtener_avisos(
    empresaId: Optional[str] = None,
    tipoMuro: Optional[str] = None,
    departamento: Optional[str] = None,
):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM avisos WHERE empresa_id=%s AND archivado=FALSE ORDER BY fecha_creacion DESC",
        (empresaId,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    avisos = [row_to_aviso(r) for r in rows]
    if tipoMuro:
        avisos = [a for a in avisos if a["tipoMuro"] == tipoMuro]
    if departamento:
        avisos = [a for a in avisos if a["departamento"] == departamento]
    return {"total": len(avisos), "avisos": avisos}

@app.get("/avisos/{aviso_id}")
def obtener_aviso(aviso_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM avisos WHERE id=%s", (aviso_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    return {"aviso": row_to_aviso(row)}

@app.patch("/avisos/{aviso_id}")
def editar_aviso(aviso_id: int, datos: dict):
    conn = get_db()
    cur = conn.cursor()
    campos = {"titulo": "titulo", "contenido": "contenido",
              "destacado": "destacado", "archivado": "archivado"}
    for campo_api, campo_db in campos.items():
        if campo_api in datos:
            cur.execute(f"UPDATE avisos SET {campo_db}=%s WHERE id=%s",
                        (datos[campo_api], aviso_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.delete("/avisos/{aviso_id}")
def eliminar_aviso(aviso_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM avisos WHERE id=%s", (aviso_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.post("/avisos/{aviso_id}/reacciones")
def agregar_reaccion_aviso(aviso_id: int, reaccion: ReaccionAviso):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT reacciones FROM avisos WHERE id=%s", (aviso_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    reacciones = json.loads(row[0] or "[]")
    existente = next((r for r in reacciones if r["uid"] == reaccion.uid), None)
    if existente:
        if existente["tipo"] == reaccion.tipo:
            reacciones = [r for r in reacciones if r["uid"] != reaccion.uid]
        else:
            reacciones = [
                {**r, "tipo": reaccion.tipo, "fecha": datetime.now().isoformat()}
                if r["uid"] == reaccion.uid else r for r in reacciones
            ]
    else:
        reacciones.append({
            "uid": reaccion.uid, "nombreUsuario": reaccion.nombreUsuario,
            "tipo": reaccion.tipo, "fecha": datetime.now().isoformat(),
        })
    cur.execute("UPDATE avisos SET reacciones=%s WHERE id=%s",
                (json.dumps(reacciones), aviso_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.post("/avisos/{aviso_id}/comentarios")
def agregar_comentario_aviso(aviso_id: int, comentario: Comentario):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT comentarios FROM avisos WHERE id=%s", (aviso_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    comentarios = json.loads(row[0] or "[]")
    comentarios.append({
        "id": str(int(datetime.now().timestamp() * 1000)),
        "texto": comentario.texto,
        "autorUid": comentario.autorUid,
        "autorNombre": comentario.autorNombre,
        "fecha": datetime.now().isoformat(),
    })
    cur.execute("UPDATE avisos SET comentarios=%s WHERE id=%s",
                (json.dumps(comentarios), aviso_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.delete("/avisos/{aviso_id}/comentarios/{comentario_id}")
def eliminar_comentario_aviso(aviso_id: int, comentario_id: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT comentarios FROM avisos WHERE id=%s", (aviso_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    comentarios = [c for c in json.loads(row[0] or "[]") if c.get("id") != comentario_id]
    cur.execute("UPDATE avisos SET comentarios=%s WHERE id=%s", 
                (json.dumps(comentarios), aviso_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

# ─────────────────────────────────────────────────────────────
#  AGENDA PERSONAL
# ─────────────────────────────────────────────────────────────

@app.post("/agenda")
def crear_evento_personal(evento: EventoPersonal):
    conn = get_db()
    cur = conn.cursor()
    ahora = datetime.now().isoformat()
    cur.execute("""
        INSERT INTO agenda_personal (uid,titulo,descripcion,tipo,color,fecha_inicio,hora_inicio,
        fecha_fin,hora_fin,ubicacion,notas,completado,fecha_creacion,fecha_actualizacion)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (
        evento.uid, evento.titulo, evento.descripcion, evento.tipo, evento.color,
        evento.fechaInicio, evento.horaInicio, evento.fechaFin, evento.horaFin,
        evento.ubicacion, evento.notas, evento.completado, ahora, ahora,
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"evento": {**evento.model_dump(), "id": new_id}}

@app.get("/agenda")
def obtener_agenda(uid: Optional[str] = None):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM agenda_personal WHERE uid=%s ORDER BY fecha_inicio ASC", (uid,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"total": len(rows), "eventos": [row_to_agenda(r) for r in rows]}

@app.get("/agenda/{evento_id}")
def obtener_evento_personal(evento_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM agenda_personal WHERE id=%s", (evento_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return {"evento": row_to_agenda(row)}

@app.patch("/agenda/{evento_id}")
def editar_evento_personal(evento_id: int, datos: dict):
    conn = get_db()
    cur = conn.cursor()
    campos = {
        "titulo": "titulo", "descripcion": "descripcion",
        "tipo": "tipo", "color": "color",
        "fechaInicio": "fecha_inicio", "horaInicio": "hora_inicio",
        "fechaFin": "fecha_fin", "horaFin": "hora_fin",
        "ubicacion": "ubicacion", "notas": "notas", "completado": "completado",
    }
    for campo_api, campo_db in campos.items():
        if campo_api in datos:
            cur.execute(f"UPDATE agenda_personal SET {campo_db}=%s WHERE id=%s",
                        (datos[campo_api], evento_id))
    cur.execute("UPDATE agenda_personal SET fecha_actualizacion=%s WHERE id=%s",
                (datetime.now().isoformat(), evento_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}

@app.delete("/agenda/{evento_id}")
def eliminar_evento_personal(evento_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM agenda_personal WHERE id=%s", (evento_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"ok": True}