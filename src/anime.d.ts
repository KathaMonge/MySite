declare module 'animejs' {
  interface AnimeParams {
    targets?: string | HTMLElement | NodeList | HTMLElement[];
    duration?: number;
    delay?: number | number[] | ((el: HTMLElement, index: number, len: number) => number);
    opacity?: number | number[];
    easing?: string;
    complete?: (anim: unknown) => void;
    [key: string]: unknown;
  }

  interface AnimeInstance {
    play: () => void;
    pause: () => void;
    restart: () => void;
    reverse: () => void;
    seek: (time: number) => void;
    finished: Promise<void>;
  }

  interface AnimeStatic {
    (params: AnimeParams): AnimeInstance;
    stagger(
      value: number,
      options?: { grid?: number[]; from?: string | number; axis?: string }
    ): number[];
  }

  const anime: AnimeStatic;
  export default anime;
}
