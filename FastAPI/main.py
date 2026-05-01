from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="WorkStation API")

class Tarea(BaseModel):
    id: Optional[int] = None
    titulo: str
    descripcion: Optional[str] = ""
    prioridad: Optional[str] = "Media"
    estado: Optional[str] = "Pendiente"
    creadaPor: Optional[str] = ""
    nombreCreador: Optional[str] = ""
    empresaId: Optional[str] = ""
    asignadoA: Optional[List[str]] = []
    nombresAsignados: Optional[List[str]] = []

tareas: List[Tarea] = []

@app.get("/")
def inicio():
    return {"mensaje": "API FastAPI funcionando"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/tareas")
def crear_tarea(tarea: Tarea):
    nueva = Tarea(
        id=len(tareas) + 1,
        **tarea.model_dump(exclude={"id"})
    )
    tareas.append(nueva)
    return {"mensaje": "Tarea creada desde FastAPI", "tarea": nueva}

@app.get("/tareas")
def obtener_tareas():
    return {"total": len(tareas), "tareas": tareas}
