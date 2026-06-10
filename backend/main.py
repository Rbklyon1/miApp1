from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
import os
import bcrypt
import jwt
import json

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

app = FastAPI(title="workstation API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "workstation_secret_key_2024")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24 * 7  # 7 días

security = HTTPBearer()

# ─────────────────────────────────────────────
# DB CONNECTION
# ─────────────────────────────────────────────

def get_conn():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            uid TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            correo TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            rol TEXT DEFAULT 'Empleado',
            empresa_id TEXT,
            departamento TEXT,
            fecha_registro TEXT DEFAULT (NOW()::TEXT),
            activo BOOLEAN DEFAULT TRUE
        );

        CREATE TABLE IF NOT EXISTS empresas (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            codigo_acceso TEXT UNIQUE NOT NULL,
            creada_por TEXT,
            roles_disponibles JSONB DEFAULT '["Administrador","Jefe","Empleado"]',
            fecha_creacion TEXT DEFAULT (NOW()::TEXT)
        );

        CREATE TABLE IF NOT EXISTS departamentos (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL,
            nombre TEXT NOT NULL,
            activo BOOLEAN DEFAULT TRUE,
            fecha_creacion TEXT DEFAULT (NOW()::TEXT)
        );

        CREATE TABLE IF NOT EXISTS tareas (
            id TEXT PRIMARY KEY,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            prioridad TEXT DEFAULT 'Media',
            estado TEXT DEFAULT 'Pendiente',
            fecha_creacion TEXT,
            fecha_vencimiento TEXT,
            fecha_completada TEXT,
            creada_por TEXT,
            nombre_creador TEXT,
            asignado_a JSONB DEFAULT '[]',
            nombres_asignados JSONB DEFAULT '[]',
            tipo_asignacion TEXT DEFAULT 'usuarios',
            departamento_asignado TEXT,
            empresa_id TEXT,
            empresa_nombre TEXT,
            etiquetas JSONB DEFAULT '[]',
            adjuntos JSONB DEFAULT '[]',
            comentarios JSONB DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS eventos (
            id TEXT PRIMARY KEY,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            tipo TEXT,
            fecha_inicio TEXT,
            hora_inicio TEXT,
            fecha_fin TEXT,
            hora_fin TEXT,
            ubicacion TEXT,
            es_virtual BOOLEAN DEFAULT FALSE,
            link_virtual TEXT,
            asistentes JSONB DEFAULT '[]',
            capacidad_maxima INTEGER,
            creado_por TEXT,
            nombre_creador TEXT,
            empresa_id TEXT,
            empresa_nombre TEXT,
            fecha_creacion TEXT,
            recordatorio_enviado BOOLEAN DEFAULT FALSE,
            adjuntos JSONB DEFAULT '[]',
            notas TEXT,
            tipo_asignacion TEXT DEFAULT 'usuarios',
            departamento_asignado TEXT
        );

        CREATE TABLE IF NOT EXISTS avisos (
            id TEXT PRIMARY KEY,
            titulo TEXT NOT NULL,
            contenido TEXT,
            creado_por TEXT,
            nombre_creador TEXT,
            rol_creador TEXT,
            empresa_id TEXT,
            empresa_nombre TEXT,
            tipo_muro TEXT DEFAULT 'General',
            departamento TEXT,
            reacciones JSONB DEFAULT '[]',
            comentarios JSONB DEFAULT '[]',
            fecha_creacion TEXT,
            fecha_edicion TEXT,
            destacado BOOLEAN DEFAULT FALSE,
            archivado BOOLEAN DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS agenda_personal (
            id TEXT PRIMARY KEY,
            uid TEXT NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            tipo TEXT,
            color TEXT,
            fecha_inicio TEXT,
            hora_inicio TEXT,
            fecha_fin TEXT,
            hora_fin TEXT,
            ubicacion TEXT,
            notas TEXT,
            completado BOOLEAN DEFAULT FALSE,
            fecha_creacion TEXT,
            fecha_actualizacion TEXT
        );

        CREATE TABLE IF NOT EXISTS publicaciones (
            id TEXT PRIMARY KEY,
            contenido TEXT NOT NULL,
            empresa_id TEXT,
            tipo_muro TEXT DEFAULT 'general',
            departamento_id TEXT,
            nombre_departamento TEXT,
            creada_por TEXT,
            nombre_usuario TEXT,
            rol_usuario TEXT,
            fecha_creacion TEXT,
            fecha_actualizacion TEXT,
            comentarios JSONB DEFAULT '[]',
            reacciones JSONB DEFAULT '[]'
        );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Tablas inicializadas")

@app.on_event("startup")
def startup():
    init_db()

# ─────────────────────────────────────────────
# AUTH HELPERS
# ─────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(uid: str, correo: str) -> str:
    payload = {
        "uid": uid,
        "correo": correo,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

def generate_id(prefix: str = "") -> str:
    import uuid
    return f"{prefix}{uuid.uuid4().hex}"

# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class RegistroSchema(BaseModel):
    nombre: str
    correo: str
    password: str

class LoginSchema(BaseModel):
    correo: str
    password: str

class EmpresaSchema(BaseModel):
    nombre: str
    codigo_acceso: str

class DepartamentoSchema(BaseModel):
    empresa_id: str
    nombre: str

class UnirseEmpresaSchema(BaseModel):
    codigo_acceso: str
    rol: str = "Empleado"

class TareaSchema(BaseModel):
    titulo: str
    descripcion: Optional[str] = ""
    prioridad: str = "Media"
    estado: str = "Pendiente"
    fecha_vencimiento: Optional[str] = None
    creada_por: str
    nombre_creador: str
    asignado_a: List[str] = []
    nombres_asignados: List[str] = []
    tipo_asignacion: Optional[str] = "usuarios"
    departamento_asignado: Optional[str] = None
    empresa_id: str
    empresa_nombre: str
    etiquetas: Optional[List[str]] = []

class TareaUpdateSchema(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    prioridad: Optional[str] = None
    estado: Optional[str] = None
    fecha_vencimiento: Optional[str] = None
    fecha_completada: Optional[str] = None
    asignado_a: Optional[List[str]] = None
    nombres_asignados: Optional[List[str]] = None
    etiquetas: Optional[List[str]] = None
    comentarios: Optional[list] = None
    adjuntos: Optional[list] = None

class EventoSchema(BaseModel):
    titulo: str
    descripcion: Optional[str] = ""
    tipo: str
    fecha_inicio: str
    hora_inicio: str
    fecha_fin: Optional[str] = None
    hora_fin: Optional[str] = None
    ubicacion: Optional[str] = None
    es_virtual: bool = False
    link_virtual: Optional[str] = None
    asistentes: List[dict] = []
    capacidad_maxima: Optional[int] = None
    creado_por: str
    nombre_creador: str
    empresa_id: str
    empresa_nombre: str
    notas: Optional[str] = ""
    tipo_asignacion: Optional[str] = "usuarios"
    departamento_asignado: Optional[str] = None

class EventoUpdateSchema(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    fecha_inicio: Optional[str] = None
    hora_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    hora_fin: Optional[str] = None
    ubicacion: Optional[str] = None
    es_virtual: Optional[bool] = None
    link_virtual: Optional[str] = None
    asistentes: Optional[List[dict]] = None
    notas: Optional[str] = None

class AvisoSchema(BaseModel):
    titulo: str
    contenido: str
    creado_por: str
    nombre_creador: str
    rol_creador: str
    empresa_id: str
    empresa_nombre: str
    tipo_muro: str = "General"
    departamento: Optional[str] = None
    destacado: bool = False

class AvisoUpdateSchema(BaseModel):
    titulo: Optional[str] = None
    contenido: Optional[str] = None
    destacado: Optional[bool] = None
    archivado: Optional[bool] = None
    reacciones: Optional[list] = None
    comentarios: Optional[list] = None

class AgendaSchema(BaseModel):
    uid: str
    titulo: str
    descripcion: Optional[str] = ""
    tipo: str
    color: str
    fecha_inicio: str
    hora_inicio: str
    fecha_fin: Optional[str] = None
    hora_fin: Optional[str] = None
    ubicacion: Optional[str] = None
    notas: Optional[str] = ""
    completado: bool = False

class AgendaUpdateSchema(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    color: Optional[str] = None
    fecha_inicio: Optional[str] = None
    hora_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    hora_fin: Optional[str] = None
    ubicacion: Optional[str] = None
    notas: Optional[str] = None
    completado: Optional[bool] = None

class PublicacionSchema(BaseModel):
    contenido: str
    empresa_id: str
    tipo_muro: str = "general"
    departamento_id: Optional[str] = None
    nombre_departamento: Optional[str] = None
    creada_por: str
    nombre_usuario: str
    rol_usuario: str

class PublicacionUpdateSchema(BaseModel):
    contenido: Optional[str] = None
    reacciones: Optional[list] = None
    comentarios: Optional[list] = None

# ─────────────────────────────────────────────
# AUTH ENDPOINTS
# ─────────────────────────────────────────────

@app.post("/auth/registro", status_code=201)
def registro(data: RegistroSchema):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT uid FROM usuarios WHERE correo = %s", (data.correo.lower(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

        uid = generate_id("usr_")
        password_hash = hash_password(data.password)
        fecha = datetime.utcnow().isoformat()

        cur.execute("""
            INSERT INTO usuarios (uid, nombre, correo, password_hash, fecha_registro)
            VALUES (%s, %s, %s, %s, %s)
        """, (uid, data.nombre.strip(), data.correo.lower().strip(), password_hash, fecha))

        conn.commit()
        token = create_token(uid, data.correo.lower())

        return {"uid": uid, "nombre": data.nombre, "correo": data.correo.lower(), "token": token}
    finally:
        cur.close()
        conn.close()

@app.post("/auth/login")
def login(data: LoginSchema):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM usuarios WHERE correo = %s AND activo = TRUE", (data.correo.lower(),))
        user = cur.fetchone()

        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        token = create_token(user["uid"], user["correo"])
        return {
            "uid": user["uid"],
            "nombre": user["nombre"],
            "correo": user["correo"],
            "rol": user["rol"],
            "empresa_id": user["empresa_id"],
            "token": token
        }
    finally:
        cur.close()
        conn.close()

@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT uid, nombre, correo, rol, empresa_id, departamento FROM usuarios WHERE uid = %s", (current_user["uid"],))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return dict(user)
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# EMPRESAS
# ─────────────────────────────────────────────

@app.post("/empresas", status_code=201)
def crear_empresa(data: EmpresaSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM empresas WHERE codigo_acceso = %s", (data.codigo_acceso.upper(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Código de empresa ya existe")

        empresa_id = generate_id("emp_")
        cur.execute("""
            INSERT INTO empresas (id, nombre, codigo_acceso, creada_por, fecha_creacion)
            VALUES (%s, %s, %s, %s, %s)
        """, (empresa_id, data.nombre.strip(), data.codigo_acceso.upper(), current_user["uid"], datetime.utcnow().isoformat()))

        cur.execute("""
            UPDATE usuarios SET empresa_id = %s, rol = 'Administrador' WHERE uid = %s
        """, (empresa_id, current_user["uid"]))

        conn.commit()
        return {"id": empresa_id, "nombre": data.nombre, "codigo_acceso": data.codigo_acceso.upper()}
    finally:
        cur.close()
        conn.close()

@app.get("/empresas/codigo/{codigo}")
def buscar_empresa_por_codigo(codigo: str):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM empresas WHERE codigo_acceso = %s", (codigo.upper(),))
        empresa = cur.fetchone()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        return dict(empresa)
    finally:
        cur.close()
        conn.close()

@app.get("/empresas/{empresa_id}")
def obtener_empresa(empresa_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM empresas WHERE id = %s", (empresa_id,))
        empresa = cur.fetchone()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        return dict(empresa)
    finally:
        cur.close()
        conn.close()

@app.post("/empresas/unirse")
def unirse_empresa(data: UnirseEmpresaSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM empresas WHERE codigo_acceso = %s", (data.codigo_acceso.upper(),))
        empresa = cur.fetchone()
        if not empresa:
            raise HTTPException(status_code=404, detail="Código de empresa inválido")

        cur.execute("""
            UPDATE usuarios SET empresa_id = %s, rol = %s WHERE uid = %s
        """, (empresa["id"], data.rol, current_user["uid"]))

        conn.commit()
        return {"empresa_id": empresa["id"], "nombre": empresa["nombre"], "rol": data.rol}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# DEPARTAMENTOS
# ─────────────────────────────────────────────

@app.get("/departamentos/{empresa_id}")
def obtener_departamentos(empresa_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM departamentos WHERE empresa_id = %s AND activo = TRUE", (empresa_id,))
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.post("/departamentos", status_code=201)
def crear_departamento(data: DepartamentoSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        depto_id = generate_id("dep_")
        cur.execute("""
            INSERT INTO departamentos (id, empresa_id, nombre, fecha_creacion)
            VALUES (%s, %s, %s, %s)
        """, (depto_id, data.empresa_id, data.nombre.strip(), datetime.utcnow().isoformat()))
        conn.commit()
        return {"id": depto_id, "nombre": data.nombre, "empresa_id": data.empresa_id}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# USUARIOS
# ─────────────────────────────────────────────

@app.get("/usuarios/{uid}")
def obtener_usuario(uid: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT uid, nombre, correo, rol, empresa_id, departamento FROM usuarios WHERE uid = %s", (uid,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return dict(user)
    finally:
        cur.close()
        conn.close()

@app.get("/usuarios/empresa/{empresa_id}")
def obtener_usuarios_empresa(empresa_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT uid, nombre, correo, rol, departamento FROM usuarios
            WHERE empresa_id = %s AND activo = TRUE
        """, (empresa_id,))
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.put("/usuarios/{uid}")
def actualizar_usuario(uid: str, data: dict, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        fields = []
        values = []
        allowed = ["nombre", "rol", "departamento", "empresa_id"]
        for key in allowed:
            if key in data:
                fields.append(f"{key} = %s")
                values.append(data[key])
        if not fields:
            raise HTTPException(status_code=400, detail="Sin campos para actualizar")
        values.append(uid)
        cur.execute(f"UPDATE usuarios SET {', '.join(fields)} WHERE uid = %s", values)
        conn.commit()
        return {"message": "Usuario actualizado"}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# TAREAS
# ─────────────────────────────────────────────

@app.get("/tareas")
def obtener_tareas(empresa_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM tareas WHERE empresa_id = %s ORDER BY fecha_creacion DESC", (empresa_id,))
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.post("/tareas", status_code=201)
def crear_tarea(data: TareaSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        tarea_id = generate_id("tar_")
        fecha = datetime.utcnow().isoformat()
        cur.execute("""
            INSERT INTO tareas (id, titulo, descripcion, prioridad, estado, fecha_creacion,
                fecha_vencimiento, creada_por, nombre_creador, asignado_a, nombres_asignados,
                tipo_asignacion, departamento_asignado, empresa_id, empresa_nombre, etiquetas)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            tarea_id, data.titulo, data.descripcion, data.prioridad, data.estado, fecha,
            data.fecha_vencimiento, data.creada_por, data.nombre_creador,
            json.dumps(data.asignado_a), json.dumps(data.nombres_asignados),
            data.tipo_asignacion, data.departamento_asignado,
            data.empresa_id, data.empresa_nombre, json.dumps(data.etiquetas)
        ))
        conn.commit()
        return {"id": tarea_id, "fecha_creacion": fecha, **data.dict()}
    finally:
        cur.close()
        conn.close()

@app.put("/tareas/{tarea_id}")
def actualizar_tarea(tarea_id: str, data: TareaUpdateSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        fields = []
        values = []
        update = data.dict(exclude_none=True)
        json_fields = {"asignado_a", "nombres_asignados", "etiquetas", "comentarios", "adjuntos"}
        for key, val in update.items():
            fields.append(f"{key} = %s")
            values.append(json.dumps(val) if key in json_fields else val)
        if not fields:
            raise HTTPException(status_code=400, detail="Sin campos para actualizar")
        values.append(tarea_id)
        cur.execute(f"UPDATE tareas SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return {"message": "Tarea actualizada"}
    finally:
        cur.close()
        conn.close()

@app.delete("/tareas/{tarea_id}")
def eliminar_tarea(tarea_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM tareas WHERE id = %s", (tarea_id,))
        conn.commit()
        return {"message": "Tarea eliminada"}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# EVENTOS
# ─────────────────────────────────────────────

@app.get("/eventos")
def obtener_eventos(empresa_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM eventos WHERE empresa_id = %s ORDER BY fecha_inicio ASC", (empresa_id,))
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.post("/eventos", status_code=201)
def crear_evento(data: EventoSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        evento_id = generate_id("evt_")
        fecha = datetime.utcnow().isoformat()
        cur.execute("""
            INSERT INTO eventos (id, titulo, descripcion, tipo, fecha_inicio, hora_inicio,
                fecha_fin, hora_fin, ubicacion, es_virtual, link_virtual, asistentes,
                capacidad_maxima, creado_por, nombre_creador, empresa_id, empresa_nombre,
                fecha_creacion, notas, tipo_asignacion, departamento_asignado)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            evento_id, data.titulo, data.descripcion, data.tipo,
            data.fecha_inicio, data.hora_inicio, data.fecha_fin, data.hora_fin,
            data.ubicacion, data.es_virtual, data.link_virtual,
            json.dumps(data.asistentes), data.capacidad_maxima,
            data.creado_por, data.nombre_creador, data.empresa_id, data.empresa_nombre,
            fecha, data.notas, data.tipo_asignacion, data.departamento_asignado
        ))
        conn.commit()
        return {"id": evento_id, "fecha_creacion": fecha, **data.dict()}
    finally:
        cur.close()
        conn.close()

@app.put("/eventos/{evento_id}")
def actualizar_evento(evento_id: str, data: EventoUpdateSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        fields = []
        values = []
        update = data.dict(exclude_none=True)
        for key, val in update.items():
            fields.append(f"{key} = %s")
            values.append(json.dumps(val) if key == "asistentes" else val)
        if not fields:
            raise HTTPException(status_code=400, detail="Sin campos para actualizar")
        values.append(evento_id)
        cur.execute(f"UPDATE eventos SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return {"message": "Evento actualizado"}
    finally:
        cur.close()
        conn.close()

@app.delete("/eventos/{evento_id}")
def eliminar_evento(evento_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM eventos WHERE id = %s", (evento_id,))
        conn.commit()
        return {"message": "Evento eliminado"}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# AVISOS
# ─────────────────────────────────────────────

@app.get("/avisos")
def obtener_avisos(empresa_id: str, tipo_muro: str = "General", departamento: Optional[str] = None, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        if departamento:
            cur.execute("""
                SELECT * FROM avisos WHERE empresa_id = %s AND tipo_muro = %s
                AND departamento = %s AND archivado = FALSE ORDER BY destacado DESC, fecha_creacion DESC
            """, (empresa_id, tipo_muro, departamento))
        else:
            cur.execute("""
                SELECT * FROM avisos WHERE empresa_id = %s AND tipo_muro = %s
                AND archivado = FALSE ORDER BY destacado DESC, fecha_creacion DESC
            """, (empresa_id, tipo_muro))
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.post("/avisos", status_code=201)
def crear_aviso(data: AvisoSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        aviso_id = generate_id("avi_")
        fecha = datetime.utcnow().isoformat()
        cur.execute("""
            INSERT INTO avisos (id, titulo, contenido, creado_por, nombre_creador, rol_creador,
                empresa_id, empresa_nombre, tipo_muro, departamento, destacado, fecha_creacion)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            aviso_id, data.titulo, data.contenido, data.creado_por, data.nombre_creador,
            data.rol_creador, data.empresa_id, data.empresa_nombre, data.tipo_muro,
            data.departamento, data.destacado, fecha
        ))
        conn.commit()
        return {"id": aviso_id, "fecha_creacion": fecha, **data.dict()}
    finally:
        cur.close()
        conn.close()

@app.put("/avisos/{aviso_id}")
def actualizar_aviso(aviso_id: str, data: AvisoUpdateSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        fields = []
        values = []
        update = data.dict(exclude_none=True)
        json_fields = {"reacciones", "comentarios"}
        if update:
            fields.append("fecha_edicion = %s")
            values.append(datetime.utcnow().isoformat())
        for key, val in update.items():
            fields.append(f"{key} = %s")
            values.append(json.dumps(val) if key in json_fields else val)
        if not fields:
            raise HTTPException(status_code=400, detail="Sin campos para actualizar")
        values.append(aviso_id)
        cur.execute(f"UPDATE avisos SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return {"message": "Aviso actualizado"}
    finally:
        cur.close()
        conn.close()

@app.delete("/avisos/{aviso_id}")
def eliminar_aviso(aviso_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM avisos WHERE id = %s", (aviso_id,))
        conn.commit()
        return {"message": "Aviso eliminado"}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# AGENDA PERSONAL
# ─────────────────────────────────────────────

@app.get("/agenda")
def obtener_agenda(uid: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM agenda_personal WHERE uid = %s ORDER BY fecha_inicio ASC", (uid,))
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.post("/agenda", status_code=201)
def crear_evento_personal(data: AgendaSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        evento_id = generate_id("agd_")
        fecha = datetime.utcnow().isoformat()
        cur.execute("""
            INSERT INTO agenda_personal (id, uid, titulo, descripcion, tipo, color,
                fecha_inicio, hora_inicio, fecha_fin, hora_fin, ubicacion, notas,
                completado, fecha_creacion, fecha_actualizacion)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            evento_id, data.uid, data.titulo, data.descripcion, data.tipo, data.color,
            data.fecha_inicio, data.hora_inicio, data.fecha_fin, data.hora_fin,
            data.ubicacion, data.notas, data.completado, fecha, fecha
        ))
        conn.commit()
        return {"id": evento_id, "fecha_creacion": fecha, **data.dict()}
    finally:
        cur.close()
        conn.close()

@app.put("/agenda/{evento_id}")
def actualizar_evento_personal(evento_id: str, data: AgendaUpdateSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        fields = ["fecha_actualizacion = %s"]
        values = [datetime.utcnow().isoformat()]
        update = data.dict(exclude_none=True)
        for key, val in update.items():
            fields.append(f"{key} = %s")
            values.append(val)
        values.append(evento_id)
        cur.execute(f"UPDATE agenda_personal SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return {"message": "Evento actualizado"}
    finally:
        cur.close()
        conn.close()

@app.delete("/agenda/{evento_id}")
def eliminar_evento_personal(evento_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM agenda_personal WHERE id = %s", (evento_id,))
        conn.commit()
        return {"message": "Evento eliminado"}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# PUBLICACIONES
# ─────────────────────────────────────────────

@app.get("/publicaciones")
def obtener_publicaciones(empresa_id: str, tipo_muro: str = "general", departamento_id: Optional[str] = None, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        if departamento_id:
            cur.execute("""
                SELECT * FROM publicaciones WHERE empresa_id = %s AND tipo_muro = %s
                AND departamento_id = %s ORDER BY fecha_creacion DESC
            """, (empresa_id, tipo_muro, departamento_id))
        else:
            cur.execute("""
                SELECT * FROM publicaciones WHERE empresa_id = %s AND tipo_muro = %s
                ORDER BY fecha_creacion DESC
            """, (empresa_id, tipo_muro))
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.post("/publicaciones", status_code=201)
def crear_publicacion(data: PublicacionSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        pub_id = generate_id("pub_")
        fecha = datetime.utcnow().isoformat()
        cur.execute("""
            INSERT INTO publicaciones (id, contenido, empresa_id, tipo_muro, departamento_id,
                nombre_departamento, creada_por, nombre_usuario, rol_usuario, fecha_creacion, fecha_actualizacion)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            pub_id, data.contenido, data.empresa_id, data.tipo_muro,
            data.departamento_id, data.nombre_departamento,
            data.creada_por, data.nombre_usuario, data.rol_usuario, fecha, fecha
        ))
        conn.commit()
        return {"id": pub_id, "fecha_creacion": fecha, **data.dict()}
    finally:
        cur.close()
        conn.close()

@app.put("/publicaciones/{pub_id}")
def actualizar_publicacion(pub_id: str, data: PublicacionUpdateSchema, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        fields = ["fecha_actualizacion = %s"]
        values = [datetime.utcnow().isoformat()]
        update = data.dict(exclude_none=True)
        json_fields = {"reacciones", "comentarios"}
        for key, val in update.items():
            fields.append(f"{key} = %s")
            values.append(json.dumps(val) if key in json_fields else val)
        values.append(pub_id)
        cur.execute(f"UPDATE publicaciones SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return {"message": "Publicación actualizada"}
    finally:
        cur.close()
        conn.close()

@app.delete("/publicaciones/{pub_id}")
def eliminar_publicacion(pub_id: str, current_user=Depends(get_current_user)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM publicaciones WHERE id = %s", (pub_id,))
        conn.commit()
        return {"message": "Publicación eliminada"}
    finally:
        cur.close()
        conn.close()

# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "WorkStation API", "version": "2.0.0"}