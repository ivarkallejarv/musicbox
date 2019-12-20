import { Type } from 'typescript'

declare global {
  export interface Window {
    WebAudioFontPlayer: Type<WebAudioFontPlayer>
    captureAudio(event: any): any
  }
}
