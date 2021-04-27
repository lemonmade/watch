declare module 'raw-loader!*' {
  const contents: string;
  export default contents;
}

declare module '*.module.css' {
  const classnames: {[key: string]: string};
  export default classnames;
}

declare module '*.png' {
  const classnames: {[key: string]: string};
  export default classnames;
}
