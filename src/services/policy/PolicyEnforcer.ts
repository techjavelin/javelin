export interface PolicyEnforcer {
  canAccess(resource: string, action: string, context: any): Promise<boolean>;
  // Extend with more methods as needed
}
