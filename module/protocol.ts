export interface SourceInfo {
  file: string
  editorFile: string
  code: string
  requests: { name: string; url: string; line: number; kind: 'static'; file: string }[]
  dependencies: { from: string; file: string; name: string }[]
}
export interface RequestTrace {
  id: string
  path: string
  method: string
  status: number
  duration: number
  timestamp: number
  handler?: string
  serverDuration?: number
}
export interface ExplorerState {
  selection: { file: string; line: number; component: string } | null
  requests: RequestTrace[]
}
declare module 'devframe' {
  interface DevframeRpcServerFunctions {
    'vue-explorer:read-source': (file: string) => Promise<SourceInfo>
    'vue-explorer:record-request': (trace: RequestTrace) => Promise<void>
    'vue-explorer:clear-requests': () => Promise<void>
    'vue-explorer:analyze': (file: string) => Promise<import('./graph').ComponentGraph>
  }
  interface DevframeRpcSharedStates { 'vue-explorer:state': ExplorerState }
}
