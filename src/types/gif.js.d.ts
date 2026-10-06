declare module "gif.js" {
  interface GifOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    background?: string;
    repeat?: number;
  }
  interface FrameOptions {
    copy?: boolean;
    delay?: number;
  }
  export default class GIF {
    constructor(options?: GifOptions);
    addFrame(
      image: CanvasRenderingContext2D | HTMLCanvasElement | HTMLImageElement,
      options?: FrameOptions,
    ): void;
    render(): void;
    on(event: "finished", cb: (blob: Blob) => void): void;
    on(event: "abort" | "start", cb: () => void): void;
    on(event: "progress", cb: (p: number) => void): void;
  }
}

declare module "gif.js/dist/gif.worker.js?url" {
  const url: string;
  export default url;
}
