import type { PolicyEnforcer } from './PolicyEnforcer';
import { CedarPolicyEnforcer } from './CedarPolicyEnforcer';

let policyEnforcer: PolicyEnforcer = new CedarPolicyEnforcer();

export function setPolicyEnforcer(enforcer: PolicyEnforcer) {
  policyEnforcer = enforcer;
}

export function getPolicyEnforcer(): PolicyEnforcer {
  return policyEnforcer;
}
