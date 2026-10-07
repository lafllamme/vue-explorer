import { inject, type InjectionKey, type ShallowRef } from 'vue'
import type { DevframeRpcClient } from 'devframe/client'
import type { ExplorerState } from '../protocol'

export interface ExplorerConnection {
  client: DevframeRpcClient | null
  status: ShallowRef<string>
  state: ShallowRef<ExplorerState>
  select: (selection: ExplorerState['selection']) => void
}
export const connectionKey: InjectionKey<ExplorerConnection> = Symbol('vue-explorer-connection')
export function useExplorerConnection() {
  const connection = inject(connectionKey)
  if (!connection) throw new Error('Vue Explorer connection is missing.')
  return connection
}
