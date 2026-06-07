import { SetMetadata } from '@nestjs/common';

export type ResourceType = 'team' | 'board' | 'task';
export const RESOURCE_TYPE_KEY = 'resourceType';
export const ResourceContext = (type: ResourceType) =>
  SetMetadata(RESOURCE_TYPE_KEY, type);
