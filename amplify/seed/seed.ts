import type { Schema } from "../data/resource";
import { readFile } from "node:fs/promises";
import {
  addToUserGroup,
  createAndSignUpUser,
  getSecret,
  signInUser,
} from "@aws-amplify/seed";
import { Amplify } from "aws-amplify";
import * as auth from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

// Load Amplify configuration

const url = new URL("../../amplify_outputs.json", import.meta.url);
const outputs = JSON.parse(await readFile(url, { encoding: "utf8" }));
console.log("[SEED] Amplify outputs loaded:", outputs);
Amplify.configure(outputs);

const dataClient = generateClient<Schema>();

// Helper function to delete a user from Cognito
async function deleteUser(username: string): Promise<boolean> {
  try {
    const cognitoClient = new CognitoIdentityProviderClient({
      region: outputs.auth?.aws_region,
    });
    
    await cognitoClient.send(new AdminDeleteUserCommand({
      UserPoolId: outputs.auth?.user_pool_id,
      Username: username,
    }));
    
    return true;
  } catch (error) {
    console.error(`❌ Error deleting user ${username}:`, error);
    return false;
  }
}

console.log("🌱 Starting seed process...");

// --- Ensure admin user exists & signed in BEFORE entitlement seeding (because entitlement models require admin group for writes) ---
let __adminBootstrapDone = false;
async function ensureAdminBootstrap() {
  if (__adminBootstrapDone) return;
  const adminUsername = 'admin@techjavelin.com';
  const adminPassword = 'TechJavelin2025!';
  try {
    await signInUser({ username: adminUsername, password: adminPassword, signInFlow: 'Password' });
    console.log('🔐 Admin user sign-in successful (pre-entitlement bootstrap)');
  } catch (e) {
    console.log('ℹ️ Admin pre-bootstrap sign-in failed; attempting creation...');
    try {
      const newAdmin = await createAndSignUpUser({
        username: adminUsername,
        password: adminPassword,
        signInAfterCreation: true,
        signInFlow: 'Password',
        userAttributes: { givenName: 'Tech', familyName: 'Javelin' }
      });
      console.log('✅ Admin user created during bootstrap');
      try { await addToUserGroup(newAdmin, 'admin'); console.log('✅ Admin user added to admin group (bootstrap)'); } catch { console.log('ℹ️ Could not add admin to group during bootstrap (group may not exist yet)'); }
    } catch (ce) {
      console.error('❌ Failed to create admin during bootstrap; entitlement seeding may fail due to auth rules.', ce);
    }
  }
  __adminBootstrapDone = true;
}

await ensureAdminBootstrap();

