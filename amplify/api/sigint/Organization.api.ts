import { defineFunction } from "@aws-amplify/backend";

export const createOrganization = defineFunction({
  name: "createOrganization",
  entry: "../../functions/organization/create-organization.ts",
});

// export const updateOrganization = defineFunction({
//   name: "updateOrganization",
//   entry: "../functions/organization/update-organization.ts",
// });

// export const deleteOrganization = defineFunction({
//   name: "deleteOrganization",
//   entry: "../functions/organization/delete-organization.ts",
// });

// export const listOrganizations = defineFunction({
//   name: "listOrganizations",
//   entry: "../functions/organization/list-organization.ts",
// });

// export const getOrganization = defineFunction({
//   name: "getOrganization",
//   entry: "../functions/organization/get-organization.ts",
// });

// export const inviteUserToOrganization = defineFunction({
//   name: "inviteUserToOrganization",
//   entry: "../functions/organization/invite-user-to-organization.ts",
// });
