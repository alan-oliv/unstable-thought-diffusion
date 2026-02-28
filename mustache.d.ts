declare module 'mustache' {
  function render(template: string, view: object, partials?: object): string;
  let escape: (text: string) => string;
}
