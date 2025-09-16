import { a } from '@aws-amplify/backend';

export const ProjectStatus = a.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']);

export const Project = a.model({
  name: a.string().required(),
  description: a.string().validate((value) => {
    value.maxLength(512, "Description must be at most 512 characters")
  }),
  status: a.ref('ProjectStatus').required()
})
.authorization((allow) => [
  // Admins manage full lifecycle
  allow.group('admin').to(['create','update','delete','read']),
  // Any signed-in user can read project metadata
  allow.authenticated().to(['read'])
]);