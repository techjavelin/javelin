/**
 * Custom ESLint rule: require-auth-mode
 * Ensures any usage of client.models.<Model>.<op>(...) includes either:
 *  - an auth wrapper helper (withUserAuth / withPublic / withAuth) in the argument object, OR
 *  - an inline authMode property
 *
 * Heuristic-based (string/AST) — aims to prevent accidental omission when default flips.
 */
'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require explicit authMode or helper wrapper for Amplify Data model operations',
    },
    schema: [],
    messages: {
      missingAuth: 'Amplify Data call missing explicit authMode or withUserAuth/withPublic/withAuth helper.'
    }
  },
  create(context) {
    function isTargetCallee(node) {
      // Match: client.models.X.someOp
      if (node.type !== 'MemberExpression') return false;
      const prop = node.property;
      if (!prop || prop.type !== 'Identifier') return false;
      const parentObj = node.object; // client.models.X
      if (parentObj.type !== 'MemberExpression') return false;
      const maybeModel = parentObj.object; // client.models
      if (maybeModel.type !== 'MemberExpression') return false;
      // Very loose pattern: *.models.<Model>
      const modelsIdent = maybeModel.property;
      if (!modelsIdent || modelsIdent.type !== 'Identifier' || modelsIdent.name !== 'models') return false;
      return true;
    }

    function argHasAuthMode(arg) {
      if (!arg) return false;
      if (arg.type === 'ObjectExpression') {
        return arg.properties.some(p => p.type === 'Property' && p.key.type === 'Identifier' && p.key.name === 'authMode');
      }
      // Calls like withUserAuth({...})
      if (arg.type === 'CallExpression') {
        if (arg.callee.type === 'Identifier' && ['withUserAuth','withPublic','withAuth'].includes(arg.callee.name)) return true;
      }
      return false;
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!isTargetCallee(callee)) return;
        // Inspect first arg only (list/get/create/update/delete patterns) — if none, warn.
        const firstArg = node.arguments[0];
        if (!argHasAuthMode(firstArg)) {
          context.report({ node, messageId: 'missingAuth' });
        }
      }
    };
  }
};