// --- Entitlement Catalog Seeding (idempotent) ---
async function seedEntitlements() {
  console.log("🧩 Seeding entitlement catalog...");
  try {
    // Guard: make sure model proxies exist (schema deployed)
    if (!dataClient.models?.Product) {
      console.error('❌ Product model not available on dataClient. Ensure sandbox is restarted with latest schema (npx ampx sandbox).');
      return;
    }
    // Simple existence checks by listing a few items
    const existingProducts = await dataClient.models.Product.list({ authMode: 'userPool' });
    if (existingProducts.data && existingProducts.data.length > 0) {
      console.log('ℹ️ Entitlement catalog appears seeded (products exist). Skipping.');
      return;
    }

    // Service Levels
    const serviceLevels = [
      { key: 'FREE', name: 'Free', description: 'Free tier', rank: 1 },
      { key: 'PRO', name: 'Pro', description: 'Professional tier', rank: 2 },
      { key: 'ENT', name: 'Enterprise', description: 'Enterprise tier', rank: 3 }
    ];
    const slMap: Record<string, string> = {};
    for (const sl of serviceLevels) {
      const res = await dataClient.models.ServiceLevel.create(sl, { authMode: 'userPool' });
      if (res.data) {
        slMap[sl.key] = res.data.id;
        console.log(`✅ ServiceLevel: ${sl.key}`);
      } else {
        console.warn('⚠️ Failed to create service level', sl.key, res.errors);
      }
    }

    // Product
    const productRes = await dataClient.models.Product.create({ key: 'PULSE', name: 'Pulse Platform', description: 'Pulse security intelligence platform' }, { authMode: 'userPool' });
    if (!productRes.data) {
      console.error('❌ Failed to create product PULSE', productRes.errors);
      return;
    }
    const pulseProductId = productRes.data.id;
    console.log('✅ Product: PULSE');

    // Features (example subset)
    const featureDefs = [
      { key: 'PULSE_DASHBOARD', name: 'Pulse Dashboard', productId: pulseProductId, defaultInServiceLevels: ['FREE','PRO','ENT'], description: 'Core dashboard overview' },
      { key: 'ADV_REPORTS', name: 'Advanced Reports', productId: pulseProductId, defaultInServiceLevels: ['PRO','ENT'], description: 'Advanced analytical reporting' },
      { key: 'PRIORITY_SUPPORT', name: 'Priority Support', productId: pulseProductId, defaultInServiceLevels: ['ENT'], description: 'Priority SLA support' }
    ];
    const featureKeys: Record<string,string> = {};
    for (const f of featureDefs) {
      const res = await dataClient.models.Feature.create(f, { authMode: 'userPool' });
      if (res.data) {
        featureKeys[f.key] = f.key;
        console.log(`✅ Feature: ${f.key}`);
      } else {
        console.warn('⚠️ Failed to create feature', f.key, res.errors);
      }
    }

    // Plans (map service levels directly)
    const planDefs = [
      {
        key: 'PULSE_FREE', name: 'Pulse Free', productId: pulseProductId,
        serviceLevelId: slMap['FREE'], featureKeys: ['PULSE_DASHBOARD'], addOnFeatureKeys: [], isDefault: true
      },
      {
        key: 'PULSE_PRO', name: 'Pulse Pro', productId: pulseProductId,
        serviceLevelId: slMap['PRO'], featureKeys: ['PULSE_DASHBOARD','ADV_REPORTS'], addOnFeatureKeys: [], isDefault: true
      },
      {
        key: 'PULSE_ENT', name: 'Pulse Enterprise', productId: pulseProductId,
        serviceLevelId: slMap['ENT'], featureKeys: ['PULSE_DASHBOARD','ADV_REPORTS','PRIORITY_SUPPORT'], addOnFeatureKeys: [], isDefault: true
      }
    ];
    const planIds: Record<string,string> = {};
    for (const p of planDefs) {
      const res = await dataClient.models.EntitlementPlan.create(p, { authMode: 'userPool' });
      if (res.data) {
        planIds[p.key] = res.data.id;
        console.log(`✅ Plan: ${p.key}`);
      } else {
        console.warn('⚠️ Failed to create plan', p.key, res.errors);
      }
    }

    // Assign default FREE plan to existing organizations (if any)
    const orgs = await dataClient.models.Organization.list({ authMode: 'userPool' });
    if (orgs.data) {
      for (const org of orgs.data) {
        if (!org) continue;
        // Check if entitlement exists already
        const existingEnts = await dataClient.models.OrganizationEntitlement.list({ filter: { organizationId: { eq: org.id } }, authMode: 'userPool' });
        if (existingEnts.data && existingEnts.data.length > 0) {
          console.log(`ℹ️ Org ${org.name} already has entitlement(s)`);
          continue;
        }
        const entRes = await dataClient.models.OrganizationEntitlement.create({
          organizationId: org.id,
          entitlementPlanId: planIds['PULSE_FREE'],
          status: 'ACTIVE',
          effectiveFrom: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { authMode: 'userPool' });
        if (entRes.data) console.log(`✅ Assigned FREE plan to org ${org.name}`); else console.warn('⚠️ Failed to assign plan to org', org.name, entRes.errors);
      }
    }

    console.log('🎯 Entitlement catalog seeding complete');
  } catch (err) {
    console.error('❌ Entitlement seeding failed', err);
  }
}

await seedEntitlements();

// --- Additional Test Orgs & Entitlements (after base catalog) ---
async function seedTestEntitlementOrganizations() {
  console.log("🧪 Seeding test organizations & entitlement scenarios...");
  try {
    if (!dataClient.models?.EntitlementPlan || !dataClient.models?.OrganizationEntitlement || !dataClient.models?.Organization) {
      console.log('ℹ️ Entitlement-related models not available (schema likely not deployed yet) – skipping test entitlement org seeding.');
      return;
    }
    // Ensure plans exist (catalog might have been skipped if already seeded)
    const plansRes = await dataClient.models.EntitlementPlan.list({ authMode: 'userPool' });
    if (!plansRes.data || plansRes.data.length === 0) {
      console.log('ℹ️ No entitlement plans found; skipping test entitlement org seeding.');
      return;
    }
    const planIdByKey: Record<string,string> = {};
    for (const p of plansRes.data) { if (p) planIdByKey[p.key] = p.id; }

    const adminEmail = 'admin@techjavelin.com';
    // Try to sign-in as admin to ensure auth context (ignore errors silently)
    try { await signInUser({ username: adminEmail, password: 'TechJavelin2025!', signInFlow: 'Password' }); } catch {}

    // Helper: fetch (or create) org by name
    async function getOrCreateOrg(name: string, adminUserId?: string) {
      const existing = await dataClient.models.Organization.list({ authMode: 'userPool' });
      const found = existing.data?.find(o => o?.name === name);
      if (found) return found;
      // Fallback: create with placeholder admins/members if user id unknown
      const orgRes = await dataClient.models.Organization.create({
        name,
        admins: adminUserId ? [adminUserId] : [],
        members: adminUserId ? [adminUserId] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { authMode: 'userPool' });
      if (!orgRes.data) {
        console.warn('⚠️ Failed to create test org', name, orgRes.errors);
        return undefined;
      }
      console.log(`✅ Created test org: ${name}`);
      return orgRes.data;
    }

    // Attempt to discover admin userId (Cognito sub) by creating a temp self org or via existing org membership
    let adminUserId: string | undefined;
    try {
      const { getCurrentUser } = await import('aws-amplify/auth');
      const u = await getCurrentUser();
      adminUserId = (u as any)?.userId;
    } catch {}

    const testMatrix: Array<{ name: string; planKey: string; add?: string[]; remove?: string[]; extraExpired?: boolean; }> = [
      { name: 'Pulse Free Test Org', planKey: 'PULSE_FREE' },
      { name: 'Pulse Pro Test Org', planKey: 'PULSE_PRO', extraExpired: true },
      { name: 'Pulse Ent Test Org', planKey: 'PULSE_ENT' },
      { name: 'Pulse Free+Overrides Org', planKey: 'PULSE_FREE', add: ['ADV_REPORTS'] },
      { name: 'Pulse Pro-Overrides Org', planKey: 'PULSE_PRO', remove: ['ADV_REPORTS'] }
    ];

    const entitlementSummaries: Array<{ org: string; plan: string; overridesAdd?: string[]; overridesRemove?: string[]; historyExpired?: boolean; orgId: string; }> = [];

    for (const cfg of testMatrix) {
      const org = await getOrCreateOrg(cfg.name, adminUserId);
      if (!org) continue;

      // Check if ACTIVE entitlement already exists
      const existingEnts = await dataClient.models.OrganizationEntitlement.list({
        filter: { organizationId: { eq: org.id } },
        authMode: 'userPool'
      });
      const hasActive = existingEnts.data?.some(e => e?.status === 'ACTIVE');
      if (hasActive) {
        console.log(`ℹ️ Org ${cfg.name} already has an ACTIVE entitlement – skipping new ACTIVE record.`);
        continue;
      }

      const planId = planIdByKey[cfg.planKey];
      if (!planId) {
        console.warn(`⚠️ Plan key ${cfg.planKey} not found; skipping org ${cfg.name}`);
        continue;
      }

      const now = new Date();
      const entRes = await dataClient.models.OrganizationEntitlement.create({
        organizationId: org.id,
        entitlementPlanId: planId,
        status: 'ACTIVE',
        effectiveFrom: now.toISOString(),
        overrides_addFeatures: cfg.add?.length ? cfg.add : undefined,
        overrides_removeFeatures: cfg.remove?.length ? cfg.remove : undefined,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }, { authMode: 'userPool' });
      if (entRes.data) {
        console.log(`✅ Assigned ${cfg.planKey} to ${cfg.name}${cfg.add || cfg.remove ? ' (with overrides)' : ''}`);
        entitlementSummaries.push({ org: cfg.name, plan: cfg.planKey, overridesAdd: cfg.add, overridesRemove: cfg.remove, historyExpired: !!cfg.extraExpired, orgId: org.id });

        // Create audit record for plan assignment + overrides
        try {
          await dataClient.models.EntitlementAudit.create({
            organizationId: org.id,
            action: 'ASSIGN_PLAN',
            actor: adminEmail,
            before: null,
            after: { planKey: cfg.planKey, overridesAdd: cfg.add, overridesRemove: cfg.remove },
            ts: new Date().toISOString()
          }, { authMode: 'userPool' });
        } catch (auditErr) {
          console.warn('⚠️ Failed to write audit (ASSIGN_PLAN) for', cfg.name, auditErr);
        }
        if (cfg.add || cfg.remove) {
          try {
            await dataClient.models.EntitlementAudit.create({
              organizationId: org.id,
              action: 'OVERRIDE_FEATURES',
              actor: adminEmail,
              before: null,
              after: { add: cfg.add, remove: cfg.remove },
              ts: new Date().toISOString()
            }, { authMode: 'userPool' });
          } catch (auditErr2) {
            console.warn('⚠️ Failed to write audit (OVERRIDE_FEATURES) for', cfg.name, auditErr2);
          }
        }
      } else {
        console.warn('⚠️ Failed creating entitlement for org', cfg.name, entRes.errors);
      }

      // Optionally create an expired historical entitlement for demo/history
      if (cfg.extraExpired) {
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const expired = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // yesterday
        const freePlanId = planIdByKey['PULSE_FREE'];
        if (freePlanId) {
          const hist = await dataClient.models.OrganizationEntitlement.create({
            organizationId: org.id,
            entitlementPlanId: freePlanId,
            status: 'EXPIRED',
            effectiveFrom: past.toISOString(),
            expiresAt: expired.toISOString(),
            createdAt: past.toISOString(),
            updatedAt: expired.toISOString()
          }, { authMode: 'userPool' });
          if (hist.data) {
            console.log(`🗃️ Added historical EXPIRED FREE entitlement for ${cfg.name}`);
            try {
              await dataClient.models.EntitlementAudit.create({
                organizationId: org.id,
                action: 'CHANGE_STATUS',
                actor: adminEmail,
                before: { planKey: 'PULSE_FREE', status: 'ACTIVE' },
                after: { planKey: 'PULSE_FREE', status: 'EXPIRED' },
                ts: new Date().toISOString()
              }, { authMode: 'userPool' });
            } catch (auditErr3) {
              console.warn('⚠️ Failed to write audit (CHANGE_STATUS) for', cfg.name, auditErr3);
            }
          }
        }
      }
    }

    console.log('🎯 Test entitlement org seeding complete');

    // Attach first created org custom attribute to admin/user for token enrichment demo
    try {
      if (entitlementSummaries.length > 0) {
        const first = entitlementSummaries[0];
        // We leverage AdminUpdateUserAttributes via Cognito SDK
        const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        const cognito = new CognitoIdentityProviderClient({ region: outputs.auth?.aws_region });
        const updates = [ 'admin@techjavelin.com', 'user@example.com' ];
        for (const username of updates) {
          try {
            await cognito.send(new AdminUpdateUserAttributesCommand({
              UserPoolId: outputs.auth?.user_pool_id,
              Username: username,
              UserAttributes: [ { Name: 'custom:orgId', Value: first.orgId } ]
            }));
            console.log(`🔗 Attached orgId (${first.orgId}) to ${username}`);
          } catch (attrErr) {
            console.warn(`⚠️ Failed attaching orgId to ${username}`, attrErr);
          }
        }
      }
    } catch (attachErr) {
      console.warn('⚠️ Could not attach orgId custom attribute to users', attachErr);
    }

    // Summary printout
    console.log('\n📦 Entitlement Test Summary');
    for (const s of entitlementSummaries) {
      console.log(` • ${s.org} => ${s.plan}` +
        (s.overridesAdd?.length ? ` (+${s.overridesAdd.join(',')})` : '') +
        (s.overridesRemove?.length ? ` (-${s.overridesRemove.join(',')})` : '') +
        (s.historyExpired ? ' [has expired history]' : ''));
    }
    console.log('— End Entitlement Summary —');
  } catch (err) {
    console.error('❌ Test entitlement org seeding failed', err);
  }
}

await seedTestEntitlementOrganizations();

// Admin creation block moved earlier (bootstrap). Retained here only if bootstrap failed.
if (!__adminBootstrapDone) {
  console.log('⚠️ Admin bootstrap not completed earlier; running fallback admin creation block...');
  let adminUser; let adminExists = false;
  try {
    await signInUser({ username: 'admin@techjavelin.com', password: 'TechJavelin2025!', signInFlow: 'Password' });
    console.log('ℹ️  Admin user already exists and password is correct');
    adminExists = true;
    try { await addToUserGroup({ username: 'admin@techjavelin.com' }, 'admin'); console.log('✅ Admin user added to admin group (post sign-in check)'); } catch {}
    auth.signOut();
  } catch {
    try {
      adminUser = await createAndSignUpUser({ username: 'admin@techjavelin.com', password: 'TechJavelin2025!', signInAfterCreation: false, signInFlow: 'Password', userAttributes: { givenName: 'Tech', familyName: 'Javelin' } });
      console.log('✅ Admin user created successfully (fallback)');
      if (adminUser) { try { await addToUserGroup(adminUser, 'admin'); console.log('✅ Admin user added to admin group'); } catch {} }
    } catch (e) {
      console.error('❌ Fallback admin creation failed', e);
    }
  }
  try { await addToUserGroup({ username: 'admin@techjavelin.com' }, 'admin'); } catch {}
}

// Create Regular User (or use existing)
console.log("👤 Creating regular user...");
let regularUser;

try {
  // Try to sign in first to check if user already exists
  await signInUser({
    username: "user@example.com",
    password: "RegularUser2025!",
    signInFlow: "Password",
  });
  console.log("ℹ️  Regular user already exists and password is correct");
  // Always try to add user to user group after sign-in check
  try {
  await addToUserGroup({ username: "user@example.com" }, "user");
    console.log("✅ Regular user added to user group (post sign-in check)");
  } catch (err) {
    console.log("ℹ️  User group may not exist, skipping group assignment");
  }
  auth.signOut(); // Sign out after checking
} catch (signInError) {
  // If sign in fails, try to create the user
  try {
    regularUser = await createAndSignUpUser({
      username: "user@example.com",
      password: "RegularUser2025!",
      signInAfterCreation: false,
      signInFlow: "Password",
      userAttributes: {
        givenName: "John",
        familyName: "Doe",
      },
    });
    console.log("✅ Regular user created successfully");
  } catch (createError) {
    const error = createError as Error;
    if (error.name === "UsernameExistsError" || error.message.includes("already exists") || error.message.includes("Cannot modify an already provided email")) {
      console.log("ℹ️  Regular user already exists but password might be different, skipping creation");
    } else {
      console.error("❌ Error creating regular user:", error);
      throw error;
    }
  }
}

// Always try to add user to user group after all creation paths
try {
  await addToUserGroup({ username: "user@example.com" }, "user");
  console.log("✅ Regular user added to user group (final check)");
} catch (err) {
  console.log("ℹ️  User group may not exist, skipping group assignment");
}

// Seed Blog Data
console.log("📝 Seeding blog data...");

// Try to sign in with admin first, then fall back to regular user
let signedInUser = null;
let isAdmin = false;

try {
  await signInUser({
    username: "admin@techjavelin.com",
    password: "TechJavelin2025!",
    signInFlow: "Password",
  });
  console.log("✅ Signed in as admin");
  signedInUser = "admin@techjavelin.com";
  isAdmin = true;
} catch (adminSignInError) {
  console.log("⚠️  Admin login failed, trying regular user...");
  
  try {
    await signInUser({
      username: "user@example.com",
      password: "RegularUser2025!",
      signInFlow: "Password",
    });
    console.log("✅ Signed in as regular user");
    signedInUser = "user@example.com";
    isAdmin = false;
  } catch (userSignInError) {
    console.log("❌ Could not sign in with either user, skipping blog seeding");
    console.log("💡 To fix this, delete your sandbox and recreate it: npx ampx sandbox delete");
    signedInUser = null;
  }
}

if (signedInUser) {

  // Clean up existing blog data
  console.log("🧹 Cleaning up existing blog data...");
  
  try {
    // Delete blog posts and related data
    console.log("🗑️  Deleting existing blog posts...");
    const existingPosts = await dataClient.models.BlogPost.list({
      authMode: "userPool",
    });
    
    if (existingPosts.data && existingPosts.data.length > 0) {
      console.log(`Found ${existingPosts.data.length} existing blog posts to delete`);
      
      for (const post of existingPosts.data) {
        try {
          // Delete post-tag relationships first
          const postTags = await dataClient.models.PostTag.list({
            filter: { postId: { eq: post.id } },
            authMode: "userPool",
          });
          
          for (const postTag of postTags.data || []) {
            await dataClient.models.PostTag.delete({ id: postTag.id }, {
              authMode: "userPool",
            });
          }

          // Delete post-category relationships
          const postCategories = await dataClient.models.PostCategory.list({
            filter: { postId: { eq: post.id } },
            authMode: "userPool",
          });
          
          for (const postCategory of postCategories.data || []) {
            await dataClient.models.PostCategory.delete({ id: postCategory.id }, {
              authMode: "userPool",
            });
          }

          // Delete comments
          const comments = await dataClient.models.Comment.list({
            filter: { postId: { eq: post.id } },
            authMode: "userPool",
          });
          
          for (const comment of comments.data || []) {
            await dataClient.models.Comment.delete({ id: comment.id }, {
              authMode: "userPool",
            });
          }

          // Delete the blog post
          await dataClient.models.BlogPost.delete({ id: post.id }, {
            authMode: "userPool",
          });
        } catch (deleteError) {
          console.log(`⚠️  Could not delete post ${post.id}:`, deleteError);
        }
      }
      console.log("✅ Blog posts deleted");
    } else {
      console.log("ℹ️  No existing blog posts found");
    }

    // Delete authors
    console.log("🗑️  Deleting existing authors...");
    const existingAuthors = await dataClient.models.Author.list({
      authMode: "userPool",
    });
    
    if (existingAuthors.data && existingAuthors.data.length > 0) {
      console.log(`Found ${existingAuthors.data.length} existing authors to delete`);
      
      for (const author of existingAuthors.data) {
        try {
          await dataClient.models.Author.delete({ id: author.id }, {
            authMode: "userPool",
          });
        } catch (deleteError) {
          console.log(`⚠️  Could not delete author ${author.id}:`, deleteError);
        }
      }
      console.log("✅ Authors deleted");
    } else {
      console.log("ℹ️  No existing authors found");
    }

    // Delete tags
    console.log("🗑️  Deleting existing tags...");
    const existingTags = await dataClient.models.Tag.list({
      authMode: "userPool",
    });
    
    if (existingTags.data && existingTags.data.length > 0) {
      console.log(`Found ${existingTags.data.length} existing tags to delete`);
      
      for (const tag of existingTags.data) {
        try {
          await dataClient.models.Tag.delete({ id: tag.id }, {
            authMode: "userPool",
          });
        } catch (deleteError) {
          console.log(`⚠️  Could not delete tag ${tag.id}:`, deleteError);
        }
      }
      console.log("✅ Tags deleted");
    } else {
      console.log("ℹ️  No existing tags found");
    }

    // Delete categories
    console.log("🗑️  Deleting existing categories...");
    const existingCategories = await dataClient.models.Category.list({
      authMode: "userPool",
    });
    
    if (existingCategories.data && existingCategories.data.length > 0) {
      console.log(`Found ${existingCategories.data.length} existing categories to delete`);
      
      for (const category of existingCategories.data) {
        try {
          await dataClient.models.Category.delete({ id: category.id }, {
            authMode: "userPool",
          });
        } catch (deleteError) {
          console.log(`⚠️  Could not delete category ${category.id}:`, deleteError);
        }
      }
      console.log("✅ Categories deleted");
    } else {
      console.log("ℹ️  No existing categories found");
    }

    // Delete newsletter subscriptions
    console.log("🗑️  Deleting existing newsletter subscriptions...");
    const existingNewsletters = await dataClient.models.Newsletter.list({
      authMode: "userPool",
    });
    
    if (existingNewsletters.data && existingNewsletters.data.length > 0) {
      console.log(`Found ${existingNewsletters.data.length} existing newsletter subscriptions to delete`);
      
      for (const newsletter of existingNewsletters.data) {
        try {
          await dataClient.models.Newsletter.delete({ id: newsletter.id }, {
            authMode: "userPool",
          });
        } catch (deleteError) {
          console.log(`⚠️  Could not delete newsletter ${newsletter.id}:`, deleteError);
        }
      }
      console.log("✅ Newsletter subscriptions deleted");
    } else {
      console.log("ℹ️  No existing newsletter subscriptions found");
    }

    // Delete blog analytics
    console.log("🗑️  Deleting existing blog analytics...");
    const existingAnalytics = await dataClient.models.BlogAnalytics.list({
      authMode: "userPool",
    });
    
    if (existingAnalytics.data && existingAnalytics.data.length > 0) {
      console.log(`Found ${existingAnalytics.data.length} existing analytics records to delete`);
      
      for (const analytics of existingAnalytics.data) {
        try {
          await dataClient.models.BlogAnalytics.delete({ id: analytics.id }, {
            authMode: "userPool",
          });
        } catch (deleteError) {
          console.log(`⚠️  Could not delete analytics ${analytics.id}:`, deleteError);
        }
      }
      console.log("✅ Blog analytics deleted");
    } else {
      console.log("ℹ️  No existing blog analytics found");
    }

    console.log("✅ Cleanup completed successfully");
    
    // Add a small delay to ensure all deletions are processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (cleanupError) {
    console.error("❌ Error during cleanup:", cleanupError);
    console.log("⚠️  Continuing with seeding despite cleanup errors...");
  }

  // Create Authors
  console.log("👨‍💼 Creating authors...");
  const authors = [];
  
  const authorData = [
    {
      name: "Tech Javelin Team",
      email: "admin@techjavelin.com",
      bio: "The expert team at Tech Javelin bringing you the latest insights in technology and cybersecurity.",
      avatarUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&h=150&fit=crop&crop=faces",
      website: "https://techjavelin.com",
      twitterHandle: "@techjavelin",
      linkedinProfile: "https://linkedin.com/company/techjavelin",
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      name: "Sarah Johnson",
      email: "sarah@techjavelin.com",
      bio: "Cybersecurity expert with over 10 years of experience in threat analysis and prevention.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b332c3a0?w=150&h=150&fit=crop&crop=faces",
      linkedinProfile: "https://linkedin.com/in/sarah-johnson-security",
      isActive: true,
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
    {
      name: "Mike Chen",
      email: "mike@techjavelin.com",
      bio: "Cloud infrastructure specialist helping businesses scale their technology solutions.",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
      twitterHandle: "@mike_chen_tech",
      githubProfile: "https://github.com/mikechen",
      isActive: true,
      joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    }
  ];

  for (const authorInfo of authorData) {
    try {
      const author = await dataClient.models.Author.create(authorInfo, {
        authMode: "userPool",
      });
      
      if (author.errors && author.errors.length > 0) {
        console.error("❌ Error creating author:", author.errors);
      } else {
        authors.push(author.data);
        console.log(`✅ Created author: ${authorInfo.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create author ${authorInfo.name}:`, error);
    }
  }

  // Create Categories
  console.log("📂 Creating categories...");
  const categories = [];
  
  const categoryData = [
    {
      name: "Cybersecurity",
      slug: "cybersecurity",
      description: "Latest trends and best practices in cybersecurity",
      color: "#dc2626"
    },
    {
      name: "Cloud Computing",
      slug: "cloud-computing", 
      description: "Cloud infrastructure, services, and migration strategies",
      color: "#2563eb"
    },
    {
      name: "IT Strategy",
      slug: "it-strategy",
      description: "Strategic technology planning and implementation",
      color: "#059669"
    },
    {
      name: "Digital Transformation",
      slug: "digital-transformation",
      description: "Modernizing business processes through technology",
      color: "#7c3aed"
    }
  ];

  for (const categoryInfo of categoryData) {
    try {
      const category = await dataClient.models.Category.create(categoryInfo, {
        authMode: "userPool",
      });
      
      if (category.errors && category.errors.length > 0) {
        console.error("❌ Error creating category:", category.errors);
      } else {
        categories.push(category.data);
        console.log(`✅ Created category: ${categoryInfo.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create category ${categoryInfo.name}:`, error);
    }
  }

  // Create Tags
  console.log("🏷️ Creating tags...");
  const tags = [];
  
  const tagData = [
    { name: "Security", slug: "security", color: "#dc2626" },
    { name: "Cloud", slug: "cloud", color: "#2563eb" },
    { name: "AWS", slug: "aws", color: "#f59e0b" },
    { name: "Best Practices", slug: "best-practices", color: "#059669" },
    { name: "Tutorial", slug: "tutorial", color: "#7c3aed" },
    { name: "Case Study", slug: "case-study", color: "#dc2626" },
    { name: "Technology Trends", slug: "technology-trends", color: "#2563eb" },
    { name: "Business", slug: "business", color: "#059669" },
  ];

  for (const tagInfo of tagData) {
    try {
      const tag = await dataClient.models.Tag.create(tagInfo, {
        authMode: "userPool",
      });
      
      if (tag.errors && tag.errors.length > 0) {
        console.error("❌ Error creating tag:", tag.errors);
      } else {
        tags.push(tag.data);
        console.log(`✅ Created tag: ${tagInfo.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create tag ${tagInfo.name}:`, error);
    }
  }

  // Create Blog Posts
  console.log("📄 Creating blog posts...");
  
  if (authors.length > 0) {
    const blogPosts = [
      {
        title: "The Ultimate Guide to Cybersecurity in 2025",
        slug: "ultimate-guide-cybersecurity-2025",
        summary: "Comprehensive guide covering the latest cybersecurity threats, best practices, and protection strategies for businesses in 2025.",
        content: `# The Ultimate Guide to Cybersecurity in 2025

As we navigate through 2025, cybersecurity has become more critical than ever before. With the rapid adoption of AI, remote work, and cloud technologies, the threat landscape continues to evolve at an unprecedented pace.

## Key Cybersecurity Trends in 2025

### 1. AI-Powered Threats
Cybercriminals are increasingly leveraging artificial intelligence to create more sophisticated attacks. From deepfake phishing campaigns to automated vulnerability discovery, AI is changing the game.

### 2. Zero Trust Architecture
The traditional perimeter-based security model is no longer sufficient. Organizations are moving towards Zero Trust architectures that verify every user and device.

### 3. Cloud Security Challenges
As more businesses migrate to the cloud, securing cloud environments has become a top priority. Multi-cloud and hybrid environments present unique challenges.

## Best Practices for 2025

1. **Implement Multi-Factor Authentication (MFA)** everywhere possible
2. **Regular Security Audits** and penetration testing
3. **Employee Training** on the latest social engineering tactics
4. **Incident Response Planning** with regular drills
5. **Data Encryption** both at rest and in transit

## Conclusion

Cybersecurity in 2025 requires a proactive, multi-layered approach. Organizations that invest in comprehensive security strategies today will be better positioned to face tomorrow's threats.`,
        excerpt: "As we navigate through 2025, cybersecurity has become more critical than ever before. Learn about the latest threats and protection strategies.",
        metaDescription: "Complete cybersecurity guide for 2025 covering AI-powered threats, Zero Trust architecture, and essential protection strategies for businesses.",
        previewImageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
        previewImageAlt: "Digital security concept with glowing shield and network connections representing cybersecurity protection",
        status: "PUBLISHED" as const,
        publishedAt: new Date().toISOString(),
        featuredPost: true,
        readTime: 8,
        viewCount: 0,
        seoTitle: "Ultimate Cybersecurity Guide 2025 | Tech Javelin",
        seoKeywords: "cybersecurity, security threats, AI security, Zero Trust, cloud security, 2025",
        authorId: authors[0]?.id || "",
      },
      {
        title: "Cloud Migration Best Practices: A Step-by-Step Guide",
        slug: "cloud-migration-best-practices-guide",
        summary: "Learn how to successfully migrate your business to the cloud with our comprehensive step-by-step guide covering planning, execution, and optimization.",
        content: `# Cloud Migration Best Practices: A Step-by-Step Guide

Cloud migration is no longer a question of "if" but "when" for most businesses. However, a successful migration requires careful planning and execution.

## Phase 1: Assessment and Planning

### Current State Analysis
- Inventory your existing infrastructure
- Identify dependencies and interconnections
- Assess security and compliance requirements
- Evaluate current performance metrics

### Cloud Strategy Development
- Define migration goals and success metrics
- Choose the right cloud model (IaaS, PaaS, SaaS)
- Select appropriate cloud providers
- Develop a migration timeline

## Phase 2: Migration Approaches

### The 6 R's of Cloud Migration
1. **Rehost** (Lift and Shift)
2. **Replatform** (Lift, Tinker, and Shift)
3. **Repurchase** (Drop and Shop)
4. **Refactor** (Re-architect)
5. **Retire** (Eliminate)
6. **Retain** (Keep On-Premises)

## Phase 3: Execution

### Pre-Migration Steps
- Set up cloud environment
- Configure networking and security
- Create backup and rollback plans
- Train your team

### Migration Process
- Start with non-critical applications
- Monitor performance continuously
- Validate functionality at each step
- Document lessons learned

## Phase 4: Post-Migration Optimization

- Optimize costs and performance
- Implement monitoring and alerting
- Regular security audits
- Continuous improvement processes

## Conclusion

Successful cloud migration requires thorough planning, careful execution, and ongoing optimization. With the right approach, businesses can achieve significant benefits in terms of scalability, cost-efficiency, and innovation.`,
        excerpt: "Cloud migration requires careful planning and execution. This comprehensive guide covers everything from assessment to optimization.",
        metaDescription: "Complete cloud migration guide with best practices, step-by-step process, and optimization strategies for successful business transformation.",
        previewImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
        previewImageAlt: "Cloud computing concept with servers and data flowing to cloud infrastructure in space",
        status: "PUBLISHED" as const,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        featuredPost: false,
        readTime: 12,
        viewCount: 0,
        seoTitle: "Cloud Migration Best Practices Guide | Tech Javelin",
        seoKeywords: "cloud migration, cloud strategy, AWS migration, digital transformation, cloud best practices",
        authorId: authors[2]?.id || authors[0]?.id || "",
      },
      {
        title: "IT Infrastructure Scaling: Preparing for Business Growth",
        slug: "it-infrastructure-scaling-business-growth",
        summary: "Discover strategies for scaling your IT infrastructure to support business growth without breaking the bank or compromising performance.",
        content: `# IT Infrastructure Scaling: Preparing for Business Growth

As your business grows, your IT infrastructure needs to grow with it. The key is to scale smartly, efficiently, and cost-effectively.

## Understanding Scaling Challenges

### Common Scaling Pain Points
- Performance bottlenecks
- Increased complexity
- Rising costs
- Security vulnerabilities
- Maintenance overhead

### Signs You Need to Scale
- Slow application response times
- Frequent system outages
- Limited storage capacity
- High maintenance costs
- Security concerns

## Scaling Strategies

### Horizontal vs. Vertical Scaling
**Horizontal Scaling (Scale Out)**
- Add more machines or instances
- Better fault tolerance
- More complex to manage

**Vertical Scaling (Scale Up)**
- Upgrade existing hardware
- Simpler to implement
- Limited by hardware constraints

### Cloud-First Approach
- Auto-scaling capabilities
- Pay-as-you-grow pricing
- Global reach and availability
- Managed services reduce complexity

## Implementation Roadmap

### Phase 1: Assessment (Month 1)
- Current capacity analysis
- Growth projections
- Budget planning
- Technology evaluation

### Phase 2: Planning (Month 2)
- Architecture design
- Migration strategy
- Risk assessment
- Team training plan

### Phase 3: Execution (Months 3-6)
- Gradual implementation
- Continuous monitoring
- Performance optimization
- Security hardening

### Phase 4: Optimization (Ongoing)
- Cost optimization
- Performance tuning
- Capacity planning
- Technology updates

## Key Technologies for Scalable Infrastructure

1. **Container Orchestration** (Kubernetes, Docker Swarm)
2. **Load Balancers** (Application and Network)
3. **Content Delivery Networks** (CDN)
4. **Database Clustering** and replication
5. **Monitoring and Alerting** systems

## Cost Management Strategies

- Right-sizing resources
- Reserved capacity planning
- Automated scaling policies
- Regular cost reviews
- Multi-cloud strategies

## Conclusion

Successful IT infrastructure scaling requires careful planning, the right technology choices, and ongoing optimization. By following these best practices, businesses can support growth while maintaining performance and controlling costs.`,
        excerpt: "Learn how to scale your IT infrastructure effectively to support business growth while maintaining performance and controlling costs.",
        metaDescription: "IT infrastructure scaling guide covering strategies, technologies, and best practices for growing businesses and startups.",
        previewImageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
        previewImageAlt: "Modern data center with server racks and networking equipment representing IT infrastructure scaling",
        status: "PUBLISHED" as const,
        publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        featuredPost: false,
        readTime: 10,
        viewCount: 0,
        seoTitle: "IT Infrastructure Scaling Guide for Business Growth | Tech Javelin",
        seoKeywords: "IT infrastructure, scaling, business growth, cloud infrastructure, performance optimization",
        authorId: authors[1]?.id || authors[0]?.id || "",
      }
    ];

    for (const [index, postInfo] of blogPosts.entries()) {
      try {
        const post = await dataClient.models.BlogPost.create(postInfo, {
          authMode: "userPool",
        });
        
        if (post.errors && post.errors.length > 0) {
          console.error("❌ Error creating blog post:", post.errors);
        } else {
          console.log(`✅ Created blog post: ${postInfo.title}`);
          
          // Add tags to posts
          if (tags.length > 0 && post.data) {
            const postTags = index === 0 ? [0, 1, 4] : index === 1 ? [1, 2, 4] : [1, 4, 7]; // Different tags for each post
            
            for (const tagIndex of postTags) {
              if (tags[tagIndex]) {
                try {
                  await dataClient.models.PostTag.create({
                    postId: post.data.id,
                    tagId: tags[tagIndex].id,
                  }, {
                    authMode: "userPool",
                  });
                } catch (error) {
                  console.error(`❌ Error adding tag to post:`, error);
                }
              }
            }
            console.log(`✅ Added tags to: ${postInfo.title}`);
          }
          
          // Add categories to posts
          if (categories.length > 0 && post.data) {
            const categoryIndex = index % categories.length;
            if (categories[categoryIndex]) {
              try {
                await dataClient.models.PostCategory.create({
                  postId: post.data.id,
                  categoryId: categories[categoryIndex].id || "",
                }, {
                  authMode: "userPool",
                });
                console.log(`✅ Added category to: ${postInfo.title}`);
              } catch (error) {
                console.error(`❌ Error adding category to post:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Failed to create blog post ${postInfo.title}:`, error);
      }
    }
  } else {
    console.log("⚠️  No authors available to create blog posts");
  }

  // Sign out
  auth.signOut();
  console.log("✅ Signed out successfully");



  // --- SigInt Seed Data ---
  console.log("\n🔎 Seeding SigInt demo data for each user...");

  // Helper to get Cognito sub (user id) after sign-in
  async function getCurrentUserSub() {
    const { getCurrentUser } = await import('aws-amplify/auth');
    const user = await getCurrentUser();
    // For Amplify Auth v6+, Cognito sub is user.userId
    return user?.userId;
  }

  // List of users to seed orgs for (get their userId first)
  const sigintUsers = [
    { username: "admin@techjavelin.com", password: "TechJavelin2025!", orgName: "Pulse Admin Org" },
    { username: "user@example.com", password: "RegularUser2025!", orgName: "Pulse User Org" },
  ];

  // Get userIds for both users
  const userIds: Record<string, string> = {};
  for (const user of sigintUsers) {
    try {
      await auth.signOut();
      await signInUser({ username: user.username, password: user.password, signInFlow: "Password" });
      const userId = await getCurrentUserSub();
      if (!userId) throw new Error(`Could not get Cognito sub for ${user.username}`);
      userIds[user.username] = userId;
      console.log(`[SEED] Got userId for ${user.username}: ${userId}`);
    } catch (err) {
      console.error(`[SEED] ❌ Error getting userId for ${user.username}:`, err);
    }
  }

  // Seed all orgs as admin user
  try {
    await auth.signOut();
    await signInUser({ username: "admin@techjavelin.com", password: "TechJavelin2025!", signInFlow: "Password" });
    for (const user of sigintUsers) {
      const userId = userIds[user.username];
      if (!userId) {
        console.error(`[SEED] Skipping org for ${user.username} (no userId)`);
        continue;
      }
      console.log(`[SEED] Seeding SigInt data for ${user.username} (sub: ${userId}) as admin`);

      // Create organization for this user
      const org = await dataClient.models.Organization.create({
        name: user.orgName,
        admins: [userId],
        members: [userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { authMode: "userPool" });
      if (org.errors && org.errors.length > 0) {
        console.error(`[SEED] ❌ Error creating org for ${user.username}:`, org.errors);
        continue;
      }
      if (!org.data) {
        console.error(`[SEED] ❌ Org creation returned null data for ${user.username}`);
        continue;
      }
      console.log(`[SEED] ✅ Created org for ${user.username}`);

      // Create scope for this org
      const scope = await dataClient.models.Scope.create({
        name: "Default Scope",
        description: `Demo scope for ${user.orgName}`,
        organizationId: org.data.id,
        admins: [userId],
        members: [userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { authMode: "userPool" });
      if (scope.errors && scope.errors.length > 0) {
        console.error(`[SEED] ❌ Error creating scope for ${user.username}:`, scope.errors);
        continue;
      }
      if (!scope.data) {
        console.error(`[SEED] ❌ Scope creation returned null data for ${user.username}`);
        continue;
      }
      console.log(`[SEED] ✅ Created scope for ${user.username}`);

      // Create target for this scope
      const target = await dataClient.models.Target.create({
        name: "Demo Website",
        type: "WEBSITE",
        config: JSON.stringify({ url: "https://pulse.techjavelin.com" }),
        metadata: JSON.stringify({ description: `Demo target for ${user.orgName}` }),
        scopeId: scope.data.id,
        organizationId: org.data.id,
        admins: [userId],
        members: [userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { authMode: "userPool" });
      if (target.errors && target.errors.length > 0) {
        console.error(`[SEED] ❌ Error creating target for ${user.username}:`, target.errors);
        continue;
      }
      if (!target.data) {
        console.error(`[SEED] ❌ Target creation returned null data for ${user.username}`);
        continue;
      }
      console.log(`[SEED] ✅ Created target for ${user.username}`);
    }
  } catch (err) {
    console.error(`[SEED] ❌ Error seeding SigInt data as admin:`, err);
  }

} else {
  console.log("⚠️  Skipping blog data seeding due to authentication issues");
}

console.log(`\n🎉 Seed process completed!

👥 Users created:
   📧 Admin: admin@techjavelin.com
   🔑 Password: TechJavelin2025!
   
   📧 Regular User: user@example.com
   🔑 Password: RegularUser2025!

📊 Blog data seeded:
   ✅ Authors, Categories, Tags, and Blog Posts created
   ✅ Sample blog content with relationships

🔎 SigInt demo data seeded:
   ✅ Organization, Scope, and Target created

🚀 Your sandbox is ready for development and testing!
`);
