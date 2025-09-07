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

// Create Admin User (or delete and recreate if password is wrong)
console.log("👤 Creating admin user...");
let adminUser;
let adminExists = false;

try {
  // Try to sign in first to check if user already exists with correct password
  await signInUser({
    username: "admin@techjavelin.com",
    password: "TechJavelin2025!",
    signInFlow: "Password",
  });
  console.log("ℹ️  Admin user already exists and password is correct");
  adminExists = true;
  // Always try to add admin to admin group after sign-in check
  try {
  await addToUserGroup({ username: "admin@techjavelin.com" }, "admin");
    console.log("✅ Admin user added to admin group (post sign-in check)");
  } catch (err) {
    console.log("ℹ️  Admin group may not exist, skipping group assignment");
  }
  auth.signOut(); // Sign out after checking
} catch (signInError) {
  console.log("⚠️  Admin sign-in failed, checking if user exists...");
  
  // Try to create the user - this will fail if user exists with wrong password
  try {
    adminUser = await createAndSignUpUser({
      username: "admin@techjavelin.com",
      password: "TechJavelin2025!",
      signInAfterCreation: false,
      signInFlow: "Password",
      userAttributes: {
        givenName: "Tech",
        familyName: "Javelin",
      },
    });
    console.log("✅ Admin user created successfully");
    
    // Add admin to admin group (if groups exist)
    if (adminUser) {
      try {
        await addToUserGroup(adminUser, "admin");
        console.log("✅ Admin user added to admin group");
      } catch (err) {
        console.log("ℹ️  Admin group may not exist, skipping group assignment");
      }
    }
  } catch (createError) {
    const error = createError as Error;
    if (error.name === "UsernameExistsError" || error.message.includes("already exists") || error.message.includes("Cannot modify an already provided email")) {
      console.log("🔄 Admin user exists but password is wrong, deleting and recreating...");
      
      // Delete the existing user
      const deleted = await deleteUser("admin@techjavelin.com");
      
      if (deleted) {
        console.log("✅ Deleted existing admin user");
        
        // Wait a moment for deletion to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create the user again with the correct password
        try {
          adminUser = await createAndSignUpUser({
            username: "admin@techjavelin.com",
            password: "TechJavelin2025!",
            signInAfterCreation: false,
            signInFlow: "Password",
            userAttributes: {
              givenName: "Tech",
              familyName: "Javelin",
            },
          });
          console.log("✅ Admin user recreated successfully with correct password");
          
          // Add admin to admin group (if groups exist)
          if (adminUser) {
            try {
              await addToUserGroup(adminUser, "admin");
              console.log("✅ Admin user added to admin group");
            } catch (err) {
              console.log("ℹ️  Admin group may not exist, skipping group assignment");
            }
          }
        } catch (recreateError) {
          console.error("❌ Error recreating admin user:", recreateError);
          throw recreateError;
        }
      } else {
        console.log("❌ Could not delete existing admin user, skipping recreation");
        adminExists = true; // Mark as existing to avoid further issues
      }
    } else {
      console.error("❌ Error creating admin user:", error);
      throw error;
    }
  }
}

// Always try to add admin to admin group after all creation paths
try {
  await addToUserGroup({ username: "admin@techjavelin.com" }, "admin");
  console.log("✅ Admin user added to admin group (final check)");
} catch (err) {
  console.log("ℹ️  Admin group may not exist, skipping group assignment");
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
