declare module 'markdown' {
  interface Markdown {
    toHTML(markdown: string, dialect?: string): string;
    parse(markdown: string, dialect?: string): any;
    toHTMLTree(markdown: string, dialect?: string): any;
    renderJsonML(jsonML: any): string;
  }
  
  const markdown: Markdown;
  export { markdown };
}
