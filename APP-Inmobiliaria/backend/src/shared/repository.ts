export interface Repository<T> {
  findAll(): T[] | undefined //devuelve un array de objetos o undefined si no hay elementos
  findOne(item: { id: string }): T | undefined //devuelve un objeto o undefined si no existe
  add(item: T): T | undefined //devuelve el objeto añadido o undefined si no se pudo añadir
  update(item: T): T | undefined //devuelve el objeto actualizado o undefined si no se pudo actualizar
  delete(item: { id: string }): T | undefined //devuelve el objeto eliminado o undefined si no se pudo eliminar
}
