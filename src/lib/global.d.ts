// Global module declarations for CSS modules
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
