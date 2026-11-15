/// <reference types="vite/client" />

declare module 'virtual:mdkb-data' {
  const data: import('./types/mdkb.ts').MdkbData
  export default data
}
