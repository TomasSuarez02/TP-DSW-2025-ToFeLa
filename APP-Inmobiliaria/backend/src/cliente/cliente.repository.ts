import { Repository } from '../shared/repository.js'
import { Cliente } from './cliente.entity.js'

const clientes = [
  new Cliente(
    'Lautaro',
    'Goyoaga',
    'lautarogoyoaga@gmail.com',
    '3413382583',
    '1'
  ),
]

export class ClienteRepository implements Repository<Cliente> {
  public findAll(): Cliente[] | undefined {
    return clientes
  }

  public findOne(item: { id: string }): Cliente | undefined {
    return clientes.find((cliente) => cliente.id === item.id)
  }

  public add(item: Cliente): Cliente | undefined {
    clientes.push(item)
    return item
  }

  public update(item: Cliente): Cliente | undefined {
    const clienteIdx = clientes.findIndex((cliente) => cliente.id === item.id)

    if (clienteIdx !== -1) {
      clientes[clienteIdx] = { ...clientes[clienteIdx], ...item }
    }
    return clientes[clienteIdx]
  }

  public delete(item: { id: string }): Cliente | undefined {
    const clienteIdx = clientes.findIndex((cliente) => cliente.id === item.id)

    if (clienteIdx !== -1) {
      const deletedclientes = clientes[clienteIdx]
      clientes.splice(clienteIdx, 1)
      return deletedclientes
    }
  }
}
