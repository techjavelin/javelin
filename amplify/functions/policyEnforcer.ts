// Backend DI PolicyEnforcer pattern for Lambda and schema model usage
export interface PolicyEnforcer {
  canAccess(resource: string, action: string, context: any): Promise<boolean>;
}

export class CedarPolicyEnforcer implements PolicyEnforcer {
  async canAccess(resource: string, action: string, context: any): Promise<boolean> {
    // TODO: Integrate with Cedar backend
    return true; // stub
  }
}

let policyEnforcer: PolicyEnforcer = new CedarPolicyEnforcer();

export function setPolicyEnforcer(enforcer: PolicyEnforcer) {
  policyEnforcer = enforcer;
}

export function getPolicyEnforcer(): PolicyEnforcer {
  return policyEnforcer;
}
